/* Shots (friendly and hostile), strikes against enemies and boss fare slots, slash hit tests, scrip pickups (code: shards). */
(() => {
'use strict';
const G = window.G, C = G.C, T = C.T, U = G.util, fx = G.fx, tiles = G.tiles;
const shots = G.shots = [], pickups = G.pickups = [], clouds = [], puddles = [], bolts = [];
const alive = () => G.players.filter(p => !p.down);

/* ---------------------------------------------------------------- Materials (bible sections 8 and 9)
   Every token and trinket has one or two tags (def.mat) and one card line naming its interactions (def.inter). The rules below are fixed and
   have no dice: the same items and inputs always give the same result. Each rule that fires calls M.word(), a short floating word, and counts
   itself in M.fired (the `materials` check reads it). Rules by name:
   Ignite   a spark (Flint Tether bolt, Pumice flame, a Whetstone slash) lights a flammable shot of yours in flight: x1.6 damage and burst
   Flare    a spark on a lingering Sulphur or cinder cloud sets it off in a burst (r 110, 20 damage)
   Douse    wet puts fire out: a brine puddle removes clouds and unlights shots; with the Brine Flask, sparks cannot light anything
   Conduct  a metal hit on a soaked enemy (standing in a puddle) or with the Brine Flask chains to the nearest other enemy within 150 px, half damage
   Pull     Magnet Tooth turns metal shots towards the nearest enemy or open fare slot of their cut within 240 px, at a fixed 2.4 rad/s
   Stop     with Lead Boot a heavy Ground shot stops dead against a carrier or a wall instead of ending
   Kick     a slash re-kicks a stopped heavy shot at 820 px/s for double damage
   Slide    Oiled Strap: Ground shots start 45% faster and live 50% longer
   Shatter  a heavy shot touching a brittle shot (or a Punch Glove slash on one) breaks it into 3 fragments, each a 6 damage hit
   Crack    a brittle shot of yours breaks into fragments if its carrier is hurt within 0.5 s of casting it
   Punt     Punch Glove: a slash on your own shot launches it at 1.5x damage
   Anchor   Lead Boot: being hurt does not push or hop the carrier */
G.MATERIALS = {
  heavy:    { name: 'Heavy',    color: '#a9b2bd', hint: 'breaks brittle things; Lead Boot and Punch Glove' },
  metal:    { name: 'Metal',    color: '#7fc4e8', hint: 'conducts through wet; pulled by magnets' },
  flammable:{ name: 'Flammable',color: '#ff9a3c', hint: 'a spark lights it' },
  wet:      { name: 'Wet',      color: '#6fb6d9', hint: 'puts out fire; conducts metal; dissolves salt' },
  slick:    { name: 'Slick',    color: '#d6b25a', hint: 'ground shots slide further' },
  brittle:  { name: 'Brittle',  color: '#e6dcc4', hint: 'shatters when struck by something heavy' },
  magnetic: { name: 'Magnetic', color: '#e0705f', hint: 'pulls metal shots and scrip' },
  spark:    { name: 'Spark',    color: '#fff3a0', hint: 'lights flammable things' }
};
const M = G.materials = {
  fired: {}, log: [], frags: 0,
  reset() { M.fired = {}; M.log = []; M.frags = 0; clouds.length = 0; puddles.length = 0; bolts.length = 0; },
  counts() { return { clouds: clouds.length, puddles: puddles.length, bolts: bolts.length }; },
  tagsOf(id) { const d = G.itemDefs[id] || G.trinketDefs[id]; return d && d.mat ? d.mat : []; },
  has(s, tag) { return !!(s.mat && s.mat.includes(tag)); },
  mods() { return G.run.mods; },
  word(x, y, text, tag) {
    M.fired[text] = (M.fired[text] || 0) + 1; if (M.log.length < 400) M.log.push(text);
    if (G.ledger && G.run) G.ledger.event('material', { word: text });         // the feat ledger counts each rule once
    fx.floatText(x, y - 18, text, (G.MATERIALS[tag] || {}).color || '#fff3c4');
  },
  line(id) { const d = G.itemDefs[id] || G.trinketDefs[id]; return d && d.inter ? d.inter : ''; },
  // Small labelled chips, one per tag, left to right from x (align 'left'), or ending at x ('right'). y is the chip centre. Returns the width.
  chipsWidth(ctx, tags) { ctx.font = '600 10px ' + G.C.FONT; return tags.reduce((w, t) => w + ctx.measureText(G.MATERIALS[t].name.toUpperCase()).width + 12 + 4, -4); },
  drawChips(ctx, tags, x, y, align = 'left') {
    if (!tags || !tags.length) return 0;
    const W = M.chipsWidth(ctx, tags); let cx = align === 'right' ? x - W : align === 'center' ? x - W / 2 : x;
    ctx.save(); ctx.font = '600 10px ' + G.C.FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (const t of tags) {
      const m = G.MATERIALS[t], txt = m.name.toUpperCase(), w = ctx.measureText(txt).width + 12;
      ctx.fillStyle = 'rgba(8,14,14,0.85)'; ctx.fillRect(cx, y - 7, w, 14);
      ctx.globalAlpha = 0.28; ctx.fillStyle = m.color; ctx.fillRect(cx, y - 7, w, 14); ctx.globalAlpha = 1;
      ctx.strokeStyle = m.color; ctx.lineWidth = 1; ctx.strokeRect(cx + 0.5, y - 6.5, w - 1, 13);
      ctx.fillStyle = '#f3efe2'; ctx.fillText(txt, cx + 6, y + 0.5); cx += w + 4;
    }
    ctx.restore(); return W;
  },
  // A sulphur or cinder cloud: harmless until a spark reaches it.
  cloud(x, y, owner, r = 60, life = 3, cls = 'arc', itemId = 'sulphur_kettle') { clouds.push({ x, y, r, life, owner, cls, itemId }); },
  // A brine puddle on the floor: douses clouds and unlights shots, soaks enemies standing in it.
  puddle(x, y, owner, r = 56, life = 4) {
    puddles.push({ x, y, r, life, owner });
    const n = tiles.dissolveSalt(x, y, r);
    if (n) { M.word(x, y, 'Dissolve', 'wet'); fx.spark(x, y - 4, Math.min(18, n * 3), '#e6dcc4', 120, 0.3); }
  },
  ignite(s, src) {
    if (!M.has(s, 'flammable') || s.ignited || s.doused || s === src) return false;
    if (G.run.mods.conduct) { s.doused = true; M.word(s.x, s.y, 'Douse', 'wet'); fx.spark(s.x, s.y, 6, '#6fb6d9', 160, 0.3); return false; }
    s.ignited = true; s.dmg *= 1.6; if (s.burst) s.burst = Math.round(s.burst * 1.6); s.r = Math.round(s.r * 1.25); s.trail = '#ff9a3c';
    fx.ring(s.x, s.y, 6, 70, '#ff9a3c', 0.25); fx.spark(s.x, s.y, 10, '#ff9a3c', 240, 0.35); M.word(s.x, s.y, 'Ignite', 'flammable'); return true;
  },
  flare(c) {
    const i = clouds.indexOf(c); if (i < 0) return false; clouds.splice(i, 1);
    if (G.run.mods.conduct) { M.word(c.x, c.y, 'Douse', 'wet'); return false; }
    fx.ring(c.x, c.y, 10, 300, '#ff9a3c', 0.3); fx.spark(c.x, c.y, 26, '#ff9a3c', 380, 0.5); fx.jolt(0, 3);
    combat.strike({ x: c.x, y: c.y, r: 110, cls: c.cls, itemId: c.itemId, owner: c.owner, dmg: 20, all: true, mat: [] });
    M.word(c.x, c.y, 'Flare', 'flammable'); return true;
  },
  // A spark at (x, y): lights flammable shots and sets off clouds within r. src: the shot that made it (it does not light itself).
  spark(x, y, r, src) {
    for (const s of shots.slice()) if (!s.hostile && s !== src && Math.hypot(s.x - x, s.y - y) < r + s.r) M.ignite(s, src);
    for (const c of clouds.slice()) if (Math.hypot(c.x - x, c.y - y) < r + c.r) M.flare(c);
    const n=tiles.burnTar(x,y,r); if(n) M.word(x,y,'Burn','flammable');
  },
  douse(x, y, r) {
    for (const c of clouds.slice()) if (Math.hypot(c.x - x, c.y - y) < r + c.r) { clouds.splice(clouds.indexOf(c), 1); fx.spark(c.x, c.y, 8, '#6fb6d9', 160, 0.3); M.word(c.x, c.y, 'Douse', 'wet'); }
    for (const s of shots) if (!s.hostile && s.ignited && Math.hypot(s.x - x, s.y - y) < r + s.r) {
      s.ignited = false; s.doused = true; s.dmg /= 1.6; if (s.burst) s.burst = Math.round(s.burst / 1.6); s.r = Math.round(s.r / 1.25); s.trail = null; M.word(s.x, s.y, 'Douse', 'wet');
    }
  },
  // Break a brittle shot into three fragments (each a 6 damage hit that flies the way dir points). why: 'Shatter' or 'Crack'.
  shatter(s, dir, why) {
    const i = shots.indexOf(s); if (i < 0 || s.frag) return false; shots.splice(i, 1);
    const d = dir || Math.sign(s.vx) || 1;
    for (const [vx, vy] of [[300, -200], [220, -60], [120, -340]]) {
      M.frags++;
      combat.shoot({ x: s.x, y: s.y - 2, vx: d * vx, vy, grav: 1100, life: 0.5, r: 5, owner: s.owner, cls: s.cls, itemId: s.itemId, dmg: 6, color: '#e6dcc4', trail: '#e6dcc4', frag: true, mat: [] });
    }
    fx.spark(s.x, s.y, 14, '#e6dcc4', 300, 0.4); fx.ring(s.x, s.y, 4, 60, '#e6dcc4', 0.2); M.word(s.x, s.y, why, 'brittle'); return true;
  },
  // Lead Boot: stop a heavy Ground shot dead; a slash kicks it back.
  park(s) {
    s.vx = 0; s.parked = true; s.life = Math.max(s.life, 5); fx.ring(s.x, s.y, 4, 50, '#a9b2bd', 0.2); M.word(s.x, s.y, 'Stop', 'heavy');
  },
  // A conducted chain: damage the nearest other enemy within 150 px, half of st.dmg, drawn as a zigzag for 0.25 s.
  conduct(st, from) {
    let best = null, bd = 150;
    for (const e of G.rooms.current.enemies) { if (e.dead || e === from) continue; const d = Math.hypot(e.x - from.x, (e.y - e.h / 2) - (from.y - from.h / 2)); if (d < bd) { bd = d; best = e; } }
    if (!best) return false;
    bolts.push({ x0: from.x, y0: from.y - from.h / 2, x1: best.x, y1: best.y - best.h / 2, t: 0.25 });
    best.damage((st.dmg || 0) * 0.5, from.x); M.word(best.x, best.y - best.h, 'Conduct', 'wet'); return true;
  },
  // Slash side effects (called by combat.melee): kick parked shots, punt or shatter your own shots, light flammable things.
  slash(p, s, rect) {
    const mods = G.run.mods, dir = s.face || p.face || 1;
    for (const h of shots.slice()) {
      if (h.hostile || h.free || h.r <= 0 || !U.circleRect(h.x, h.y, h.r + 4, rect)) continue;
      const key = 'm' + shots.indexOf(h); if (s.hit[key]) continue; s.hit[key] = true;
      if (h.parked) {
        h.parked = false; h.vx = dir * 820; h.dmg *= 2; h.life = 1.4; h.kicked = true; h.kickT = h.age; fx.ring(h.x, h.y, 4, 70, '#a9b2bd', 0.2); M.word(h.x, h.y, 'Kick', 'heavy');
      } else if (mods.punt && !h.punted && !h.frag) {
        if (M.has(h, 'brittle')) { M.shatter(h, dir, 'Shatter'); continue; }
        h.punted = true; h.dmg *= 1.5;
        if (s.dir === 'up') { h.vx *= 0.3; h.vy = -720; } else if (s.dir === 'down') { h.vy = 600; } else { h.vx = dir * Math.max(520, Math.abs(h.vx) * 1.5); h.vy = h.grav ? -120 : 0; }
        fx.spark(h.x, h.y, 8, '#fff3c4', 260, 0.25); M.word(h.x, h.y, 'Punt', 'heavy');
      }
      if (mods.spark) M.ignite(h);
    }
    if (mods.spark) for (const c of clouds.slice()) if (U.circleRect(c.x, c.y, c.r, rect)) M.flare(c);
  },
  // The nearest thing a metal shot is pulled towards: an enemy, or the open fare slot of its cut.
  pullTarget(s) {
    const room = G.rooms.current, b = room.boss; let best = null, bd = 240;
    const t = (x, y) => { const d = Math.hypot(x - s.x, y - s.y); if (d < bd) { bd = d; best = { x, y }; } };
    for (const e of room.enemies) if (!e.dead) t(e.x, e.y - e.h / 2);
    if (b && b.active()) { for (const sp of b.spots) if (sp.cls === s.cls && !sp.broken && sp.open && b.isExposed(sp)) { const q = b.spotPos(sp); t(q.x, q.y); } }
    return best;
  }
};

const combat = G.combat = {
  /* Spawn a shot. Fields (all optional except x, y):
     vx, vy, grav, life, r            motion and size (circle)
     hostile                          true = hurts players; false = a player's shot
     owner, cls, itemId, dmg          for player shots: who fired it, cut (class id), token id, damage to bodies and enemies
     burst                            radius; the shot does nothing in flight and strikes this radius when it ends
     hug                              true = slides along the floor under gravity (drops off ledges); ends at walls
     tile                             'die' (default) ends on solid tiles, 'pass' ignores them
     rect: { w, h }                   hostile only: a box (bottom centre on x, y) instead of a circle; does not end on hit
     cut                              hostile only: true = a slash destroys it
     paint(ctx, s), onEnd(s)          drawing in world space; callback when it ends
     color, trail                     fallback dot colour; trail = colour of a particle trail
     step(s, dt)                      called every step before the shot moves (steer, bounce, split, wait)
     free                             true = the shot does no hit test of its own (its step does the striking)
     seen                             a Set: things already struck by this shot are skipped and the shot flies on (piercing) */
  shoot(def) {
    const s = Object.assign({ vx: 0, vy: 0, grav: 0, life: 1.5, r: 6, hostile: false, dmg: 6, tile: 'die', burst: 0, age: 0 }, def);
    if (!s.hostile) {
      s.mat = s.mat ? s.mat.slice() : M.tagsOf(s.itemId).slice();
      if (G.run && G.run.mods.slick && s.cls === 'ground' && !s.frag) { s.vx *= 1.45; s.life *= 1.5; s.mat.push('slick'); M.word(s.x, s.y, 'Slide', 'slick'); }
    }
    shots.push(s); return s;
  },
  /* One damaging event from a token: { x, y, r, cls, itemId, owner, dmg, vx, vy, all }.
     Tests the active boss (its fare slot of that cut first, then its body) and enemies (the first one, or all in range with all: true).
     Returns 'spot', 'body', 'enemy' or null. */
  strike(st) {
    const room = G.rooms.current, b = room.boss;
    let res = null;
    if (b && b.active()) {
      const sp = st.cls ? b.spotAt(st) : null;
      if (sp) { if (!(st.seen && st.seen.has(sp))) { if (st.seen) st.seen.add(sp); b.hitSpot(sp, st); res = 'spot'; } }
      else if (b.hitsCircle(st.x, st.y, st.r) && !(st.seen && st.seen.has(b))) { if (st.seen) st.seen.add(b); b.damage(st.dmg || 0); res = 'body'; }
    }
    for (const e of room.enemies) {
      if (e.dead || (st.seen && st.seen.has(e)) || !U.circleRect(st.x, st.y, st.r, e.rect())) continue;
      if (st.seen) st.seen.add(e);
      e.damage(st.dmg || 0, st.owner ? st.owner.x : st.x); res = res || 'enemy';
      const mat = st.mat || M.tagsOf(st.itemId);
      if (mat.includes('metal') && !st.chained && (G.run.mods.conduct || e.soak > 0)) { st.chained = true; M.conduct(st, e); }
      if (!st.all) break;
    }
    return res;
  },
  // True if a shot is in contact with the boss, its fare slot of the shot's cut, or an enemy.
  touching(s) {
    const room = G.rooms.current, b = room.boss;
    if (b && b.active() && (b.hitsCircle(s.x, s.y, s.r) || (s.cls && b.spotAt(s)))) return true;
    return room.enemies.some(e => !e.dead && U.circleRect(s.x, s.y, s.r, e.rect()));
  },
  // A slash: test the boss body, enemies, cuttable hostile shots and (for a down slash) spikes.
  melee(p, s, rect) {
    const room = G.rooms.current, b = room.boss, dmg = (s.heavy ? 32 : 13) * G.run.mods.dmg;
    if (b && b.active() && !s.hit.boss && b.hitsRect(rect)) {
      const q = b.hitsRect(rect) || b.rect();
      s.hit.boss = true; b.damage(dmg);
      p.slashLanded(s, U.clamp((rect.x0 + rect.x1) / 2, q.x0, q.x1), U.clamp((rect.y0 + rect.y1) / 2, q.y0, q.y1), true);
    }
    for (const e of room.enemies) {
      if (e.dead || s.hit[e.uid] || !U.overlap(rect, e.rect())) continue;
      s.hit[e.uid] = true; e.damage(dmg, p.x); p.slashLanded(s, e.x, e.y - e.h / 2, true);
    }
    for (const pr of room.props) {                          // a cracked barrier: only a heavy cut breaks it
      if (pr.type !== 'crack' || pr.gone || s.hit[pr.x + ':' + pr.y]) continue;
      if (U.overlap(rect, G.props.TYPES.crack.rect(pr))) { s.hit[pr.x + ':' + pr.y] = true; G.props.TYPES.crack.hit(pr, !!s.heavy); }
    }
    M.slash(p, s, rect);
    for (let i = shots.length - 1; i >= 0; i--) {
      const h = shots[i];
      if (h.hostile && h.cut && U.circleRect(h.x, h.y, h.r, rect)) { fx.spark(h.x, h.y, 6, '#fff3c4'); shots.splice(i, 1); }
    }
    if (s.dir === 'down' && !s.hit.spike) {
      const rr = Math.floor(rect.y1 / T);
      for (let c = Math.floor(rect.x0 / T); c <= Math.floor(rect.x1 / T); c++)
        if (tiles.spike(c, rr) && rect.y1 > rr * T + 8) { s.hit.spike = true; p.slashLanded(s, p.x, rr * T + 10, false); break; }
    }
  },
  // Hurt every standing player whose box overlaps the rect. Returns true if anyone was hurt.
  hurtPlayers(rect, fromX) {
    let any = false;
    for (const p of alive()) if (U.overlap(p.rect(), rect) && p.hurt(fromX)) any = true;
    return any;
  },
  clearHostile(x, y, r) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      if (s.hostile && !s.rect && Math.hypot(s.x - x, s.y - y) < r) { fx.spark(s.x, s.y, 6, '#b79cff'); shots.splice(i, 1); }
    }
  },
  dropShards(x, y, total) {
    if (G.run && G.run.rule && G.run.rule.scrip) total *= G.run.rule.scrip;            // Timetable card Scrip Boom: drops are doubled
    const n = Math.min(12, total), each = total / Math.max(1, n);
    for (let i = 0; i < n; i++) pickups.push({ x, y: y - 8, w: 8, h: 8, vx: U.rnd(-160, 160), vy: U.rnd(-380, -160), value: each, life: 14 });
  },
  // keepPickups: leave scrip on the floor (a boss dying wipes shots only).
  clear(keepPickups) { shots.length = 0; clouds.length = 0; puddles.length = 0; bolts.length = 0; if (!keepPickups) pickups.length = 0; },
  // The party leaves a room: scrip still on the floor is collected for it, so nothing is lost by walking out.
  leave() { let n = 0; for (const k of pickups) n += k.value; pickups.length = 0; shots.length = 0; clouds.length = 0; puddles.length = 0; bolts.length = 0; if (n && G.run) G.run.shards += n; return n; },

  update(dt) {
    // Tokens a player carries may have tick(player, dt) for a timer that runs while held (e.g. standing still).
    for (const p of G.players) for (const id of p.items) { const d = G.itemDefs[id]; if (d && d.tick) d.tick(p, dt); }
    // Materials: a hurt carrier (Anchor, Crack), clouds and puddles, then shots meeting shots.
    for (const p of G.players) {
      if (p.hpSeen !== undefined && p.hp < p.hpSeen && !p.down) {
        if (G.run.mods.anchor) { p.vx = 0; p.vy = Math.max(p.vy, 0); M.word(p.x, p.y - 50, 'Anchor', 'heavy'); }
        if (G.time - (p.castAt || -9) < 0.5) for (const h of shots.slice()) if (h.owner === p && M.has(h, 'brittle') && !h.frag) M.shatter(h, Math.sign(h.vx) || p.face, 'Crack');
      }
      p.hpSeen = p.hp;
    }
    for (let i = clouds.length - 1; i >= 0; i--) { clouds[i].life -= dt; if (clouds[i].life <= 0) clouds.splice(i, 1); }
    for (let i = puddles.length - 1; i >= 0; i--) {
      const q = puddles[i]; q.life -= dt; if (q.life <= 0) { puddles.splice(i, 1); continue; }
      M.douse(q.x, q.y, q.r);
      for (const e of G.rooms.current.enemies) if (!e.dead && Math.abs(e.x - q.x) < q.r + e.w / 2 && Math.abs(e.y - q.y) < 30) e.soak = 0.3;
    }
    for (const e of G.rooms.current.enemies) if (e.soak > 0) e.soak -= dt;
    for (let i = bolts.length - 1; i >= 0; i--) { bolts[i].t -= dt; if (bolts[i].t <= 0) bolts.splice(i, 1); }
    for (const a of shots.slice()) {
      if (a.hostile || a.frag || !M.has(a, 'heavy')) continue;
      for (const b of shots.slice()) if (b !== a && !b.hostile && !b.frag && M.has(b, 'brittle') && Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 10) { M.shatter(b, Math.sign(a.vx) || 1, 'Shatter'); break; }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; let end = false;
      s.age += dt; s.life -= dt; if (s.life <= 0) end = true;
      if (!s.hostile) {
        if (M.has(s, 'spark')) M.spark(s.x, s.y, s.r + 38, s);
        if (s.ignited) { const n=tiles.burnTar(s.x,s.y,s.r+20); if(n) M.word(s.x,s.y,'Burn','flammable'); }
        if (G.run.mods.magnetic && M.has(s, 'metal') && !s.free) {          // Pull: turn towards the nearest enemy or open slot by up to 2.4 rad/s
          const t = M.pullTarget(s), sp = Math.hypot(s.vx, s.vy);
          if (t && sp > 0) {
            let d = Math.atan2(t.y - s.y, t.x - s.x) - Math.atan2(s.vy, s.vx); d = Math.atan2(Math.sin(d), Math.cos(d));
            if (Math.abs(d) < 1.2 && Math.abs(d) > 0.001) {
              const a = Math.atan2(s.vy, s.vx) + U.clamp(d, -2.4 * dt, 2.4 * dt); s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp;
              if (!s.pulled) { s.pulled = true; M.word(s.x, s.y, 'Pull', 'magnetic'); }
            }
          }
        }
        if (G.run.mods.anchor && s.hug && M.has(s, 'heavy') && !s.parked && s.age > 0.12 && s.age - (s.kickT || -9) > 0.35 && !s.free)
          for (const p of alive()) if (U.circleRect(s.x, s.y, s.r, p.rect())) { M.park(s); break; }
      }
      if (s.step && !end) s.step(s, dt);
      if (s.hug) {
        const box = { x: s.x, y: s.y + s.r, w: s.r * 2, h: s.r * 2 };
        s.vy = Math.min(s.vy + 1800 * dt, 900);
        const res = tiles.moveBox(box, s.vx * dt, s.vy * dt);
        s.x = box.x; s.y = box.y - s.r; if (res.hy === 1) s.vy = 0; if (res.hx) { if (G.run.mods.anchor && !s.hostile && M.has(s, 'heavy') && !s.free && !s.parked) M.park(s); else end = true; }
      } else {
        s.vy += s.grav * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        const lead = s.rect ? s.x + Math.sign(s.vx) * s.rect.w / 2 : s.x;
        if ((s.tile === 'die' || s.rect) && tiles.solid(Math.floor(lead / T), Math.floor((s.y - (s.rect ? 8 : 0)) / T))) end = true;
      }
      if (s.trail && Math.random() < 0.6) fx.parts.push({ x: s.x, y: s.y, vx: U.rnd(-20, 20), vy: U.rnd(-20, 20), life: 0.2, max: 0.2, color: s.trail, grav: 0, size: 3 });
      if (s.x < -60 || s.x > tiles.cols * T + 60 || s.y > tiles.rows * T + 60 || s.y < -400) end = true;
      if (s.hostile) {
        for (const p of alive()) {
          const q = p.rect();
          if (s.rect) { if (U.overlap(q, { x0: s.x - s.rect.w / 2, x1: s.x + s.rect.w / 2, y0: s.y - s.rect.h, y1: s.y })) p.hurt(s.x - Math.sign(s.vx) * 20); }
          else if (U.circleRect(s.x, s.y, s.r, q) && p.hurt(s.x)) end = true;
        }
      } else if (!end) {
        if (s.burst) { if (combat.touching(s)) end = true; }
        else if (!s.free && combat.strike(s) && !s.seen) end = true;
      }
      if (end) {
        if (!s.hostile && M.has(s, 'spark')) M.spark(s.x, s.y, s.r + 50, s);
        if (!s.hostile && s.burst) combat.strike(Object.assign({}, s, { r: s.burst, all: true }));
        if (s.onEnd) s.onEnd(s); else fx.spark(s.x, s.y, 6, s.color || '#fff3c4', 200, 0.25);
        shots.splice(i, 1);
      }
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
      const k = pickups[i]; k.life -= dt;
      let best = null, bd = 120 * G.run.mods.magnet;
      for (const p of alive()) { const d = Math.hypot(p.x - k.x, p.cy - k.y); if (d < bd) { bd = d; best = p; } }
      if (best && k.life < 13.6) {
        if (bd < 22) { G.run.shards += k.value; fx.spark(k.x, k.y, 3, '#fff3c4', 90, 0.2, 0, 2); pickups.splice(i, 1); continue; }
        k.vx += (best.x - k.x) / bd * 2600 * dt; k.vy += (best.cy - k.y) / bd * 2600 * dt;
      } else k.vy = Math.min(k.vy + 1500 * dt, 700);
      const res = tiles.moveBox(k, k.vx * dt, k.vy * dt);
      if (res.hy === 1) { k.vy = 0; k.vx *= Math.pow(0.02, dt); }
      if (res.hx) k.vx = -k.vx * 0.4;
      if (k.life <= 0) pickups.splice(i, 1);
    }
  },
  draw(ctx) {
    for (const q of puddles) {
      ctx.save(); ctx.globalAlpha = Math.min(1, q.life) * 0.5; ctx.fillStyle = '#6fb6d9'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 2, q.r, 8, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = Math.min(1, q.life); ctx.strokeStyle = '#bfe4f4'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    }
    for (const c of clouds) {
      ctx.save(); ctx.globalAlpha = Math.min(1, c.life) * (0.35 + 0.1 * Math.sin(G.time * 6)); ctx.fillStyle = '#d8c64a';
      for (const [dx, dy, k] of [[0, 0, 1], [-0.45, 0.2, 0.7], [0.45, 0.15, 0.75], [0.1, -0.4, 0.6]]) { ctx.beginPath(); ctx.arc(c.x + dx * c.r, c.y + dy * c.r, c.r * 0.5 * k, 0, 6.283); ctx.fill(); }
      ctx.restore();
    }
    for (const s of shots) {
      if (s.paint) s.paint(ctx, s);
      else { ctx.fillStyle = s.color || (s.hostile ? '#cfe3c0' : '#fff3c4'); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }
      if (s.ignited || s.parked) { ctx.save(); ctx.strokeStyle = s.ignited ? '#ff9a3c' : '#a9b2bd'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.time * 14); ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 5, 0, 6.283); ctx.stroke(); ctx.restore(); }
    }
    for (const b of bolts) {
      ctx.save(); ctx.globalAlpha = Math.min(1, b.t * 5); ctx.strokeStyle = '#bfe4f4'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(b.x0, b.y0);
      for (let i = 1; i < 6; i++) { const k = i / 6; ctx.lineTo(b.x0 + (b.x1 - b.x0) * k, b.y0 + (b.y1 - b.y0) * k + (i % 2 ? -9 : 9)); }
      ctx.lineTo(b.x1, b.y1); ctx.stroke(); ctx.restore();
    }
    for (const k of pickups) {
      ctx.save(); ctx.translate(k.x, k.y - 5); ctx.rotate(Math.PI / 4 + G.time * 2 + k.x);
      ctx.globalAlpha = k.life < 2 ? 0.4 + 0.6 * (Math.floor(G.time * 10) % 2) : 1;
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
};
})();
