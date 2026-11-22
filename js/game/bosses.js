/* Bosses (Wardens): a registry plus a base class that owns hp, fare slots, the intro, stagger, contact damage and death.
   A boss file only describes what makes the boss itself: its attacks, its poses, its drawing and its fare slots.

   G.defineBoss({
     id, name, hp, par, w, h,       par: the time in seconds under which a fight earns the Par grade (about 1.2 x the slash-only bot time of fight_len, one player)
                                    body box (its feet centre is b.x, b.y)
     spots: { <cut>: { name, local, r, exposed(b), accepts(b, strike), onBreak(b), lost } },
                                    fare slots keyed by cut ('pierce' | 'arc' | 'burst' | 'ground'), at most one per cut.
                                    local: [x, y] in boss space (x forward, y up negative, origin at the feet) OR a function (b) => [x, y] for a slot
                                    that moves (a head, a vent that changes sides). Never write a getter: the base class resolves it with b.spotLocal(sp).
     init(b), update(b, dt),        update runs in every state except sleep, intro, stagger and dead (the base class runs those)
     pose(b),                       optional: { rot, px, py, sx, sy, ox } rotation about local pivot (px, py), squash, x wobble (art only; hit shapes ignore it)
     draw(b, ctx),                  drawn in boss space, facing right; the base class applies position, facing and pose
     staggered(b, dt)               optional hook while staggered

     HOOKS (all optional; a boss file never assigns to an instance method of G.Boss: the check boss_hooks fails on that)
     shapes(b)                      the boxes a slash or a token body hit can land on: one world rect { x0, x1, y0, y1 } or an array of them. It is asked
                                    every time, so it can change with the state (a lying body, a head stuck in the floor, a ball and a tail).
                                    Default: the body box (w x h). b.hitsCircle(x, y, r), b.hitsRect(rect), b.shapes() use it; b.rect() is the bounding
                                    box of all shapes, for older code that takes one rect.
     contact                        false = touching the boss never hurts; true or missing = the body box, inset 4 px at the sides and 6 px on top, hurts.
                                    Either way only while b.phase() is 'strike' (the strike states of the attack registry): standing inside a Warden that
                                    is idle, winding up, recovering or staggered is safe (playtest round 2, issue 7)
                                    (never while staggered or dead); a function (b) => false | rect | rect[] decides per state and may return several boxes.
                                    A function must return false while b.held or the intro is on if the boss only hurts through its own attacks.
     onStart(b)                     the fight begins (before hp is scaled for co-op): reset per-fight state, borrow attacks, set b.scale = 1 if you set hp
     filterDamage(b, d)             returns the damage a body hit really does (armour, shutters). Fare-slot punches are not filtered.
     onDeath(b)                     once, the step hp reaches 0 (before the Warden reward): clear crates, beams and other things the boss left in the room.
                                    Everything the boss summoned with b.summon() is killed for you.
     windScale(b)                   multiplier for every wind-up (default: 0.75 below half hp, else 1)
     interp: ['hx', ...]            numeric fields of the boss that are drawn interpolated between simulation steps (positions of limbs, angles)

     ATTACK REGISTRY: G.defineAttacks('<boss id>', { <attack id>: { name, tell, wind, min, strike, strikeT, recover, recoverStates, fair, dodge, slots, like } })
       name            what the attack is called
       tell            the state the boss is in while it winds up (the wind-up the player reads), wind: its length in seconds before any scaling.
                       The fairness rule: wind >= 0.45 s, and wind x windScale (0.75 enraged) not under min (0.35 s). Checked by boss_hooks.
       strike          [states] in which the attack hurts; strikeT: how long they last, nominal (art timing only: the real timers rule)
       recover         seconds of opening after it (nominal), recoverStates: [states] that make up that opening (default ['recover'])
       fair            one or two sentences: how a player reads it and what beats it (required)
       dodge           the base move that beats it: 'jump' | 'duck' | 'move' | 'leave' | 'cut'
       slots           [{ cut, flag, mode: 'disable' | 'weaken', note }]: the fare slot whose punch sets b.flags[flag]; 'disable' also takes the attack out of
                       b.available(id), 'weaken' only changes how it plays (the boss code reads the flag)
       like            'bossId.attackId': take every field not given here from another boss's attack (the Long Clock's borrowed attacks do)
     b.begin(id) puts the boss into the attack's tell with its scaled wind-up and remembers the attack (b.attack, b.phase()); b.available(id) says whether a
     punched slot has taken it away. Skins read the same table (js/art/boss_skins.js).

     SUMMONS: b.summon(enemyId, x, y, { loot, face, kb }) makes an enemy the boss owns (b.owned, e.owner), b.ownedAlive(enemyId?) lists the living ones.
              loot: false = it drops no scrip and gives no mend, so it cannot be farmed.
     Boss space helpers: b.toWorld(lx, ly), b.spotPos(spot). State helpers: b.set(state, t), b.state, b.t (counts down), b.t0 (what it was set to),
     b.sAge (seconds in the state), b.rage (below half hp), b.target(), b.facePlayer(), b.flags (free-form, e.g. set by onBreak), b.minX / b.maxX / b.floor
     (arena limits), b.shoot(def) (def.kind names the shot so a skin can swap its picture). */
