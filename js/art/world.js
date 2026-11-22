/* WORLD ART: the code-drawn watercolor world, cached to offscreen canvases so it costs almost nothing per frame.
   Paper grain, uneven washes inside shapes, darker pooled edges, slightly wobbly ink outlines, a muted natural palette. Everything is
   deterministic (hashes of room and cell, never Math.random) so nothing shimmers, and everything can be replaced by painted images
   (see js/art/world_hooks.js, the one table, and tools/art/README.md).
   This file: shared paint helpers, region palettes, tile chunks (solid, one-way, spikes, decorations), the image hooks.
   world_bg.js: the three parallax layers of each place. world_props.js: the props. ui/skin.js: parchment and the title.
   Everything switches off with G.artTest (F2): then art.js draws the old flat world. */
(() => {
'use strict';
const G = window.G, C = G.C, T = C.T, U = G.util;
const W = G.world = { caches: [], stats: { chunks: 0, buildMs: 0 } };

/* ---------- small tools ---------- */
const h2 = (x, y, s = 0) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const mulberry = seed => { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hex = (r, g, b) => '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
const mix = (a, b, t) => { const p = rgb(a), q = rgb(b); return hex(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t); };
const rgba = (h, a) => { const p = rgb(h); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; };
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = h => { const p = typeof h === 'string' ? rgb(h) : h; return 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
Object.assign(W, { h2, vnoise, mulberry, strHash, rgb, hex, mix, rgba, lum, ratio, mk });

// The wobble every hand-drawn line in the world shares: a smooth displacement of any point, so two shapes that meet stay joined.
const wob = (x, y, k) => { const a = k ? 1.0 : 1.7, f = k ? 0.1 : 0.062; return [(vnoise(x * f, y * f, 11 + k * 7) - 0.5) * 2 * a, (vnoise(x * f + 9.1, y * f + 3.3, 23 + k * 7) - 0.5) * 2 * a]; };
W.wob = wob;

/* ---------- paper grain and soft blobs ---------- */
let grainCv = null;
W.grain = () => {
  if (grainCv) return grainCv;
  const c = grainCv = mk(160, 160), x = c.getContext('2d'), R = mulberry(77);
  for (let i = 0; i < 2600; i++) { x.fillStyle = 'rgba(40,28,14,' + (0.06 + R() * 0.16) + ')'; x.fillRect(R() * 160, R() * 160, R() < 0.8 ? 1 : 2, 1); }
  for (let i = 0; i < 1500; i++) { x.fillStyle = 'rgba(255,246,220,' + (0.05 + R() * 0.16) + ')'; x.fillRect(R() * 160, R() * 160, R() < 0.8 ? 1 : 2, 1); }
  x.lineWidth = 0.6;
  for (let i = 0; i < 70; i++) { x.strokeStyle = R() < 0.5 ? 'rgba(40,28,14,0.07)' : 'rgba(255,246,220,0.08)'; x.beginPath(); const px = R() * 160, py = R() * 160; x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * 14, py + (R() - 0.5) * 14); x.stroke(); }
  return c;
};
// Paper grain over everything already painted on x (device pixels, so it stays fine at any scale).
W.applyGrain = (x, strength = 1) => {
  const cv = x.canvas, pat = x.createPattern(W.grain(), 'repeat');
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = strength; x.fillStyle = pat; x.fillRect(0, 0, cv.width, cv.height); x.restore();
};
const blobs = {};
const blob = col => blobs[col] || (blobs[col] = (() => {
  const c = mk(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32), p = rgb(col);
  g.addColorStop(0, 'rgba(' + p + ',1)'); g.addColorStop(0.55, 'rgba(' + p + ',0.55)'); g.addColorStop(1, 'rgba(' + p + ',0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
})());
W.blob = blob;
// A watercolor shape: base wash, uneven blotches, darker pooled edge, wobbly ink line. path: Path2D. o: { bb:[x,y,w,h], wash:[colours], edge, ink, lw, soft, seed }
W.wc = (x, path, col, o = {}) => {
  const bb = o.bb || [0, 0, 0, 0], R = mulberry(o.seed || 1), soft = o.soft || 0;
  x.save(); x.fillStyle = col; x.fill(path); x.clip(path);
  if (bb[2] > 0 && !o.flat) {
    const wash = o.wash || [mix(col, '#ffffff', 0.18), mix(col, '#000000', 0.2)], n = o.blobs || Math.max(2, Math.min(7, Math.round(bb[2] * bb[3] / 500)));
    for (let i = 0; i < n; i++) {
      const r = Math.max(5, Math.min(bb[2], bb[3]) * (0.45 + R() * 0.6));
      x.globalAlpha = (0.28 + R() * 0.25) * (1 - soft * 0.4); x.drawImage(blob(wash[i % wash.length]), bb[0] + R() * bb[2] - r, bb[1] + R() * bb[3] - r, r * 2, r * 2);
    }
  }
  x.globalAlpha = (o.edgeA || 0.4) * (1 - soft * 0.4); x.strokeStyle = o.edge || mix(col, '#1a1208', 0.5); x.lineWidth = o.edgeW || 5; x.lineJoin = 'round'; x.stroke(path);
  x.restore();
  if (o.ink !== false && !soft) { x.save(); x.strokeStyle = o.ink || '#1a1710'; x.lineWidth = o.lw || 1.6; x.lineJoin = 'round'; x.lineCap = 'round'; x.globalAlpha = 0.92; x.stroke(path); x.restore(); }
};
// A closed polygon with a little hand jitter, as a Path2D. pts: [[x, y], ...]; seed makes the jitter repeatable.
W.poly = (pts, jit, seed, round) => {
  const R = mulberry(seed || 5), p = new Path2D(), q = pts.map(a => [a[0] + (R() - 0.5) * 2 * jit, a[1] + (R() - 0.5) * 2 * jit]);
  if (round) { const n = q.length; p.moveTo((q[0][0] + q[n - 1][0]) / 2, (q[0][1] + q[n - 1][1]) / 2); for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } }
  else { p.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) p.lineTo(q[i][0], q[i][1]); }
  p.closePath(); return p;
};
W.ell = (cx, cy, rx, ry, seed, jit = 0.8) => { const pts = [], R = mulberry(seed || 3), n = 12; for (let i = 0; i < n; i++) { const a = i / n * 6.2832; pts.push([cx + Math.cos(a) * rx * (1 + (R() - 0.5) * 0.12), cy + Math.sin(a) * ry * (1 + (R() - 0.5) * 0.12)]); } return W.poly(pts, jit * 0.3, seed, true); };
W.rect = (x, y, w, h, seed, jit = 0.8) => W.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], jit, seed);

/* ---------- region looks ---------- */
// mat: stone | timber | coral | salt | iron | steel. base/washes: the mass; cap/capHi/capLow: the walkable top edge (always pale, so it reads against the dark backdrop);
// plank: one-way platforms; ink: outline; deco: decorations placed on floors and ceilings.
const REG = {
  hub:   { name: 'junction', mat: 'stone',  base: '#566656', washes: ['#6b7d68', '#4a584c', '#767657', '#52665e'], deep: '#2c382f', ink: '#1b1f17', cap: '#cfd69c', capHi: '#eef0c6', capLow: '#8f9d62', plank: '#d9bf82', plankLow: '#8a6a3c', trim: '#c8a65a', deco: ['lamp', 'moss', 'rail', 'moss', 'stones'], hang: ['cable', 'lampHang'] },
  r1:    { name: 'quay',     mat: 'timber', base: '#7a5a42', washes: ['#8b6948', '#5e4533', '#6f5a3c', '#835640'], deep: '#3a281d', ink: '#201510', cap: '#e0c590', capHi: '#f6e7b8', capLow: '#a36a3a', plank: '#e2c58c', plankLow: '#8f5a30', trim: '#b06a36', deco: ['crate', 'coil', 'barnacle', 'rib', 'crate'], hang: ['chain', 'chain', 'net'] },
  r2:    { name: 'reef',     mat: 'coral',  base: '#6e6384', washes: ['#807096', '#5a5170', '#826a86', '#66708a'], deep: '#30283f', ink: '#1d1827', cap: '#e1d6ee', capHi: '#f8f1ff', capLow: '#9d8ab8', plank: '#d6c6e6', plankLow: '#7d6a9c', trim: '#d9c06a', deco: ['fan', 'branch', 'polyp', 'fan', 'branch'], hang: ['lampHang', 'cable', 'tendril'] },
  r3:    { name: 'cutting',  mat: 'salt',   base: '#8ea2b2', washes: ['#a3b6c4', '#7a8fa0', '#9aa8bc', '#86a0a4'], deep: '#44566a', ink: '#1c2630', cap: '#f6f9f6', capHi: '#ffffff', capLow: '#aebfcc', plank: '#e9edf0', plankLow: '#7f93a5', trim: '#c9d4dc', deco: ['crystal', 'sleeper', 'crystal', 'pile', 'crystal'], hang: ['drip', 'stalactite', 'drip'] },
  r4:    { name: 'hall',     mat: 'iron',   base: '#3a5a4a', washes: ['#476a58', '#2f4a3d', '#4c6a50', '#3a5560'], deep: '#1b2d25', ink: '#111a15', cap: '#e0c877', capHi: '#f8eaa6', capLow: '#97813c', plank: '#e3cd7c', plankLow: '#7a6428', trim: '#d4b25c', deco: ['clock', 'booth', 'bench', 'brassLamp', 'trunkpile'], hang: ['chandelier', 'brassLamp'] },
  final: { name: 'terminus', mat: 'steel',  base: '#4a527c', washes: ['#59628f', '#3d4468', '#55608a', '#455a82'], deep: '#222744', ink: '#12152a', cap: '#d3dcf2', capHi: '#f3f6ff', capLow: '#8b98c4', plank: '#d3dcf2', plankLow: '#69749f', trim: '#c9b878', deco: ['pipe', 'gauge', 'buffer', 'steam', 'pipe'], hang: ['pipeHang', 'valve'] }
};
W.REG = REG;
const reg = id => REG[id] || REG.hub;
W.region = reg;
W.regionName = id => reg(id).name;
W.on = () => G.artTest !== false;

/* ---------- image hooks (js/art/world_hooks.js is the table) ---------- */
const HK = (G.worldHooks || { hooks: {}, regions: {} }).hooks;
W.images = {};                         // sheet name -> HTMLImageElement | HTMLCanvasElement (loaded or injected)
W.setImage = (name, img) => { if (img) W.images[name] = img; else delete W.images[name]; W.flush(); };
(G.worldFiles || []).forEach(name => {
  if (!HK[name]) return;
  const img = new Image();
  G.spritesPending = (G.spritesPending || 0) + 1;
  const done = ok => { if (ok && img.naturalWidth > 0) { W.images[name] = img; W.flush(); } G.spritesPending--; };
  img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).then(() => done(true), () => done(true)); };
  img.onerror = () => done(false);
  img.src = 'assets/world/' + name + '.png';
});
// The picture for one slot of a sheet: { img, sx, sy, sw, sh } (equal cells in reading order), or null.
W.cell = (name, slotName) => {
  const hk = HK[name], img = W.images[name];
  if (!hk || !img || !hk.slots) return null;
  const i = hk.slots.findIndex(s => (s.name || s) === slotName); if (i < 0) return null;
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, sw = w / hk.cols, sh = h / hk.rows;
  return { img, sx: (i % hk.cols) * sw, sy: Math.floor(i / hk.cols) * sh, sw, sh, hook: hk, slot: hk.slots[i] };
};
const tileSheet = (region, which) => 'tiles_' + (reg(region).name) + '_' + which + '_f6';
const bgName = (region, layer) => 'bg_' + reg(region).name + '_' + layer + '_f1';
W.tileSheet = tileSheet; W.bgName = bgName;

