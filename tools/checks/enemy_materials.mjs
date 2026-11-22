// Enemy material vocabulary: at least one regular enemy in every region exposes a readable material hook.
export default async ({page})=>{
 const r=await page.evaluate(()=>{
  const wanted={
    ballast_crab:['brittle'],brine_spout:['wet'],turnstile:['metal'],signal_gull:['metal'],
    lamp_wisp:['flammable'],brine_toad:['wet'],handcar:['metal','heavy'],hanging_lamp:['metal','brittle'],
    sapper:['metal','flammable'],harvester:['metal','wet'],mirage:['slick']
  },bad=[];
  for(const [id,tags] of Object.entries(wanted)){const d=G.enemyDefs[id];if(!d){bad.push('missing '+id);continue}
    if(!Array.isArray(d.mat))bad.push(id+' has no mat[]');
    else for(const t of tags)if(!d.mat.includes(t))bad.push(id+' missing '+t);
  }
  const regions={r1:['ballast_crab','brine_spout','turnstile','sapper'],r2:['ballast_crab','harvester','signal_gull','lamp_wisp','hanging_lamp'],r3:['ballast_crab','brine_spout','brine_toad','mirage','hanging_lamp'],r4:['ballast_crab','turnstile','handcar','sapper','harvester','lamp_wisp']};
  for(const [rid,ids] of Object.entries(regions))if(!ids.some(id=>(G.enemyDefs[id].mat||[]).length))bad.push(rid+' has no material-reactive cast member');
  return{bad,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error(r.bad.join(' | '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));
 return 'enemy material tags present across all four Warden regions';
};