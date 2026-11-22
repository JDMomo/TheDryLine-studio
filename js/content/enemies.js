/* CONTENT: enemies. One G.defineEnemy per type (fields and helpers: js/game/enemies.js; recipe: docs/ARCHITECTURE.md).
   The active roster has eleven enemies: Strider, Boiler, Scrapper, Rivet, Gearling, Lamp Wisp, Brine Toad, Hanging Lamp, Sapper, Harvester and Mirage. Every hurtful attack has a visible wind-up of at least 0.35 s.
   Drawn in code: chunky rounded shapes, a 3 px dark outline, light fills so they read on the dark backgrounds. The three without
   watercolor art (Lamp Wisp, Brine Toad, Hanging Lamp) use the 'wash' helpers instead: warm ink 2 px outline, a light-to-dark wash on
   the fill, muted brass / moss / ochre, to sit beside the watercolor skins.
   Skins: each enemy with art has a skinFrame(e, skin) returning [strip, frame, rotation?] (see js/game/enemies.js, tools/art/README.md).
   Colours stay out of the player's teal and amber and out of the four token colours. */
(() => {
'use strict';
const G = window.G, C = G.C, T = C.T, U = G.util, tiles = G.tiles, fx = G.fx;

/* ---------- shared helpers ---------- */
const OUT = '#0e1518', RUST = '#B8482F', SAND = '#D9C5A0', SALT = '#F4F1E8', LAMP = '#F4E6B8', SEA = '#3C6E71';
const TAU = 6.283;
const rr = () => G.run.rng();
const hit = (e, c) => e.flash > 0 ? '#ffffff' : c;

// Fill a path with an outline of 3 px.
const solid = (ctx, fill, path) => {
  ctx.beginPath(); path(); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.stroke();
};
// Watercolor-style helpers for enemies without art: warm ink, 2 px outline, a light wash from the top and a darker one at the foot.
const INK = '#2b2118';
const wash = (ctx, fill, path, top, bot, lo = 0.22) => {       // top, bot: the shape's y extent, for the wash
  const h = bot - top;
  ctx.beginPath(); path(); ctx.fillStyle = fill; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,248,226,0.28)'; ctx.fillRect(-80, top - 2, 160, h * 0.35 + 2);
  ctx.fillStyle = 'rgba(43,33,24,' + lo + ')'; ctx.fillRect(-80, bot - h * 0.3, 160, h * 0.3 + 2); ctx.restore();
  ctx.beginPath(); path(); ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
};
const wline = (ctx, x0, y0, x1, y1, col, w) => {
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
};
const rrect = (ctx, x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};
const line = (ctx, x0, y0, x1, y1, col, w) => {   // a stroked limb with outline
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  ctx.strokeStyle = OUT; ctx.lineWidth = w + 3; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
};
const eye = (ctx, x, y, r, col) => { ctx.fillStyle = col || OUT; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

// Ground checks for walkers: the cell row of the floor under the feet, floor ahead, no spikes, no wall.
const frow = e => Math.floor((e.y + 2) / T);
const cellSafe = (x, e) => {
  const c = Math.floor(x / T), r = frow(e);
  return tiles.floorAt(c, r) && !tiles.spike(c, r - 1) && !tiles.spike(c, r) && !tiles.solid(c, r - 1);
};
const safeAhead = (e, far = 6) => cellSafe(e.x + e.face * (e.w / 2 + far), e);
// Every cell of a hop of 'dist' px ahead has floor at this level and nothing in the way.
const hopSafe = (e, dist) => { for (let d = 8; d <= dist + e.w / 2; d += 10) if (!cellSafe(e.x + e.face * d, e)) return false; return cellSafe(e.x + e.face * (dist + e.w / 2), e); };
const faceTarget = (e, p) => { if (p && Math.abs(p.x - e.x) > 4) e.face = p.x > e.x ? 1 : -1; };
const near = (e, p, rx, ry) => p && Math.abs(p.x - e.x) < rx && Math.abs(p.y - e.y) < ry;

// Brine drops (the Spout's lob and the Toad's splash) share a look.
const brinePaint = (ctx, s) => {
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fillStyle = '#d6e8dc'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.x - s.r * 0.3, s.y - s.r * 0.3, s.r * 0.25, 0, TAU); ctx.fill();
};
const warnRing = (ctx, y, r, k) => {     // the rust warning glow of a wind-up, k 0..1
  ctx.save(); ctx.globalAlpha = 0.25 + 0.5 * k; ctx.strokeStyle = RUST; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, y, r + 4 + 4 * k, 0, TAU); ctx.stroke(); ctx.restore();
};

/* A slash is the only thing that can be shielded: wrap melee so the guard of a def can see who slashed. */
if (!G.combat.slashBy && G.combat.melee) {
  const melee = G.combat.melee;
  G.combat.slashBy = null;
  G.combat.melee = function (p, s, rect) {
    G.combat.slashBy = { p, s };
    try { return melee.call(this, p, s, rect); } finally { G.combat.slashBy = null; }
  };
}

