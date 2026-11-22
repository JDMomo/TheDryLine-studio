/* Audio: a Web Audio synth and step sequencer that plays the patterns in js/content/music.js, synthesised sound effects, and a director that
   chooses the music from the game's state. Nothing here needs a file; assets/audio/<track>.ogg (or <track>__<layer>.ogg stems) listed in
   G.music.files play in place of the synth. It never throws: with no AudioContext, or before the first gesture, every call does nothing.
   Layout: 1. synth helpers  2. instruments and drums  3. sound effects  4. engine (buses, sequencer, layers, files)  5. G.audio, the director,
   the hooks into the game (wrapped from here, so no other file calls the audio code), mute key, pause-menu sliders. docs/AUDIO_BIBLE.md has the plan. */
(() => {
'use strict';
const G = window.G, M = G.music;
const LOOKAHEAD = 0.14, TICK_MS = 25, VOICE_CAP = 4, SFX_BOOST = 1.8;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const note = fn => { try { return fn(); } catch (e) { return undefined; } };       // audio must never break the game

/* ---------------------------------------------------------------- 1. synth helpers */
function percEnv(g, t, vol, dur, atk = 0.002) { g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(vol, t + atk); g.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, atk + 0.01)); }
function susEnv(g, t, vol, atk, dur, rel, sus = 1, dec = 0.1) {
  g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(vol, t + atk);
  if (sus < 1) g.setTargetAtTime(vol * sus, t + atk, dec / 3);
  g.setTargetAtTime(0.0001, t + Math.max(dur, atk + 0.01), rel / 3);
}
function noiseBuf(e) {
  if (e.noise) return e.noise;
  const c = e.ctx, n = Math.floor(c.sampleRate * 2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  let s = 12345; for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
  return (e.noise = b);
}
function pulseWave(e, duty) {
  const k = Math.round(duty * 100);
  if (e.waves[k]) return e.waves[k];
  const N = 40, re = new Float32Array(N), im = new Float32Array(N);
  for (let n = 1; n < N; n++) { const a = n * Math.PI * duty; re[n] = (2 / (n * Math.PI)) * Math.sin(a) * Math.cos(a); im[n] = (2 / (n * Math.PI)) * Math.sin(a) * Math.sin(a); }
  return (e.waves[k] = e.ctx.createPeriodicWave(re, im));
}
const filt = (c, type, f, q = 0.7) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
const gain = (c, v = 1) => { const g = c.createGain(); g.gain.value = v; return g; };
const pan = (c, p) => { if (!p || !c.createStereoPanner) return null; const n = c.createStereoPanner(); n.pan.value = clamp(p, -1, 1); return n; };

// One oscillator through an optional low-pass into dest. o: type | wave (periodic wave), f, f1 (end pitch), t, dur, vol, env 'perc' | 'sus', atk, rel, sus, dec, lp, lp1, q, detune, vib (cents), dest.
function tone(e, o) {
  const c = e.ctx, t = o.t, osc = c.createOscillator(), g = c.createGain();
  if (o.wave) osc.setPeriodicWave(o.wave); else osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + (o.slide || o.dur));
  if (o.detune) osc.detune.value = o.detune;
  let last = osc;
  if (o.lp) { const fl = filt(c, 'lowpass', o.lp, o.q || 0.7); if (o.lp1) { fl.frequency.setValueAtTime(o.lp, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, o.lp1), t + Math.min(o.dur, o.lpT || o.dur)); } last.connect(fl); last = fl; }
  last.connect(g);
  const rel = o.rel == null ? 0.05 : o.rel;
  if (o.env === 'sus') susEnv(g.gain, t, o.vol, o.atk == null ? 0.01 : o.atk, o.dur, rel, o.sus == null ? 1 : o.sus, o.dec || 0.1); else percEnv(g.gain, t, o.vol, o.dur, o.atk);
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib, t + 0.25); l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(t + o.dur + rel * 2 + 0.1); }
  g.connect(o.dest);
  osc.start(t); osc.stop(t + o.dur + (o.env === 'sus' ? rel * 2 : 0.05) + 0.05);
  return osc;
}
// Filtered noise burst. o: t, dur, vol, type ('bandpass' ...), f, f1, q, atk, dest, env.
function noise(e, o) {
  const c = e.ctx, t = o.t, src = c.createBufferSource(), fl = filt(c, o.type || 'bandpass', o.f || 1000, o.q || 0.8), g = c.createGain();
  src.buffer = noiseBuf(e); src.loop = true;
  fl.frequency.setValueAtTime(o.f || 1000, t); if (o.f1) fl.frequency.exponentialRampToValueAtTime(Math.max(40, o.f1), t + o.dur);
  src.connect(fl); fl.connect(g);
  if (o.env === 'sus') susEnv(g.gain, t, o.vol, o.atk || 0.01, o.dur, o.rel || 0.1, 1, 0.1); else percEnv(g.gain, t, o.vol, o.dur, o.atk);
  g.connect(o.dest); src.start(t, (t * 7.31) % 1.5); src.stop(t + o.dur + (o.rel || 0) * 2 + 0.05);
}
// A bell: a sine carrier with a sine modulator at an inharmonic ratio whose depth dies away fast.
function bellTone(e, o) {
  const c = e.ctx, t = o.t, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain(), ring = o.ring || 1.4;
  car.frequency.value = o.f; mod.frequency.value = o.f * (o.ratio || 3.5);
  mg.gain.setValueAtTime(o.f * (o.index || 1.6), t); mg.gain.exponentialRampToValueAtTime(o.f * 0.05, t + ring * 0.5);
  mod.connect(mg); mg.connect(car.frequency); car.connect(g); percEnv(g.gain, t, o.vol, ring, 0.002); g.connect(o.dest);
  car.start(t); mod.start(t); car.stop(t + ring + 0.1); mod.stop(t + ring + 0.1);
}

/* ---------------------------------------------------------------- 2. instruments and drums
   Each: (e, dest, t, dur, midi, vel, params). dur is the written length in seconds. */
