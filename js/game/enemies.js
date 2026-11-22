/* Enemies: a registry plus a base class that handles physics, damage, knockback, contact damage and death. */
(() => {
'use strict';
const G = window.G, C = G.C, T = C.T, U = G.util, fx = G.fx, tiles = G.tiles;
G.enemyDefs = {};
let uid = 0;

/* G.defineEnemy({ id, name, hp, w, h, touch, shards: [min, max], flying, gravity, collide, heavy,
                   init(e), update(e, dt), draw(e, ctx) })
   touch    truthy = touching it hurts a player (one pip); 0 = harmless body.  shards: scrip dropped, min to max
   heavy    true = barely knocked back
   flying   true = spawned at 'F' markers instead of 'E'; usually with gravity: false
   gravity  default true.  collide: default true (stopped by tiles)
   update   set e.vx / e.vy and e.face; the base class moves the box. Helpers: e.set(state, t), e.state, e.t (counts down),
            e.onGround, e.hitWall (-1 | 0 | 1), e.edgeAhead(), e.target() (nearest standing player or null)
   draw     world space; the enemy's feet centre is e.x, e.y
   staticArt {w,h} + optional staticPose/staticFx are used for canonical watercolor bodies that do not yet have animation strips.
   skinFrame(e, skin)  optional, used while a watercolor skin (G.enemySkins) is on: returns [strip, frame, rotation?] with strip 'move' |
            'attack' | 'defeat' (frames of tools/art strips, see tools/art/README.md). Without it the skin loops its move strip.
   Debug: G.debugBoxes = true draws every enemy's hitbox (magenta), its feet or centre cross and its state. */
G.defineEnemy = def => {
  if (!def.id || typeof def.update !== 'function') return G.fail('bad enemy definition: ' + (def.id || '?'));
  G.enemyDefs[def.id] = Object.assign({ hp: 20, w: 28, h: 24, touch: 1, shards: [1, 3] }, def);
  if (def.draw) G.art.define('enemy_' + def.id, (ctx, o) => def.draw(o.ent, ctx));
};

class Enemy {
  constructor(def, x, y) {
    Object.assign(this, { def, id: def.id, uid: 'e' + (++uid), x, y, w: def.w, h: def.h, vx: 0, vy: 0, face: -1, hp: def.hp,
      flash: 0, kbT: 0, kbV: 0, onGround: false, hitWall: 0, dead: false, state: 'idle', t: 0 });
    this.aggro = 1;
    if (def.init) def.init(this);
  }
  // Per-region difficulty (G.defineRegion scale: { hp, aggro }): fewer hit points, a slower tempo (waits, wind-ups and walking are longer
  // by 1 / aggro). The enemy definitions themselves are never edited.
  applyScale(sc) { if (!sc) return; if (sc.hp) this.hp = Math.max(1, Math.round(this.hp * sc.hp)); if (sc.aggro) this.aggro = sc.aggro; }
  makeElite() {
    if (this.elite) return;
    this.elite = true; this.hp = Math.max(this.hp + 6, Math.round(this.hp * 1.45)); this.maxEliteHp = this.hp; this.aggro *= 1.12;
  }
  rect() { return { x0: this.x - this.w / 2, x1: this.x + this.w / 2, y0: this.y - this.h, y1: this.y }; }
  set(state, t = 0) { if (state !== this.state) { this.prev = this.state; this.sAt = G.time; } this.state = state; this.t = t; this.t0 = t; }
  // Seconds in the current state (for art that plays recovery frames after a state ends) and how far through its timer the state is, 0..1.
  age() { return G.time - (this.sAt || 0); }
  prog() { return this.t0 ? U.clamp(1 - this.t / this.t0, 0, 1) : 0; }
  target() {
    const live=G.players.filter(p=>!p.down);
    if(!live.length){this.targetUid=null;return null;}
    const locked=live.find(p=>p.index===this.targetUid);
    if(locked&&this.targetUntil>G.time)return locked;
    let best=null,bd=Infinity;
    for(const p of live){
      const d=Math.abs(p.x-this.x)+Math.abs(p.y-this.y);
      let pressure=0;
      if(live.length>1&&G.rooms&&G.rooms.current) for(const e of G.rooms.current.enemies)
        if(e!==this&&!e.dead&&e.targetUid===p.index&&e.targetUntil>G.time) pressure++;
      const score=d+pressure*140;
      if(score<bd){bd=score;best=p;}
    }
    this.targetUid=best&&best.index;this.targetUntil=G.time+0.8;
    return best;
  }
  // No floor one step ahead in the facing direction.
  edgeAhead() { return !tiles.floorAt(Math.floor((this.x + this.face * (this.w / 2 + 6)) / T), Math.floor((this.y + 2) / T)); }
  damage(d, fromX) {
    if (this.dead) return;
    if (this.noLoot) {                                // an enemy a boss summoned for the fight (b.summon(.., { loot: false })): no scrip, no mend, no defeat art
      this.hp -= d; this.flash = fx.flashT(0.1); fx.hitstop = Math.max(fx.hitstop, 0.05); this.kbT = 0.12; const weight = Math.max(0.5, this.def.weight || (this.def.heavy ? 3.5 : 1)); this.kbV = Math.sign(this.x - fromX || 1) * 220 / weight;
      if (this.hp <= 0) { this.dead = true; fx.spark(this.x, this.y - this.h / 2, 18, '#e9e2cf', 320, 0.5); }
      return;
    }
    if (this.def.guard && this.def.guard(this, d, fromX) === false) return;   // guard(e, d, fromX): return false to block the hit
    this.hp -= d; this.flash = fx.flashT(0.1); fx.hitstop = Math.max(fx.hitstop, 0.05); this.kbT = 0.12; const weight = Math.max(0.5, this.def.weight || (this.def.heavy ? 3.5 : 1)); this.kbV = Math.sign(this.x - fromX || 1) * 220 / weight;
    if (this.hp <= 0) {
      this.dead = true;
      const skin = this.skin();
      const defeat = skin && G.art.hasStrip(skin.id + '_defeat');
      fx.spark(this.x, this.y - this.h / 2, defeat ? 8 : 18, '#e9e2cf', 320, 0.5); fx.ring(this.x, this.y - this.h / 2, 6, 200, '#e9e2cf', 0.25);
      if (defeat) this.playDefeat(skin);
      // careful play is rewarded: a kill puts a little into the nearest standing player's mend gauge
      let near = null, nd = 420; for (const p of G.players) { if (p.down) continue; const d = Math.hypot(p.x - this.x, p.cy - this.y); if (d < nd) { nd = d; near = p; } }
      if (near && near.glow < 99) { near.glow = Math.min(99, near.glow + C.KILL_MEND); fx.floatText(near.x, near.y - 56, '+mend', '#fff3c4'); }
      const [lo, hi] = this.def.shards;
      G.combat.dropShards(this.x, this.y - this.h / 2, lo + G.run.rng.int(hi - lo + 1) + (this.elite ? 2 : 0));
    }
  }
  // The watercolor skin in use right now, or null (art test off, no skin, strips missing).
  skin() { const sk = G.artTest && G.enemySkins && G.enemySkins[this.id]; return sk && G.art.hasStrip(sk.id + '_move') ? sk : null; }
  // Where the skin's feet go for a body whose hitbox bottom is at y: ground walkers on the hitbox bottom, flyers (skin.center) centred on it.
  skinFoot(sk, k) { return sk.center ? this.y - this.h / 2 + sk.fig * k / 2 : this.y; }
  // The defeat strip plays at the spot of the kill (0.5 s, then fades); a flyer's art falls to the floor below it while it plays.
  playDefeat(sk) {
    const st = G.strips[sk.id + '_defeat'], k = sk.h / st.fh, y0 = this.skinFoot(sk, k);
    let y1 = y0;
    if (sk.center) {
      const c = Math.floor(this.x / T);
      for (let r = Math.floor(y0 / T); r < tiles.rows && r * T < y0 + 320; r++) if (tiles.floorAt(c, r)) { y1 = r * T; break; }
    }
    fx.anim({ strip: sk.id + '_defeat', x: this.x, y: y0, y1: Math.max(y0, y1), face: this.face || 1, h: sk.h, foot: 4, play: 0.5, fade: 0.3 });
  }
  update(dt) {
    const def = this.def;
    // Authored encounter staging: a dormant enemy is visible but does not patrol/attack until a living player approaches.
    // It still settles onto terrain, so dormant bodies never float or pop into existence.
    if (this.wakeRange && !this.awake) {
      const close = G.players.some(p => !p.down && Math.hypot(p.x - this.x, p.cy - (this.y - this.h / 2)) <= this.wakeRange);
      if (!close) {
        this.flash -= dt; this.kbT -= dt; this.vx = 0; this.harmless = true;
        if (def.gravity !== false) this.vy = Math.min(this.vy + 1800 * dt, 900);
        if (def.collide !== false) {
          const res = tiles.moveBox(this, 0, this.vy * dt);
          this.onGround = res.hy === 1; this.hitWall = res.hx; if (res.hy) this.vy = 0;
        }
        this.x = U.clamp(this.x, this.w / 2 + 2, tiles.cols * T - this.w / 2 - 2);
        this.y = U.clamp(this.y, this.h + 2, tiles.rows * T);
        return;
      }
      this.awake = true; this.harmless = this.dormantHarmless; this.targetUid = null; this.targetUntil = 0;
    }
    this.flash -= dt; this.t -= dt * this.aggro; this.kbT -= dt;
    def.update(this, dt);
    if (def.gravity !== false) this.vy = Math.min(this.vy + 1800 * dt, 900);
    const surface = this.onGround ? tiles.surfaceUnder(this) : '.', belt = this.onGround ? tiles.conveyor(this) : 0;
    const terrainMove = surface === 'm' ? 0.65 : 1;
    const mvx = (this.vx * this.aggro + (this.kbT > 0 ? this.kbV : 0)) * terrainMove + belt * 105;
    if (def.collide !== false) {
      const res = tiles.moveBox(this, mvx * dt, this.vy * dt);
      this.onGround = res.hy === 1; this.hitWall = res.hx; if (res.hy) this.vy = 0;
    } else { this.x += mvx * dt; this.y += this.vy * dt; }
    this.x = U.clamp(this.x, this.w / 2 + 2, tiles.cols * T - this.w / 2 - 2);
    this.y = U.clamp(this.y, this.h + 2, tiles.rows * T);
    if (def.touch && !this.harmless) G.combat.hurtPlayers(this.rect(), this.x);
  }
  draw(ctx) {
    const skin = this.skin(), staticArt = !skin && this.def.staticArt && G.sprites['enemy_' + this.id];
    if (skin) this.drawSkin(ctx, skin);
    else if (staticArt) {
      const a=this.def.staticArt, pose=this.def.staticPose?this.def.staticPose(this):null, alpha=pose&&pose.alpha!==undefined?pose.alpha:1;
      ctx.save();ctx.translate(this.x,this.y+(pose&&pose.dy||0));ctx.rotate(pose&&pose.rot||0);ctx.globalAlpha*=alpha;
      G.art.draw('enemy_' + this.id, ctx, { x:0,y:0,w:a.w,h:a.h,face:this.face,ent:this });
      if(this.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=0.55;G.art.draw('enemy_'+this.id,ctx,{x:0,y:0,w:a.w,h:a.h,face:this.face,ent:this});}
      ctx.restore();
      if(this.def.staticFx)this.def.staticFx(this,ctx);
    } else G.art.draw('enemy_' + this.id, ctx, { x: this.x, y: this.y, w: this.w, h: this.h, face: this.face, ent: this });
    if (this.elite && !this.dead) {
      ctx.save(); ctx.translate(this.x, this.y - this.h - 9); ctx.rotate(Math.PI/4);
      ctx.fillStyle='#d6b767';ctx.globalAlpha=0.82;ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#4b3519';ctx.fillRect(-2,-2,4,4);
      ctx.restore();ctx.globalAlpha=1;
    }
    if (G.debugBoxes) this.drawBox(ctx, skin);
  }
  // Watercolor art (F2): a skin from G.enemySkins replaces the code-drawn enemy. The definition's skinFrame picks strip and frame from the
  // real state (wind-up frames spread over the wind-up time, the strike frame during the hit, recovery after); the base class adds a hurt
  // lean and squash while knocked back and a quick turn-around squeeze when the facing changes.
  drawSkin(ctx, skin) {
    let pick = this.def.skinFrame && this.def.skinFrame(this, skin);
    let name = pick ? pick[0] : 'move', frame = pick ? pick[1] : G.time * (skin.fps || 8), rot = pick && pick[2] || 0;
    if (!G.art.hasStrip(skin.id + '_' + name)) { name = 'move'; frame = G.time * (skin.fps || 8); }
    const strip = skin.id + '_' + name, st = G.strips[strip], k = skin.h / st.fh, face = this.face || 1;
    if (this.pf !== face) { this.turnAt = this.pf === undefined ? -9 : G.time; this.pf = face; }
    const turn = Math.min(1, (G.time - this.turnAt) / 0.14), hurt = this.kbT > 0 ? this.kbT / 0.12 : 0;
    const py = skin.center ? this.y - this.h / 2 : this.y;
    ctx.save(); ctx.translate(this.x, py);
    ctx.rotate(rot + (hurt ? Math.sign(this.kbV) * 0.2 * hurt : 0));
    ctx.scale(0.3 + 0.7 * turn, 1 - 0.1 * hurt);
    const o = { x: 0, y: skin.center ? skin.fig * k / 2 : 0, face, h: skin.h, foot: 4 };
    G.art.drawFrame(strip, ctx, frame, o);
    if (this.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; G.art.drawFrame(strip, ctx, frame, o); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
  }
  drawBox(ctx, skin) {
    const r = this.rect(); ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = '#ff00ff'; ctx.strokeRect(r.x0, r.y0, this.w, this.h);
    ctx.beginPath(); ctx.moveTo(this.x - 5, this.y); ctx.lineTo(this.x + 5, this.y); ctx.moveTo(this.x, this.y - this.h / 2 - 4); ctx.lineTo(this.x, this.y - this.h / 2 + 4); ctx.stroke();
    ctx.fillStyle = '#ff00ff'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText(this.state + (skin ? ' ' + skin.id : ''), this.x, r.y0 - 3); ctx.restore();
  }
}
G.Enemy = Enemy;
})();