/* ---------- 1. Strider (ballast_crab): light rusher; patrol -> claw tell -> committed scuttle -> punishable recovery ---------- */
G.defineEnemy({
  id: 'ballast_crab', name: 'Strider', hp: 26, w: 30, h: 22, touch: 1, shards: [2, 5],
  mat: ["stone","brittle"],
  init(e) { e.face = G.run.rng.chance(0.5) ? 1 : -1; e.cool=0.7+rr(); e.set('patrol',0); e.harmless=true; },
  update(e,dt) {
    e.cool-=dt; const p=e.target();
    if(e.state==='patrol'){
      e.harmless=true;
      if(e.onGround&&(e.hitWall||!safeAhead(e)))e.face=-e.face;
      e.vx=e.face*48;
      if(e.cool<=0&&p&&near(e,p,190,60)){
        faceTarget(e,p);
        if(hopSafe(e,82)){e.vx=0;e.set('wind',0.38);}
      }
    } else if(e.state==='wind'){
      e.harmless=true;e.vx=-e.face*24*(e.t/0.38);
      if(e.t<=0)e.set('lunge',0.34);
    } else if(e.state==='lunge'){
      e.harmless=false;e.vx=e.face*245;
      if(e.hitWall||!safeAhead(e,8)||e.t<=0){e.harmless=true;e.vx=0;e.set('recover',0.5);}
    } else {
      e.harmless=true;e.vx=0;
      if(e.t<=0){e.cool=0.9+rr()*0.6;e.set('patrol',0);}
    }
  },
  skinFrame(e,sk){
    if(e.state==='wind')return ['attack',Math.min(2,Math.floor(e.prog()*3))];
    if(e.state==='lunge')return ['attack',3];
    if(e.state==='recover')return ['attack',e.prog()<0.5?4:5];
    return ['move',G.time*sk.fps];
  },
  draw(e, ctx) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1);
    const step = Math.sin(G.time * (e.state==='lunge'?22:12) + e.x * 0.1) * 3, body = hit(e, '#b7ad8e'), dark = hit(e, '#7d7660');
    if(e.state==='wind')warnRing(ctx,-12,15,e.prog());
    if(e.state==='wind')ctx.scale(0.92,1.08); else if(e.state==='lunge')ctx.scale(1.16,0.88);
    for (const lx of [-11, -4, 5, 12]) line(ctx, lx, -8, lx + (lx > 0 ? 3 : -3), -1 + (lx > 0 ? step : -step) * 0.4, '#8c846c', 3);
    solid(ctx, body, () => ctx.ellipse(0, -11, 14, 9, 0, 0, TAU));
    solid(ctx, dark, () => rrect(ctx, -9, -14, 18, 5, 2));
    const reach=e.state==='lunge'?27:e.state==='wind'?20:17;
    line(ctx, 11, -11, reach, -14, '#b7ad8e', 4);
    solid(ctx, e.state==='wind'?RUST:body, () => ctx.arc(reach+2, -15, 5, 0.5, TAU - 0.5));
    line(ctx, 4, -17, 4, -23, '#b7ad8e', 2); line(ctx, 10, -16, 10, -22, '#b7ad8e', 2);
    eye(ctx, 4, -24, 2.6, LAMP); eye(ctx, 10, -23, 2.6, LAMP); eye(ctx, 4.6, -24, 1, OUT); eye(ctx, 10.6, -23, 1, OUT);
    ctx.restore();
  }
});

/* ---------- 2. Boiler (brine_spout): artillery + close pressure vent; both tell, fire, then recover ---------- */
G.defineEnemy({
  id: 'brine_spout', name: 'Boiler', hp: 30, w: 26, h: 30, touch: 1, shards: [3, 5],
  mat: ["wet"],
  init(e) { e.set('idle', 0.9 + rr() * 0.8); e.harmless=true; },
  update(e) {
    e.vx = 0; const p = e.target();
    if (e.state === 'idle') {
      e.harmless=true; faceTarget(e, p);
      if (e.t <= 0 && p && Math.abs(p.x - e.x) < 560 && Math.abs(p.y - e.y) < 340)
        e.set(Math.abs(p.x-e.x)<105 && Math.abs(p.y-e.y)<70 ? 'ventwind' : 'wind', Math.abs(p.x-e.x)<105 && Math.abs(p.y-e.y)<70 ? 0.42 : 0.6);
    } else if (e.state === 'wind') {
      e.harmless=true; faceTarget(e,p);
      if (e.t <= 0) {
        const ox=e.x+e.face*4, oy=e.y-e.h, tx=p?p.x:e.x+e.face*200, ty=p?p.cy:e.y, g=900;
        const tt=U.clamp(Math.abs(tx-ox)/380,0.45,0.95);
        G.combat.shoot({x:ox,y:oy,vx:(tx-ox)/tt,vy:(ty-oy-0.5*g*tt*tt)/tt,grav:g,r:7,life:3,hostile:true,cut:true,paint:brinePaint,
          onEnd:q=>G.materials.puddle(q.x,q.y,null,52,3.2)});
        fx.spark(ox,oy,8,'#d6e8dc',200,0.3); e.set('spent',0.52);
      }
    } else if(e.state==='ventwind') {
      e.harmless=true; faceTarget(e,p);
      if(e.t<=0){
        // Short-lived radial steam/brine body: staying close after the tell is the mistake.
        G.combat.shoot({x:e.x,y:e.y-18,r:58,life:0.18,hostile:true,tile:'pass',
          paint:(ctx,q)=>{ctx.save();ctx.globalAlpha=0.16+0.36*(q.life/0.18);ctx.fillStyle='#d6e8dc';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,TAU);ctx.fill();ctx.strokeStyle=RUST;ctx.lineWidth=3;ctx.stroke();ctx.restore();}});
        fx.ring(e.x,e.y-18,10,220,'#d6e8dc',0.3);fx.spark(e.x,e.y-28,12,'#d6e8dc',180,0.35);e.set('spent',0.72);
      }
    } else {
      e.harmless=true;
      if(e.t<=0)e.set('idle',1.4+rr()*0.8);
    }
  },
  skinFrame(e, sk) {
    if (e.state === 'wind' || e.state==='ventwind') return ['attack', Math.min(2, Math.floor(e.prog() * 3))];
    if (e.state === 'spent') { const u=e.prog(); return ['attack',u<0.35?3:u<0.7?4:5]; }
    return ['move', G.time * sk.fps];
  },
  draw(e, ctx) {
    const winding=e.state==='wind'||e.state==='ventwind', dur=e.state==='ventwind'?0.42:0.6;
    const k=winding?1-Math.max(0,e.t)/dur:e.state==='spent'?-0.35*e.t/0.72:0;
    ctx.save();ctx.translate(e.x,e.y);
    if(winding)warnRing(ctx,-16,e.state==='ventwind'?24:14,k);
    ctx.scale(1+0.12*k,1-0.1*k);
    const body=hit(e,'#9fb4af');
    solid(ctx,'#6d8a88',()=>rrect(ctx,-16,-8,32,8,3));
    solid(ctx,body,()=>{ctx.moveTo(-9,-8);ctx.lineTo(-7,-26);ctx.lineTo(7,-26);ctx.lineTo(9,-8);ctx.closePath();});
    solid(ctx,hit(e,winding?RUST:'#c4d2cc'),()=>rrect(ctx,-12,-32,24,9,4));
    solid(ctx,hit(e,'#c4d2cc'),()=>rrect(ctx,-9,-17,18,4,2));
    eye(ctx,e.face*3,-28,3,OUT);
    if(winding&&Math.random()<0.45)fx.spark(e.x+e.face*2,e.y-34,1,'#d6e8dc',60,0.3);
    ctx.restore();
  }
});