/* ---------- room caches ---------- */
const store = new WeakMap();
// Everything cached for the tile grid being drawn: chunks, decoration list, lamps. Dropped when the grid or the region changes.
function cacheFor(region) {
  const grid = G.tiles.grid; if (!grid) return null;
  let byRegion = store.get(grid); if (!byRegion) store.set(grid, byRegion = {});
  let E = byRegion[region];
  if (E && (E.rows !== G.tiles.rows || E.cols !== G.tiles.cols)) E = null;
  if (!E) {
    const cols = G.tiles.cols, rows = G.tiles.rows, room = G.rooms && G.rooms.current && G.rooms.current.grid === grid ? G.rooms.current : null;
    E = byRegion[region] = { grid, region, cols, rows, chunks: new Map(), seed: strHash((room ? room.id : 'x') + region) % 9973, lamps: [], decor: [], marks: room ? room.def.marks : [], R: reg(region) };
    E.S = (c, r) => r < 0 || r >= rows ? true : grid[r][c < 0 ? 0 : c >= cols ? cols - 1 : c] === '#';
    E.at = (c, r) => r < 0 || r >= rows ? '#' : grid[r][c < 0 ? 0 : c >= cols ? cols - 1 : c];
    placeDecor(E); scanDyn(E);
    W.caches.push(E); while (W.caches.length > 3) { const old = W.caches.shift(); old.chunks.clear(); }
  }
  return E;
}
// Cells that move (crumble ledges, vents, conveyor belts) are drawn each frame over the cached chunks; the list is built once per grid.
function scanDyn(E) {
  E.dyn = { c: [], v: [], belt: [] };
  for (let r = 0; r < E.rows; r++) for (let c = 0; c < E.cols; c++) { const ch = E.grid[r][c]; if (ch === 'c') E.dyn.c.push([c, r]); else if (ch === 'v') E.dyn.v.push([c, r]); else if (ch === '>' || ch === '<') E.dyn.belt.push([c, r, ch === '>' ? 1 : -1]); }
}
// A tile changed (tar burnt, salt dissolved): the chunks around it repaint, one per frame, so a burn never costs a spike.
W.dirtyCell = (c, r) => {
  for (const E of W.caches) {
    if (E.grid !== G.tiles.grid) continue;
    scanDyn(E);
    const px = CHC * T, py = CHR * T;
    for (let cy = Math.floor(((r - 2) * T - MARG) / py); cy <= Math.floor(((r + 3) * T + MARG) / py); cy++) for (let cx = Math.floor(((c - 2) * T - MARG) / px); cx <= Math.floor(((c + 3) * T + MARG) / px); cx++)
      for (const k of E.chunks.keys()) { const q = k.split(','); if (+q[0] === cx && +q[1] === cy) (E.dirty = E.dirty || new Set()).add(k); }
  }
};
if (G.tiles && !G.tiles._wcWrapped) { G.tiles._wcWrapped = true; const rep = G.tiles.replace; G.tiles.replace = function (c, r, ch) { const ok = rep.call(this, c, r, ch); if (ok) W.dirtyCell(c, r); return ok; }; }
W.flush = () => { for (const e of W.caches) e.chunks.clear(); W.caches.length = 0; W.bgFlush && W.bgFlush(); W.propFlush && W.propFlush(); };

/* ---------- decorations: deterministic, non-colliding, never near a prop, a doorway or a spike ---------- */
function placeDecor(E) {
  const { cols, rows, R } = E, near = (c, r) => E.marks.some(m => Math.abs(m.c - c) <= 2 && Math.abs(m.r - r) <= 3);
  const lastFloor = {}, lastHang = {};
  for (let r = 2; r < rows - 2; r++) for (let c = 2; c < cols - 2; c++) {
    if (!E.S(c, r)) continue;
    const key = r, spike = E.at(c - 1, r - 1) === '^' || E.at(c + 1, r - 1) === '^' || E.at(c, r - 1) === '^';
    if (!E.S(c, r - 1) && E.at(c, r - 1) === '.' && !E.S(c, r - 2) && E.at(c, r - 2) === '.' && E.S(c - 1, r) && E.S(c + 1, r) && !spike && !near(c, r - 1)) {
      if (h2(c, r, E.seed + 5) < 0.2 && c - (lastFloor[key] === undefined ? -9 : lastFloor[key]) >= 5) {
        lastFloor[key] = c; const kind = R.deco[Math.floor(h2(c, r, E.seed + 9) * R.deco.length)];
        E.decor.push({ kind, x: c * T + T / 2, y: r * T, c, r, hang: false, seed: Math.floor(h2(c, r, 4) * 9999) });
      }
    } else if (!E.S(c, r + 1) && E.at(c, r + 1) === '.' && !E.S(c, r + 2) && E.at(c, r + 2) === '.' && !near(c, r + 1)) {
      if (h2(c, r, E.seed + 15) < 0.13 && c - (lastHang[key] === undefined ? -9 : lastHang[key]) >= 4) {
        lastHang[key] = c; const kind = R.hang[Math.floor(h2(c, r, E.seed + 19) * R.hang.length)];
        E.decor.push({ kind, x: c * T + T / 2, y: (r + 1) * T, c, r, hang: true, seed: Math.floor(h2(c, r, 6) * 9999) });
      }
    }
  }
  E.decor.sort((a, b) => a.c - b.c);
}

/* ---------- materials: the marks painted over a cell of the mass ---------- */
function stroke(x, pts, col, a, w) { x.globalAlpha = a; x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); }
const PATTERN = {
  stone(x, c, r, E, R) {                    // courses of stone: staggered joints, lit lower edges, a lighter block here and there
    const px = c * T, py = r * T, ink = E.R.ink;
    for (let k = 0; k < 2; k++) {
      const y = py + k * 16 + 0.5 + (R() - 0.5) * 2, off = ((r * 2 + k) % 2) * 20 + h2(c >> 1, r * 2 + k, E.seed) * 8;
      stroke(x, [[px, y], [px + 11, y + (R() - 0.5)], [px + 22, y + (R() - 0.5)], [px + T, y]], ink, 0.34, 1.2);
      stroke(x, [[px, y + 1.4], [px + T, y + 1.4]], '#f2ecd0', 0.09, 1);
      const jx = px + ((off % T) + T) % T; stroke(x, [[jx, y], [jx + (R() - 0.5) * 1.5, y + 16]], ink, 0.3, 1.1);
    }
    if (R() < 0.35) { x.globalAlpha = 0.1; x.fillStyle = '#f0ead0'; x.fillRect(px + R() * 14, py + R() * 14, 14 + R() * 10, 12); }
    if (R() < 0.3) { x.globalAlpha = 0.18; x.fillStyle = '#6f8a4a'; x.beginPath(); x.ellipse(px + R() * T, py + R() * T, 4 + R() * 5, 2 + R() * 3, 0, 0, 6.3); x.fill(); }
  },
  timber(x, c, r, E, R) {                   // hull strakes: long horizontal planks, staggered butt joints, nails, grain
    const px = c * T, py = r * T, ink = E.R.ink;
    for (let k = 0; k < 3; k++) {
      const y = py + k * 10.67 + 0.5, w = [[px, y + (R() - 0.5) * 0.8], [px + 16, y + (R() - 0.5) * 1.2], [px + T, y + (R() - 0.5) * 0.8]];
      stroke(x, w, ink, 0.4, 1.3); stroke(x, [[px, y + 1.6], [px + T, y + 1.6]], '#f3d7a0', 0.1, 1);
      const jx = px + ((((r * 3 + k) * 37) % 96) / 96 * 64 + c * 0) % 64; if (jx >= px && jx < px + T) { stroke(x, [[jx, y], [jx, y + 10.5]], ink, 0.38, 1.2); x.globalAlpha = 0.5; x.fillStyle = '#2a1a10'; x.fillRect(jx - 3, y + 4, 1.4, 1.4); x.fillRect(jx + 2, y + 4, 1.4, 1.4); }
      for (let g = 0; g < 2; g++) { const gy = y + 2.5 + R() * 6, gx = px + R() * 20; stroke(x, [[gx, gy], [gx + 6 + R() * 8, gy + (R() - 0.5) * 1.5]], '#2a1a10', 0.14, 0.9); }
    }
    if (R() < 0.18) { x.globalAlpha = 0.22; x.fillStyle = '#a14e2c'; x.beginPath(); x.ellipse(px + R() * T, py + R() * T, 3 + R() * 4, 5 + R() * 6, 0, 0, 6.3); x.fill(); }
  },
  coral(x, c, r, E, R) {                    // porous coral: pits with a pale lip, soft ridges
    const px = c * T, py = r * T;
    for (let i = 0; i < 5; i++) {
      const cx = px + R() * T, cy = py + R() * T, rr = 1.4 + R() * 3.2;
      x.globalAlpha = 0.34; x.fillStyle = '#231b30'; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.8, 0, 0, 6.3); x.fill();
      x.globalAlpha = 0.22; x.strokeStyle = '#efe4fa'; x.lineWidth = 0.9; x.beginPath(); x.arc(cx, cy + 0.6, rr + 0.8, 0.2, 2.9); x.stroke();
    }
    for (let i = 0; i < 2; i++) { const y = py + 6 + i * 15 + R() * 5; stroke(x, [[px, y], [px + 10, y - 2 - R() * 3], [px + 22, y + 1 + R() * 3], [px + T, y - 1]], '#d8c9ec', 0.1, 2.2); }
  },
  salt(x, c, r, E, R) {                     // salt crystal: angular facets, pale and dark, thin scratches
    const px = c * T, py = r * T;
    for (let i = 0; i < 3; i++) {
      const ax = px + R() * T, ay = py + R() * T, p = [[ax, ay], [ax + 8 + R() * 14, ay + (R() - 0.3) * 8], [ax + 3 + R() * 12, ay + 8 + R() * 12]];
      x.globalAlpha = 0.16 + R() * 0.1; x.fillStyle = R() < 0.5 ? '#ffffff' : '#4f647a'; x.beginPath(); x.moveTo(p[0][0], p[0][1]); x.lineTo(p[1][0], p[1][1]); x.lineTo(p[2][0], p[2][1]); x.closePath(); x.fill();
    }
    for (let i = 0; i < 2; i++) { const ax = px + R() * T, ay = py + R() * T; stroke(x, [[ax, ay], [ax + (R() - 0.5) * 22, ay + (R() - 0.5) * 22]], '#3a4d62', 0.3, 0.9); }
  },
  iron(x, c, r, E, R) {                     // riveted plates: inset panel lines, brass rivets, a verdigris streak
    const px = c * T, py = r * T, ink = E.R.ink;
    x.globalAlpha = 0.42; x.strokeStyle = ink; x.lineWidth = 1.2; x.strokeRect(px + 2.5, py + 2.5, T - 5, T - 5);
    x.globalAlpha = 0.1; x.strokeStyle = '#d9f0d0'; x.strokeRect(px + 3.8, py + 3.8, T - 7, T - 7);
    x.fillStyle = E.R.trim; for (const [dx, dy] of [[5, 5], [T - 5, 5], [5, T - 5], [T - 5, T - 5]]) { x.globalAlpha = 0.85; x.beginPath(); x.arc(px + dx, py + dy, 1.5, 0, 6.3); x.fill(); x.globalAlpha = 0.3; x.fillStyle = ink; x.fillRect(px + dx - 0.3, py + dy + 0.4, 1.6, 1.2); x.fillStyle = E.R.trim; }
    if (R() < 0.3) { x.globalAlpha = 0.2; x.fillStyle = '#6fb59c'; x.fillRect(px + 6 + R() * 16, py + 4, 3 + R() * 3, 14 + R() * 12); }
  },
  steel(x, c, r, E, R) {                    // steel plate: horizontal seams, rows of rivets, a vertical seam every two cells
    const px = c * T, py = r * T, ink = E.R.ink;
    for (const y of [py + 0.5, py + 16.5]) { stroke(x, [[px, y], [px + T, y]], ink, 0.4, 1.2); stroke(x, [[px, y + 1.4], [px + T, y + 1.4]], '#e0e8ff', 0.1, 1); x.fillStyle = '#cdd6f0'; x.globalAlpha = 0.55; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(px + 4 + i * 8, y + 4, 1.1, 0, 6.3); x.fill(); } }
    if (c % 2 === 0) stroke(x, [[px + 0.5, py], [px + 0.5, py + T]], ink, 0.4, 1.2);
    if (R() < 0.25) { x.globalAlpha = 0.18; x.fillStyle = '#9fb0e0'; x.fillRect(px + R() * 20, py + R() * 20, 8 + R() * 10, 2); }
  }
};


