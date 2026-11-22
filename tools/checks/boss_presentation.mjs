// Shared Warden presentation and multipart collision contract.
export default async ({page})=>{
 const r=await page.evaluate(()=>{
  const D=G.debug,bad=[],regions=['r1','r2','r3','r4','final'];
  for(const rid of regions){
    D.fullCharts=true;D.newRun(33);D.god(true);D.startBoss(rid);const b=G.rooms.current.boss;
    if(b.state!=='intro'||Math.abs(b.t0-1.5)>.02)bad.push(rid+' intro not 1.5s');
    if(!G.cam.bossCue)bad.push(rid+' no camera cue');
    const open=b.spots.find(s=>s.open)||b.spots[0];if(!open)bad.push(rid+' no fare slot');
    else {const q=b.spotPos(open);open.hp=G.C.SPOT_HP;open.open=true;const hp=open.hp;b.hitSpot(open,{x:q.x,y:q.y,r:5,cls:open.cls,dmg:0,itemId:null,owner:G.players[0]});if(open.hp!==hp-1)bad.push(rid+' spot did not crack');}
    b.set('idle',1);b.hp=b.maxHp*.49;D.step(1);if(!b.phase2||(rid!=='final'&&b.state!=='stagger')||(rid==='final'&&b.state==='stagger'))bad.push(rid+' no half-health phase beat');
    b.hp=1;b.damage(99999);D.step(2);if(b.state!=='dead'||b.deathWash<=0)bad.push(rid+' no death wash');
  }
  // Synthetic two-part shape proves body hit tests no longer use only the bounding box.
  D.newRun(3);D.god(true);D.startBoss('r1');const b=G.rooms.current.boss;
  b.def.shapes=()=>[{x0:b.x-60,x1:b.x-30,y0:b.y-60,y1:b.y},{x0:b.x+30,x1:b.x+60,y0:b.y-60,y1:b.y}];
  if(b.hitsCircle(b.x,b.y-30,4))bad.push('multipart gap counted as body');
  if(!b.hitsCircle(b.x-45,b.y-30,4))bad.push('multipart lobe did not count');
  return{bad,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error(r.bad.join(' | '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));
 return 'five Wardens: 1.5s intro/camera cue, half-health beat, slot crack, death wash; multipart gap respected';
};