/* ---------- 3. Scrapper (turnstile): armored lane holder; shielded advance -> shove tell -> charge -> open recovery ---------- */
G.defineEnemy({
  id: 'turnstile', name: 'Scrapper', hp: 44, w: 34, h: 40, touch: 1, shards: [3, 5], heavy: true,
  mat: ["metal"],
  init(e) { e.face = G.run.rng.chance(0.5) ? 1 : -1; e.set('walk', 0); e.cool = 1; e.harmless=true; },
  guard(e, d, fromX) {
    const s = G.combat.slashBy;
    if (!s || e.state === 'turn' || e.state==='recover' || s.s.dir === 'down') return true;
    if (Math.sign(s.p.x - e.x) === e.face) {
      fx.spark(e.x + e.face * 22, e.y - 20, 6, '#ffffff', 220, 0.2); fx.ring(e.x + e.face * 22, e.y - 20, 4, 90, '#ffffff', 0.15);
      if (!(e.shieldHit > 0)) fx.floatText(e.x, e.y - e.h - 6, 'Blocked', '#e9e2cf');
      e.flash = 0; e.shieldHit = 0.2; return false;
    }
    return true;
  },
  skinFrame(e, sk) {
    if(e.state==='wind')return ['attack',Math.min(2,Math.floor(e.prog()*3))];
    if(e.state==='charge'||e.shieldHit>0)return ['attack',3];
    if(e.state==='recover')return ['attack',e.prog()<0.5?4:5];
    if(e.state==='turn')return ['attack',e.prog()<0.5?1:0];
    return ['move',G.time*sk.fps];
  },
  update(e, dt) {
    e.shieldHit=Math.max(0,(e.shieldHit||0)-dt);e.cool-=dt;const p=e.target();
    if(e.state==='walk'){
      e.harmless=true;
      if(e.onGround&&(e.hitWall||!safeAhead(e))){e.set('turn',0.5);e.flip=true;}
      else if(e.cool<=0&&p&&Math.abs(p.y-e.y)<70&&Math.abs(p.x-e.x)<230){
        if(Math.sign(p.x-e.x)!==e.face){e.set('turn',0.5);e.flip=true;}
        else if(hopSafe(e,100)){faceTarget(e,p);e.set('wind',0.55);}
      }
      e.vx=e.state==='walk'?e.face*26:0;
    } else if(e.state==='turn'){
      e.harmless=true;e.vx=0;
      if(e.flip&&e.t<0.25){e.face=-e.face;e.flip=false;}
      if(e.t<=0){e.cool=0.35;e.set('walk',0);}
    } else if(e.state==='wind'){
      e.harmless=true;e.vx=-e.face*18*(e.t/0.55);
      if(e.t<=0)e.set('charge',0.48);
    } else if(e.state==='charge'){
      e.harmless=false;e.vx=e.face*225;
      if(e.hitWall||!safeAhead(e,8)||e.t<=0){if(e.hitWall)fx.jolt(0.035,3);e.harmless=true;e.vx=0;e.set('recover',0.72);}
    } else {
      e.harmless=true;e.vx=0;
      if(e.t<=0){e.cool=1.25+rr()*0.6;e.set('walk',0);}
    }
  },
  draw(e, ctx) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1);
    const open=e.state==='turn'||e.state==='recover', body=hit(e,SAND), sway=Math.sin(G.time*5+e.x)*1.5;
    if(e.state==='wind')warnRing(ctx,-21,23,e.prog());
    if(e.state==='wind')ctx.scale(0.96,1.04);else if(e.state==='charge')ctx.scale(1.1,0.94);
    for(const lx of [-9,9])line(ctx,lx,-8,lx,0,'#a89a78',6);
    solid(ctx,body,()=>rrect(ctx,-14,-34,28,28,7));
    solid(ctx,hit(e,'#a89a78'),()=>rrect(ctx,-10,-40,20,10,5));
    eye(ctx,3,-35,2.4,LAMP);eye(ctx,3.7,-35,1,OUT);
    for(let k=0;k<3;k++)line(ctx,-9+k*9,-29-sway*.2,-9+k*9,-11,'#a89a78',2);
    ctx.save();ctx.translate(e.state==='charge'?19:14,-20);if(open)ctx.rotate(-1.1);else if(e.state==='wind')ctx.rotate(0.12);
    solid(ctx,e.shieldHit>0?'#ffffff':e.state==='wind'?RUST:'#8d979a',()=>rrect(ctx,-2,-17,9,34,4));
    eye(ctx,2.5,-9,1.6,RUST);eye(ctx,2.5,9,1.6,RUST);ctx.restore();ctx.restore();
  }
});