const INST = {
  pad(e, d, t, dur, m, v, p) {
    const f = mtof(m), c = p.cutoff || 1300, lp = filt(e.ctx, 'lowpass', c, 0.6), g = gain(e.ctx, 1), rel = 1.0;
    lp.connect(g); g.connect(d);
    susEnv(g.gain, t, 0.07 * v, 0.45, dur, rel, 1);
    for (const [type, det, k] of [['sawtooth', -11, 1], ['sawtooth', 11, 1], ['triangle', 0, 1.4]]) {
      const o = e.ctx.createOscillator(), og = gain(e.ctx, 0.5 * k); o.type = type; o.frequency.value = f; o.detune.value = det; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + rel * 2.2 + 0.1);
    }
  },
  pulse(e, d, t, dur, m, v, p) { tone(e, { wave: pulseWave(e, p.duty || 0.25), f: mtof(m), t, dur, vol: 0.11 * v, env: 'sus', atk: 0.008, rel: 0.07, sus: 0.7, dec: 0.2, lp: 3800, vib: dur > 0.3 ? 9 : 0, dest: d }); },
  lead(e, d, t, dur, m, v, p) {
    const f = mtof(m);
    tone(e, { type: 'sawtooth', f, t, dur, vol: 0.07 * v, env: 'sus', atk: 0.05, rel: 0.25, lp: p.cutoff || 2200, detune: -6, vib: 7, dest: d });
    tone(e, { type: 'triangle', f, t, dur, vol: 0.09 * v, env: 'sus', atk: 0.05, rel: 0.25, detune: 6, dest: d });
  },
  bass(e, d, t, dur, m, v, p) {
    const f = mtof(m), c = p.cutoff || 800;
    tone(e, { type: 'sawtooth', f, t, dur, vol: 0.16 * v, env: 'sus', atk: 0.006, rel: 0.08, sus: 0.6, dec: 0.2, lp: c * 2, lp1: c * 0.4, lpT: 0.25, q: 2, dest: d });
    tone(e, { type: 'sine', f, t, dur, vol: 0.22 * v, env: 'sus', atk: 0.008, rel: 0.1, sus: 0.8, dec: 0.3, dest: d });
  },
  sub(e, d, t, dur, m, v) { tone(e, { type: 'sine', f: mtof(m), t, dur, vol: 0.3 * v, env: 'sus', atk: 0.08, rel: 0.5, dest: d }); },
  bell(e, d, t, dur, m, v) { bellTone(e, { f: mtof(m), t, vol: 0.11 * v, ring: clamp(0.8 + dur * 0.5, 0.9, 2.4), dest: d }); },
  pluck(e, d, t, dur, m, v) {
    const f = mtof(m);
    tone(e, { wave: pulseWave(e, 0.125), f, t, dur: 0.2, vol: 0.12 * v, lp: 3600, lp1: 900, dest: d });
    tone(e, { type: 'triangle', f: f * 2, t, dur: 0.08, vol: 0.04 * v, dest: d });
  },
  arp(e, d, t, dur, m, v) { tone(e, { type: 'triangle', f: mtof(m), t, dur: 0.16, vol: 0.13 * v, lp: 4200, dest: d }); },
  epiano(e, d, t, dur, m, v) {
    const f = mtof(m), len = clamp(dur + 0.3, 0.5, 1.6);
    tone(e, { type: 'sine', f, t, dur: len, vol: 0.12 * v, env: 'sus', atk: 0.005, rel: 0.3, sus: 0.4, dec: 0.5, detune: -4, dest: d });
    tone(e, { type: 'sine', f: f * 2, t, dur: 0.35, vol: 0.05 * v, dest: d });
    tone(e, { type: 'triangle', f, t, dur: len, vol: 0.06 * v, env: 'sus', atk: 0.008, rel: 0.3, sus: 0.3, dec: 0.4, detune: 5, dest: d });
  }
};
const DRUM = {
  k(e, d, t, v) { tone(e, { type: 'sine', f: 150, f1: 42, slide: 0.12, t, dur: 0.3, vol: 0.55 * v, dest: d }); },
  s(e, d, t, v) { noise(e, { t, dur: 0.16, vol: 0.18 * v, type: 'bandpass', f: 1900, q: 0.7, dest: d }); tone(e, { type: 'triangle', f: 190, f1: 130, t, dur: 0.1, vol: 0.14 * v, dest: d }); },
  h(e, d, t, v) { noise(e, { t, dur: 0.045, vol: 0.09 * v, type: 'highpass', f: 7500, q: 0.5, dest: d }); },
  H(e, d, t, v) { noise(e, { t, dur: 0.22, vol: 0.08 * v, type: 'highpass', f: 6500, q: 0.5, dest: d }); },
  c(e, d, t, v) { for (let i = 0; i < 3; i++) noise(e, { t: t + i * 0.012, dur: 0.05 + (i === 2 ? 0.1 : 0), vol: 0.13 * v, type: 'bandpass', f: 1300, q: 0.9, dest: d }); },
  r(e, d, t, v) { tone(e, { type: 'square', f: 1700, t, dur: 0.035, vol: 0.05 * v, lp: 3000, dest: d }); },
  t(e, d, t, v) { tone(e, { type: 'sine', f: 160, f1: 90, slide: 0.15, t, dur: 0.25, vol: 0.3 * v, dest: d }); },
  m(e, d, t, v) { tone(e, { type: 'sine', f: 2600, t, dur: 0.03, vol: 0.07 * v, dest: d }); noise(e, { t, dur: 0.015, vol: 0.04 * v, type: 'highpass', f: 5000, dest: d }); }
};

/* ---------------------------------------------------------------- 3. sound effects
   Each: (X) with X = { e, t, d (destination), r (pitch factor, about 1 +- 3 percent), v (volume 0 to 1), o (options) }. A name used anywhere in the game must be here. */
