/* Particles, rings, floating text, the banner, hitstop and screen shake. Cosmetic only. */
(() => {
'use strict';
const G = window.G, U = G.util, rnd = U.rnd;
const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const parts = [], floaters = [];

const fx = G.fx = {
  parts, floaters, hitstop: 0, shake: 0, slow: 0, slowScale: 1, banner: null, stampNow: null,
  slowmo(t, scale = 0.35) { fx.slow = Math.max(fx.slow, t); fx.slowScale = Math.min(fx.slowScale || 1, scale); },
  spark(x, y, n, color, spd = 260, life = 0.35, grav = 600, size = 3) {
    for (let i = 0; i < n && parts.length < 800; i++) {
      const a = rnd(0, 6.283), s = rnd(spd * 0.3, spd);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(life * 0.5, life), max: life, color, grav, size });
    }
  },
  dust(x, y, n, dir = 0) {
    for (let i = 0; i < n && parts.length < 800; i++)
      parts.push({ x: x + rnd(-8, 8), y: y - rnd(0, 4), vx: rnd(-60, 60) + dir * 80, vy: rnd(-70, -10), life: rnd(0.2, 0.45), max: 0.45, color: '#9fb3a6', grav: -40, size: rnd(2, 5), soft: true });
  },
  ring(x, y, r, vr, color, life = 0.3) { parts.push({ ring: true, x, y, r, vr, color, life, max: life, vx: 0, vy: 0, grav: 0 }); },
  // paint(ctx, alpha) draws a fading after-image at 0,0
  ghost(x, y, life, paint) { parts.push({ paint, x, y, life, max: life, vx: 0, vy: 0, grav: 0 }); },
  // A strip animation that plays once where something died: o = { strip, x, y (feet), y1 (feet at the end, for a fall), face, h, foot, play, fade };
  // the frames run over 'play' seconds, then the last one fades over 'fade'.
  anim(o) { const st = G.strips[o.strip]; if (!st) return; parts.push({ anim: o, frames: st.frames, x: o.x, y: o.y, life: o.play + o.fade, max: o.play + o.fade, vx: 0, vy: 0, grav: 0 }); },
  floatText(x, y, text, color) { floaters.push({ x, y, text, color, t: 1 }); },
  // A short stamp for a graded fight: lines = ['BEATEN', 'PAR', 'CLEAN'], note = one line under it.
  stamp(lines, note = '', t = 4.2) { fx.stampNow = { lines, note, t, max: t }; },
  say(a, b, t = 3.2, portrait = null) { fx.banner = { a, b, t, max: t, portrait }; },
  jolt(stop, sh) { fx.hitstop = Math.max(fx.hitstop, stop); if (!calm && G.meta.settings.shake) fx.shake = Math.max(fx.shake, sh); },
  // Length of a white hit flash on a body: none when 'reduced flashes' is on (sparks and knock-back still show the hit).
  flashT(t) { return G.meta.settings.reduceFlashes ? 0 : t; },
  clear() { parts.length = 0; floaters.length = 0; },
  update(dt) {
    if (fx.slow > 0) { fx.slow = Math.max(0, fx.slow - dt); if (!fx.slow) fx.slowScale = 1; }
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i]; q.life -= dt;
      if (q.life <= 0) { parts.splice(i, 1); continue; }
      if (q.ring) q.r += q.vr * dt; else { q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    }
    for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.t -= dt; f.y -= 30 * dt; if (f.t <= 0) floaters.splice(i, 1); }
    if (fx.banner) { fx.banner.t -= dt; if (fx.banner.t <= 0) fx.banner = null; }
    if (fx.stampNow) { fx.stampNow.t -= dt; if (fx.stampNow.t <= 0) fx.stampNow = null; }
    fx.shake = Math.max(0, fx.shake - dt * 40);
  },
  // World-space layer; call with the camera transform applied.
  draw(ctx) {
    for (const q of parts) {
      const k = q.life / q.max;
      if (q.ring) { ctx.globalAlpha = k; ctx.strokeStyle = q.color; ctx.lineWidth = 3 * k + 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.stroke(); }
      else if (q.anim) {
        const a = q.anim, t = q.max - q.life, u = Math.min(1, t / a.play);
        ctx.globalAlpha = t < a.play ? 1 : Math.max(0, 1 - (t - a.play) / a.fade);
        G.art.drawFrame(a.strip, ctx, Math.min(q.frames - 1, Math.floor(u * q.frames)), { x: a.x, y: a.y + (a.y1 - a.y) * u * u, face: a.face, h: a.h, foot: a.foot });
      }
      else if (q.paint) { ctx.save(); ctx.translate(q.x, q.y); q.paint(ctx, k * 0.45); ctx.restore(); }
      else if (q.soft) { ctx.globalAlpha = k * 0.5; ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.4 - k * 0.4), 0, 6.283); ctx.fill(); }
      else { ctx.globalAlpha = k; ctx.fillStyle = q.color; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
    }
    ctx.globalAlpha = 1;
    for (const f of floaters) { ctx.globalAlpha = U.clamp(f.t * 2, 0, 1); G.art.label(ctx, f.text, f.x, f.y, 14, f.color, 'center', G.C.FONT, 600); }
    ctx.globalAlpha = 1;
  }
};
})();
