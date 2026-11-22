// Audio production contract that can run before expensive offline rendering.
export default async ({page})=>{
 const r=await page.evaluate(()=>{
  const bad=[],M=G.music;
  const must=['title','hub','r1','r2','r3','r4','final','quiet','boss_warden','boss_clock'];
  for(const id of must){const t=M.tracks[id];if(!t){bad.push('missing '+id);continue}
    const sec=t.bars*t.sig[0]*(4/t.sig[1])*60/t.bpm;if(id.startsWith('r')&&!(sec>=20&&sec<=55))bad.push(id+' loop '+sec.toFixed(1)+'s');
    const roles=new Set(t.layers.map(l=>l.role));if(!roles.has('bed')||!roles.has('lead')&&!roles.has('motif'))bad.push(id+' lacks melodic/bed layers');
  }
  for(const id of ['r1','r2','r3','r4']){const t=M.tracks[id],roles=new Set(t.layers.map(l=>l.role));if(!roles.has('motif'))bad.push(id+' has no Last Timetable/Line motif layer');}
  const bc=M.tracks.boss_clock;if(!bc.layers.some(l=>l.role==='borrow:r1')||!bc.layers.some(l=>l.role==='borrow:r4'))bad.push('Long Clock lacks borrowed Warden voices');
  const sfx=G.audio.SFX_NAMES;for(const n of ['slash','heavyCut','pogo','dash','slotCrack','slotPunch','bossStagger','bossDefeat'])if(!sfx.includes(n))bad.push('missing sfx '+n);
  return{bad,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error(r.bad.join(' | '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));
 return 'track motif/layer/loop contract and critical hit SFX present';
};