/* ---------- 4. Rivet (signal_gull): hovers, then swoops in an arc ---------- */
G.defineEnemy({
  id: 'signal_gull', name: 'Rivet', hp: 22, w: 30, h: 22, touch: 1, shards: [2, 4], flying: true, gravity: false,
  mat: ["metal"],
  init(e) { e.off = rr() < 0.5 ? -100 : 100; e.set('hover', 1.2 + rr()); e.bob = rr() * 6; e.harmless=true; },
  update(e, dt) {
    const p = e.target(), top = e.h + 40, bot = tiles.rows * T - 40;
    if (e.state === 'hover') {
      e.harmless=true;
      if (p) {
        const tx = p.x + e.off, ty = U.clamp(p.y - 150, top, bot);
        e.vx = U.clamp((tx - e.x) * 2, -130, 130); e.vy = U.clamp((ty - e.y) * 3, -120, 120) + Math.sin(G.time * 4 + e.bob) * 25;
        faceTarget(e, p);
        if (e.t <= 0 && Math.abs(p.x - e.x) < 460 && p.y > e.y - 40) e.set('wind', 0.55);
      } else { e.vx = 0; e.vy = Math.sin(G.time * 3 + e.bob) * 20; }
    } else if (e.state === 'wind') {
      e.harmless=true; faceTarget(e, p);
      e.vx = -e.face * 40; e.vy = -50 * (e.t / 0.55);               // rears back and up
      if (e.t <= 0) {
        const tx = p ? p.x : e.x + e.face * 100, ty = U.clamp(p ? p.cy : e.y + 100, top, bot);
        e.ax = e.x; e.ay = e.y; e.bx = U.clamp(2 * tx - e.x, 40, tiles.cols * T - 40); e.ty = ty; e.dur = 1.0; e.u = 0;
        e.set('swoop', e.dur);
      }
    } else if (e.state === 'swoop') {
      e.harmless=false; e.u = 1 - Math.max(0, e.t) / e.dur;
      const nx = e.ax + (e.bx - e.ax) * e.u, ny = e.ay + (e.ty - e.ay) * Math.sin(Math.PI * e.u);
      e.vx = (nx - e.x) / dt; e.vy = (ny - e.y) / dt; e.face = e.bx > e.ax ? 1 : -1;
      if (e.u >= 1 || e.hitWall || e.onGround) { e.off = -e.off; e.harmless=true; e.set('recover', 0.48); }
    } else if(e.state==='recover') {
      e.harmless=true;e.vx=-e.face*55;e.vy=-45;
      if(e.t<=0)e.set('hover',1.25+rr()*0.6);
    } else { e.harmless=true; e.set('hover', 1); }
  },
  // Skin: wind-up frames across the 0.55 s rear-back, the strike frame through the swoop (recovery as it ends), two recovery frames after it,
  // the move loop (wing beats) while hovering; the body pitches into the swoop.
  skinFrame(e, sk) {
    if (e.state === 'wind') return ['attack', Math.min(2, Math.floor(e.prog() * 3))];
    if (e.state === 'swoop') return ['attack', e.prog() < 0.8 ? 3 : 4, Math.atan2(e.vy, Math.abs(e.vx) + 1) * 0.6 * e.face];
    if (e.state === 'recover') return ['attack', e.prog() < 0.5 ? 4 : 5];
    return ['move', G.time * sk.fps + e.bob];
  },
  draw(e, ctx) {
    ctx.save(); ctx.translate(e.x, e.y - e.h / 2); ctx.scale(e.face, 1);
    const flap = e.state === 'swoop' ? 0.2 : Math.sin(G.time * 11 + e.bob) * (e.state === 'wind' ? 0.2 : 0.7);
    const body = hit(e, SALT), wing = hit(e, '#a9b5b6');
    if (e.state === 'wind') warnRing(ctx, 0, 16, 1 - Math.max(0, e.t) / 0.55);
    ctx.save(); ctx.rotate(e.state === 'swoop' ? Math.atan2(e.vy, Math.abs(e.vx) + 1) * 0.6 : 0);
    ctx.save(); ctx.translate(-2, -4); ctx.rotate(-0.5 - flap * 0.8);
    solid(ctx, wing, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -22, -16, -20); ctx.quadraticCurveTo(-14, -8, 6, 2); ctx.closePath(); }); ctx.restore();
    solid(ctx, body, () => ctx.ellipse(0, 0, 14, 9, 0, 0, TAU));                                  // body
    solid(ctx, body, () => ctx.arc(11, -5, 6, 0, TAU));                                           // head
    solid(ctx, e.state === 'wind' ? RUST : '#c9633f', () => { ctx.moveTo(15, -7); ctx.lineTo(24, -4); ctx.lineTo(15, -2); ctx.closePath(); });   // beak
    eye(ctx, 12, -7, 1.8);
    solid(ctx, wing, () => { ctx.moveTo(-12, 2); ctx.lineTo(-22, 6 + flap * 3); ctx.lineTo(-12, 7); ctx.closePath(); });   // tail
    ctx.restore(); ctx.restore();
  }
});