const T = (X, o) => tone(X.e, Object.assign({ t: X.t, dest: X.d }, o, { f: o.f * X.r, f1: o.f1 && o.f1 * X.r, vol: (o.vol || 0.2) * X.v }));
const N = (X, o) => noise(X.e, Object.assign({ t: X.t, dest: X.d }, o, { vol: (o.vol || 0.2) * X.v }));
const SFX = {
  jump: X => T(X, { type: 'square', f: 280, f1: 560, dur: 0.12, vol: 0.12, lp: 2600 }),
  doubleJump: X => { T(X, { type: 'square', f: 420, f1: 840, dur: 0.1, vol: 0.1, lp: 3000 }); T(Object.assign({}, X, { t: X.t + 0.06 }), { type: 'triangle', f: 700, f1: 1500, dur: 0.14, vol: 0.12 }); },
  pogo: X => { T(X, { type: 'sine', f: 400, f1: 900, slide: 0.06, dur: 0.06, vol: 0.11 }); N(X, { type: 'highpass', f: 4200, dur: 0.025, vol: 0.045 }); },
  land: X => { N(X, { type: 'lowpass', f: 700, f1: 200, dur: 0.1, vol: 0.28 }); T(X, { type: 'sine', f: 110, f1: 55, dur: 0.1, vol: 0.3 }); },
  dash: X => { N(X, { type: 'bandpass', f: 700, f1: 3200, q: 1.2, dur: 0.16, vol: 0.2 }); T(X, { type: 'sine', f: 220, f1: 420, dur: 0.12, vol: 0.08 }); },
  slash: X => N(X, { type: 'bandpass', f: 3000, f1: 900, q: 1.1, dur: 0.1, vol: 0.2 }),
  heavyCut: X => { N(X, { type: 'bandpass', f: 2200, f1: 400, q: 1.0, dur: 0.22, vol: 0.28 }); T(X, { type: 'sawtooth', f: 150, f1: 55, dur: 0.22, vol: 0.2, lp: 700 }); },
  hitEnemy: X => { N(X, { type: 'bandpass', f: 1800, q: 0.8, dur: 0.06, vol: 0.2 }); T(X, { type: 'square', f: 200, f1: 120, dur: 0.07, vol: 0.12, lp: 1800 }); },
  enemyDefeat: X => { T(X, { type: 'square', f: 420, f1: 70, dur: 0.24, vol: 0.14, lp: 2200 }); N(X, { type: 'lowpass', f: 2400, f1: 300, dur: 0.22, vol: 0.2 }); },
  hurt: X => { T(X, { type: 'sawtooth', f: 330, f1: 100, dur: 0.26, vol: 0.2, lp: 1600 }); N(X, { type: 'bandpass', f: 900, dur: 0.12, vol: 0.18 }); },
  down: X => { [392, 311, 233, 175].forEach((f, i) => T(Object.assign({}, X, { t: X.t + i * 0.12 }), { type: 'triangle', f, dur: 0.3, vol: 0.18, env: 'sus', atk: 0.01, rel: 0.2 })); },
  revive: X => { [262, 330, 392, 523].forEach((f, i) => T(Object.assign({}, X, { t: X.t + i * 0.07 }), { type: 'triangle', f, dur: 0.16, vol: 0.14 })); },
  mend: X => { [523, 659, 784, 1047].forEach((f, i) => bellTone(X.e, { f: f * X.r, t: X.t + i * 0.08, vol: 0.12 * X.v, ring: 0.7, dest: X.d })); },
  mendTick: X => bellTone(X.e, { f: 880 * X.r, t: X.t, vol: 0.05 * X.v, ring: 0.3, dest: X.d }),
  cutPierce: X => { T(X, { type: 'triangle', f: 1300, f1: 2400, dur: 0.1, vol: 0.14 }); N(X, { type: 'highpass', f: 5000, dur: 0.05, vol: 0.06 }); },
  cutArc: X => T(X, { type: 'sine', f: 380, f1: 720, slide: 0.08, dur: 0.2, vol: 0.2, lp: 2400 }),
  cutBurst: X => { T(X, { type: 'sine', f: 140, f1: 50, dur: 0.28, vol: 0.34 }); N(X, { type: 'lowpass', f: 1800, f1: 200, dur: 0.24, vol: 0.2 }); },
  cutGround: X => { T(X, { type: 'sawtooth', f: 120, f1: 70, dur: 0.3, vol: 0.18, lp: 500 }); N(X, { type: 'bandpass', f: 400, f1: 220, q: 1.5, dur: 0.28, vol: 0.14 }); },
  slotCrack: X => { N(X, { type: 'highpass', f: 4500, dur: 0.05, vol: 0.14 }); [1850, 2350].forEach((f, i) => bellTone(X.e, { f: f * X.r, t: X.t + i * 0.025, vol: 0.07 * X.v, ring: 0.35, ratio: 2.7, dest: X.d })); },
  sealed: X => T(X, { type: 'square', f: 260, f1: 200, dur: 0.07, vol: 0.09, lp: 900 }),
  slotPunch: X => {                                  // a ticket punch: a sharp click, a low thump and a bright fare bell
    N(X, { type: 'highpass', f: 3500, dur: 0.04, vol: 0.28 }); T(X, { type: 'sine', f: 150, f1: 48, dur: 0.22, vol: 0.4 });
    bellTone(X.e, { f: 1568 * X.r, t: X.t + 0.03, vol: 0.2 * X.v, ring: 1.0, dest: X.d }); bellTone(X.e, { f: 2093 * X.r, t: X.t + 0.09, vol: 0.12 * X.v, ring: 0.8, dest: X.d });
  },
  tokenVoid: X => { [784, 587, 494, 392].forEach((f, i) => T(Object.assign({}, X, { t: X.t + i * 0.1 }), { type: 'triangle', f, dur: 0.22, vol: 0.14, lp: 3000, lp1: 500 })); },
  pickupScrip: X => { const k = Math.pow(2, (X.o.step || 0) / 12); [1320, 1760].forEach((f, i) => T(Object.assign({}, X, { t: X.t + i * 0.05 }), { type: 'sine', f: f * k, dur: 0.1, vol: 0.12 })); },
  pickupToken: X => { [784, 988, 1175, 988, 1568].forEach((f, i) => bellTone(X.e, { f: f * X.r, t: X.t + i * 0.07, vol: 0.12 * X.v, ring: i === 4 ? 1.2 : 0.5, dest: X.d })); },
  propUse: X => { T(X, { type: 'square', f: 520, dur: 0.03, vol: 0.08, lp: 2000 }); T(X, { type: 'sine', f: 330, f1: 280, dur: 0.1, vol: 0.14 }); },
  door: X => { T(X, { type: 'sawtooth', f: 85, f1: 130, dur: 0.4, vol: 0.14, lp: 420 }); N(X, { type: 'bandpass', f: 500, f1: 1400, q: 0.8, dur: 0.36, vol: 0.12 }); },
  bossIntro: X => {
    N(X, { type: 'lowpass', f: 120, f1: 900, dur: 1.0, vol: 0.22, env: 'sus', atk: 0.6, rel: 0.3 });
    [0, 0.45, 0.9].forEach((dt, i) => bellTone(X.e, { f: 165 * X.r, t: X.t + dt, vol: (0.2 + i * 0.04) * X.v, ring: 1.8, ratio: 2.4, index: 2.2, dest: X.d }));
  },
  bossStagger: X => { N(X, { type: 'lowpass', f: 3500, f1: 250, dur: 0.5, vol: 0.3 }); T(X, { type: 'sawtooth', f: 220, f1: 60, dur: 0.5, vol: 0.22, lp: 900 }); },
  bossDefeat: X => {
    N(X, { type: 'lowpass', f: 3000, f1: 100, dur: 1.5, vol: 0.34 }); T(X, { type: 'sine', f: 120, f1: 30, dur: 1.2, vol: 0.4 });
    [988, 784, 659, 523, 392, 330].forEach((f, i) => bellTone(X.e, { f: f * X.r, t: X.t + 0.2 + i * 0.13, vol: 0.14 * X.v, ring: 1.6, dest: X.d }));
  },
  menuMove: X => T(X, { type: 'sine', f: 720, dur: 0.035, vol: 0.1 }),
  menuSelect: X => { T(X, { type: 'square', f: 600, dur: 0.05, vol: 0.09, lp: 2500 }); T(Object.assign({}, X, { t: X.t + 0.05 }), { type: 'square', f: 900, dur: 0.08, vol: 0.09, lp: 2500 }); },
  pause: X => T(X, { type: 'sine', f: 520, f1: 250, dur: 0.16, vol: 0.14 }),
  unpause: X => T(X, { type: 'sine', f: 250, f1: 520, dur: 0.14, vol: 0.14 })
};

/* ---------------------------------------------------------------- 4. engine */
const LEVEL = {jump: 4.38, doubleJump: 1.82, land: 2.33, dash: 5.0, slash: 4.38, heavyCut: 2.78, hitEnemy: 4.44, enemyDefeat: 2.81, hurt: 3.67, down: 0.67, revive: 1.33, mend: 0.98, mendTick: 3.75, cutPierce: 4.44, cutArc: 3.33, cutBurst: 1.92, cutGround: 3.08, slotCrack: 2.86, sealed: 4.17, slotPunch: 1.2, tokenVoid: 1.55, pickupScrip: 1.67, pickupToken: 1.15, propUse: 2.5, door: 2.92, bossIntro: 0.87, bossStagger: 1.62, bossDefeat: 1.07, menuMove: 3.33, menuSelect: 1.67, pause: 3.75, unpause: 3.75};   // per-effect trim so every effect peaks near its target at full volume (set by measuring an offline render)
const REV_SFX = new Set(['door', 'bossIntro', 'bossDefeat', 'slotPunch', 'pickupToken', 'mend']);
const SFX_LIFE = { bossIntro: 3, bossDefeat: 3.5, down: 1, mend: 1.4, pickupToken: 1.6, slotPunch: 1.3, door: 1 };   // seconds an effect can ring, before its nodes are let go
function makeImpulse(c, secs, decay) {
  const rate = c.sampleRate, n = Math.floor(rate * secs), b = c.createBuffer(2, n, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let s = 9871 + ch * 77, lp = 0;
    for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; const w = (s / 4294967296) * 2 - 1; lp += (w - lp) * 0.35; d[i] = lp * Math.pow(1 - i / n, decay); }
  }
  return b;
}
const unitSteps = (T, unit) => unit === 'bar' ? M.stepsPerBar(T) : M.beatSteps(T);