/* ---------- terrain tiles: each its own material, in the same ink and wash as the mass ---------- */
// base/wash/deep: the body; cap: the walkable top (pale); ink: outline. Colours are mid-tones: terrain reads lighter than the rock beside it, so it is easy to find.
const TER = {
  s: { name: 'salt',  base: '#cfd2c6', wash: ['#f1efe2', '#aeb8bc', '#c9d3d6'], deep: '#8d98a2', ink: '#27303a', cap: '#fbfaf0', capLow: '#b7c0c0' },
  m: { name: 'mud',   base: '#6f563f', wash: ['#84674a', '#523d2d', '#8e7050'], deep: '#33251b', ink: '#1a120c', cap: '#b08d62', capLow: '#7c5f3f' },
  t: { name: 'tar',   base: '#18171a', wash: ['#29272d', '#09090b', '#353139'], deep: '#050506', ink: '#020203', cap: '#d8d1c6', capLow: '#57525a' },
  '>': { name: 'belt', base: '#5b716d', wash: ['#7a928c', '#425651', '#6e8a84'], deep: '#2f403c', ink: '#101a18', cap: '#dce8de', capLow: '#8aa39b' },
  '<': { name: 'belt', base: '#5b716d', wash: ['#7a928c', '#425651', '#6e8a84'], deep: '#2f403c', ink: '#101a18', cap: '#dce8de', capLow: '#8aa39b' },
  j: { name: 'spring', base: '#54605c', wash: ['#74827c', '#3a4642', '#68776f'], deep: '#26302d', ink: '#0f1613', cap: '#f0d675', capLow: '#b0903a' },
  v: { name: 'vent',  base: '#566360', wash: ['#76867f', '#3c4844', '#6a7a73'], deep: '#252e2b', ink: '#0e1513', cap: '#d6e0da', capLow: '#8da097' },
  c: { name: 'crumble', base: '#9a8466', wash: ['#b79f7c', '#7a6549', '#a58f6e'], deep: '#4a3b2a', ink: '#1f160e', cap: '#e8d6a8', capLow: '#a38a5c' }
};
W.TER = TER;
const isMassCh = ch => ch === '#' || !!TER[ch];
function terrainCell(x, E, c, r, ch, solidOnly) {
  const K = TER[ch], X = c * T, Y = r * T, R = mulberry((h2(c, r, E.seed + 41) * 4294967296) | 0), at = E.at;
  const up = !isMassCh(at(c, r - 1)), dn = !isMassCh(at(c, r + 1)), lf = !isMassCh(at(c - 1, r)), rt = !isMassCh(at(c + 1, r));
  x.save();
  const body = new Path2D(); body.rect(X - 0.3, Y - 0.3, T + 0.6, T + 0.6);
  x.fillStyle = K.base; x.fill(body); x.clip(body);
  for (let i = 0; i < 3; i++) { const rr = 14 + R() * 18; x.globalAlpha = 0.3 + R() * 0.22; x.drawImage(blob(K.wash[Math.floor(R() * K.wash.length)]), X + R() * T - rr, Y + R() * T - rr, rr * 2, rr * 2); }
  x.globalAlpha = 0.34; x.drawImage(blob(K.deep), X - 6, Y + T * 0.45, T + 12, T * 0.8);          // a darker pool low in the cell
  x.globalAlpha = 1;
  TERPAT[ch](x, X, Y, R, K, E, c, r);
  // top cap, pale and wobbly, only where the cell is exposed
  if (up) {
    const p = new Path2D(); p.moveTo(X, Y - 0.5);
    for (let i = 1; i <= 4; i++) { const d = wob(X + i * 8, Y, 0); p.lineTo(X + i * 8, Y + d[1] * 0.5 - 0.5); }
    for (let i = 4; i >= 0; i--) { const d = wob(X + i * 8, Y + 6, 1); p.lineTo(X + i * 8, Y + 6 + d[1] * 0.6 + (R() * 1.6)); }
    p.closePath(); x.fillStyle = K.cap; x.globalAlpha = 0.95; x.fill(p);
    x.globalAlpha = 0.5; x.strokeStyle = K.capLow; x.lineWidth = 2.4; x.beginPath(); x.moveTo(X, Y + 6); x.lineTo(X + T, Y + 6); x.stroke();
  }
  x.restore();
  // ink on every exposed edge; a second thin pass so it looks hand-drawn
  x.save(); x.lineCap = 'round'; x.strokeStyle = K.ink; x.globalAlpha = 0.9; x.lineWidth = 2.1;
  x.beginPath();
  const line = (x0, y0, x1, y1) => { const a = wob(x0, y0, 1), b = wob(x1, y1, 1); x.moveTo(x0 + a[0], y0 + a[1]); x.lineTo((x0 + x1) / 2 + (a[0] + b[0]) / 2, (y0 + y1) / 2 + (a[1] + b[1]) / 2); x.lineTo(x1 + b[0], y1 + b[1]); };
  if (up) line(X, Y, X + T, Y); if (dn) line(X, Y + T, X + T, Y + T); if (lf) line(X, Y, X, Y + T); if (rt) line(X + T, Y, X + T, Y + T);
  x.stroke(); x.restore();
}
const TERPAT = {
  s(x, X, Y, R, K) {                       // salt: angular facets, scratches, a dissolving seam
    for (let i = 0; i < 4; i++) { const ax = X + R() * T, ay = Y + 6 + R() * (T - 8), q = [[ax, ay], [ax + 7 + R() * 12, ay + (R() - 0.3) * 8], [ax + 2 + R() * 11, ay + 8 + R() * 10]]; x.globalAlpha = 0.2 + R() * 0.14; x.fillStyle = R() < 0.5 ? '#ffffff' : '#6c7f92'; x.beginPath(); x.moveTo(q[0][0], q[0][1]); x.lineTo(q[1][0], q[1][1]); x.lineTo(q[2][0], q[2][1]); x.closePath(); x.fill(); }
    x.globalAlpha = 0.38; x.strokeStyle = '#46596c'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(X + 5, Y + 12); x.lineTo(X + 13, Y + 17); x.lineTo(X + 9, Y + 25); x.moveTo(X + 22, Y + 8); x.lineTo(X + 18, Y + 19); x.lineTo(X + 27, Y + 24); x.stroke();
    x.globalAlpha = 0.5; x.fillStyle = '#7da4c4'; for (let i = 0; i < 2; i++) { x.beginPath(); x.arc(X + 8 + R() * 16, Y + 22 + R() * 6, 1.2, 0, 6.3); x.fill(); }   // damp specks: it dissolves in water
  },
  m(x, X, Y, R, K) {                       // mud: matte brown with shallow ripple marks
    for (let i = 0; i < 4; i++) { const cx = X + R() * T, cy = Y + 8 + R() * 22, rr = 2 + R() * 4; x.globalAlpha = 0.45; x.fillStyle = '#2a1d14'; x.beginPath(); x.ellipse(cx, cy, rr * 1.6, rr * 0.8, 0, 0, 6.3); x.fill(); x.globalAlpha = 0.28; x.strokeStyle = '#d6b88a'; x.lineWidth = 0.9; x.beginPath(); x.ellipse(cx, cy + 0.8, rr * 1.6, rr * 0.8, 0, 0.3, 2.8); x.stroke(); }
    x.globalAlpha = 0.16; x.strokeStyle = '#b99267'; x.lineWidth = 1.25; x.lineCap = 'round'; for (let i = 0; i < 2; i++) { const yy = Y + 10 + i * 10 + R() * 3; x.beginPath(); x.moveTo(X + 3 + R() * 6, yy); x.quadraticCurveTo(X + 16, yy - 2 - R() * 3, X + 29 - R() * 6, yy + R() * 2); x.stroke(); }
  },
  t(x, X, Y, R, K) {                       // tar: glossy near-black with a hard reflected highlight, bubbles, ember flecks
    x.globalAlpha = 0.5; x.fillStyle = '#9a6a6a'; x.beginPath(); x.ellipse(X + 9 + R() * 6, Y + 9, 7, 2.2, -0.2, 0, 6.3); x.fill();
    x.globalAlpha = 0.34; x.fillStyle = '#e0a27a'; x.beginPath(); x.ellipse(X + 22 + R() * 4, Y + 18 + R() * 6, 4, 1.6, 0.2, 0, 6.3); x.fill();
    for (let i = 0; i < 3; i++) { const cx = X + 4 + R() * 24, cy = Y + 10 + R() * 18, rr = 1.5 + R() * 2.2; x.globalAlpha = 0.5; x.strokeStyle = '#c99a86'; x.lineWidth = 0.9; x.beginPath(); x.arc(cx, cy, rr, 0, 6.3); x.stroke(); }
    x.globalAlpha = 0.7; x.fillStyle = '#e0742c'; for (let i = 0; i < 2; i++) x.fillRect(X + 4 + R() * 24, Y + 14 + R() * 14, 1.6, 1.6);
  },
  '>'(x, X, Y, R, K, E, c, r) { belt(x, X, Y, 1, K); },
  '<'(x, X, Y, R, K, E, c, r) { belt(x, X, Y, -1, K); },
  j(x, X, Y, R, K) {                       // spring: a dark housing, a brass coil, a bright pad
    x.globalAlpha = 0.55; x.fillStyle = K.deep; x.fillRect(X + 3, Y + 9, T - 6, T - 12);
    x.globalAlpha = 1; x.strokeStyle = '#d9b85b'; x.lineWidth = 3; x.lineJoin = 'round'; x.beginPath(); x.moveTo(X + 6, Y + 25); x.lineTo(X + 12, Y + 14); x.lineTo(X + 18, Y + 25); x.lineTo(X + 24, Y + 14); x.lineTo(X + 27, Y + 24); x.stroke();
    x.strokeStyle = '#fff0b0'; x.lineWidth = 1; x.globalAlpha = 0.7; x.beginPath(); x.moveTo(X + 6, Y + 24); x.lineTo(X + 12, Y + 13); x.stroke();
    x.globalAlpha = 1; x.fillStyle = '#f0d070'; x.fillRect(X + 3, Y + 3, T - 6, 5); x.fillStyle = '#fff4c0'; x.fillRect(X + 4, Y + 3.5, T - 8, 1.6);
  },
  v(x, X, Y, R, K) {                       // vent: a grate of dark slots in a pale rim
    x.globalAlpha = 0.6; x.fillStyle = K.deep; x.fillRect(X + 4, Y + 8, T - 8, 17);
    x.globalAlpha = 1; x.fillStyle = '#1c2523'; for (let k = 0; k < 4; k++) x.fillRect(X + 7 + k * 6, Y + 10, 3, 13);
    x.globalAlpha = 0.5; x.fillStyle = '#e6efe9'; for (let k = 0; k < 4; k++) x.fillRect(X + 7 + k * 6, Y + 10, 1, 13);
    x.globalAlpha = 0.8; x.strokeStyle = K.cap; x.lineWidth = 1.4; x.strokeRect(X + 3.5, Y + 7.5, T - 7, 18);
  },
  c(x, X, Y, R, K) {                       // crumble: sandy block with deep cracks
    x.globalAlpha = 0.85; x.strokeStyle = K.ink; x.lineWidth = 1.5; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(X + 4, Y + 9); x.lineTo(X + 13, Y + 16); x.lineTo(X + 9, Y + 27); x.moveTo(X + 28, Y + 7); x.lineTo(X + 20, Y + 15); x.lineTo(X + 25, Y + 28); x.moveTo(X + 13, Y + 16); x.lineTo(X + 21, Y + 21); x.stroke();
    x.globalAlpha = 0.4; x.strokeStyle = '#f6ecc8'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(X + 5, Y + 10); x.lineTo(X + 14, Y + 17); x.moveTo(X + 29, Y + 8); x.lineTo(X + 21, Y + 16); x.stroke();
    x.globalAlpha = 0.5; x.fillStyle = K.deep; for (let i = 0; i < 4; i++) x.fillRect(X + 3 + R() * 26, Y + 18 + R() * 12, 2.4, 1.6);
  }
};
function belt(x, X, Y, d, K) {            // a conveyor: a dark belt strip on rollers with pale chevrons (they slide each frame, see beltFx)
  x.globalAlpha = 0.9; x.fillStyle = '#26332f'; x.fillRect(X, Y + 5, T, 9);
  x.globalAlpha = 0.5; x.fillStyle = '#9db4ac'; for (const rx of [X + 4, X + 16, X + 28]) { x.beginPath(); x.arc(rx, Y + 18, 3, 0, 6.3); x.fill(); }
  x.globalAlpha = 0.85; x.strokeStyle = K.cap; x.lineWidth = 2; x.lineCap = 'round'; x.lineJoin = 'round';
  for (const cx of [X + 8, X + 24]) { x.beginPath(); x.moveTo(cx - d * 3, Y + 7); x.lineTo(cx + d * 2, Y + 9.5); x.lineTo(cx - d * 3, Y + 12); x.stroke(); }
  x.globalAlpha = 0.4; x.strokeStyle = K.ink; x.lineWidth = 1; x.strokeRect(X + 4.5, Y + 21.5, T - 9, 6);
}
// crumble ledge sprite, one per scale (blitted each frame: the ledge comes and goes)
const crumbleSprite = (E, s) => {
  const key = '__c' + s; if (E[key]) return E[key];
  const cv = mk((T + 8) * s, (T + 8) * s), x = cv.getContext('2d'); x.scale(s, s); x.translate(4, 4);
  const Ek = { seed: E.seed, at: () => '.' }; terrainCell(x, Ek, 0, 0, 'c'); W.applyGrain(x, 0.8);
  return E[key] = cv;
};