/* ---------- 5. Lamp Wisp: slow flyer that drifts at the player; pops (0.45 s warning) when killed ---------- */
G.defineEnemy({
  id: 'lamp_wisp', name: 'Lamp Wisp', hp: 20, w: 24, h: 24, touch: 1, shards: [2, 4], flying: true, gravity: false,
  mat: ["flammable"],
  init(e) { e.bob = rr() * 6; e.set('drift', 0); },
  // The killing blow does not kill yet: the wisp swells for 0.45 s, then bursts and dies.
  guard(e, d) {
    if (e.state === 'pop') return false;
    if (e.state !== 'gone' && e.hp - d <= 0) { e.set('pop', 0.45); e.harmless = true; e.hp = 0.001; e.flash = fx.flashT(0.1); return false; }
    return true;
  },
  update(e) {
    const p = e.target();
    if (e.state === 'drift') {
      const wob = Math.sin(G.time * 2.4 + e.bob) * 18;
      if (p) { const dx = p.x - e.x, dy = p.cy - 10 - e.y, d = Math.hypot(dx, dy) || 1, s = Math.min(55, d * 2); e.vx = dx / d * s; e.vy = dy / d * s + wob; faceTarget(e, p); }
      else { e.vx = 0; e.vy = wob; }
    } else if (e.state === 'pop') {
      e.vx = e.vy = 0;
      if (e.t <= 0) {
        const x = e.x, y = e.y - e.h / 2;
        G.combat.shoot({ x, y, r: 56, life: 0.14, hostile: true, tile: 'pass', paint: (ctx, s) => {
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fillStyle = 'rgba(244,230,184,0.55)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LAMP; ctx.stroke(); } });
        fx.spark(x, y, 24, LAMP, 360, 0.5); fx.ring(x, y, 10, 260, LAMP, 0.3);
        e.set('gone', 0); e.damage(1, e.x);
      }
    }
  },
  draw(e, ctx) {
    ctx.save(); ctx.translate(e.x, e.y - e.h / 2);
    const k = e.state === 'pop' ? 1 - Math.max(0, e.t) / 0.45 : 0, sw = 1 + 0.5 * k, pulse = 1 + Math.sin(G.time * 6 + e.bob) * 0.06;
    ctx.save(); ctx.globalAlpha = 0.18 + 0.2 * k; ctx.fillStyle = LAMP; ctx.beginPath(); ctx.arc(0, 0, 26 * sw, 0, TAU); ctx.fill(); ctx.restore();   // light
    if (e.state === 'pop') { ctx.save(); ctx.globalAlpha = 0.3 + 0.5 * k; ctx.strokeStyle = RUST; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(0, 0, 56 * (0.5 + 0.5 * k), 0, TAU); ctx.stroke(); ctx.restore(); }
    ctx.scale(sw * pulse, sw * pulse);
    for (let i = -1; i <= 1; i++) wline(ctx, i * 5, 8, i * 6 + Math.sin(G.time * 5 + i) * 2, 17, '#a89a7c', 3);   // wisps of smoke
    wash(ctx, hit(e, e.state === 'pop' && Math.floor(G.time * 14) % 2 ? '#ffffff' : '#f0dc9c'), () => ctx.arc(0, 0, 11, 0, TAU), -11, 11, 0.12);
    wash(ctx, hit(e, '#a98550'), () => rrect(ctx, -7, -15, 14, 6, 3), -15, -9);                    // brass cap
    eye(ctx, -3.5, 0, 2, INK); eye(ctx, 3.5, 0, 2, INK);
    ctx.restore();
  }
});

/* ---------- 6. Brine Toad: crouches, hops toward players, splashes on landing ---------- */
G.defineEnemy({
  id: 'brine_toad', name: 'Brine Toad', hp: 34, w: 32, h: 24, touch: 1, shards: [2, 5],
  mat: ["wet"],
  init(e) { e.face = G.run.rng.chance(0.5) ? 1 : -1; e.set('rest', 0.5 + rr()); },
  update(e) {
    const p = e.target();
    if (e.state === 'rest') {
      e.vx = 0;
      if (e.t <= 0 && e.onGround) {
        if (p && near(e, p, 460, 160)) faceTarget(e, p);
        if (hopSafe(e, 100)) e.set('crouch', 0.4);
        else { e.face = -e.face; e.set('rest', 0.5); }
      }
    } else if (e.state === 'crouch') {
      e.vx = 0;
      if (e.t <= 0) { e.vy = -520; e.vx = e.face * 170; e.set('hop', 0.12); }
    } else if (e.state === 'hop') {
      e.vx = e.face * 170;
      if (e.t <= 0 && e.onGround) {
        e.vx = 0;
        for (const s of [-1, 1]) G.combat.shoot({ x: e.x + s * 14, y: e.y - 6, vx: s * 230, r: 6, life: 0.3, hug: true, hostile: true, cut: true, paint: brinePaint });
        fx.spark(e.x, e.y - 4, 10, '#d6e8dc', 220, 0.3); fx.ring(e.x, e.y - 2, 6, 120, '#d6e8dc', 0.25);
        e.set('rest', 0.9 + rr() * 0.5);
      }
    }
  },
  draw(e, ctx) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1);
    const k = e.state === 'crouch' ? 1 - Math.max(0, e.t) / 0.4 : 0, air = e.state === 'hop' ? 1 : 0;
    if (e.state === 'crouch') warnRing(ctx, -10, 14, k);
    ctx.scale(1 + 0.18 * k - 0.1 * air, 1 - 0.28 * k + 0.12 * air);
    const body = hit(e, '#8a9a5c'), belly = hit(e, '#d3c18a'), dark = hit(e, '#66733f');
    wash(ctx, dark, () => rrect(ctx, -16, -8, 12, 8, 4), -8, 0);                                  // back foot
    wash(ctx, body, () => ctx.ellipse(0, -11, 15, 10, 0, 0, TAU), -21, -1);                       // body
    wash(ctx, belly, () => ctx.ellipse(3, -6, 9, 4, 0, 0, TAU), -10, -2, 0.1);
    wash(ctx, dark, () => rrect(ctx, 6, -6, 12, 6, 3), -6, 0);                                    // front foot
    wash(ctx, body, () => ctx.arc(9, -19, 5, 0, TAU), -24, -14); wash(ctx, body, () => ctx.arc(2, -20, 4.5, 0, TAU), -24.5, -15.5);   // eye bumps
    eye(ctx, 10, -19.5, 2, '#efe3b8'); eye(ctx, 10.6, -19.5, 0.9, INK); eye(ctx, 2.5, -20.5, 1.8, '#efe3b8'); eye(ctx, 3, -20.5, 0.8, INK);
    ctx.restore();
  }
});

/* ---------- 7. Gearling (handcar): pump trolley; winds up (pumping, rust flash), dashes along the floor, then rests ---------- */
G.defineEnemy({
  id: 'handcar', name: 'Gearling', hp: 56, w: 46, h: 30, touch: 1, shards: [4, 5], heavy: true,
  mat: ["metal","heavy"],
  init(e) { e.face = G.run.rng.chance(0.5) ? 1 : -1; e.set('roll', 0); e.cool = 1.5; },
  update(e, dt) {
    e.cool -= dt;
    const p = e.target();
    if (e.state === 'roll') {
      if (e.onGround && (e.hitWall || !safeAhead(e))) e.face = -e.face;
      e.vx = e.face * 40;
      if (e.cool <= 0 && p && e.onGround && Math.abs(p.y - e.y) < 70 && Math.abs(p.x - e.x) < 400 && Math.abs(p.x - e.x) > 40) { faceTarget(e, p); if (safeAhead(e)) e.set('wind', 0.65); }
    } else if (e.state === 'wind') {
      e.vx = -e.face * 12 * (e.t / 0.65);                          // rocks back as the handle pumps
      if (e.t <= 0) e.set('dash', 1.0);
    } else if (e.state === 'dash') {
      e.vx = e.face * 340;
      if (e.hitWall || !safeAhead(e, 8) || e.t <= 0) { e.vx = 0; fx.spark(e.x + e.face * 20, e.y - 8, 8, '#e9e2cf', 200, 0.3); e.set('rest', 0.9); }
    } else if (e.state === 'rest') {
      e.vx = 0;
      if (e.t <= 0) { e.cool = 1.5; e.set('roll', 0); }
    }
  },
  // Skin: wind-up frames across the 0.65 s pumping, the strike frame (3) for the whole dash, recovery 4 then 5 across the 0.9 s rest.
  skinFrame(e, sk) {
    if (e.state === 'wind') return ['attack', Math.min(2, Math.floor(e.prog() * 3))];
    if (e.state === 'dash') return ['attack', 3];
    if (e.state === 'rest') return ['attack', e.prog() < 0.5 ? 4 : 5];
    return ['move', G.time * sk.fps];
  },
  draw(e, ctx) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1);
    const wind = e.state === 'wind' ? 1 - Math.max(0, e.t) / 0.65 : 0, dash = e.state === 'dash';
    const pump = e.state === 'wind' ? Math.sin(wind * 18) : e.state === 'roll' ? Math.sin(G.time * 3 + e.x) * 0.3 : dash ? 0.9 : 0;
    if (e.state === 'wind') warnRing(ctx, -16, 24, wind);
    const ang = G.time * (dash ? 14 : 3) * (e.state === 'rest' ? 0 : 1);
    for (const wx of [-14, 14]) {                                                                // wheels
      ctx.save(); ctx.translate(wx, -7); solid(ctx, hit(e, SAND), () => ctx.arc(0, 0, 7, 0, TAU)); ctx.rotate(ang);
      line(ctx, -5, 0, 5, 0, OUT, 1); line(ctx, 0, -5, 0, 5, OUT, 1); ctx.restore();
    }
    solid(ctx, hit(e, e.state === 'wind' && Math.floor(wind * 8) % 2 ? RUST : '#a46a4d'), () => rrect(ctx, -22, -22, 44, 12, 4));   // deck
    solid(ctx, hit(e, '#c9b48a'), () => rrect(ctx, -3, -29, 6, 10, 2));                           // post
    ctx.save(); ctx.translate(0, -29); ctx.rotate(pump * 0.5);                                    // pump handle
    solid(ctx, hit(e, '#8d979a'), () => rrect(ctx, -19, -3, 38, 6, 3)); eye(ctx, -19, 0, 3, LAMP); eye(ctx, 19, 0, 3, LAMP); ctx.restore();
    solid(ctx, hit(e, '#8d979a'), () => rrect(ctx, 14, -26, 9, 14, 3));                           // front plate
    ctx.restore();
  }
});