function createEngine(ctx, opt = {}) {
  const e = { ctx, waves: {}, noise: null, insts: [], cur: null, vol: Object.assign({ master: 0.9, music: 0.8, sfx: 0.9 }, opt.vol), muted: !!opt.muted, muted: false, debug: !!opt.debug, log: [], comp: {}, buffers: {}, voices: {}, lastSfx: {}, paused: false };
  // buses: music (and its pause filter) and sfx into master, a limiter on the way out
  e.master = gain(ctx, 1); e.limiter = ctx.createDynamicsCompressor();
  if (e.limiter.threshold) { e.limiter.threshold.value = -3; e.limiter.knee.value = 0; e.limiter.ratio.value = 20; e.limiter.attack.value = 0.003; e.limiter.release.value = 0.12; }
  e.master.connect(e.limiter); e.limiter.connect(ctx.destination);
  if (ctx.createAnalyser) { e.watch = ctx.createAnalyser(); e.watch.fftSize = 2048; e.limiter.connect(e.watch); e.watchBuf = new Float32Array(2048); e.hot = 0; }
  // Watchdog: true when the output has gone bad (NaN, or near full scale for three seconds straight), so the caller can rebuild the engine.
  e.broken = () => {
    if (!e.watch || ctx.state !== 'running') return false;
    e.watch.getFloatTimeDomainData(e.watchBuf); let sum = 0;
    for (let i = 0; i < e.watchBuf.length; i++) { const v = e.watchBuf[i]; if (v !== v) return true; sum += v * v; }
    e.hot = Math.sqrt(sum / e.watchBuf.length) > 0.5 ? e.hot + 1 : 0;
    return e.hot >= 3;
  };
  e.musicBus = gain(ctx, 1); e.duck = gain(ctx, 1); e.pauseF = filt(ctx, 'lowpass', 20000, 0.5); e.musicBus.connect(e.duck); e.duck.connect(e.pauseF); e.pauseF.connect(e.master);
  e.sfxBus = gain(ctx, 1); e.sfxBus.connect(e.master);
  e.musicRev = { input: gain(ctx, 1) }; const mc = ctx.createConvolver(); mc.buffer = makeImpulse(ctx, 2.8, 3); e.musicRev.input.connect(mc); const mr = gain(ctx, 0.9); mc.connect(mr); mr.connect(e.musicBus);
  e.sfxRev = { input: gain(ctx, 0.25) }; const sc = ctx.createConvolver(); sc.buffer = makeImpulse(ctx, 1.1, 3); e.sfxRev.input.connect(sc); sc.connect(e.sfxBus);

  let first = true;
  e.applyVolumes = () => {
    const t = ctx.currentTime, v = e.vol, set = (p, x) => { if (first) p.value = x; else p.setTargetAtTime(x, t, 0.03); };
    set(e.master.gain, e.muted ? 0 : 1); set(e.musicBus.gain, v.master * v.master * v.music * v.music); set(e.sfxBus.gain, v.master * v.master * v.sfx * v.sfx * SFX_BOOST); first = false;
  };
  e.setPaused = (on, light) => {
    if (e.paused === (on ? (light ? 2 : 1) : 0)) return;
    e.paused = on ? (light ? 2 : 1) : 0; const t = ctx.currentTime;
    e.pauseF.frequency.setTargetAtTime(on ? (light ? 2400 : 800) : 20000, t, 0.1); e.duck.gain.setTargetAtTime(on ? (light ? 0.75 : 0.5) : 1, t, 0.1);
  };
  e.compiled = id => e.comp[id] || (e.comp[id] = M.compile(M.tracks[id]));

  /* ----- music: one instance per playing track; the sequencer schedules notes a little ahead of the audio clock */
  e.play = (id, o = {}) => {
    const T0 = M.tracks[id]; if (!T0) return null;
    const variant = o.variant || '', cur = e.cur;
    if (cur && cur.id === id && cur.variant === variant && !cur.stopping) return cur;
    const now = ctx.currentTime, fade = o.fade == null ? 1.5 : o.fade, start = o.at == null ? now + 0.08 : o.at;
    const comp = e.compiled(id), spb = comp.stepsPerBar, stepDur = 60 / T0.bpm / 4;
    const out = gain(ctx, 1), trim = gain(ctx, T0.level || 1); out.connect(trim); trim.connect(e.musicBus);
    const dly = { input: gain(ctx, 1) }, dnode = ctx.createDelay(2), fb = gain(ctx, 0.38), dl = filt(ctx, 'lowpass', 2600), dout = gain(ctx, 0.8);
    dnode.delayTime.value = stepDur * 6; dly.input.connect(dnode); dnode.connect(dl); dl.connect(fb); fb.connect(dnode); dl.connect(dout); dout.connect(out);
    const inst = { id, variant, track: T0, comp, spb, stepDur, start, out, dly, nextStep: 0, layers: {}, order: [], stopping: false, ended: false,
      transpose: (M.variants[id] && M.variants[id][variant]) || 0, killAt: Infinity, mode: 'synth', total: comp.steps };
    const files = M.files[id], buf = e.buffers[id], useFiles = files && buf && buf.ready;
    if (useFiles) inst.mode = buf.mix ? 'mix' : 'stems';
    T0.layers.forEach((L, i) => {
      const on = o.layers && o.layers[L.id] != null ? !!o.layers[L.id] : L.on !== false;
      const g = gain(ctx, 1), p = pan(ctx, L.pan), rs = gain(ctx, L.rev || 0), ds = gain(ctx, L.dly || 0);
      let head = g; if (p) { g.connect(p); head = p; } head.connect(out); head.connect(rs); head.connect(ds); rs.connect(e.musicRev.input); ds.connect(dly.input);
      const byStep = {}; for (const ev of comp.layers[i].events) (byStep[ev.s] || (byStep[ev.s] = [])).push(ev);
      const layer = { def: L, id: L.id, gain: g, level: 1, on, initial: on, changes: [], byStep, params: L.params || {}, src: null };
      if (inst.mode === 'stems' && buf.stems[L.id]) layer.src = e.startSource(buf.stems[L.id], T0, comp, stepDur, start, g, inst);
      if (inst.mode === 'mix' && i === 0) layer.src = e.startSource(buf.mix, T0, comp, stepDur, start, g, inst);
      if (!on && layer.src) g.gain.value = 0;
      inst.layers[L.id] = layer; inst.order.push(layer);
    });
    // crossfade: the old track fades out as this one fades in
    if (cur && !cur.stopping) e.fadeOut(cur, fade);
    out.gain.setValueAtTime(fade > 0.05 ? 0.0001 : 1, Math.max(now, start - 0.001));
    if (fade > 0.05) out.gain.linearRampToValueAtTime(1, start + Math.min(fade, 1.5));
    e.insts.push(inst); e.cur = inst;
    if (!opt.manual && !e.timer && typeof setInterval === 'function') e.timer = setInterval(() => note(() => e.tick()), TICK_MS);
    return inst;
  };
  e.startSource = (buffer, T0, comp, stepDur, start, g, inst) => {
    const s = ctx.createBufferSource(); s.buffer = buffer; s.loop = T0.loop !== false;
    if (s.loop) { s.loopStart = comp.loopStartStep * stepDur; s.loopEnd = comp.loopEndStep * stepDur; }
    s.connect(g); s.start(Math.max(start, ctx.currentTime)); inst.sources = (inst.sources || []).concat(s); return s;
  };
  e.fadeOut = (inst, fade) => {
    const now = ctx.currentTime; inst.stopping = true; inst.killAt = now + fade + 0.3;
    inst.out.gain.cancelScheduledValues(now); inst.out.gain.setValueAtTime(inst.out.gain.value, now); inst.out.gain.linearRampToValueAtTime(0.0001, now + Math.max(0.02, fade));
    if (e.cur === inst) e.cur = null;
  };
  e.stop = fade => { if (e.cur) e.fadeOut(e.cur, fade == null ? 1 : fade); };

  // The next beat or bar line of the current track, at least `lead` seconds from now.
  e.boundary = (inst, unit, lead = 0.1) => {
    const now = ctx.currentTime + lead;
    if (unit === 'now') return now;
    const dur = unitSteps(inst.track, unit) * inst.stepDur, k = Math.max(0, Math.ceil((now - inst.start) / dur - 1e-9));
    return inst.start + k * dur;
  };
  // Turn a layer on or off at the next bar (default) or beat line. fade: seconds to fade out (the layer keeps playing until the fade ends).
  e.setLayer = (id, on, o = {}) => {
    const inst = o.inst || e.cur; if (!inst || inst.stopping) return null;
    const L = inst.layers[id]; if (!L) return null;
    const t = e.boundary(inst, o.when || 'bar'), fade = on ? 0 : (o.fade || 0), ch = { t, gateT: t + fade, on: !!on };
    L.changes = L.changes.filter(c => c.gateT < t); L.changes.push(ch); L.target = !!on;
    const g = L.gain.gain;
    g.cancelScheduledValues(t);
    if (on) { g.setValueAtTime(L.src ? 0.0001 : 1, t); if (L.src) g.linearRampToValueAtTime(1, t + 0.04); }
    else if (fade > 0 || L.src) { g.setValueAtTime(1, t); g.linearRampToValueAtTime(0.0001, t + Math.max(fade, 0.04)); }
    return ch;
  };
  const layerOnAt = (L, t) => { let s = L.initial; for (const c of L.changes) if (c.gateT <= t + 1e-6) s = c.on; return s; };
  e.layerOn = (id, inst) => { const L = (inst || e.cur) && (inst || e.cur).layers[id]; return !!L && (L.target == null ? L.initial : L.target); };

  e.tick = horizon => {
    const now = ctx.currentTime, until = horizon == null ? now + LOOKAHEAD : horizon;
    for (let i = e.insts.length - 1; i >= 0; i--) {
      const inst = e.insts[i];
      if (now >= inst.killAt || (inst.ended && now >= inst.endAt)) { note(() => { inst.out.disconnect(); }); if (inst.sources) for (const s of inst.sources) note(() => s.stop()); if (e.cur === inst) e.cur = null; e.insts.splice(i, 1); if (!e.insts.length && e.timer) { clearInterval(e.timer); e.timer = null; } continue; }
      if (inst.stopping || inst.mode !== 'synth') continue;
      const loop = inst.track.loop !== false, c = inst.comp, loopLen = c.loopEndStep - c.loopStartStep;
      while (!inst.ended && inst.start + inst.nextStep * inst.stepDur < until) {
        const n = inst.nextStep++;
        if (!loop && n >= inst.total) { inst.ended = true; inst.endAt = inst.start + n * inst.stepDur + 4; break; }
        const idx = n < c.loopEndStep || !loop ? n : c.loopStartStep + ((n - c.loopEndStep) % loopLen);
        let t = inst.start + n * inst.stepDur;
        if (inst.track.swing && idx % 4 === 2) t += inst.track.swing * 2 * inst.stepDur;
        if (t < now - 0.05) continue;
        for (const L of inst.order) {
          const evs = L.byStep[idx]; if (!evs || !layerOnAt(L, inst.start + n * inst.stepDur)) continue;
          for (const ev of evs) e.playEvent(inst, L, ev, t);
        }
      }
    }
  };
  e.playEvent = (inst, L, ev, t) => {
    const def = L.def, vol = (def.vol == null ? 0.5 : def.vol) * (ev.v || 0.75), dest = L.gain;
    if (e.debug) e.log.push({ layer: L.id, t, s: ev.s, n: ev.n ? ev.n.slice() : ev.d.slice() });
    if (ev.d) { for (const d of ev.d) if (DRUM[d]) DRUM[d](e, dest, t, vol * 1.6); return; }
    const fn = INST[def.inst]; if (!fn) return;
    const dur = Math.max(0.05, ev.len * inst.stepDur * 0.97);
    for (const m of ev.n) fn(e, dest, t, dur, m + inst.transpose, vol * 1.6, L.params);
  };

  /* ----- sound effects */
  e.sfx = (name, o = {}) => {
    const fn = SFX[name]; if (!fn) return false;
    const now = ctx.currentTime, list = (e.voices[name] || (e.voices[name] = [])).filter(x => x > now);
    if (list.length >= VOICE_CAP || now - (e.lastSfx[name] || -1) < (o.gap == null ? 0.03 : o.gap)) { e.voices[name] = list; return false; }
    e.lastSfx[name] = now; list.push(now + 0.6); e.voices[name] = list;
    // Each effect gets its own output node; the reverb send taps that node, never the bus itself (a send from the bus feeds the reverb back
    // into its own input, and every effect that added one made the loop louder until it rang forever).
    const d = gain(ctx, 1), p = pan(ctx, o.pan);
    if (p) { d.connect(p); p.connect(e.sfxBus); } else d.connect(e.sfxBus);
    if (REV_SFX.has(name)) note(() => { const s = gain(ctx, 0.5); d.connect(s); s.connect(e.sfxRev.input); });
    const life = (SFX_LIFE[name] || 1.2) + 1.5 + (o.delay || 0);
    setTimeout(() => note(() => { d.disconnect(); if (p) p.disconnect(); }), life * 1000);
    fn({ e, t: (o.at == null ? now : o.at) + 0.005 + (o.delay || 0), d, r: o.rate || 1 + (Math.random() - 0.5) * 0.06, v: (o.vel == null ? 1 : o.vel) * (LEVEL[name] || 1), o });
    return true;
  };
  e.dispose = () => { if (e.timer) clearInterval(e.timer); e.timer = null; note(() => e.master.disconnect()); note(() => e.limiter.disconnect()); };
  e.state = () => ({ time: ctx.currentTime, tracks: e.insts.map(i => ({ id: i.id, variant: i.variant, start: i.start, stepDur: i.stepDur, stopping: i.stopping, mode: i.mode, current: i === e.cur,
    layers: Object.fromEntries(i.order.map(L => [L.id, { on: L.target == null ? L.initial : L.target, initial: L.initial, changes: L.changes.map(c => ({ t: c.t, gateT: c.gateT, on: c.on })) }])) })) });
  e.applyVolumes();
  return e;
}