(() => {
'use strict';
const G = window.G, C = G.C, U = G.util, fx = G.fx;
G.bossDefs = {};

G.defineBoss = def => {
  if (!def.id || typeof def.update !== 'function') return G.fail('bad boss definition: ' + (def.id || '?'));
  for (const cls in def.spots || {}) {
    const sp = def.spots[cls], d = Object.getOwnPropertyDescriptor(sp, 'local');
    if (!G.CLASSES[cls] || !sp.local || (d && d.get)) G.fail('boss ' + def.id + ' has a bad fare slot: ' + cls + ' (local is [x, y] or a function)');
  }
  if (def.contact !== undefined && typeof def.contact !== 'boolean' && typeof def.contact !== 'function') G.fail('boss ' + def.id + ': contact is a boolean or a function');
  G.bossDefs[def.id] = Object.assign({ hp: 400, w: 120, h: 100, spots: {}, name: def.id }, def);
  if (def.draw) G.art.define('boss_' + def.id, (ctx, o) => def.draw(o.ent, ctx));
};

// ---- the attack registry
G.attackDefs = {};
const resolved = {};
G.defineAttacks = (bossId, table) => {
  const t = G.attackDefs[bossId] = G.attackDefs[bossId] || {};
  for (const id in table) {
    const a = table[id];
    if (!a.tell && !a.like) G.fail('attack ' + bossId + '.' + id + ' has no tell');
    t[id] = Object.assign({ id, boss: bossId }, a);
  }
  for (const k in resolved) delete resolved[k];
};
// The attack with its `like` parent filled in (the parent's fare slots are not inherited: they belong to another boss).
G.attackDef = (bossId, id, depth = 0) => {
  const key = bossId + '.' + id;
  if (resolved[key]) return resolved[key];
  const a = G.attackDefs[bossId] && G.attackDefs[bossId][id];
  if (!a) return null;
  let out = a;
  if (a.like && depth < 4) {
    const [pb, pid] = a.like.split('.'), p = G.attackDef(pb, pid, depth + 1);
    if (p) out = Object.assign({}, p, a);
    else G.fail('attack ' + key + ' is like ' + a.like + ', which does not exist');
  }
  out = Object.assign({ min: 0.35, strike: [], recoverStates: ['recover'], recover: 0, strikeT: 0, slots: [] }, out, { slots: a.slots || [] });
  return (resolved[key] = out);
};

class Boss {
  // limits: { x0, x1 } the open floor of the arena in pixels (set by the room from its boss door and right wall)
  constructor(def, x, y, region, limits) {
    Object.assign(this, { def, id: def.id, region, x, y, floor: y, vx: 0, vy: 0, face: -1, hp: def.hp, maxHp: def.hp, w: def.w, h: def.h,
      state: 'sleep', t: 0, t0: 0, sAge: 0, clock: 0, hits0: 0, spent0: 0, flash: 0, sealedT: 0, flags: {}, held: null,
      attack: null, owned: [], hurtAt: -9, hurtHeavy: false, lastX: x, speed: 0, phase2: false, deathWash: 0,
      minX: limits.x0 + def.w / 2 + 13, maxX: limits.x1 - def.w / 2 - 13 });
    // Only the cuts on this run's lock chart have a fare slot at all (the fourth is not drawn, not listed, cannot be punched).
    const chart = G.run && G.run.graph && G.run.graph.chart && G.run.graph.chart[region];
    this.chart = chart ? chart.slice() : Object.keys(def.spots);
    this.spots = Object.keys(def.spots).filter(cls => this.chart.includes(cls)).map(cls => ({ def: def.spots[cls], cls, hp: C.SPOT_HP, open: false, broken: false, flash: 0 }));
    if (def.init) def.init(this);
  }
  get rage() { return this.hp < this.maxHp / 2; }
  set(state, t = 0) { this.state = state; this.t = t; this.t0 = t; this.sAge = 0; if (state === 'idle' || state === 'stagger' || state === 'intro') this.attack = null; }
  active() { return this.state !== 'sleep' && this.state !== 'dead'; }

  // ---- hit shapes: where a slash or a token body hit can land. Asked every time, so a definition can change them per state.
  bodyRect() { return { x0: this.x - this.w / 2, x1: this.x + this.w / 2, y0: this.y - this.h, y1: this.y }; }
  shapes() {
    const f = this.def.shapes, r = f ? f(this) : null;
    return r ? (Array.isArray(r) ? r : [r]) : [this.bodyRect()];
  }
  // One rect that holds every shape (older code takes a single rect: the fight bot, the tests). With one shape it is that shape.
  rect() {
    const a = this.shapes();
    if (a.length === 1) return a[0];
    return { x0: Math.min(...a.map(q => q.x0)), x1: Math.max(...a.map(q => q.x1)), y0: Math.min(...a.map(q => q.y0)), y1: Math.max(...a.map(q => q.y1)) };
  }
  hitsCircle(x, y, r) { return this.shapes().some(q => U.circleRect(x, y, r, q)); }
  // The first shape that overlaps rect, or null.
  hitsRect(rect) { return this.shapes().find(q => U.overlap(rect, q)) || null; }
  // The boxes that hurt a player who touches the boss right now (see `contact` in the definition).
  contactBoxes() {
    const c = this.def.contact;
    if (c === false) return [];
    if (this.phase() !== 'strike') return [];         // fairness: the body only hurts during an attack's committed strike frames, never idle, tell or recovery
    if (typeof c === 'function') { const r = c(this); return r ? (Array.isArray(r) ? r : [r]) : []; }
    return [{ x0: this.x - this.w / 2 + 4, x1: this.x + this.w / 2 - 4, y0: this.y - this.h + 6, y1: this.y }];
  }
  // True while the boss's own attack code runs (not frozen by a test, not in its intro): contact functions use this.
  acting() { return !this.held && this.state !== 'intro'; }

  // ---- attacks (the registry above)
  attackDef(id) { return G.attackDef(this.id, id); }
  windScale() { const f = this.def.windScale; return f ? f(this) : (this.rage ? 0.75 : 1); }
  windFor(a) { return Math.max(a.min === undefined ? 0.35 : a.min, a.wind * this.windScale()); }
  // Start an attack: the boss goes into its tell state for the scaled wind-up. Returns the attack, or null if it is not registered.
  begin(id) {
    const a = this.attackDef(id);
    if (!a) { G.fail('boss ' + this.id + ' has no attack ' + id); return null; }
    this.set(a.tell, this.windFor(a)); this.attack = id; return a;
  }
  // False when a punched fare slot has taken the attack away (slots with mode 'disable').
  available(id) { const a = this.attackDef(id); return !!a && !a.slots.some(s => s.mode === 'disable' && this.flags[s.flag]); }
  // 'wind' | 'strike' | 'recover' | null: which part of the current attack the boss is in.
  phase() {
    const a = this.attack && this.attackDef(this.attack);
    if (!a) return null;
    if (this.state === a.tell) return 'wind';
    if (a.strike.includes(this.state)) return 'strike';
    if (a.recoverStates.includes(this.state)) return 'recover';
    return null;
  }

  // ---- things the boss owns
  // An enemy that belongs to the boss: it is listed in b.owned, knows e.owner, and dies with the boss. loot: false = no scrip, no mend.
  summon(enemyId, x, y, o = {}) {
    const e = new G.Enemy(G.enemyDefs[enemyId], x, y);
    e.owner = this; e.summoned = true; if (o.loot === false) e.noLoot = true;
    if (o.face) e.face = o.face;
    if (o.kb) { e.kbT = o.kb[0]; e.kbV = o.kb[1]; }
    G.rooms.current.enemies.push(e); this.owned.push(e); return e;
  }
  ownedAlive(id) { this.owned = this.owned.filter(e => !e.dead); return id ? this.owned.filter(e => e.id === id) : this.owned.slice(); }
  killOwned() { for (const e of this.ownedAlive()) e.damage(9999, this.x); this.owned = []; }
  target() {
    let best = null, bd = Infinity;
    for (const p of G.players) { if (p.down) continue; const d = Math.abs(p.x - this.x); if (d < bd) { bd = d; best = p; } }
    return best || G.players[0];
  }
  facePlayer() { this.face = this.target().x < this.x ? -1 : 1; }
  // def.kind names the shot ('wave', 'glob'): while a skin with an fx strip is on, its picture replaces def.paint (js/art/boss_skins.js).
  shoot(def) {
    if (def.kind && def.paint) {
      const orig = def.paint, b = this, kind = def.kind;
      def = Object.assign({}, def, { paint(ctx, s) { if (!(G.bossSkin && G.bossSkin.paintShot(b, kind, ctx, s))) orig(ctx, s); } });
    }
    return G.combat.shoot(Object.assign({ hostile: true }, def));
  }

  toWorld(lx, ly) {
    const p = this.def.pose ? this.def.pose(this) : null;
    let x = lx, y = ly;
    if (p && p.rot) {
      const cs = Math.cos(p.rot), sn = Math.sin(p.rot), dx = lx - (p.px || 0), dy = ly - (p.py || 0);
      x = (p.px || 0) + dx * cs - dy * sn; y = (p.py || 0) + dx * sn + dy * cs;
    }
    return { x: this.x + this.face * x, y: this.y + y };
  }
  // A fare slot's anchor in boss space: its `local` is [x, y] or a function of the boss (a moving head, a vent that changes sides).
  spotLocal(sp) { const l = sp.def.local; return typeof l === 'function' ? l(this) : l; }
  spotPos(sp) { const l = this.spotLocal(sp); return this.toWorld(l[0], l[1]); }
  isExposed(sp) { return !sp.def.exposed || sp.def.exposed(this); }
  // The unpunched fare slot of the strike's cut that the strike reaches, if any.
  spotAt(st) {
    for (const sp of this.spots) {
      if (sp.cls !== st.cls || sp.broken || !this.isExposed(sp)) continue;
      const q = this.spotPos(sp);
      if (Math.hypot(st.x - q.x, st.y - q.y) < st.r + sp.def.r && (!sp.def.accepts || sp.def.accepts(this, st))) return sp;
    }
    return null;
  }
  // A token hit on a fare slot. The third hit punches it: 10% of max hp, a stagger, onBreak, and the punching token is void.
  hitSpot(sp, st) {
    const q = this.spotPos(sp), col = G.CLASSES[sp.cls].color;
    if (!sp.open) {
      fx.spark(q.x, q.y, 6, '#8a938e', 200, 0.25); this.damage(st.dmg || 0);
      if (this.sealedT <= 0) { fx.floatText(q.x, q.y - 14, 'Sealed: needs a ' + sp.cls + ' token', '#9aa89f'); this.sealedT = 0.7; }
      return;
    }
    sp.hp--; sp.flash = 0.25; fx.jolt(0.08, 8); fx.spark(q.x, q.y, 22, col, 420, 0.5); fx.ring(q.x, q.y, 8, 300, col, 0.3);
    if (sp.hp > 0) { fx.floatText(q.x, q.y - 16, 'Punch ' + (C.SPOT_HP - sp.hp) + ' of ' + C.SPOT_HP, col); return; }
    sp.broken = true; this.hp -= this.maxHp * C.BREAK_FRAC; this.flash = fx.flashT(0.2); this.set('stagger', C.STAGGER); fx.jolt(0.16, 16);
    fx.spark(q.x, q.y, 46, col, 560, 0.9); fx.ring(q.x, q.y, 10, 520, '#fff3c4', 0.45);
    if (sp.def.onBreak) sp.def.onBreak(this);
    const item = G.game.spend(st.itemId, st.owner);
    G.game.punched(sp.cls);
    fx.say(sp.def.name + ' punched', (item ? item.name + ' is void. ' : '') + (sp.def.lost || ''), 4);
  }
  damage(d) {
    if (!this.active()) return;
    if (this.def.filterDamage) d = this.def.filterDamage(this, d);
    this.hp -= d; this.flash = Math.max(this.flash, fx.flashT(0.07));
    if (d > 0) { this.hurtAt = G.time; this.hurtHeavy = d >= 25; }
  }

  // The fight begins: a fare slot opens only if the party carries a token of its cut.
  start() {
    if (this.def.onStart) this.def.onStart(this);
    // Co-op: +60% max hp for each player beyond the first, decided now (this.scale remembers what is already applied).
    const f = 1 + C.COOP_HP * Math.max(0, G.players.length - 1);
    this.maxHp = this.maxHp / (this.scale || 1) * f; this.hp = this.maxHp; this.scale = f;
    this.clock = 0; this.hits0 = G.run.stats.hits; this.spent0 = G.run.spent.length;      // for the grade: fight time, hits taken, tokens punched
    const have = G.game.partyClasses();
    for (const sp of this.spots) sp.open = have.has(sp.cls);
    const open = this.spots.filter(s => s.open).map(s => s.def.name);
    this.phase2 = false; this.deathWash = 0;
    this.set('intro', 1.5); if (G.cam && G.cam.cue) G.cam.cue(this, 1.5); fx.jolt(0, 10);
    if (open.length) G.tips.fire('fare');
    const shut = this.spots.filter(s => !s.open).map(s => s.cls);
    fx.say(this.def.name, open.length ? 'Fare slots open: ' + open.join(', ') + '.' + (shut.length ? ' Sealed: needs a ' + shut.join(' or ') + ' token.' : '')
      : 'No token of its cuts (' + shut.join(', ') + '). Slashes still work, slowly: find a trunk, plinth or ticket token.', 4.5);
  }
  update(dt) {
    this.flash -= dt; this.sealedT -= dt;
    for (const sp of this.spots) sp.flash -= dt;
    if (this.state === 'sleep') return;
    if (this.state !== 'dead') this.clock += dt;
    this.t -= dt; this.sAge += dt;
    if (this.state === 'dead') { this.deathWash = Math.max(0, this.deathWash - dt); return; }
    // Shared phase presentation: every Warden gets one harmless half-health beat before its enraged pattern takes over.
    if (!this.phase2 && this.hp > 0 && this.hp <= this.maxHp / 2 && this.state !== 'intro' && this.state !== 'stagger') {
      this.phase2 = true; this.set('stagger', 0.7); fx.jolt(0.08, 12); fx.ring(this.x, this.y - this.h / 2, 20, 260, '#fff3c4', 0.45);
      fx.say(this.def.name + ' — Phase II', 'The pattern changes.', 2.2);
    }
    if (this.held) Object.assign(this, this.held);                 // test hook: G.debug.holdBoss
    else if (this.state === 'intro') { if (this.t <= 0) this.set('idle', C.BOSS_GRACE); }   // no attack for BOSS_GRACE seconds after the intro
    else if (this.state === 'stagger') {
      if (this.y < this.floor) { this.vy += 2000 * dt; this.y = Math.min(this.floor, this.y + this.vy * dt); }
      if (this.def.staggered) this.def.staggered(this, dt);
      if (this.t <= 0) this.set('idle', 0.4);
    } else this.def.update(this, dt);
    this.x = U.clamp(this.x, this.minX, this.maxX);
    if (this.state !== 'stagger') for (const r of this.contactBoxes()) G.combat.hurtPlayers(r, this.x);
    this.speed = dt > 0 ? Math.abs(this.x - this.lastX) / dt : 0; this.lastX = this.x;       // for skins: walking or standing
    if (this.hp <= 0) {
      this.hp = 0; this.set('dead', 0); this.deathWash = 1.0; fx.slowmo(0.34, 0.32); fx.jolt(0.18, 18);
      fx.spark(this.x, this.y - this.h / 2, 80, '#f4e6b8', 620, 1.2); fx.ring(this.x, this.y - this.h / 2, 20, 700, '#fff3c4', 0.6);
      G.combat.clear(true);
      if (this.def.onDeath) this.def.onDeath(this);
      this.killOwned();
      G.game.bossBeaten(this);
    }
  }
  applyPose(ctx) {
    const p = (this.def.pose && this.def.pose(this)) || {};
    ctx.translate(this.x + (p.ox || 0), this.y); ctx.scale(this.face * (p.sx || 1), p.sy || 1);
    if (p.rot) { ctx.translate(p.px || 0, p.py || 0); ctx.rotate(p.rot); ctx.translate(-(p.px || 0), -(p.py || 0)); }
  }
  draw(ctx) {
    if (this.state === 'dead' && this.t < -1.2) return;
    ctx.save();
    if (this.state === 'dead') ctx.globalAlpha = U.clamp(1 + this.t / 1.2, 0, 1);
    // A watercolor skin (js/art/boss_skins.js) draws the body for the current state when it has the strip; anything it lacks is code-drawn below.
    if (G.bossSkin && G.bossSkin.draw(this, ctx)) {
      if (this.state === 'stagger') this.drawStars(ctx, this.x, this.y);
      for (const sp of this.spots) G.bossSkin.badge(this, ctx, sp);
    } else {
      this.applyPose(ctx);
      if (!this.drawWashed(ctx)) G.art.draw('boss_' + this.id, ctx, { x: 0, y: 0, face: 1, ent: this });
      if (this.state === 'stagger') this.drawStars(ctx, 0, 0);
      for (const sp of this.spots) this.drawSpot(ctx, sp);
    }
    ctx.restore();
    if (this.state === 'dead' && this.deathWash > 0) { const k = U.clamp(this.deathWash, 0, 1); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = k * 0.28; ctx.fillStyle = '#fff3c4'; const r = this.rect(); ctx.fillRect(r.x0 - 12, r.y0 - 12, r.x1 - r.x0 + 24, r.y1 - r.y0 + 24); ctx.restore(); }
    if (G.debugBoxes) this.drawBoxes(ctx);
  }
  // The code-drawn body in the watercolor style: the painter draws into an offscreen canvas (boss space, origin bottom centre), which then gets a
  // wash shade (light top, cool dark bottom), paper grain, soft edges and a translucent dark-violet wash outline. Hit tests never read it. A sprite
  // (G.sprites) or a skin is drawn as given; G.debug.noWash = true draws the plain painter.
  drawWashed(ctx) {
    if (G.sprites['boss_' + this.id] || (G.debug && G.debug.noWash) || !document.createElement) return false;
    const k = G.view && G.view.scale > 1.4 ? 2 : 1, w = Math.ceil(this.def.w * 2 + 140), h = Math.ceil(this.h * 1.5 + 90), oy = h - 26;
    let W = this._wash;
    if (!W || W.k !== k || W.w !== w || W.h !== h) {
      const mk = () => { const c = document.createElement('canvas'); c.width = w * k; c.height = h * k; return c; };
      W = this._wash = { k, w, h, cv: mk(), mask: mk() };
    }
    const c = W.cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, w * k, h * k);
    c.setTransform(k, 0, 0, k, w / 2 * k, oy * k);
    G.art.draw('boss_' + this.id, c, { x: 0, y: 0, face: 1, ent: this });
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop';
    const g = c.createLinearGradient(0, 0, 0, h * k);
    g.addColorStop(0, 'rgba(255,243,210,0.22)'); g.addColorStop(0.45, 'rgba(255,243,210,0)'); g.addColorStop(1, 'rgba(34,30,66,0.34)');
    c.fillStyle = g; c.fillRect(0, 0, w * k, h * k);
    const gr = G.bossWashGrain || (G.bossWashGrain = (() => {
      const t = document.createElement('canvas'); t.width = t.height = 64; const x = t.getContext('2d'); let r = 7;
      for (let i = 0; i < 700; i++) { r = (r * 16807) % 2147483647; const px = r % 64; r = (r * 16807) % 2147483647; const py = r % 64; x.fillStyle = (i & 1) ? 'rgba(255,248,226,0.5)' : 'rgba(40,34,70,0.4)'; x.fillRect(px, py, 2, 2); }
      return t; })());
    c.globalAlpha = 0.16; c.fillStyle = c.createPattern(gr, 'repeat'); c.fillRect(0, 0, w * k, h * k); c.globalAlpha = 1;
    const m = W.mask.getContext('2d');
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, w * k, h * k); m.drawImage(W.cv, 0, 0);
    m.globalCompositeOperation = 'source-in'; m.fillStyle = '#2b2440'; m.fillRect(0, 0, w * k, h * k);
    ctx.save(); ctx.translate(-w / 2, -oy);
    ctx.globalAlpha *= 1; const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * 0.5;
    for (const [dx, dy] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.2]]) ctx.drawImage(W.mask, dx, dy, w, h);
    ctx.globalAlpha = a0;
    ctx.drawImage(W.cv, 0, 0, w, h);
    ctx.restore(); return true;
  }
  // G.debugBoxes = true: hit shapes in magenta, contact boxes in red, fare-slot anchors as crosses, the state and attack above.
  drawBoxes(ctx) {
    ctx.save(); ctx.lineWidth = 1;
    ctx.strokeStyle = '#ff00ff'; for (const q of this.shapes()) ctx.strokeRect(q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0);
    ctx.strokeStyle = '#ff3030'; for (const q of this.contactBoxes()) ctx.strokeRect(q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0);
    ctx.strokeStyle = '#30ffff'; for (const sp of this.spots) { const q = this.spotPos(sp); ctx.beginPath(); ctx.moveTo(q.x - 5, q.y); ctx.lineTo(q.x + 5, q.y); ctx.moveTo(q.x, q.y - 5); ctx.lineTo(q.x, q.y + 5); ctx.stroke(); }
    ctx.fillStyle = '#ff00ff'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText(this.state + (this.attack ? ' (' + this.attack + ')' : '') + (this.skinNote ? ' ' + this.skinNote : ''), this.x, this.y - this.h - 6);
    ctx.restore();
  }
  drawStars(ctx, x, y) { ctx.fillStyle = '#fff3c4'; for (let i = 0; i < 3; i++) { const a = G.time * 5 + i * 2.1; ctx.fillRect(x + Math.cos(a) * 26, y - this.h - 18 + Math.sin(a) * 7, 4, 4); } }
  // Fare slots look the same on every boss so players can read them: cut colour and shape = open, grey plate = sealed, dark = punched.
  drawSpot(ctx, sp) { const [lx, ly] = this.spotLocal(sp); ctx.save(); ctx.translate(lx, ly); this.paintSpot(ctx, sp); ctx.restore(); }
  // The badge itself, centred on the origin (boss space for drawSpot, world space for a skin's badge).
  paintSpot(ctx, sp) {
    const r = sp.def.r, cut = G.CLASSES[sp.cls], exposed = this.isExposed(sp);
    ctx.save();
    if (sp.broken) {
      ctx.fillStyle = '#12100f'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#5c544b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.5); ctx.lineTo(0, 0); ctx.lineTo(r * 0.5, -r * 0.2); ctx.moveTo(0, 0); ctx.lineTo(-r * 0.2, r * 0.7); ctx.stroke();
    } else if (!sp.open) {
      ctx.fillStyle = '#586068'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#2a3036'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
    } else {
      const pulse = 0.5 + 0.5 * Math.sin(G.time * 6), a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * (exposed ? 0.3 + 0.25 * pulse : 0.12); ctx.fillStyle = cut.color; ctx.beginPath(); ctx.arc(0, 0, r + 9 + pulse * 4, 0, 6.283); ctx.fill(); ctx.globalAlpha = a0;
      ctx.fillStyle = sp.flash > 0 ? '#ffffff' : cut.color; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#1a1410'; G.art.cutShape(ctx, cut.shape, r * 0.55);
      ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 2;
      for (let i = 0; i < C.SPOT_HP - sp.hp; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * 2.2 + 0.6) * r, Math.sin(i * 2.2 + 0.6) * r); ctx.stroke(); }
    }
    ctx.restore();
  }
}
G.Boss = Boss;
})();