/* ---------- caps: the walkable top edge ---------- */
const CAPNUB = {                                       // little things growing on the top edge, per material
  stone: (x, px, y, R, K) => { x.fillStyle = '#7f9c4c'; for (let i = 0; i < 2; i++) { const bx = px + R() * 28 + 2, h = 3 + R() * 3; x.beginPath(); x.moveTo(bx - 2, y + 0.5); x.lineTo(bx + (R() - 0.5) * 2, y - h); x.lineTo(bx + 2, y + 0.5); x.fill(); } },
  timber: (x, px, y, R, K) => { x.fillStyle = '#5a3a24'; x.globalAlpha = 0.8; x.fillRect(px + 6 + R() * 6, y + 2.5, 1.6, 1.6); x.fillRect(px + 20 + R() * 6, y + 2.5, 1.6, 1.6); },
  coral: (x, px, y, R, K) => { x.fillStyle = K.capHi; x.strokeStyle = K.ink; x.lineWidth = 1; for (let i = 0; i < 2; i++) { const bx = px + 5 + R() * 22; x.beginPath(); x.arc(bx, y - 0.5, 2 + R() * 1.5, Math.PI, 0); x.fill(); x.stroke(); } },
  salt: (x, px, y, R, K) => { x.fillStyle = '#ffffff'; x.strokeStyle = K.ink; x.lineWidth = 1; for (let i = 0; i < 2; i++) { const bx = px + 4 + R() * 24, h = 3 + R() * 4; x.beginPath(); x.moveTo(bx - 2.5, y + 0.5); x.lineTo(bx + (R() - 0.5) * 2, y - h); x.lineTo(bx + 2.5, y + 0.5); x.closePath(); x.fill(); x.stroke(); } },
  iron: (x, px, y, R, K) => { x.fillStyle = K.trim; x.strokeStyle = K.ink; x.lineWidth = 0.8; for (const dx of [5, 27]) { x.beginPath(); x.arc(px + dx, y + 3, 1.7, 0, 6.3); x.fill(); x.stroke(); } },
  steel: (x, px, y, R, K) => { x.fillStyle = '#8b98c4'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(px + 4 + i * 8, y + 3.2, 1.1, 0, 6.3); x.fill(); } }
};
function drawCap(x, E, c0, c1, r) {
  const K = E.R, xa = c0 * T, xb = (c1 + 1) * T, y = r * T, top = [], bot = [];
  for (let px = xa; px <= xb + 0.01; px += 8) {
    const d = wob(px, y, 0), depth = 6 + vnoise(px * 0.05, r * 3.1, E.seed) * 3 + (h2(Math.floor(px / 8), r, E.seed + 2) < 0.18 ? 3 + h2(Math.floor(px / 8), r, 8) * 4 : 0);
    top.push([px + d[0], y + d[1] - 0.5]); const d2 = wob(px, y + depth, 1); bot.push([px + d2[0], y + depth + d2[1]]);
  }
  const p = new Path2D(); p.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i < top.length; i++) p.lineTo(top[i][0], top[i][1]);
  p.quadraticCurveTo(top[top.length - 1][0] + 2, top[top.length - 1][1] + 4, bot[bot.length - 1][0], bot[bot.length - 1][1]);
  for (let i = bot.length - 2; i >= 0; i--) p.lineTo(bot[i][0], bot[i][1]);
  p.quadraticCurveTo(top[0][0] - 2, top[0][1] + 4, top[0][0], top[0][1]); p.closePath();
  const R = mulberry(strHash(c0 + ':' + r) + E.seed);
  W.wc(x, p, K.cap, { bb: [xa, y, xb - xa, 8], wash: [K.capHi, K.capLow], edge: K.capLow, edgeA: 0.55, edgeW: 4, ink: K.ink, lw: 1.3, blobs: Math.max(2, (c1 - c0 + 1) * 1.5), seed: E.seed + c0 * 7 + r });
  x.save(); x.lineCap = 'round'; x.strokeStyle = K.capHi; x.globalAlpha = 0.9; x.lineWidth = 1.6; x.beginPath(); top.forEach((q, i) => i ? x.lineTo(q[0], q[1] + 1.8) : x.moveTo(q[0], q[1] + 1.8)); x.stroke();
  x.globalAlpha = 1; x.fillStyle = K.cap; x.strokeStyle = K.ink;
  for (let c = c0; c <= c1; c++) { const rr = mulberry(h2(c, r, E.seed + 3) * 1e6 | 0); x.globalAlpha = 1; (CAPNUB[K.mat] || CAPNUB.stone)(x, c * T, y, rr, K); }
  x.restore();
}