/* ---------- 8. Hanging Lamp: hangs from the ceiling above its spawn, drops when a player passes under, then burns out ---------- */
G.defineEnemy({
  id: 'hanging_lamp', name: 'Hanging Lamp', hp: 20, w: 24, h: 30, touch: 1, shards: [2, 3], gravity: false, ceiling: true,
  mat: ["metal","brittle"],
  init(e) {
    const c = Math.floor(e.x / T); let r = Math.floor((e.y - 2) / T);
    while (r >= 0 && !tiles.solid(c, r)) r--;
    e.ceil = Math.max(0, (r + 1) * T);                           // underside of the ceiling tile above the spawn
    e.y = e.ceil + 14 + e.h; e.set('hang', 0); e.sway = rr() * 6;
  },
  update(e, dt) {
    if (e.state === 'hang') {
      e.vx = e.vy = 0;
      for (const p of G.players) if (!p.down && Math.abs(p.x - e.x) < 26 && p.y > e.y) { e.set('shake', 0.45); break; }
    } else if (e.state === 'shake') {
      e.vx = e.vy = 0;
      if (e.t <= 0) { e.set('fall', 0); e.vy = 60; }
    } else if (e.state === 'fall') {
      e.vy = Math.min(e.vy + 2000 * dt, 900);
      if (e.onGround) {
        e.vy = 0; e.set('landed', 3.2);
        fx.spark(e.x, e.y - 4, 12, LAMP, 260, 0.4); fx.ring(e.x, e.y - 2, 8, 140, LAMP, 0.3); fx.jolt(0.03, 3);
      }
    } else if (e.state === 'landed') {
      e.vx = e.vy = 0;
      if (e.t <= 0) { e.dead = true; fx.spark(e.x, e.y - 12, 16, '#e9e2cf', 280, 0.4); fx.ring(e.x, e.y - 12, 6, 160, '#e9e2cf', 0.25); }   // breaks: no scrip
    }
  },
  draw(e, ctx) {
    ctx.save(); ctx.translate(e.x, e.y);
    const swing = e.state === 'hang' ? Math.sin(G.time * 1.6 + e.sway) * 0.05 : e.state === 'shake' ? Math.sin(G.time * 60) * 0.12 : 0;
    if (e.ceil !== undefined && e.state !== 'landed') {                                           // chain up to the ceiling
      ctx.save(); ctx.translate(0, -e.h); ctx.rotate(swing); const len = Math.max(0, e.y - e.h - e.ceil);
      wline(ctx, 0, 0, 0, -len, '#7f8a84', 2); ctx.restore();
    }
    ctx.translate(0, -e.h / 2); ctx.rotate(e.state === 'landed' ? 0 : swing);
    const lit = e.state === 'landed' ? (e.t < 0.9 ? Math.floor(G.time * 12) % 2 : 1) : e.state === 'shake' ? 1 : 0.55;
    const glass = e.state === 'landed' || e.state === 'shake' ? RUST : '#f0dc9c';
    if (e.state === 'landed' || e.state === 'shake') { ctx.save(); ctx.globalAlpha = 0.25 * lit; ctx.fillStyle = RUST; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill(); ctx.restore(); }
    wash(ctx, hit(e, '#a98550'), () => rrect(ctx, -9, -15, 18, 7, 3), -15, -8);                   // brass cap
    wash(ctx, hit(e, glass), () => { ctx.moveTo(-8, -9); ctx.lineTo(8, -9); ctx.lineTo(11, 9); ctx.arc(0, 9, 11, 0, Math.PI); ctx.closePath(); }, -9, 20, 0.12);   // glass
    ctx.save(); ctx.globalAlpha = lit; eye(ctx, 0, 2, 4, '#fffaf0'); ctx.restore();
    wash(ctx, hit(e, '#a98550'), () => rrect(ctx, -10, 11, 20, 4, 2), 11, 15);                   // rim
    ctx.restore();
  }
});