// Offline render of a track or an effect, for the audio check: resolves { peak, rms, seconds, clipped }.
function renderOffline(kind, id, seconds, opts) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) return Promise.resolve(null);
  const rate = 32000, ctx = new OAC(2, Math.floor(rate * seconds), rate), e = createEngine(ctx, { manual: true, vol: { master: 1, music: 1, sfx: 1 } });
  if (kind === 'track') { e.play(id, Object.assign({ at: 0, fade: 0 }, opts)); e.tick(seconds); }
  else if (kind === 'sfxSeq') for (const [name, at] of id) e.sfx(name, Object.assign({ gap: 0 }, opts, { at }));   // id: [[effect, start seconds], ...]
  else e.sfx(id, Object.assign({ at: 0, gap: 0 }, opts));
  const tailFrom = opts && opts.tailFrom;
  return ctx.startRendering().then(buf => {
    let peak = 0, sum = 0, n = 0, last = 0, tail = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; n++; if (a > 0.003 && ch === 0) last = i; if (tailFrom != null && i >= tailFrom * rate && a > tail) tail = a; } }
    return { peak, rms: Math.sqrt(sum / n), seconds: last / rate, clipped: peak >= 0.999, tail };
  });
}

/* ---------------------------------------------------------------- 5. G.audio */
const SAVE_KEY = 'dryline-audio-v1';
const AC = () => window.AudioContext || window.webkitAudioContext;
let ctx = null, engine = null, unlockTried = false, blurTimer = null, hiddenSusp = false, vols = { master: 0.9, music: 0.8, sfx: 0.9 }, muted = false;
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) { for (const k of ['master', 'music', 'sfx']) if (typeof s[k] === 'number') vols[k] = clamp(s[k], 0, 1); muted = !!s.muted; } } catch (err) { /* storage unavailable */ }
const saveVols = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({ muted }, vols))); } catch (err) { /* ignore */ } };