/* ---------- chunks ---------- */
const CHC = 16, CHR = 8, MARG = 48;
function buildChunk(E, cx, cy, s) {
  const t0 = performance.now(), K = E.R, px = CHC * T, py = CHR * T;
  const cv = mk((px + 2 * MARG) * s, (py + 2 * MARG) * s), x = cv.getContext('2d');
  x.scale(s, s); x.translate(MARG - cx * px, MARG - cy * py);
  const c0 = Math.max(-1, cx * CHC - 2), c1 = Math.min(E.cols, cx * CHC + CHC + 1), r0 = Math.max(0, cy * CHR - 2), r1 = Math.min(E.rows - 1, cy * CHR + CHR + 1);
  const bx0 = cx * px - MARG, by0 = cy * py - MARG, bx1 = cx * px + px + MARG, by1 = cy * py + py + MARG;
  const inBox = (a, b, w, h) => a < bx1 && a + w > bx0 && b < by1 && b + h > by0;
  const tilesA = W.images[tileSheet(E.region, 'a')], tilesB = W.images[tileSheet(E.region, 'b')], tilesC = W.images[tileSheet(E.region, 'c')];
  // 1. decorations behind the mass (their feet are hidden by the cap)
  for (const d of E.decor) if (inBox(d.x - 60, d.y - 90, 120, 180)) { if (tilesC) imageDecor(x, E, d); else W.decorate(x, E, d); }
  // 2. the mass: one path for every solid cell so there are no seams
  const solids = [], mass = new Path2D(), bound = new Path2D(), pool = new Path2D();
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!E.S(c, r) || c < 0 || c >= E.cols) continue;
    solids.push([c, r]);
    const X = c * T, Y = r * T, P = [], add = (qx, qy) => { const d = wob(qx, qy, 0); P.push([qx + d[0], qy + d[1]]); };
    const edge = (x0, y0, x1, y1, bd) => { add(x0, y0); if (bd) { const pts = [[x0, y0]]; for (let i = 1; i < 4; i++) { add(x0 + (x1 - x0) * i / 4, y0 + (y1 - y0) * i / 4); } for (let i = 0; i < 4; i++) { const a = i === 0 ? [x0, y0] : [x0 + (x1 - x0) * i / 4, y0 + (y1 - y0) * i / 4], b = [x0 + (x1 - x0) * (i + 1) / 4, y0 + (y1 - y0) * (i + 1) / 4], da = wob(a[0], a[1], 0), db = wob(b[0], b[1], 0); bound.moveTo(a[0] + da[0], a[1] + da[1]); bound.lineTo(b[0] + db[0], b[1] + db[1]); pool.moveTo(a[0] + da[0], a[1] + da[1]); pool.lineTo(b[0] + db[0], b[1] + db[1]); } } };
    edge(X, Y, X + T, Y, !E.S(c, r - 1)); edge(X + T, Y, X + T, Y + T, !E.S(c + 1, r)); edge(X + T, Y + T, X, Y + T, !E.S(c, r + 1)); edge(X, Y + T, X, Y, !E.S(c - 1, r));
    mass.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) mass.lineTo(P[i][0], P[i][1]); mass.closePath();
  }
  if (solids.length && !tilesA) {
    x.fillStyle = K.base; x.fill(mass);
    x.globalCompositeOperation = 'source-atop';
    const pattern = PATTERN[K.mat];
    for (const [c, r] of solids) {
      const R = mulberry((h2(c, r, E.seed) * 4294967296) | 0), X = c * T, Y = r * T;
      for (let i = 0; i < 2; i++) { const rr = 16 + R() * 24; x.globalAlpha = 0.2 + R() * 0.2; x.drawImage(blob(K.washes[Math.floor(R() * K.washes.length)]), X + R() * T - rr, Y + R() * T - rr, rr * 2, rr * 2); }
      if (E.S(c - 2, r) && E.S(c + 2, r) && E.S(c, r - 2) && E.S(c, r + 2) && E.S(c - 1, r - 1) && E.S(c + 1, r + 1)) { x.globalAlpha = 0.42; x.drawImage(blob(K.deep), X - 22, Y - 22, T + 44, T + 44); }
      x.globalAlpha = 1; if (pattern) pattern(x, c, r, E, R);
    }
    x.globalAlpha = 0.5; x.strokeStyle = mix(K.base, K.ink, 0.65); x.lineWidth = 9; x.lineJoin = 'round'; x.stroke(pool);            // darker pooled edges
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    // the walkable top edge, a cap on every run of exposed cells
    for (let r = r0; r <= r1; r++) { let c = c0; while (c <= c1) { if (c >= 0 && c < E.cols && E.S(c, r) && !E.S(c, r - 1)) { let e = c; while (e + 1 <= c1 && e + 1 < E.cols && E.S(e + 1, r) && !E.S(e + 1, r - 1)) e++; drawCap(x, E, c, e, r); c = e + 1; } else c++; } }
    // ink outline: two sketchy passes along every exposed edge
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = K.ink; x.globalAlpha = 0.92; x.lineWidth = 2.3; x.stroke(bound);
    const bound2 = new Path2D();
    for (const [c, r] of solids) {
      const X = c * T, Y = r * T;
      for (const [x0, y0, x1, y1, ex] of [[X, Y, X + T, Y, !E.S(c, r - 1)], [X + T, Y, X + T, Y + T, !E.S(c + 1, r)], [X, Y + T, X + T, Y + T, !E.S(c, r + 1)], [X, Y, X, Y + T, !E.S(c - 1, r)]]) {
        if (!ex) continue; for (let i = 0; i < 4; i++) { const a = [x0 + (x1 - x0) * i / 4, y0 + (y1 - y0) * i / 4], b = [x0 + (x1 - x0) * (i + 1) / 4, y0 + (y1 - y0) * (i + 1) / 4], da = wob(a[0], a[1], 1), db = wob(b[0], b[1], 1); bound2.moveTo(a[0] + da[0] * 1.3, a[1] + da[1] * 1.3); bound2.lineTo(b[0] + db[0] * 1.3, b[1] + db[1] * 1.3); }
      }
    }
    x.globalAlpha = 0.5; x.lineWidth = 1; x.stroke(bound2); x.globalAlpha = 1;
  } else if (solids.length && tilesA) imageTiles(x, E, solids, tilesA, tilesB);

  // 2b. terrain cells: salt, mud, tar, conveyors, springs, vents (crumble ledges are blitted per frame, see W.tiles)
  if (!tilesA) for (let r = Math.max(0, r0); r <= r1; r++) for (let c = Math.max(0, c0); c <= Math.min(E.cols - 1, c1); c++) {
    const ch = E.grid[r][c]; if (ch !== 'c' && TER[ch]) terrainCell(x, E, c, r, ch);
  }
  // 3. one-way platforms and spikes
  for (let r = r0; r <= r1; r++) for (let c = Math.max(0, c0); c <= Math.min(E.cols - 1, c1); c++) {
    const ch = E.at(c, r);
    if (ch === '=') { if (E.at(c - 1, r) !== '=' || c === Math.max(0, c0)) { let e = c; while (E.at(e + 1, r) === '=' && e + 1 <= c1) e++; plank(x, E, c, e, r, tilesB); } }
    else if (ch === '^') spikes(x, E, c, r, tilesC);
  }
  if (!tilesA) W.applyGrain(x, 1);
  // 4. hanging decoration is drawn last so it overlaps the ceiling's lower edge
  { const dt = performance.now() - t0; W.stats.chunks++; W.stats.buildMs += dt; if (dt > (W.stats.maxMs || 0)) W.stats.maxMs = dt; }
  return cv;
}

/* ---------- platforms and spikes ---------- */
function plank(x, E, c0, c1, r, tilesB) {
  const K = E.R, xa = c0 * T, xb = (c1 + 1) * T, y = r * T;
  if (tilesB) {
    const mid = W.cell(tileSheet(E.region, 'b'), 'platform'), end = W.cell(tileSheet(E.region, 'b'), 'platformEnd');
    for (let c = c0; c <= c1; c++) { const q = c === c1 && end ? end : mid; if (q) x.drawImage(q.img, q.sx, q.sy, q.sw, q.sh, c * T, y, T, T); }
    return;
  }
  const top = [], bot = [];
  for (let px = xa; px <= xb + 0.01; px += 8) { const d = wob(px, y, 0), d2 = wob(px, y + 10, 1); top.push([px + d[0], y + d[1] - 1]); bot.push([px + d2[0], y + 10 + d2[1]]); }
  const p = new Path2D(); p.moveTo(top[0][0], top[0][1]); for (let i = 1; i < top.length; i++) p.lineTo(top[i][0], top[i][1]);
  for (let i = bot.length - 1; i >= 0; i--) p.lineTo(bot[i][0], bot[i][1]); p.closePath();
  // supports first (a thin bracket every 48 px, so the platform reads as a plank on struts, not a wall)
  x.save(); x.strokeStyle = K.ink; x.fillStyle = K.plankLow; x.lineWidth = 1.4;
  for (let px = xa + 6; px < xb - 4; px += 44) { x.beginPath(); x.moveTo(px, y + 9); x.lineTo(px + 8, y + 9); x.lineTo(px + 4, y + 17); x.closePath(); x.globalAlpha = 0.9; x.fill(); x.stroke(); }
  x.restore();
  W.wc(x, p, K.plank, { bb: [xa, y - 1, xb - xa, 11], wash: [mix(K.plank, '#ffffff', 0.3), K.plankLow], edge: K.plankLow, edgeA: 0.7, edgeW: 6, ink: K.ink, lw: 1.6, blobs: (c1 - c0 + 1) * 1.5, seed: E.seed + c0 + r * 5 });
  x.save(); x.strokeStyle = mix(K.plank, '#ffffff', 0.55); x.lineWidth = 1.4; x.lineCap = 'round'; x.beginPath(); top.forEach((q, i) => i ? x.lineTo(q[0], q[1] + 1.8) : x.moveTo(q[0], q[1] + 1.8)); x.stroke();
  x.fillStyle = K.ink; x.globalAlpha = 0.7; for (let px = xa + 6; px < xb; px += 16) { x.beginPath(); x.arc(px, y + 5.5, 1, 0, 6.3); x.fill(); }
  x.restore();
}
function spikes(x, E, c, r, tilesC) {
  const X = c * T, Y = r * T, q = tilesC && W.cell(tileSheet(E.region, 'c'), 'spikes');
  if (q) { x.drawImage(q.img, q.sx, q.sy, q.sw, q.sh, X, Y, T, T); return; }
  const R = mulberry(h2(c, r, E.seed + 31) * 1e6 | 0), K = E.R;
  // a dark rusted rail, a stain on the stone, then four tall bone-white spikes (the whole tile is the hazard, so the spikes fill it)
  x.save();
  x.globalAlpha = 0.45; x.fillStyle = '#7a2a22'; x.beginPath(); x.ellipse(X + 16, Y + 29, 18, 5, 0, 0, 6.3); x.fill(); x.globalAlpha = 1;
  const rail = W.rect(X - 0.5, Y + 26, T + 1, 6, E.seed + c, 0.5);
  W.wc(x, rail, '#5a3028', { bb: [X, Y + 26, T, 6], edge: '#2a1410', ink: K.ink, lw: 1.4, blobs: 2, seed: c + r });
  for (let i = 0; i < 4; i++) {
    const bx = X + i * 8, tip = Y + 3 + R() * 3, lean = (R() - 0.5) * 1.6, mid = bx + 4 + lean;
    const left = W.poly([[bx + 0.5, Y + 28], [mid, tip], [mid + 0.4, Y + 28]], 0.25, c * 9 + i + r * 3), right = W.poly([[mid, tip], [bx + 7.5, Y + 28], [mid + 0.4, Y + 28]], 0.25, c * 9 + i + 40 + r * 3);
    x.fillStyle = '#fbf7e4'; x.fill(left); x.fillStyle = '#d9d0b0'; x.fill(right);
    x.strokeStyle = K.ink; x.lineWidth = 1.5; x.lineJoin = 'round'; x.globalAlpha = 0.95; x.beginPath(); x.moveTo(bx + 0.5, Y + 28); x.lineTo(mid, tip); x.lineTo(bx + 7.5, Y + 28); x.stroke(); x.globalAlpha = 1;
    x.strokeStyle = '#ffffff'; x.lineWidth = 1; x.globalAlpha = 0.8; x.beginPath(); x.moveTo(mid - 0.8, tip + 4); x.lineTo(mid - 0.2, tip + 11); x.stroke(); x.globalAlpha = 1;
  }
  x.restore();
}

/* ---------- painted tile images (the owner's art) ---------- */
function imageTiles(x, E, solids, A, B) {
  const a = n => W.cell(tileSheet(E.region, 'a'), n), b = n => B ? W.cell(tileSheet(E.region, 'b'), n) : null;
  const put = (q, c, r, flip) => { if (!q) return false; x.save(); x.translate(c * T + (flip ? T : 0), r * T); if (flip) x.scale(-1, 1); x.drawImage(q.img, q.sx, q.sy, q.sw, q.sh, 0, 0, T, T); x.restore(); return true; };
  for (const [c, r] of solids) {
    const up = !E.S(c, r - 1), dn = !E.S(c, r + 1), lf = !E.S(c - 1, r), rt = !E.S(c + 1, r);
    let q;
    if (up) q = lf ? b('cornerTopLeft') : rt ? b('cornerTopRight') : null, q = q || a(h2(c, r, 7) < 0.5 ? 'floor' : 'floor2') || a('floor');
    else if (dn) q = a('ceiling');
    else if (lf) q = a('wallLeft'); else if (rt) q = a('wallRight');
    else if (b('innerTopLeft') && !E.S(c - 1, r - 1)) q = b('innerTopLeft'); else if (b('innerTopRight') && !E.S(c + 1, r - 1)) q = b('innerTopRight');
    put(q || a('wall'), c, r);
  }
}
function imageDecor(x, E, d) {
  const names = ['deco1', 'deco2', 'deco3', 'deco4', 'deco5'], q = W.cell(tileSheet(E.region, 'c'), names[d.seed % 5]);
  if (!q || d.hang) return;
  const h = q.hook.decoH || 56, w = h * q.sw / q.sh; x.drawImage(q.img, q.sx, q.sy, q.sw, q.sh, d.x - w / 2, d.y - h + 4, w, h);
}