/* ---------- 9. Sapper: bomb-like demolition unit; plants a clearly warned charge, then backs off ---------- */
G.defineEnemy({
  id: 'sapper', name: 'Sapper', hp: 30, w: 30, h: 28, touch: 1, shards: [3, 5], staticArt:{w:48,h:42},
  mat: ["metal","flammable"],
  staticFx(e,ctx){if(e.state==='wind'){ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.face,1);warnRing(ctx,-16,18,e.prog());ctx.restore();}},
  init(e) { e.face = G.run.rng.chance(0.5) ? 1 : -1; e.cool = 1.1 + rr(); e.set('walk', 0); },
  update(e, dt) {
    e.cool -= dt; const p=e.target();
    if(e.state==='walk'){
      if(e.onGround && (e.hitWall || !safeAhead(e))) e.face=-e.face;
      e.vx=e.face*34;
      if(e.cool<=0 && p && near(e,p,300,90)){ faceTarget(e,p); e.set('wind',0.7); }
    } else if(e.state==='wind'){
      e.vx=0;
      if(e.kbT>0.02){ e.cool=1.2; e.set('recover',0.35); }
      else if(e.t<=0){
        const mx=e.x+e.face*22, my=e.y-5;
        G.combat.shoot({x:mx,y:my,r:5,life:1.35,hostile:true,cut:true,tile:'pass',
          paint:(ctx,s)=>{ const hot=s.life<0.48; ctx.save(); ctx.globalAlpha=0.7+0.3*Math.sin(G.time*(hot?28:10)); ctx.fillStyle=hot?RUST:'#8b765a'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r+2,0,TAU); ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.stroke(); ctx.restore(); },
          onEnd:s=>{ fx.ring(s.x,s.y,8,220,RUST,0.28); fx.spark(s.x,s.y,18,RUST,340,0.42);
            G.combat.shoot({x:s.x,y:s.y-10,r:58,life:0.14,hostile:true,tile:'pass',paint:(ctx,q)=>{ctx.save();ctx.globalAlpha=0.28+0.35*(q.life/0.14);ctx.fillStyle=RUST;ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,TAU);ctx.fill();ctx.strokeStyle=LAMP;ctx.lineWidth=3;ctx.stroke();ctx.restore();}});
          }});
        e.cool=2.6+rr(); e.set('recover',0.55);
      }
    } else { e.vx=-e.face*24; if(e.t<=0) e.set('walk',0); }
  },
  draw(e,ctx){
    ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.face,1);
    if(e.state==='wind') warnRing(ctx,-16,18,e.prog());
    const bob=e.state==='wind'?Math.sin(G.time*22)*2:0;
    wash(ctx,hit(e,'#6f705d'),()=>ctx.arc(0,-13+bob,13,0,TAU),-27+bob,1+bob,0.2);
    wash(ctx,hit(e,'#9b6d49'),()=>rrect(ctx,-10,-31+bob,20,8,4),-31+bob,-23+bob,0.16);
    wline(ctx,-8,-5, -13,0,'#80715a',4); wline(ctx,8,-5,13,0,'#80715a',4);
    ctx.strokeStyle=RUST;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(4,-29+bob);ctx.quadraticCurveTo(12,-40,17,-32);ctx.stroke();
    eye(ctx,4,-15+bob,2.3,LAMP); eye(ctx,4.5,-15+bob,0.9,INK);ctx.restore();
  }
});