const A = G.audio = {
  SFX, SFX_NAMES: Object.keys(SFX), createEngine, renderOffline,
  get available() { return !!AC(); },
  get engine() { return engine; },
  get unlocked() { return !!(ctx && ctx.state === 'running'); },
  get muted() { return muted; },
  hooks: false,
  // Create the context (a gesture is needed for it to run) and start the music. Safe to call at any time, as often as you like.
  unlock() {
    return note(() => {
      const C = AC(); if (!C) return false;
      if (!ctx) {
        ctx = new C({ latencyHint: 'interactive' }); engine = createEngine(ctx); engine.vol = Object.assign({}, vols); engine.muted = muted; engine.applyVolumes();
        if (ctx.addEventListener) ctx.addEventListener('statechange', () => { if (A.unlocked) note(() => A.update()); });
        note(() => A.preload());
      }
      if (ctx.state === 'suspended' && !hiddenSusp) { const r = ctx.resume(); if (r && r.catch) r.catch(() => {}); }
      return A.unlocked;
    }) || false;
  },
  // Forget the context (used by checks to try another stub).
  reset() { if (engine) engine.dispose(); ctx = null; engine = null; },
  sfx(name, o) { return note(() => (A.unlocked && engine) ? engine.sfx(name, o) : false) || false; },
  play(id, o) { return note(() => (A.unlocked && engine) ? engine.play(id, o) : null) || null; },
  stop(fade) { note(() => engine && engine.stop(fade)); },
  setLayer(id, on, o) { return note(() => engine ? engine.setLayer(id, on, o) : null) || null; },
  layerOn(id) { return note(() => engine ? engine.layerOn(id) : false) || false; },
  current() { return engine && engine.cur ? engine.cur.id + (engine.cur.variant ? ':' + engine.cur.variant : '') : null; },
  setVolume(bus, v) { if (!(bus in vols) || typeof v !== 'number' || !isFinite(v)) return false; vols[bus] = clamp(v, 0, 1); if (engine) { engine.vol = Object.assign({}, vols); note(() => engine.applyVolumes()); } saveVols(); return true; },
  getVolume(bus) { return vols[bus]; },
  mute(on) { muted = !!on; if (engine) { engine.muted = muted; note(() => engine.applyVolumes()); } saveVols(); return muted; },
  toggleMute() { return A.mute(!muted); },
  state() { return { available: A.available, unlocked: A.unlocked, muted, volumes: Object.assign({}, vols), current: A.current(), engine: engine ? engine.state() : null }; },
  // Real files named in G.music.files: load and decode them (http only; the synth plays until they are ready).
  preload() {
    if (!engine || location.protocol === 'file:' || typeof fetch !== 'function') return;
    for (const id of Object.keys(M.files)) {
      const spec = M.files[id], T0 = M.tracks[id]; if (!spec || !T0 || engine.buffers[id]) continue;
      const rec = engine.buffers[id] = { ready: false, stems: {}, mix: null };
      const get = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.arrayBuffer(); }).then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no)));
      const jobs = spec === true ? [get('assets/audio/' + id + '.ogg').then(b => { rec.mix = b; })]
        : (spec.stems || T0.layers.map(L => L.id)).map(l => get('assets/audio/' + id + '__' + l + '.ogg').then(b => { rec.stems[l] = b; }));
      Promise.all(jobs).then(() => { rec.ready = true; }).catch(() => { delete engine.buffers[id]; });
    }
  },

  /* ---- the director: picks the track and its layers from the game's state (about ten times a second) */
  decide() {
    if (G.state === 'title' || !G.run || !G.rooms || !G.rooms.current) return { track: 'title', layers: null, fade: 1.5 };
    const run = G.run, room = G.rooms.current, b = room.boss, live = G.players.filter(p => !p.down);
    if (run.over) return { track: run.over === 'win' ? 'win' : 'lose', layers: null, fade: 0.4 };
    const low = live.length > 0 && live.some(p => p.hp <= 1 || p.hp / Math.max(1, p.maxHp) <= 0.25);
    const fighting = !!(room.fight && b && b.state !== 'dead');
    const near = room.enemies.some(en => !en.dead && live.some(p => Math.abs(p.x - en.x) < 560 && Math.abs(p.y - en.y) < 320));
    if (near) A._combatAt = G.time;
    const combat = near || (G.time - (A._combatAt || -99) < 4);
    if (fighting) return { track: room.region === 'final' ? 'boss_clock' : 'boss_warden', variant: room.region === 'final' ? '' : room.region, kind: 'boss', low, boss: b, fade: 0.5 };
    // The music follows the area, not the room: every room of a region (side branches and trials too) keeps the region's track playing, and
    // only its layers change. The home area has one track. A new track starts only on crossing into another area, or for a boss fight.
    const area = M.regionTrack[room.region];
    if (room.kind === 'hub' || !area) return { track: 'hub', kind: 'calm', fade: 2.5 };
    const side = room.kind === 'branch' || room.kind === 'trial';
    return { track: area, kind: 'explore', low, combat: combat && !side, quiet: side, fade: b && b.state === 'dead' ? 2.5 : 2.5 };
  },
  // Which layers should sound, by role. slot:<cut> follows the boss's fare slots; borrow:<region> follows the Long Clock's borrowed attacks.
  targets(T0, d) {
    const out = {}, b = d.boss, punched = b ? b.spots.filter(s => s.broken).length : 0, borrowed = d.kind === 'boss' && d.track === 'boss_clock' && G.game && G.game.borrows ? G.game.borrows().map(x => x.region) : [];
    for (const L of T0.layers) {
      const r = L.role; let on = L.on !== false;
      if (d.kind === 'explore') { if (r === 'lead' || r === 'arp' || r === 'motif') on = !d.low && !(d.quiet && r === 'lead'); else if (r === 'perc') on = d.combat || d.low; else if (r === 'tense') on = !!d.low; }
      else if (d.kind === 'boss') {
        if (r.startsWith('slot:')) { const s = b.spots.find(x => x.cls === r.slice(5)); on = !!(s && s.open && !s.broken); }
        else if (r === 'rage') on = !!b.rage; else if (r === 'lift') on = punched >= 1; else if (r === 'lift2') on = punched >= 2;
        else if (r.startsWith('borrow:')) on = borrowed.includes(r.slice(7)); else if (r === 'tense') on = !!d.low;
      } else if (r === 'tense') on = false;
      out[L.id] = on;
    }
    return out;
  },
  // Throw the engine away and build a fresh one on a fresh context (the watchdog's cure); the director restarts the music.
  rebuild() {
    note(() => { if (engine) engine.dispose(); });
    const old = ctx; ctx = null; engine = null; A._lastWant = null; A.rebuilds = (A.rebuilds || 0) + 1;
    note(() => { if (old && old.close) { const r = old.close(); if (r && r.catch) r.catch(() => {}); } });
    return A.unlock();
  },
  update() {
    note(() => {
      if (!engine) return;
      if ((A._watchN = (A._watchN || 0) + 1) % 10 === 0 && note(() => engine.broken())) { A.rebuild(); return; }
      if (!A.unlocked) { if (ctx && ctx.state === 'suspended' && !hiddenSusp && G.input && G.input.any && Object.values(G.input.any.pressed).some(Boolean)) A.unlock(); return; }
      engine.setPaused(G.state === 'pause' || G.state === 'map', G.state === 'map');
      const d = A.decide(), T0 = M.tracks[d.track]; if (!T0) return;
      const want = d.track + (d.variant ? ':' + d.variant : ''), tg = A.targets(T0, d);
      if (A.current() !== want) {
        if (A._lastWant === want && T0.loop === false) return;                // a sting that has already played does not play again
        engine.play(d.track, { variant: d.variant || '', fade: d.fade, layers: tg }); A._lastWant = want;
        return;
      }
      const inst = engine.cur; if (!inst || !d.kind) return;
      for (const id in tg) {
        if (!!engine.layerOn(id) === tg[id]) continue;
        const L = inst.layers[id], bar = inst.spb * inst.stepDur;
        engine.setLayer(id, tg[id], { when: d.low && !tg[id] ? 'beat' : 'bar', fade: !tg[id] && L.def.role.startsWith('slot:') ? bar : 0 });
      }
    });
  }
};