/* ---------- decorations drawn in code ---------- */
const glowSprites = {};
const glow = col => glowSprites[col] || (glowSprites[col] = (() => { const c = mk(96, 96), x = c.getContext('2d'), g = x.createRadialGradient(48, 48, 0, 48, 48, 48), p = rgb(col); g.addColorStop(0, 'rgba(' + p + ',0.85)'); g.addColorStop(0.35, 'rgba(' + p + ',0.32)'); g.addColorStop(1, 'rgba(' + p + ',0)'); x.fillStyle = g; x.fillRect(0, 0, 96, 96); return c; })());
W.glow = glow;
const lampAt = (E, d, x, y, r, col) => { if (!E.lamps.some(l => l.x === x && l.y === y)) E.lamps.push({ x, y, r, col: col || '#f2b45a', seed: d.seed }); };
const ink = K => K.ink;
const DECO = {
  // junction
  lamp(x, E, d) { const K = E.R, X = d.x, Y = d.y + 3; W.wc(x, W.rect(X - 1.6, Y - 62, 3.2, 62, d.seed, 0.3), '#6a5a3c', { bb: [X - 2, Y - 62, 4, 62], edge: '#2a2216', ink: K.ink, lw: 1.2, blobs: 2 });
    W.wc(x, W.poly([[X - 6, Y - 64], [X + 6, Y - 64], [X + 7, Y - 74], [X, Y - 80], [X - 7, Y - 74]], 0.4, d.seed + 1), '#d9a84a', { bb: [X - 7, Y - 80, 14, 16], wash: ['#f6dc8a', '#b07a2a'], edge: '#7a4c18', ink: K.ink, lw: 1.3, blobs: 3 });
    x.fillStyle = '#fff2b8'; x.beginPath(); x.ellipse(X, Y - 71, 2.6, 4, 0, 0, 6.3); x.fill(); lampAt(E, d, X, Y - 71, 70); },
  moss(x, E, d) { const X = d.x, Y = d.y + 2; for (let i = 0; i < 4; i++) { const rr = 5 + h2(i, d.seed, 1) * 6; W.wc(x, W.ell(X - 12 + i * 8, Y - rr * 0.5, rr, rr * 0.7, d.seed + i, 0.6), i % 2 ? '#6f8e4c' : '#86a35a', { bb: [X - 20 + i * 8, Y - rr, rr * 2, rr], wash: ['#a8c070', '#4c6a36'], edge: '#34502a', ink: false, blobs: 2 }); } },
  rail(x, E, d) { const K = E.R, X = d.x, Y = d.y; for (let i = -1; i <= 1; i++) W.wc(x, W.rect(X - 4 + i * 18, Y - 3, 8, 4, d.seed + i, 0.3), '#5a4630', { flat: true, ink: K.ink, lw: 1 });
    W.wc(x, W.rect(X - 30, Y - 6, 60, 3.2, d.seed, 0.3), '#c8a65a', { bb: [X - 30, Y - 6, 60, 3.2], wash: ['#f0d890', '#8a6a2c'], edge: '#6a4c1c', ink: K.ink, lw: 1.1, blobs: 2 }); },
  stones(x, E, d) { const K = E.R, X = d.x, Y = d.y; for (let i = 0; i < 3; i++) { const rr = 3 + h2(i, d.seed, 2) * 4; W.wc(x, W.ell(X - 12 + i * 12, Y - rr * 0.5 + 1, rr, rr * 0.75, d.seed + i, 0.5), '#8d9a86', { bb: [X - 16 + i * 12, Y - rr, rr * 2, rr], wash: ['#b3bba6', '#5d6b5c'], edge: '#3a463a', ink: K.ink, lw: 1.1, blobs: 2 }); } },
  cable(x, E, d) { const K = E.R, X = d.x, Y = d.y; x.strokeStyle = '#2d2a22'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(X - 14, Y - 2); x.quadraticCurveTo(X, Y + 22 + (d.seed % 14), X + 40, Y - 3); x.stroke(); },
  lampHang(x, E, d) { const K = E.R, X = d.x, L = 26 + (d.seed % 20), Y = d.y; x.strokeStyle = K.ink; x.lineWidth = 1.4; x.beginPath(); x.moveTo(X, Y - 2); x.lineTo(X, Y + L); x.stroke();
    W.wc(x, W.poly([[X - 6, Y + L], [X + 6, Y + L], [X + 7, Y + L + 12], [X - 7, Y + L + 12]], 0.4, d.seed), '#d9a84a', { bb: [X - 7, Y + L, 14, 12], wash: ['#f6dc8a', '#b07a2a'], edge: '#7a4c18', ink: K.ink, lw: 1.2, blobs: 2 }); lampAt(E, d, X, Y + L + 6, 62); },
  // quay
  crate(x, E, d) { const K = E.R, X = d.x, Y = d.y + 1, w = 16 + (d.seed % 3) * 4, h = 14 + (d.seed % 2) * 4; W.wc(x, W.rect(X - w / 2, Y - h, w, h, d.seed, 0.5), '#9a7448', { bb: [X - w / 2, Y - h, w, h], wash: ['#c09860', '#6a4a2c'], edge: '#3c2814', ink: K.ink, lw: 1.4, blobs: 3 });
    x.strokeStyle = K.ink; x.globalAlpha = 0.6; x.lineWidth = 1.1; x.beginPath(); x.moveTo(X - w / 2, Y - h); x.lineTo(X + w / 2, Y); x.moveTo(X + w / 2, Y - h); x.lineTo(X - w / 2, Y); x.stroke(); x.globalAlpha = 1; },
  coil(x, E, d) { const K = E.R, X = d.x, Y = d.y; for (let i = 0; i < 3; i++) { x.strokeStyle = i % 2 ? '#b89a68' : '#d0b680'; x.lineWidth = 3.4; x.beginPath(); x.ellipse(X, Y - 3 - i * 3, 11 - i, 4, 0, 0, 6.3); x.stroke(); } x.strokeStyle = K.ink; x.lineWidth = 1; x.globalAlpha = 0.7; x.beginPath(); x.ellipse(X, Y - 3, 12.5, 5.6, 0, 0, 6.3); x.stroke(); x.globalAlpha = 1; },
  barnacle(x, E, d) { const K = E.R, X = d.x, Y = d.y + 1; for (let i = 0; i < 5; i++) { const rr = 2 + h2(i, d.seed, 3) * 2.6, bx = X - 14 + i * 7; W.wc(x, W.poly([[bx - rr, Y], [bx - rr * 0.5, Y - rr * 1.6], [bx + rr * 0.5, Y - rr * 1.6], [bx + rr, Y]], 0.2, d.seed + i), '#d9d0b8', { bb: [bx - rr, Y - rr * 1.6, rr * 2, rr * 1.6], edge: '#7a6c50', ink: K.ink, lw: 1, blobs: 1 }); } },
  rib(x, E, d) { const K = E.R, X = d.x, Y = d.y + 2; x.save(); x.lineCap = 'round'; for (const [w, col] of [[7, K.ink], [4.6, '#cbb890']]) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(X - 14, Y); x.quadraticCurveTo(X - 12, Y - 34, X + 12, Y - 40); x.stroke(); } x.restore(); },
  chain(x, E, d) { const K = E.R, X = d.x, L = 20 + (d.seed % 40), Y = d.y; for (let y = Y - 2, i = 0; y < Y + L; y += 6.5, i++) { x.strokeStyle = K.ink; x.lineWidth = 2.6; x.beginPath(); if (i % 2) x.ellipse(X, y + 3, 1.2, 3.4, 0, 0, 6.3); else x.ellipse(X, y + 3, 3, 3.4, 0, 0, 6.3); x.stroke(); x.strokeStyle = '#a99070'; x.lineWidth = 1.1; x.stroke(); } },
  net(x, E, d) { const K = E.R, X = d.x, Y = d.y; x.strokeStyle = '#8a7656'; x.lineWidth = 1.1; x.globalAlpha = 0.85; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(X + i * 8, Y); x.quadraticCurveTo(X + i * 10, Y + 16, X + i * 6, Y + 28 + (i & 1) * 6); x.stroke(); } for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(X - 18, Y + k * 7); x.quadraticCurveTo(X, Y + k * 7 + 6, X + 18, Y + k * 7); x.stroke(); } x.globalAlpha = 1; },
  // reef
  fan(x, E, d) { const K = E.R, X = d.x, Y = d.y + 2, h = 28 + (d.seed % 14); x.save(); for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.28; x.strokeStyle = i % 2 ? '#b89cd0' : '#d6bde8'; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + Math.cos(a) * h * 0.5 + i * 2, Y + Math.sin(a) * h * 0.6, X + Math.cos(a) * h, Y + Math.sin(a) * h); x.stroke(); }
    x.strokeStyle = K.ink; x.globalAlpha = 0.5; x.lineWidth = 1; x.beginPath(); x.moveTo(X - 6, Y); x.lineTo(X, Y - h); x.lineTo(X + 6, Y); x.stroke(); x.restore(); },
  branch(x, E, d) { const K = E.R, X = d.x, Y = d.y + 2, h = 22 + (d.seed % 18); x.save(); x.lineCap = 'round'; for (const [w, col] of [[6.6, K.ink], [4, '#c9a9c8']]) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + 2, Y - h); x.moveTo(X + 1, Y - h * 0.5); x.lineTo(X + 11, Y - h * 0.9); x.moveTo(X + 1.6, Y - h * 0.7); x.lineTo(X - 8, Y - h * 1.1); x.stroke(); } x.restore(); },
  polyp(x, E, d) { const K = E.R, X = d.x, Y = d.y + 1; for (let i = 0; i < 4; i++) { const bx = X - 12 + i * 8, rr = 3 + h2(i, d.seed, 3) * 3; W.wc(x, W.ell(bx, Y - rr, rr, rr * 1.1, d.seed + i), i % 2 ? '#d6a2b8' : '#c8b0e0', { bb: [bx - rr, Y - rr * 2, rr * 2, rr * 2], edge: '#6a4a78', ink: K.ink, lw: 1.1, blobs: 1 }); } },
  tendril(x, E, d) { const K = E.R, X = d.x, Y = d.y; x.strokeStyle = '#8a76a6'; x.lineWidth = 2.4; x.lineCap = 'round'; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(X + i * 6, Y - 2); x.quadraticCurveTo(X + i * 9, Y + 12, X + i * 5, Y + 20 + (d.seed + i * 3) % 12); x.stroke(); } },
  // cutting
  crystal(x, E, d) { const K = E.R, X = d.x, Y = d.y + 2; for (let i = 0; i < 4; i++) { const h = 10 + h2(i, d.seed, 4) * 24, w = 4 + h2(i, d.seed, 5) * 4, bx = X - 14 + i * 9 + (h2(i, d.seed, 6) - 0.5) * 4, lean = (h2(i, d.seed, 7) - 0.5) * 6;
      W.wc(x, W.poly([[bx - w, Y], [bx - w * 0.4 + lean, Y - h], [bx + w * 0.4 + lean, Y - h + 3], [bx + w, Y]], 0.3, d.seed + i), '#dbe8f2', { bb: [bx - w, Y - h, w * 2, h], wash: ['#ffffff', '#9fb6cc'], edge: '#5a7490', ink: K.ink, lw: 1.3, blobs: 2 }); } },
  sleeper(x, E, d) { const K = E.R, X = d.x, Y = d.y; for (let i = -1; i <= 1; i++) W.wc(x, W.rect(X - 5 + i * 20, Y - 4, 10, 4.5, d.seed + i, 0.3), '#8d7c68', { flat: true, ink: K.ink, lw: 1 }); W.wc(x, W.rect(X - 34, Y - 8, 68, 3.4, d.seed, 0.3), '#b8c2cc', { bb: [X - 34, Y - 8, 68, 4], wash: ['#eef2f6', '#7a8794'], edge: '#4a5864', ink: K.ink, lw: 1.1, blobs: 2 }); },
  pile(x, E, d) { const K = E.R, X = d.x, Y = d.y + 1; W.wc(x, W.poly([[X - 18, Y], [X - 8, Y - 8], [X, Y - 12], [X + 9, Y - 7], [X + 18, Y]], 0.8, d.seed, true), '#e8eef2', { bb: [X - 18, Y - 12, 36, 12], wash: ['#ffffff', '#a3b4c2'], edge: '#6a8098', ink: K.ink, lw: 1.2, blobs: 3 }); },
  drip(x, E, d) { const K = E.R, X = d.x, Y = d.y, L = 16 + (d.seed % 26); x.fillStyle = '#d9e8f2'; x.strokeStyle = K.ink; x.lineWidth = 1; x.beginPath(); x.moveTo(X - 2.5, Y - 2); x.lineTo(X, Y + L - 4); x.lineTo(X + 2.5, Y - 2); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#bfe0f0'; x.beginPath(); x.ellipse(X, Y + L, 1.9, 2.6, 0, 0, 6.3); x.fill(); x.stroke(); },
  stalactite(x, E, d) { const K = E.R, X = d.x, Y = d.y, L = 16 + (d.seed % 24); W.wc(x, W.poly([[X - 8, Y - 2], [X + 8, Y - 2], [X + 2, Y + L], [X - 1, Y + L + 4]], 0.4, d.seed), '#e3edf4', { bb: [X - 8, Y, 16, L], wash: ['#ffffff', '#9fb6cc'], edge: '#5a7490', ink: K.ink, lw: 1.3, blobs: 2 }); },
  // hall
  clock(x, E, d) { const K = E.R, X = d.x, Y = d.y; W.wc(x, W.rect(X - 2, Y - 48, 4, 48, d.seed, 0.3), '#2e3e34', { flat: true, ink: K.ink, lw: 1.2 });
    W.wc(x, W.ell(X, Y - 56, 14, 14, d.seed), '#e6dcb4', { bb: [X - 14, Y - 70, 28, 28], wash: ['#fff6d0', '#b8a870'], edge: '#7a6428', ink: K.ink, lw: 1.8, blobs: 3 });
    x.strokeStyle = K.ink; x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y - 56); x.lineTo(X + 1, Y - 65); x.moveTo(X, Y - 56); x.lineTo(X + 7, Y - 53); x.stroke();
    x.strokeStyle = '#a8892f'; x.lineWidth = 2; x.globalAlpha = 0.9; x.beginPath(); x.ellipse(X, Y - 56, 14, 14, 0, 0, 6.3); x.stroke(); x.globalAlpha = 1; },
  booth(x, E, d) { const K = E.R, X = d.x, Y = d.y; W.wc(x, W.rect(X - 15, Y - 34, 30, 34, d.seed, 0.4), '#2f4a3c', { bb: [X - 15, Y - 34, 30, 34], wash: ['#4a6e58', '#1d3026'], edge: '#0f1c15', ink: K.ink, lw: 1.5, blobs: 3 });
    W.wc(x, W.rect(X - 10, Y - 28, 20, 11, d.seed + 1, 0.3), '#d9c47a', { bb: [X - 10, Y - 28, 20, 11], wash: ['#f6e6a0', '#a8892f'], edge: '#6a5420', ink: K.ink, lw: 1.1, blobs: 1 }); W.wc(x, W.rect(X - 18, Y - 38, 36, 5, d.seed + 2, 0.3), '#d4b25c', { flat: true, ink: K.ink, lw: 1.3 }); },
  bench(x, E, d) { const K = E.R, X = d.x, Y = d.y; W.wc(x, W.rect(X - 18, Y - 12, 36, 4, d.seed, 0.3), '#8a6a3c', { flat: true, ink: K.ink, lw: 1.2 }); W.wc(x, W.rect(X - 17, Y - 22, 34, 3.4, d.seed + 1, 0.3), '#8a6a3c', { flat: true, ink: K.ink, lw: 1.1 }); x.fillStyle = K.ink; x.fillRect(X - 15, Y - 9, 3, 9); x.fillRect(X + 12, Y - 9, 3, 9); x.fillRect(X - 15, Y - 22, 2.4, 10); x.fillRect(X + 13, Y - 22, 2.4, 10); },
  brassLamp(x, E, d) { const K = E.R, X = d.x, Y = d.y; if (d.hang) { x.strokeStyle = K.ink; x.lineWidth = 1.4; x.beginPath(); x.moveTo(X, Y - 2); x.lineTo(X, Y + 20); x.stroke(); W.wc(x, W.poly([[X - 7, Y + 20], [X + 7, Y + 20], [X + 5, Y + 32], [X - 5, Y + 32]], 0.4, d.seed), '#d8bd72', { bb: [X - 7, Y + 20, 14, 12], wash: ['#fbe9a2', '#97813c'], edge: '#6a5420', ink: K.ink, lw: 1.2, blobs: 2 }); lampAt(E, d, X, Y + 26, 66, '#e8c070'); return; }
    W.wc(x, W.rect(X - 1.6, Y - 38, 3.2, 38, d.seed, 0.3), '#8a7438', { flat: true, ink: K.ink, lw: 1.1 }); W.wc(x, W.poly([[X - 7, Y - 40], [X + 7, Y - 40], [X + 5, Y - 52], [X - 5, Y - 52]], 0.4, d.seed + 1), '#d8bd72', { bb: [X - 7, Y - 52, 14, 12], wash: ['#fbe9a2', '#97813c'], edge: '#6a5420', ink: K.ink, lw: 1.2, blobs: 2 }); lampAt(E, d, X, Y - 46, 62, '#e8c070'); },
  trunkpile(x, E, d) { const K = E.R, X = d.x, Y = d.y; W.wc(x, W.rect(X - 14, Y - 14, 28, 14, d.seed, 0.4), '#7a5a3a', { bb: [X - 14, Y - 14, 28, 14], wash: ['#9a7a52', '#4a3420'], edge: '#2a1a0c', ink: K.ink, lw: 1.4, blobs: 3 }); W.wc(x, W.rect(X - 10, Y - 24, 20, 10, d.seed + 3, 0.4), '#566a54', { bb: [X - 10, Y - 24, 20, 10], wash: ['#72886c', '#34463a'], edge: '#1c2a20', ink: K.ink, lw: 1.3, blobs: 2 }); x.fillStyle = '#d4b25c'; x.fillRect(X - 14, Y - 8, 28, 1.6); x.fillRect(X - 10, Y - 19, 20, 1.6); },
  chandelier(x, E, d) { const K = E.R, X = d.x, Y = d.y, L = 18 + (d.seed % 14); x.strokeStyle = K.ink; x.lineWidth = 1.5; x.beginPath(); x.moveTo(X, Y - 2); x.lineTo(X, Y + L); x.stroke(); W.wc(x, W.poly([[X - 16, Y + L + 6], [X, Y + L], [X + 16, Y + L + 6], [X + 12, Y + L + 9], [X - 12, Y + L + 9]], 0.3, d.seed), '#d4b25c', { bb: [X - 16, Y + L, 32, 9], wash: ['#fbe9a2', '#97813c'], edge: '#6a5420', ink: K.ink, lw: 1.3, blobs: 2 }); for (const dx of [-12, 0, 12]) { x.fillStyle = '#fff0b0'; x.beginPath(); x.ellipse(X + dx, Y + L + 3, 1.8, 2.8, 0, 0, 6.3); x.fill(); } lampAt(E, d, X, Y + L + 8, 70, '#e8c070'); },
  // terminus
  pipe(x, E, d) { const K = E.R, X = d.x, Y = d.y, h = 20 + (d.seed % 24); W.wc(x, W.rect(X - 5, Y - h, 10, h, d.seed, 0.3), '#7480b0', { bb: [X - 5, Y - h, 10, h], wash: ['#a8b4e0', '#464e80'], edge: '#262b52', ink: K.ink, lw: 1.5, blobs: 2 }); W.wc(x, W.rect(X - 7.5, Y - h - 2, 15, 5, d.seed + 1, 0.3), '#c9b878', { flat: true, ink: K.ink, lw: 1.2 }); W.wc(x, W.rect(X - 7.5, Y - 5, 15, 5, d.seed + 2, 0.3), '#c9b878', { flat: true, ink: K.ink, lw: 1.2 }); },
  gauge(x, E, d) { const K = E.R, X = d.x, Y = d.y; W.wc(x, W.rect(X - 1.6, Y - 28, 3.2, 28, d.seed, 0.3), '#4a527c', { flat: true, ink: K.ink, lw: 1.1 }); W.wc(x, W.ell(X, Y - 36, 11, 11, d.seed), '#e2e6f2', { bb: [X - 11, Y - 47, 22, 22], wash: ['#ffffff', '#9aa6cc'], edge: '#4a527c', ink: K.ink, lw: 1.7, blobs: 2 });
    x.strokeStyle = K.ink; x.lineWidth = 1.5; x.lineCap = 'round'; const a = -0.6 + (d.seed % 20) / 10; x.beginPath(); x.moveTo(X, Y - 36); x.lineTo(X + Math.cos(a) * 8, Y - 36 + Math.sin(a) * 8); x.stroke(); },
  buffer(x, E, d) { const K = E.R, X = d.x, Y = d.y; W.wc(x, W.rect(X - 4, Y - 18, 8, 18, d.seed, 0.3), '#5a6290', { flat: true, ink: K.ink, lw: 1.3 }); W.wc(x, W.rect(X - 12, Y - 28, 24, 10, d.seed + 1, 0.4), '#c9b878', { bb: [X - 12, Y - 28, 24, 10], wash: ['#efdf9c', '#8a7a3c'], edge: '#5a4c20', ink: K.ink, lw: 1.5, blobs: 2 }); },
  steam(x, E, d) { const K = E.R, X = d.x, Y = d.y; W.wc(x, W.rect(X - 6, Y - 10, 12, 10, d.seed, 0.3), '#7480b0', { flat: true, ink: K.ink, lw: 1.3 }); for (let i = 0; i < 4; i++) { x.globalAlpha = 0.5 - i * 0.08; x.drawImage(blob('#e8ecf8'), X - 9 - i * 2 + (i & 1) * 6, Y - 22 - i * 11, 20 + i * 5, 20 + i * 5); } x.globalAlpha = 1; },
  pipeHang(x, E, d) { const K = E.R, X = d.x, Y = d.y, L = 14 + (d.seed % 26); W.wc(x, W.rect(X - 4.5, Y - 2, 9, L + 2, d.seed, 0.3), '#7480b0', { bb: [X - 5, Y, 10, L], wash: ['#a8b4e0', '#464e80'], edge: '#262b52', ink: K.ink, lw: 1.4, blobs: 2 }); W.wc(x, W.rect(X - 7, Y + L - 4, 14, 5, d.seed + 1, 0.3), '#c9b878', { flat: true, ink: K.ink, lw: 1.2 }); },
  valve(x, E, d) { const K = E.R, X = d.x, Y = d.y; x.strokeStyle = K.ink; x.lineWidth = 3.6; x.beginPath(); x.moveTo(X, Y - 2); x.lineTo(X, Y + 14); x.stroke(); x.strokeStyle = '#7480b0'; x.lineWidth = 1.8; x.stroke(); W.wc(x, W.ell(X, Y + 18, 9, 9, d.seed), '#c9b878', { bb: [X - 9, Y + 9, 18, 18], wash: ['#efdf9c', '#8a7a3c'], edge: '#5a4c20', ink: K.ink, lw: 1.5, blobs: 2 }); x.strokeStyle = K.ink; x.lineWidth = 1.3; x.beginPath(); x.moveTo(X - 9, Y + 18); x.lineTo(X + 9, Y + 18); x.moveTo(X, Y + 9); x.lineTo(X, Y + 27); x.stroke(); }
};
W.decorate = (x, E, d) => { const f = DECO[d.kind]; if (f) { x.save(); f(x, E, d); x.restore(); } };
W.DECO = DECO;