/* ---------- 10. Harvester: support tripod; a long repair tell restores nearby damaged enemies if allowed to finish ---------- */
G.defineEnemy({
  id:'harvester', name:'Harvester', hp:52, w:38, h:42, touch:1, shards:[4,5], heavy:true, mat:['metal','wet'], staticArt:{w:56,h:52},
  staticFx(e,ctx){if(e.state==='wind'){const k=e.prog();ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=.18+.35*k;ctx.fillStyle=LAMP;ctx.beginPath();ctx.arc(0,-22,28+12*k,0,TAU);ctx.fill();ctx.globalAlpha=1;warnRing(ctx,-22,24,k);ctx.restore();}},
  init(e){ e.face=G.run.rng.chance(0.5)?1:-1; e.cool=2+rr(); e.set('walk',0); },
  update(e,dt){
    e.cool-=dt; const room=G.rooms.current;
    const hurtAlly=()=>room.enemies.find(a=>a!==e&&!a.dead&&a.hp<a.def.hp&&Math.hypot(a.x-e.x,a.y-e.y)<250);
    if(e.state==='walk'){
      if(e.onGround&&(e.hitWall||!safeAhead(e))) e.face=-e.face;
      e.vx=e.face*22;
      const a=hurtAlly(); if(e.cool<=0&&a){ faceTarget(e,a); e.set('wind',0.85); }
    } else if(e.state==='wind'){
      e.vx=0;
      if(e.kbT>0.02){ e.cool=1.4; e.set('recover',0.45); }
      else if(e.t<=0){
        let n=0; for(const a of room.enemies) if(a!==e&&!a.dead&&Math.hypot(a.x-e.x,a.y-e.y)<230&&a.hp<a.def.hp){ const before=a.hp; a.hp=Math.min(a.def.hp,a.hp+9); if(a.hp>before){n++;fx.floatText(a.x,a.y-a.h-8,'+repair',LAMP);} }
        fx.ring(e.x,e.y-22,18,260,LAMP,0.45); fx.spark(e.x,e.y-25,8,LAMP,130,0.4);
        if(n) fx.floatText(e.x,e.y-e.h-10,'Repair pulse',LAMP);
        e.cool=3.8+rr(); e.set('recover',0.7);
      }
    } else { e.vx=0; if(e.t<=0)e.set('walk',0); }
  },
  draw(e,ctx){
    ctx.save();ctx.translate(e.x,e.y);
    if(e.state==='wind'){ const k=e.prog(); ctx.globalAlpha=.18+.35*k;ctx.fillStyle=LAMP;ctx.beginPath();ctx.arc(0,-22,28+12*k,0,TAU);ctx.fill();ctx.globalAlpha=1;warnRing(ctx,-22,24,k); }
    for(const x of [-12,0,12]) wline(ctx,x,-11,x+(x?Math.sign(x)*4:0),0,'#716b57',4);
    wash(ctx,hit(e,'#71807a'),()=>rrect(ctx,-16,-34,32,23,8),-34,-11,0.22);
    wash(ctx,hit(e,'#9c8154'),()=>rrect(ctx,-11,-44,22,11,4),-44,-33,0.18);
    ctx.fillStyle=LAMP;ctx.globalAlpha=e.state==='wind'?0.95:0.62;ctx.fillRect(-6,-40,12,4);ctx.globalAlpha=1;
    for(const x of [-10,10]){ctx.strokeStyle='#8c7751';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,-30);ctx.bezierCurveTo(x*1.8,-26,x*1.5,-16,x*1.2,-9);ctx.stroke();}
    eye(ctx,e.face*5,-27,2,LAMP);ctx.restore();
  }
});

/* ---------- 11. Mirage: phasing ambusher; vanishes, relocates on safe footing, tells, then commits to a dash ---------- */
G.defineEnemy({
  id:'mirage', name:'Mirage', hp:28, w:28, h:40, touch:1, shards:[3,5], mat:['slick'], staticArt:{w:50,h:56},
  staticPose(e){return {alpha:e.state==='fade'?Math.max(.12,e.t/.42):1,rot:e.state==='dash'?.18*(e.face||1):0};},
  staticFx(e,ctx){if(e.state==='tell'){ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.face,1);warnRing(ctx,-22,20,e.prog());ctx.restore();}},
  init(e){ e.face=G.run.rng.chance(0.5)?1:-1; e.cool=1.5+rr(); e.set('watch',0); },
  update(e,dt){
    e.cool-=dt; const p=e.target();
    if(e.state==='watch'){
      e.harmless=false; if(e.onGround&&(e.hitWall||!safeAhead(e))) e.face=-e.face; e.vx=e.face*24;
      if(e.cool<=0&&p&&near(e,p,380,130)){ faceTarget(e,p); e.harmless=true; e.set('fade',0.42); }
    } else if(e.state==='fade'){
      e.vx=0;e.harmless=true;
      if(e.t<=0){
        if(p){ const row=Math.floor((e.y+2)/T), want=p.x-(p.x>e.x?1:-1)*105, c=Math.floor(want/T);
          if(c>1&&c<tiles.cols-2&&tiles.floorAt(c,row)&&!tiles.solid(c,row-1)&&!tiles.spike(c,row)) e.x=(c+.5)*T;
          faceTarget(e,p);
        }
        e.harmless=false;e.set('tell',0.5);
      }
    } else if(e.state==='tell'){
      e.vx=0;e.harmless=false;
      if(e.kbT>0.02){e.cool=1.5;e.set('recover',0.65);}
      else if(e.t<=0)e.set('dash',0.42);
    } else if(e.state==='dash'){
      e.harmless=false;e.vx=e.face*330;
      if(e.hitWall||!safeAhead(e,8)||e.t<=0){e.cool=2.4+rr();e.set('recover',0.75);}
    } else { e.harmless=false;e.vx=0;if(e.t<=0)e.set('watch',0); }
  },
  draw(e,ctx){
    const fade=e.state==='fade'?Math.max(0.12,e.t/0.42):1;
    ctx.save();ctx.globalAlpha=fade;ctx.translate(e.x,e.y);ctx.scale(e.face,1);
    if(e.state==='tell')warnRing(ctx,-22,20,e.prog());
    const lean=e.state==='dash'?0.28:0;ctx.rotate(lean);
    wash(ctx,hit(e,'#676276'),()=>{ctx.moveTo(-12,0);ctx.quadraticCurveTo(-13,-29,-4,-39);ctx.quadraticCurveTo(5,-47,13,-30);ctx.lineTo(15,0);ctx.closePath();},-43,0,0.28);
    wash(ctx,hit(e,'#867b91'),()=>{ctx.moveTo(-9,-30);ctx.quadraticCurveTo(0,-44,10,-29);ctx.lineTo(7,-19);ctx.lineTo(-7,-19);ctx.closePath();},-44,-19,0.18);
    eye(ctx,3,-28,2,LAMP);
    ctx.strokeStyle='#81748e';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-8+i*7,-4);ctx.quadraticCurveTo(-20-i*4,6,-28-i*7,2+Math.sin(G.time*5+i)*4);ctx.stroke();}
    ctx.restore();ctx.globalAlpha=1;
  }
});

})();