/* ---- hooks into the game. Everything is wrapped from here after the game files have loaded, so the other files do not call the audio code. */
function wrap(obj, name, make) { const o = obj && obj[name]; if (typeof o !== 'function' || o.audWrapped) return false; const w = make(o); w.audWrapped = true; obj[name] = w; return true; }
const panOf = x => G.cam ? clamp((x - G.cam.x - 480) / 520, -0.8, 0.8) : 0;
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
function install() {
  if (A.hooks) return; A.hooks = true;
  const P = G.Player && G.Player.prototype;
  if (P) {
    wrap(P, 'update', orig => function (dt) {
      const p = this, vy0 = p.vy, grounded0 = p.onGround, dash0 = p.dashT, hp0 = p.hp, down0 = p.down;
      const r = orig.call(this, dt);
      note(() => {
        if (!A.unlocked || down0) return;
        const pn = panOf(p.x);
        if (p.vy < -450 && vy0 > p.vy + 350 && p._audPogo !== G.time) A.sfx(p.djAt === G.time ? 'doubleJump' : 'jump', { pan: pn });
        if (!grounded0 && p.onGround && vy0 > 380) A.sfx('land', { pan: pn, vel: clamp(vy0 / 900, 0.4, 1) });
        if (!(dash0 > 0) && p.dashT > 0) A.sfx('dash', { pan: pn });
        if (p.hp > hp0 && !p.down) A.sfx('mend', { pan: pn });
        if (p.healT > 0 && G.time - (p._audTick || 0) > 0.3) { p._audTick = G.time; A.sfx('mendTick', { pan: pn }); }
      });
      return r;
    });
    wrap(P, 'startSlash', orig => function (heavy) { const r = orig.apply(this, arguments); note(() => A.sfx(heavy ? 'heavyCut' : 'slash', { pan: panOf(this.x) })); return r; });
    wrap(P, 'slashLanded', orig => function (s) { const r = orig.apply(this, arguments); if (s && s.dir === 'down') { this._audPogo = G.time; note(() => A.sfx('pogo', { pan: panOf(this.x) })); } return r; });
    wrap(P, 'useItem', orig => function () { const r = orig.apply(this, arguments); note(() => { if (this.castAt === G.time && this.castCls) A.sfx('cut' + cap(this.castCls), { pan: panOf(this.x) }); }); return r; });
    wrap(P, 'hurt', orig => function () { const r = orig.apply(this, arguments); note(() => { if (r === true) A.sfx(this.down ? 'down' : 'hurt', { pan: panOf(this.x) }); }); return r; });
    wrap(P, 'revive', orig => function () { const was = this.down, r = orig.apply(this, arguments); note(() => { if (was) A.sfx('revive'); }); return r; });
  }
  if (G.Enemy) wrap(G.Enemy.prototype, 'damage', orig => function (d) {
    const hp0 = this.hp, dead0 = this.dead, r = orig.apply(this, arguments);
    note(() => { if (dead0) return; if (this.dead) A.sfx('enemyDefeat', { pan: panOf(this.x) }); else if (this.hp < hp0) A.sfx('hitEnemy', { pan: panOf(this.x), vel: clamp(0.5 + d / 40, 0.5, 1) }); else if (d > 0) A.sfx('sealed', { pan: panOf(this.x) }); });
    return r;
  });
  if (G.Boss) {
    const B = G.Boss.prototype;
    wrap(B, 'damage', orig => function (d) { const active = this.active && this.active(), r = orig.apply(this, arguments); note(() => { if (active && d > 0) A.sfx('hitEnemy', { pan: panOf(this.x), vel: clamp(0.4 + d / 60, 0.4, 0.9), gap: 0.07 }); }); return r; });
    wrap(B, 'start', orig => function () { const r = orig.apply(this, arguments); note(() => A.sfx('bossIntro')); return r; });
    wrap(B, 'update', orig => function () { const s0 = this.state, r = orig.apply(this, arguments); note(() => { if (this.state !== s0) { if (this.state === 'stagger') A.sfx('bossStagger'); else if (this.state === 'dead') A.sfx('bossDefeat'); } }); return r; });
    wrap(B, 'hitSpot', orig => function (sp) {
      const open0 = sp.open, r = orig.apply(this, arguments);
      note(() => { const pn = panOf(this.x); if (!open0) A.sfx('sealed', { pan: pn }); else if (sp.broken) { A.sfx('slotPunch', { pan: pn }); A.sfx('bossStagger', { pan: pn, delay: 0.12 }); } else A.sfx('slotCrack', { pan: pn }); });
      return r;
    });
  }
  if (G.game) {
    wrap(G.game, 'spend', orig => function () { const r = orig.apply(this, arguments); note(() => { if (r) A.sfx('tokenVoid', { delay: 0.25 }); }); return r; });
    wrap(G.game, 'takeItem', orig => function () { const r = orig.apply(this, arguments); note(() => A.sfx('pickupToken')); return r; });
    wrap(G.game, 'addTrinket', orig => function () { const r = orig.apply(this, arguments); note(() => A.sfx('pickupToken')); return r; });
  }
  if (G.combat) wrap(G.combat, 'update', orig => function () {
    const s0 = G.run && G.run.shards, r = orig.apply(this, arguments);
    note(() => { if (G.run && G.run.shards > s0) { A._chain = G.time - (A._chainAt || -9) < 0.5 ? Math.min(7, (A._chain || 0) + 1) : 0; A._chainAt = G.time; A.sfx('pickupScrip', { step: A._chain, gap: 0.04 }); } });
    return r;
  });
  if (G.props && G.props.make) wrap(G.props, 'make', orig => function (type) {
    const pr = orig.apply(this, arguments), inter = pr && pr.interact;
    if (inter && type !== 'plinth') pr.interact = function () { const r = inter.apply(this, arguments); note(() => A.sfx(type === 'door' || type === 'gate' ? 'door' : type === 'standpipe' ? 'mend' : 'propUse')); return r; };
    return pr;
  });
  if (G.menus) {
    const mn = G.menus, menu = mn.menu, step = mn.pauseStep, draw = mn.pause, open = mn.open;
    mn.open = function () { audioSel = -1; note(() => A.sfx('pause')); return open.apply(this, arguments); };
    mn.pauseStep = function (pr) {
      const was = G.state;
      if (menu.page !== 'comfort') audioSel = -1;
      else if (audioSel >= 0) return audioStep(pr, step);
      else if (menu.sel === 2 && pr.down) { audioSel = 0; menu.sel = -1; note(() => A.sfx('menuMove')); return; }
      const r = step.apply(this, arguments);
      note(() => { if (was === 'pause' && G.state === 'play') A.sfx('unpause'); else if (pr.up || pr.down) A.sfx('menuMove'); else if (pr.jump) A.sfx('menuSelect'); });
      return r;
    };
    mn.pause = function (ctx2) { const r = draw.apply(this, arguments); note(() => { if (menu.page === 'comfort') drawSound(ctx2); }); return r; };
  }
}