/* ---------- drawing the tiles of the current room (called by art.tiles) ---------- */
let frameNo = 0;
// Build the chunks of the view (and the ring around it) of the room just entered, at the camera it starts with. Called from rooms.enter, which runs under the
// room fade, so the cost lands there and the first drawn frame finds them cached (the playtest's 128 to 302 ms frames). Returns the chunks built.
W.prewarm = () => {
  const room = G.rooms && G.rooms.current; if (!room || !G.tiles || !G.tiles.grid || (G.artTest === false)) return 0;
  const E = cacheFor(room.region); if (!E) return 0;
  const v = G.view, sc = v ? Math.max(v.scale || 1, v.sy || 1) : 1, s = Math.max(1, Math.min(2, Math.ceil(sc - 0.01)));
  const px = CHC * T, py = CHR * T, cam = G.cam || { x: 0, y: 0 };
  const cx0 = Math.max(0, Math.floor((cam.x - 8) / px) - 1), cx1 = Math.floor((cam.x + C.W + 8) / px) + 1, cy0 = Math.max(0, Math.floor((cam.y - 8) / py) - 1), cy1 = Math.floor((cam.y + C.H + 8) / py) + 1;
  const maxCx = Math.floor((E.cols * T) / px), maxCy = Math.floor((E.rows * T) / py); let n = 0;
  for (let cy = cy0; cy <= Math.min(cy1, maxCy); cy++) for (let cx = cx0; cx <= Math.min(cx1, maxCx); cx++) {
    const key = cx + ',' + cy + ',' + s;
    if (!E.chunks.has(key)) { E.chunks.set(key, hasSolid(E, cx, cy) ? buildChunk(E, cx, cy, s) : null); n++; }
  }
  return n;
};
W.tiles = (ctx, pal) => {
  const tl = G.tiles, room = G.rooms && G.rooms.current, region = room ? room.region : 'hub', E = cacheFor(region);
  if (!E) return false;
  const tr = ctx.getTransform ? ctx.getTransform() : null, s = tr ? Math.max(1, Math.min(2, Math.ceil(Math.max(Math.abs(tr.a), Math.abs(tr.b)) - 0.01))) : 1;
  const px = CHC * T, py = CHR * T, cam = G.cam || { x: 0, y: 0 };
  const cx0 = Math.max(0, Math.floor((cam.x - 8) / px)), cx1 = Math.floor((cam.x + C.W + 8) / px), cy0 = Math.max(0, Math.floor((cam.y - 8) / py)), cy1 = Math.floor((cam.y + C.H + 8) / py);
  const maxCx = Math.floor((E.cols * T) / px), maxCy = Math.floor((E.rows * T) / py);
  for (let cy = cy0; cy <= Math.min(cy1, maxCy); cy++) for (let cx = cx0; cx <= Math.min(cx1, maxCx); cx++) {
    const key = cx + ',' + cy + ',' + s; let cv = E.chunks.get(key);
    if (cv === undefined) { cv = hasSolid(E, cx, cy) ? buildChunk(E, cx, cy, s) : null; E.chunks.set(key, cv); }
    if (cv) ctx.drawImage(cv, MARG * s, MARG * s, px * s, py * s, cx * px, cy * py, px, py);
  }
  // one more chunk of the ring around the view per frame, so scrolling never has to build a whole screen at once
  if ((++frameNo & 1) === 0) {
    outer: for (let cy = cy0 - 1; cy <= Math.min(cy1 + 1, maxCy); cy++) for (let cx = cx0 - 1; cx <= Math.min(cx1 + 1, maxCx); cx++) {
      if (cx < 0 || cy < 0) continue; const key = cx + ',' + cy + ',' + s;
      if (!E.chunks.has(key)) { E.chunks.set(key, hasSolid(E, cx, cy) ? buildChunk(E, cx, cy, s) : null); break outer; }
    }
  }
  // repaint at most one stale chunk per frame (tar burnt, salt dissolved)
  if (E.dirty && E.dirty.size) { const k = E.dirty.values().next().value; E.dirty.delete(k); const q = k.split(',').map(Number); if (q[2] === s) E.chunks.set(k, hasSolid(E, q[0], q[1]) ? buildChunk(E, q[0], q[1], s) : null); else E.chunks.delete(k); }
  dynamic(ctx, E, s, cam);
  // lamps glow warm, with a slow flicker (one cached sprite each, additive)
  if (E.lamps.length) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const l of E.lamps) {
      if (l.x < cam.x - l.r || l.x > cam.x + C.W + l.r || l.y < cam.y - l.r || l.y > cam.y + C.H + l.r) continue;
      const k = 0.2 + 0.06 * Math.sin(G.time * 2.3 + l.seed) + 0.03 * Math.sin(G.time * 7.1 + l.seed * 3); ctx.globalAlpha = k; ctx.drawImage(glow(l.col), l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.restore();
  }
  W.blockers(ctx, E, pal);
  return true;
};
W.tilesOn = () => !!(G.tiles && G.tiles.grid);
// Moving terrain, a few cells at most on screen: crumble ledges (fade while they warn, vanish when gone), conveyor chevrons, steam from active vents.
function dynamic(ctx, E, s, cam) {
  const x0 = cam.x - T, x1 = cam.x + C.W + T, y0 = cam.y - T, y1 = cam.y + C.H + T, tl = G.tiles, t = G.time;
  for (const [c, r] of E.dyn.c) {
    const X = c * T, Y = r * T; if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
    if (tl.at(c, r) !== 'c' || tl.crumbleGone(c, r)) continue;
    const st = tl.crumbleState(c, r), warn = st && st.phase === 'warn', j = warn ? Math.sin(t * 90 + c) * 0.9 : 0;
    ctx.globalAlpha = warn ? 0.55 + 0.35 * Math.abs(Math.sin(t * 24)) : 1;
    ctx.drawImage(crumbleSprite(E, s), X - 4 + j, Y - 4, T + 8, T + 8);
  }
  ctx.globalAlpha = 1;
  if (E.dyn.belt.length) {
    ctx.save(); ctx.fillStyle = '#e8f2e6';
    for (const [c, r, d] of E.dyn.belt) {
      const X = c * T, Y = r * T; if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
      ctx.globalAlpha = 0.5; const ph = ((t * 34 * d) % 16 + 16) % 16;
      for (let k = 0; k < 2; k++) ctx.fillRect(X + ((ph + k * 16) % T), Y + 12, 4, 1.5);          // a slow glint running with the belt
    }
    ctx.restore();
  }
  if (E.dyn.v.length) {
    ctx.save(); ctx.fillStyle = '#e4eee8';
    for (const [c, r] of E.dyn.v) {
      const X = c * T, Y = r * T; if (X < x0 || X > x1 || Y < y0 - 120 || Y > y1 || !tl.ventActive(c, r)) continue;
      for (let k = 0; k < 5; k++) { const yy = Y - 8 - ((t * 95 + k * 23) % 105), a = 0.46 * (1 - (Y - yy) / 130); ctx.globalAlpha = Math.max(0.05, a); ctx.beginPath(); ctx.arc(X + 7 + (k % 3) * 9, yy, 5 + (k % 2) * 2, 0, 6.283); ctx.fill(); }
    }
    ctx.restore();
  }
}
function hasSolid(E, cx, cy) {
  const c0 = Math.max(0, cx * CHC - 2), c1 = Math.min(E.cols - 1, cx * CHC + CHC + 1), r0 = Math.max(0, cy * CHR - 2), r1 = Math.min(E.rows - 1, cy * CHR + CHR + 1);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (E.grid[r][c] !== '.') return true;
  return E.decor.some(d => d.c >= c0 - 3 && d.c <= c1 + 3 && d.r >= r0 - 3 && d.r <= r1 + 3);
}
// Boss door and other temporary walls: an iron gate with brass studs, drawn each frame (a few rects) because it comes and goes.
W.blockers = (ctx, E, pal) => {
  for (const b of G.tiles.blockers) {
    if (!b.on) continue;
    const q = W.cell('props_b_f6', 'portcullis'), x0 = b.c * T, y0 = b.r0 * T, h = (b.r1 - b.r0 + 1) * T;
    if (q) { ctx.drawImage(q.img, q.sx, q.sy, q.sw, q.sh, x0, y0, T, h); continue; }
    const K = E.R;
    ctx.save(); ctx.fillStyle = 'rgba(20,16,12,0.55)'; ctx.fillRect(x0 + 2, y0, T - 4, h);
    for (let i = 0; i < 4; i++) { const bx = x0 + 3 + i * 8.6; ctx.fillStyle = '#4a4a48'; ctx.fillRect(bx, y0, 4.4, h); ctx.fillStyle = '#8a8a82'; ctx.fillRect(bx, y0, 1.4, h); ctx.strokeStyle = K.ink; ctx.lineWidth = 1.2; ctx.strokeRect(bx, y0, 4.4, h); }
    for (let k = 0; k <= (b.r1 - b.r0 + 1); k += 1) { const by = y0 + k * T - 3; ctx.fillStyle = K.trim; ctx.fillRect(x0, by, T, 5); ctx.strokeStyle = K.ink; ctx.lineWidth = 1.2; ctx.strokeRect(x0, by, T, 5); }
    for (let k = 0; k < h; k += T) for (const dx of [4, T - 4]) { ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.arc(x0 + dx, y0 + k + 14, 1.5, 0, 6.3); ctx.fill(); }
    ctx.restore();
  }
};
})();
