/* G.Player: movement, slashing, mending, token use. Feel is identical to reference/prototype.html.
   Abilities are shared by the party (G.run.abil). Each player owns some of the party's three token slots (p.slots; four players: one each). */
(() => {
'use strict';
const G = window.G, C = G.C, M = C.MOVE, T = C.T, U = G.util, fx = G.fx, tiles = G.tiles;

G.players = [];
G.abilityDefs = {};
// Movement abilities are flags on the run. Content can add more with G.defineAbility.
G.defineAbility = def => { G.abilityDefs[def.id] = def; };
G.defineAbility({ id: 'dash', name: 'Dash', how: 'C, K or Shift. Works in the air once.' });
G.defineAbility({ id: 'grip', name: 'Wall Grip', how: 'Push into a wall to slide. Jump to kick off it.' });
G.defineAbility({ id: 'double', name: 'Double Jump', how: 'Jump again in the air.' });
G.defineAbility({ id: 'heavy', name: 'Heavy Cut', how: 'Hold slash, then release.' });

class Player {
  constructor(index, input) {
    this.index = index; this.in = input; this.w = 22; this.h = 42;
    this.color = C.PLAYER_COLORS[index % C.PLAYER_COLORS.length];
    this.items = []; this.slots = C.SLOTS; this.sel = 0;
    this.hp = C.BASE_HP; this.glow = 0; this.down = false;
    this.scarf = []; for (let i = 0; i < 6; i++) this.scarf.push({ x: 0, y: 0 });
    this.place(0, 0);
  }
  get maxHp() { return Math.max(1, C.BASE_HP + G.run.bonusHp + G.run.mods.maxHp); }
  get cy() { return this.y - 21; }
  rect() { return { x0: this.x - this.w / 2, x1: this.x + this.w / 2, y0: this.y - this.h, y1: this.y }; }

  // Put the player somewhere and clear all motion state (hp, items and gauge are kept).
  place(x, y, face = 1) {
    Object.assign(this, { x, y, vx: 0, vy: 0, face, onGround: true, coyote: 0, jbuf: 0, dbuf: 0, abuf: 0, jumping: false, airJ: false,
      canDash: true, canDouble: true, dashT: 0, dashCd: 0, dashDir: 1, wall: 0, sliding: false, wlock: 0, atkCd: 0, slash: null, charge: 0,
      inv: 0, stun: 0, healT: 0, recoilT: 0, recoilV: 0, safeX: x, safeY: y, groundT: 0, squash: 0, itemCd: 0, ghostT: 0, dropT: 0, dropThru: false, _ventCd: 0 });
    for (const s of this.scarf) { s.x = x; s.y = y - 30; }
  }

  // A downed player gets back up with hp health (a new room, a standpipe). Plays the revive strip.
  revive(hp) { if (this.down) this.reviveAt = G.time; this.down = false; this.hp = hp; }
  hurt(fromX) {
    if (this.inv > 0 || this.down || G.debug.godMode) return false;
    this.hp--; this.inv = M.INV; this.stun = 0.22; this.vx = (this.x < fromX ? -1 : 1) * 260 * G.run.mods.knockback; this.vy = -420;
    this.dashT = 0; this.healT = 0; this.slash = null; this.charge = 0; this.sliding = false; this.jumping = false;
    G.run.stats.hits++; if (this.hp > 0 && this.glow >= M.MEND_COST) G.tips.fire('mend'); fx.jolt(M.STOP_HURT, 10); fx.spark(this.x, this.cy, 14, '#fff3c4', 320, 0.4);
    if (this.hp <= 0) { this.hp = 0; this.down = true; this.downAt = G.time; fx.spark(this.x, this.cy, 40, this.color, 420, 0.8); }
    return true;
  }

  startSlash(heavy) {
    const dir = this.in.held.up ? 'up' : (this.in.held.down && !this.onGround ? 'down' : 'side');
    this.slash = { dir, t: 0, dur: heavy ? 0.24 : 0.16, heavy, face: this.face, hit: {} };
    this.atkCd = heavy ? 0.42 : M.ATK_CD; this.abuf = 0;
    if (heavy && dir === 'side') { this.recoilT = 0.1; this.recoilV = this.face * 260; }
  }
  slashRect(s) {
    const k = s.heavy;
    if (s.dir === 'side') {
      const a = this.x + s.face * 6, b = this.x + s.face * (k ? 108 : 74);
      return { x0: Math.min(a, b), x1: Math.max(a, b), y0: this.y - (k ? 66 : 50), y1: this.y - (k ? 0 : 4) };
    }
    const hw = k ? 46 : 30;
    if (s.dir === 'up') return { x0: this.x - hw, x1: this.x + hw, y0: this.y - this.h - (k ? 88 : 58), y1: this.y - this.h + 8 };
    return { x0: this.x - hw, x1: this.x + hw, y0: this.y - 10, y1: this.y + (k ? 80 : 56) };
  }
  // Called by the combat layer for each thing a slash connects with.
  slashLanded(s, x, y, gainsGlow) {
    fx.jolt(s.heavy ? 0.09 : M.STOP_HIT, s.heavy ? 9 : 4);
    fx.spark(x, y, s.heavy ? 16 : 8, '#fff3c4', 340, 0.3);
    if (gainsGlow) this.glow = Math.min(99, this.glow + (s.heavy ? 16 : 11));
    if (s.dir === 'side') { this.recoilT = 0.09; this.recoilV = -s.face * 230; }
    else if (s.dir === 'down') { this.vy = -M.POGO_V; this.jumping = false; this.airJ = false; this.canDash = true; this.canDouble = true; }
    else if (!this.onGround) this.vy = Math.max(this.vy, 120);
  }

  useItem() {
    const def = G.itemDefs[this.items[this.sel]];
    if (!def) return;
    this.itemCd = def.cd * G.run.mods.itemCd; this.itemCdMax = this.itemCd; this.castAt = G.time; this.castCls = def.cls;
    def.use(this);
  }

  update(dt) {
    const p = this, inp = p.in, held = inp.held, pressed = inp.pressed, abil = G.run.abil;
    const surface = p.onGround ? tiles.surfaceUnder(p) : '.', salt = surface === 's', mud = surface === 'm', belt = p.onGround ? tiles.conveyor(p) : 0;
    const run = M.RUN * G.run.mods.speed * (mud ? 0.58 : 1), groundAcc = M.GACC * (salt ? 0.18 : mud ? 0.72 : 1);
    if (p.down) { p.vy = Math.min(p.vy + M.GRAV * dt, M.MAXFALL); p.vx = U.approach(p.vx, 0, M.GACC * dt); const r = tiles.moveBox(p, p.vx * dt, p.vy * dt); if (r.hy === 1) p.vy = 0; return; }
    p.coyote -= dt; p.jbuf -= dt; p.dbuf -= dt; p.abuf -= dt; p.dashCd -= dt; p.atkCd -= dt; p.inv -= dt; p.wlock -= dt; p.stun -= dt;
    p.recoilT -= dt; p.itemCd -= dt; p.dropT -= dt; p.squash = U.approach(p.squash, 0, dt * 6);
    const ctrl = p.stun <= 0;
    let ax = ctrl ? (held.right ? 1 : 0) - (held.left ? 1 : 0) : 0;
    if (pressed.jump) p.jbuf = M.JBUF;
    if (pressed.dash) p.dbuf = 0.1;
    if (pressed.attack) p.abuf = 0.12;

    // mend: spend glow earned from landing hits
    if (ctrl && held.heal && p.onGround && p.glow >= M.MEND_COST && p.hp < p.maxHp && p.dashT <= 0 && !p.slash) {
      p.healT += dt; ax = 0;
      if (p.healT >= M.MEND_T * G.run.mods.mendTime) { p.healT = 0.001; p.hp++; p.glow -= M.MEND_COST; fx.ring(p.x, p.cy, 8, 220, '#fff3c4', 0.35); fx.spark(p.x, p.cy, 12, '#fff3c4', 160, 0.5, -200); }
    } else p.healT = 0;
    const healing = p.healT > 0;

    if (ctrl && p.dbuf > 0 && abil.dash && p.dashCd <= 0 && p.canDash && !healing) {
      if (p.slash && p.slash.t > M.ATK_ACTIVE) { p.slash = null; p.recoilT = 0; }          // dash cancels slash recovery
      p.dashDir = p.sliding ? -p.wall : (ax || p.face); p.face = p.dashDir;
      p.dashT = M.DASH_T; p.dashCd = M.DASH_CD * G.run.mods.dashCd; p.canDash = false; p.dbuf = 0; p.vy = 0; p.jumping = false; p.sliding = false; p.wlock = 0;
      fx.dust(p.x, p.y, p.onGround ? 5 : 0, -p.dashDir);
    }
    if (p.dashT > 0) {
      p.dashT -= dt; p.vx = p.dashDir * M.DASH_V; p.vy = 0;
      p.ghostT -= dt;
      if (p.ghostT <= 0) {
        p.ghostT = 0.028; const f = p.face;
        if (stripsOn(p)) {                                              // watercolor player: the current dash frame as a faint silhouette
          const [name, frame] = pickStrip(p), id = G.art.hasStrip('player_' + name) ? 'player_' + name : 'player_idle', col = p.color;
          fx.ghost(p.x, p.y, 0.22, (ctx, a) => G.art.drawSilhouette(id, ctx, frame, { x: 0, y: 0, face: f, h: 68, foot: 4, color: col, alpha: a * 0.7 }));
        } else fx.ghost(p.x, p.y, 0.22, (ctx, a) => { ctx.scale(f * 1.3, 0.8); cloak(ctx, a, '#62d2b4'); });
      }
      if (p.dashT <= 0) p.vx = p.dashDir * run * (ax === p.dashDir ? 1 : 0.35);
    } else {
      if (p.onGround && !salt && ax && p.vx * ax < 0 && p.wlock <= 0 && p.stun <= 0) p.vx = ax * Math.min(Math.abs(p.vx), run * M.QUICK_TURN);   // quick stop: turn at once
      if (p.wlock <= 0 && p.stun <= 0) p.vx = U.approach(p.vx, ax * run, (p.onGround ? groundAcc : M.AACC) * dt);
      if (ax && !p.slash && p.wlock <= 0) p.face = ax;
      if (!held.jump) p.airJ = false;
      let g = M.GRAV;
      if (p.airJ && Math.abs(p.vy) < 100) g *= 0.5;                                   // a touch of hang at the top
      p.vy = Math.min(p.vy + g * dt, M.MAXFALL);
      if (p.jumping && !held.jump && p.vy < 0) { p.vy *= M.CUT; p.jumping = false; }   // let go early for a short hop
      if (p.vy >= 0) p.jumping = false;

      p.wall = !p.onGround && abil.grip ? tiles.wallDir(p) : 0;
      if (p.wall && p.vy > 0 && (ax === p.wall || (p.sliding && ax !== -p.wall))) {
        p.sliding = true; p.vy = Math.min(p.vy, M.SLIDE); p.canDash = true; p.canDouble = true; p.face = -p.wall;
        if (Math.random() < 0.3) fx.dust(p.x + p.wall * 10, p.y - 20, 1);
      } else p.sliding = false;

      if (ctrl && p.jbuf > 0 && !healing) {
        const onOneWay = p.onGround && !tiles.solid(Math.floor(p.x / T), Math.floor(p.y / T)) && tiles.oneway(Math.floor(p.x / T), Math.floor(p.y / T));
        if (held.down && onOneWay) { p.dropT = 0.18; p.jbuf = 0; p.onGround = false; p.coyote = 0; }      // drop through a one-way platform
        else if (p.onGround || p.coyote > 0) {
          p.vy = -M.JUMP_V; p.jumping = p.airJ = true; p.jbuf = 0; p.coyote = 0; p.onGround = false; p.squash = -0.7; fx.dust(p.x, p.y, 5);
        } else if (p.wall) {
          p.vy = -M.WJ_VY; p.vx = -p.wall * M.WJ_VX; p.wlock = M.WJ_LOCK; p.face = -p.wall; p.jumping = p.airJ = true; p.jbuf = 0; p.sliding = false;
          p.squash = -0.6; fx.dust(p.x + p.wall * 10, p.y - 10, 5, -p.wall);
        } else if (abil.double && p.canDouble) {
          p.vy = -M.DJ_V; p.canDouble = false; p.djAt = G.time; p.jumping = p.airJ = true; p.jbuf = 0; p.squash = -0.6;
          fx.ring(p.x, p.y, 6, 160, '#62d2b4', 0.25); fx.spark(p.x, p.y, 8, '#62d2b4', 160, 0.35, 300);
        }
      }
    }

    const was = p.onGround, fallV = p.vy;
    p.dropThru = p.dropT > 0;
    const mdx = (p.vx + (p.recoilT > 0 ? p.recoilV : 0) + belt * 105) * dt, mdy = p.vy * dt, sx0 = p.x, sy0 = p.y;
    const res = tiles.moveBox(p, mdx, mdy);
    // corner correction: nudge past a clipped ceiling corner (jump) or ledge corner (dash) instead of stopping
    if (res.hy === -1 && mdy < 0) {
      for (let n = 1; n <= M.CORNER; n++) {
        const o = [1, -1].find(sg => boxFree(p.x + sg * n, sy0 + mdy, p.w, p.h));
        if (o) { p.x += o * n; p.y = sy0 + mdy; res.hy = 0; break; }
      }
    }
    if (res.hx && p.dashT > 0) {
      const tx = sx0 + mdx;
      for (let n = 1; n <= M.CORNER; n++) if (boxFree(tx, p.y - n, p.w, p.h)) { p.x = tx; p.y -= n; res.hx = 0; break; }
    }
    if (res.hx) { if (p.dashT > 0) p.dashT = 0; p.vx = 0; }
    if (res.hy === 1) {
      if (!was) { fx.dust(p.x, p.y, fallV > 500 ? 8 : 4); p.squash = fallV > 300 ? 0.8 : 0.4; }
      p.onGround = true; p.vy = 0; p.coyote = M.COYOTE; p.canDouble = true; p.airJ = false; p.sliding = false;
      if (p.dashT <= 0) p.canDash = true;
      p.groundT += dt;
      const r = Math.floor(p.y / T), under = x => tiles.stableFloorAt(Math.floor(x / T), r) && x > 0 && x < tiles.cols * T;
      if (p.groundT > 0.12 && under(p.x - 18) && under(p.x + 18) && p.inv <= 0) { p.safeX = p.x; p.safeY = p.y; }
    } else { p.onGround = false; p.groundT = 0; if (res.hy === -1) p.vy = 0; }

    // spikes: lose a pip and return to the last safe footing
    const sr = Math.floor((p.y - 1) / T);
    for (let c = Math.floor((p.x - p.w / 2) / T); c <= Math.floor((p.x + p.w / 2) / T); c++)
      if (tiles.spike(c, sr) && p.y > sr * T + 12) { p.hurt(p.x); if (!p.down) { p.x = p.safeX; p.y = p.safeY; p.vx = p.vy = 0; p.stun = 0.25; } break; }
    if (p.down) return;

    // slashing
    if (p.slash) { p.slash.t += dt; if (p.slash.t >= p.slash.dur) p.slash = null; else if (p.slash.t <= M.ATK_ACTIVE) G.combat.melee(p, p.slash, p.slashRect(p.slash)); }
    const canAct = ctrl && p.dashT <= 0 && !healing;
    if (canAct && p.abuf > 0 && p.atkCd <= 0) p.startSlash(false);
    if (abil.heavy) {
      if (held.attack && canAct) p.charge += dt;
      else { if (p.charge >= M.HEAVY_T && canAct) p.startSlash(true); p.charge = 0; }
    }

    // tokens and props
    if (pressed.cycle && p.items.length > 1) p.sel = (p.sel + 1) % p.items.length;
    if (p.sel >= p.items.length) p.sel = 0;
    if (canAct && pressed.item && p.items.length && p.itemCd <= 0) p.useItem();
    if (canAct && pressed.interact && p.onGround) { const pr = G.rooms.propNear(p); if (pr) { pr.interact(p); p.interactAt = G.time; } }
  }

  draw(ctx, dt) {
    if (G.debug.hidePlayers) return;                 // (tests: hide every player to compare a picture with and without)
    const p = this, sc = p.scarf;
    sc[0].x = p.x - p.face * 7; sc[0].y = p.y - 30;
    for (let i = 1; i < sc.length; i++) {
      const a = sc[i - 1], b = sc[i]; b.y += 50 * dt;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d > 200) { b.x = a.x; b.y = a.y; } else if (d > 7) { b.x = a.x + dx / d * 7; b.y = a.y + dy / d * 7; }
    }
    G.art.draw('player', ctx, { x: p.x, y: p.y, face: p.face, p });
    if (p.down) return;
    if (p.charge > 0.2) {
      const full = p.charge >= M.HEAVY_T, r = full ? 20 + Math.sin(G.time * 30) * 2 : 30 - p.charge * 20;
      ctx.strokeStyle = full ? '#fff3c4' : '#e9a23b'; ctx.lineWidth = full ? 3 : 2; ctx.globalAlpha = full ? 0.9 : 0.5;
      ctx.beginPath(); ctx.arc(p.x, p.y - 22, r, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (p.healT > 0) { ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(p.x, p.cy, 34 * (1 - p.healT / (M.MEND_T * G.run.mods.mendTime)) + 6, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
    if (p.slash) {
      const s = p.slash, k = s.t / s.dur, R = s.heavy ? 78 : 54;
      ctx.save(); ctx.translate(p.x, p.y - 24);
      ctx.rotate(s.dir === 'up' ? -Math.PI / 2 : s.dir === 'down' ? Math.PI / 2 : s.face > 0 ? 0 : Math.PI);
      if (s.dir === 'side' && s.face < 0) ctx.scale(1, -1);
      ctx.globalAlpha = 1 - k * k; ctx.fillStyle = s.heavy ? '#ffd27a' : '#fbf6e6';
      const a = -1.15 + k * 0.5, b = 1.15 - (1 - k) * 0.6;
      ctx.beginPath(); ctx.arc(8, 0, R, a, b); ctx.arc(8 - (s.heavy ? 26 : 18), 0, R + 4, b * 0.96, a * 0.96, true); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
}
G.Player = Player;

// True if a box (x centre, y feet) overlaps no solid tile.
function boxFree(x, y, w, h) {
  const c0 = Math.floor((x - w / 2 + 0.01) / T), c1 = Math.floor((x + w / 2 - 0.01) / T), r0 = Math.floor((y - h) / T), r1 = Math.floor((y - 0.01) / T);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles.solid(c, r)) return false;
  return true;
}

function cloak(ctx, alpha, color) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.strokeStyle = G.art.playerOutline; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-9, -27); ctx.quadraticCurveTo(-1, -47, 9, -29); ctx.lineTo(12, 0); ctx.closePath(); ctx.stroke(); ctx.fill();
  ctx.globalAlpha = 1;
}

// The watercolor strips are on (F2) and the idle and run strips are loaded: every player uses them (players 2 to 4 wear a coloured marker over the head).
const stripsOn = p => !!(G.artTest && G.art.hasStrip('player_idle') && G.art.hasStrip('player_run'));
// Which watercolor strip and frame shows the player's current state. Order matters: the first match wins.
function pickStrip(p) {
  const t = G.time, since = at => (at === undefined ? 9 : t - at), step = (e, dur, n) => Math.min(n - 1, Math.floor(e / dur * n));
  if (p.down) return ['ko', step(since(p.downAt), 0.5, 4)];
  const rev = since(p.reviveAt); if (rev < 0.5) return ['revive', step(rev, 0.5, 4)];            // just got back up
  const hurtFor = p.inv > 0 ? (M.INV || 1) - p.inv : 9;
  if (hurtFor >= 0 && hurtFor < 0.3 && p.stun > 0) return ['hurt', step(hurtFor, 0.3, 4)];
  if (p.slash) {
    const k = p.slash.t / p.slash.dur;
    if (p.slash.heavy) return ['heavy', 2 + step(k, 1, 4)];
    if (p.slash.dir === 'down') return ['slash_down', 1 + step(k, 1, 3)];
    return ['slash_side', 1 + step(k, 1, 5)];
  }
  const cast = since(p.castAt);
  if (cast < 0.32 && p.castCls) { const n = p.castCls === 'ground' ? 4 : 6; return [p.castCls, 1 + step(cast, 0.32, n - 1)]; }
  const use = since(p.interactAt); if (use < 0.4 && p.onGround && Math.abs(p.vx) < 40) return ['interact', step(use, 0.4, 4)];     // used a prop
  if (p.dashT > 0) return ['dash', 1 + step(1 - p.dashT / (M.DASH_T || 0.155), 1, 2)];
  if (p.charge > 0.2) return ['heavy', Math.floor(t * 6) % 2];
  if (p.healT > 0) return ['mend', t * 5];
  if (p.sliding) return ['wallslide', 1];
  if (!p.onGround) {
    const dj = since(p.djAt);
    if (dj < 0.32) return ['doublejump', step(dj, 0.32, 4)];
    return ['jump', p.vy < -140 ? 1 : p.vy < 160 ? 2 : 3];
  }
  if (Math.abs(p.vx) > 40) return ['run', t * 13];
  if (p.squash > 0.2) return ['land', 1];
  return ['idle', t * 5];
}

G.pickStrip = pickStrip;                           // (for the art_test check)

// Procedural painter for the player. opts.p is the Player.
G.art.define('player', (ctx, o) => {
  const p = o.p, base = p.down ? 0.55 : (p.inv > 0 ? (G.meta.settings.reduceFlashes ? 0.6 : Math.floor(G.time * 22) % 2 ? 0.45 : 1) : 1);   // (never false/0: a bare `inv > 0 && ...` made the player invisible whenever not hurt)
  ctx.globalAlpha = base;
  // Watercolor player (F2 toggles; player 1 only): strips replace the code-drawn body and scarf. Missing files fall through to the code-drawn player.
  if (stripsOn(p)) {
    const [name, frame] = pickStrip(p);
    const stripId = G.art.hasStrip('player_' + name) ? 'player_' + name : 'player_idle';
    for (const [dx,dy] of [[-1.5,0],[1.5,0],[0,-1.5],[0,1.5]]) G.art.drawSilhouette(stripId, ctx, frame, { x:p.x+dx, y:p.y+dy, face:p.face, h:68, foot:4, color:G.art.playerOutline, alpha:0.8 });
    G.art.drawFrame(stripId, ctx, frame, { x: p.x, y: p.y, face: p.face, h: 68, foot: 4 });
    if (p.index > 0 && !p.down) {                                                  // players 2 to 4: a small marker in their colour above the head
      const my = p.y - 68 - 12 + Math.sin(G.time * 4 + p.index) * 1.5;
      ctx.globalAlpha = 1; ctx.fillStyle = p.color; ctx.strokeStyle = '#0a1110'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(p.x - 6, my - 6); ctx.lineTo(p.x + 6, my - 6); ctx.lineTo(p.x, my + 4); ctx.closePath(); ctx.stroke(); ctx.fill();
    }
    ctx.globalAlpha = 1; return;
  }
  ctx.strokeStyle = '#62d2b4'; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(p.scarf[0].x, p.scarf[0].y); for (let i = 1; i < p.scarf.length; i++) ctx.lineTo(p.scarf[i].x, p.scarf[i].y); ctx.stroke();
  let sx = 1 + p.squash * 0.25, sy = 1 - p.squash * 0.25;
  if (!p.onGround && p.dashT <= 0) { const k = U.clamp(Math.abs(p.vy) / 900, 0, 1) * 0.16; sx -= k; sy += k; }
  if (p.dashT > 0) { sx = 1.35; sy = 0.78; }
  if (p.down) { sx = 1.3; sy = 0.45; }
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.face * sx, sy);
  if (p.sliding) ctx.rotate(-0.12);
  const run = p.onGround && Math.abs(p.vx) > 40 ? Math.sin(G.time * 26) * 3 : 0;
  ctx.fillStyle = '#1a1410'; ctx.fillRect(-7 + run, -6, 5, 6); ctx.fillRect(2 - run, -6, 5, 6);
  cloak(ctx, base, p.color); ctx.globalAlpha = base;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-11, -8, 22, 3);
  ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(3.5, -30, 6.5, 6, 0, 0, 6.283); ctx.fill();
  if (!p.down) { ctx.fillStyle = '#fff3c4'; ctx.fillRect(2, -32, 2.2, 3.2); ctx.fillRect(6, -32, 2.2, 3.2); }
  if (!p.slash) { ctx.strokeStyle = '#d8ceb4'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-17, -34); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha = 1;
});
})();