/* ---- the Sound block under the pause menu's Comfort rows: Left and Right change a volume, Jump switches sound on or off */
let audioSel = -1;
const SOUND_ROWS = [['Master volume', 'master'], ['Music volume', 'music'], ['Effects volume', 'sfx'], ['Sound', null]];
function audioStep(pr, step) {
  const menu = G.menus.menu;
  if (pr.pause) { audioSel = -1; menu.sel = 2; return step.call(G.menus, pr); }
  if (pr.up) { audioSel--; if (audioSel < 0) menu.sel = 2; A.sfx('menuMove'); }
  else if (pr.down) { audioSel++; if (audioSel >= SOUND_ROWS.length) { audioSel = -1; menu.sel = 0; } A.sfx('menuMove'); }
  else if (pr.left || pr.right) { const bus = SOUND_ROWS[audioSel][1]; if (bus) { A.setVolume(bus, Math.round((A.getVolume(bus) + (pr.right ? 0.1 : -0.1)) * 10) / 10); A.sfx('menuMove'); } else A.toggleMute(); }
  else if (pr.jump && !SOUND_ROWS[audioSel][1]) { A.toggleMute(); A.sfx('menuSelect'); }
}
function drawSound(ctx2) {
  const C = G.C, art = G.art, W = C.W, top = (C.H - 490) / 2, menu = G.menus.menu;
  art.label(ctx2, 'Sound', W / 2, top + 284, 14, '#e9a23b', 'center', C.FONT, 600);
  SOUND_ROWS.forEach(([name, bus], i) => {
    const y = top + 312 + i * 26, on = audioSel === i;
    if (on) { ctx2.fillStyle = 'rgba(233,162,59,0.18)'; ctx2.fillRect(W / 2 - 220, y - 11, 440, 22); ctx2.strokeStyle = '#e9a23b'; ctx2.lineWidth = 1.5; ctx2.strokeRect(W / 2 - 220, y - 11, 440, 22); }
    art.label(ctx2, name, W / 2 - 200, y, 13.5, on ? '#fff3c4' : '#9aa89f', 'left', C.FONT, on ? 600 : 500);
    if (bus) {
      const v = A.getVolume(bus); ctx2.fillStyle = '#26352f'; ctx2.fillRect(W / 2 - 20, y - 4, 160, 8); ctx2.fillStyle = on ? '#e9a23b' : '#6f8f7e'; ctx2.fillRect(W / 2 - 20, y - 4, 160 * v, 8);
      art.label(ctx2, Math.round(v * 100) + '%', W / 2 + 200, y, 13.5, '#e9e2cf', 'right', C.FONT, 600);
    } else art.label(ctx2, muted ? 'Off (M)' : 'On (M)', W / 2 + 200, y, 13.5, muted ? '#ff9f8a' : '#e9e2cf', 'right', C.FONT, 600);
  });
  art.label(ctx2, 'Left and Right change a volume. M switches sound off and on anywhere.', W / 2, top + 416, 12.5, '#9aa89f');
  void menu;
}

/* ---- lifecycle: first gesture, the mute key, blur and hidden tabs, and the director's timer */
const onGesture = () => A.unlock();
for (const ev of ['keydown', 'pointerdown', 'mousedown', 'touchend', 'click']) addEventListener(ev, onGesture, true);
addEventListener('keydown', ev => {
  if (ev.code !== 'KeyM' || ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  note(() => {
    if (G.menus && G.menus.menu && G.menus.menu.capture) return;
    const b = G.input && G.input.bindings && G.input.bindings('keyboard');
    if (b && Object.values(b).some(codes => Array.isArray(codes) && codes.includes('KeyM'))) return;
    A.toggleMute();
    if (G.state === 'play' && G.fx && G.fx.say) G.fx.say(muted ? 'Sound off' : 'Sound on', 'M switches it', 1.2);
  });
});
addEventListener('blur', () => { clearTimeout(blurTimer); blurTimer = setTimeout(() => note(() => { if (ctx && ctx.state === 'running') ctx.suspend(); }), 5000); });
addEventListener('focus', () => { clearTimeout(blurTimer); note(() => { if (ctx && ctx.state === 'suspended' && !document.hidden) ctx.resume(); }); });
document.addEventListener('visibilitychange', () => note(() => {
  if (!ctx) return;
  if (document.hidden) { hiddenSusp = true; if (ctx.state === 'running') ctx.suspend(); } else { hiddenSusp = false; if (ctx.state === 'suspended') ctx.resume(); }
}));
setInterval(() => A.update(), 100);
install();
})();
