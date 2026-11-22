/* Camera: follows the party centre, clamped to the room. Looks ahead in the facing direction (smoothed) and pans up or down
   (up to C.MOVE.PAN px) when a player holds up or down while standing still, in rooms taller than one screen. */
(() => {
'use strict';
const G = window.G, C = G.C, M = C.MOVE, U = G.util;
let lookX = 0, panY = 0, panT = 0;
G.cam = {
  x: 0, y: 0, bossCue: null,
  cue(boss, t = 1.5) { this.bossCue = { boss, t, max: t }; },
  follow(dt, tx, ty, snap) {
    if (this.bossCue && this.bossCue.t > 0 && this.bossCue.boss) { this.bossCue.t -= dt; tx = this.bossCue.boss.x; ty = this.bossCue.boss.y - this.bossCue.boss.h * 0.45; snap = false; if (this.bossCue.t <= 0) this.bossCue = null; }
    const maxX = Math.max(0, G.tiles.cols * C.T - C.W), maxY = Math.max(0, G.tiles.rows * C.T - C.H);
    const live = (G.players || []).filter(p => !p.down);
    let dir = 0, want = 0;
    if (live.length && !snap) {
      // the party centre (2 to 4 players) and the party's average facing; the caller's own target is replaced
      tx = live.reduce((s, p) => s + p.x, 0) / live.length; ty = live.reduce((s, p) => s + p.y, 0) / live.length;
      dir = live.reduce((s, p) => s + p.face, 0) / live.length;
      const still = live.find(p => p.onGround && Math.abs(p.vx) < 10 && p.stun <= 0 && (p.in.held.up !== p.in.held.down) && !p.slash);
      if (still && G.tiles.rows > C.CH) { panT += dt; if (panT >= M.PAN_T) want = still.in.held.up ? -M.PAN : M.PAN; } else panT = 0;
    } else { lookX = 0; panY = 0; panT = 0; }
    const k = snap ? 1 : Math.min(1, dt * 7);
    lookX += (dir * M.LOOK - lookX) * Math.min(1, dt * 3);
    panY += (want - panY) * Math.min(1, dt * 6);
    const gx = U.clamp(tx + lookX - C.W / 2, 0, maxX), gy = U.clamp(ty - C.H * 0.6 + panY, 0, maxY);
    G.cam.x = U.clamp(G.cam.x + (gx - G.cam.x) * k, 0, maxX);
    G.cam.y = U.clamp(G.cam.y + (gy - G.cam.y) * k, 0, maxY);
  }
};

/* Interpolated drawing. The simulation runs in fixed steps (C.STEP); the screen may refresh faster or slower, so each frame draws the world
   between the state before the last step and the state after it. main.js calls capture() before every step and apply(alpha) / restore() around
   the draw. apply() temporarily moves the camera, players, enemies, the boss (and its def.interp fields) and shots to prev + (cur - prev) * alpha,
   so no drawing code has to know. A jump of more than SNAP px in one step (a teleport, a room change, a respawn) is not interpolated.
   Entities that appeared this step have no previous state and are drawn where they are. */
const SNAP = 60, KEYS = ['x', 'y'];
const targets = () => {
  const room = G.rooms && G.rooms.current, list = [G.cam];
  if (G.players) for (const p of G.players) list.push(p);
  if (room) { for (const e of room.enemies) list.push(e); if (room.boss) list.push(room.boss); }
  if (G.shots) for (const s of G.shots) list.push(s);
  return list;
};
const fieldsOf = o => (o.def && o.def.interp && o.state !== undefined && o.maxHp !== undefined ? KEYS.concat(o.def.interp) : KEYS);
let applied = [];
G.interp = {
  alpha: 1,
  capture() { for (const o of targets()) { const f = fieldsOf(o), pv = o._pv || (o._pv = {}); for (const k of f) pv[k] = o[k]; } },
  // Move everything to its drawn position; returns nothing. Always pair with restore().
  active: false,
  apply(alpha) {
    if (G.interp.active) return;                                // already applied (the draw wrapper below is idempotent)
    G.interp.alpha = alpha; applied = []; G.interp.active = true;
    if (alpha >= 1) return;
    for (const o of targets()) {
      const pv = o._pv; if (!pv) continue;
      const f = fieldsOf(o), saved = {};
      for (const k of f) {
        const a = pv[k], b = o[k];
        saved[k] = b;
        if (typeof a === 'number' && typeof b === 'number' && Math.abs(b - a) < SNAP) o[k] = a + (b - a) * alpha;
      }
      applied.push([o, saved]);
    }
  },
  restore() { for (const [o, saved] of applied) for (const k in saved) o[k] = saved[k]; applied = []; G.interp.active = false; },
  // Wrap the room drawing so everything inside it sees the interpolated state at G.interp.alpha (set by main.js before each frame's draw).
  wrapDraw() {
    const draw = G.rooms.draw;
    G.rooms.draw = function (ctx, dt) { const own = !G.interp.active; if (own) G.interp.apply(G.interp.alpha); try { return draw.call(this, ctx, dt); } finally { if (own) G.interp.restore(); } };
  }
};
})();
