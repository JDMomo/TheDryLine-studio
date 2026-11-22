// File-safe contrast contract: compare the actual player readability rim against code-owned backdrop/tile colours.
export default async ({page})=>{
 const r=await page.evaluate(()=>{
  const ids=['hub','r1','r2','r3','r4','final'],outline=G.art.playerOutline||'#fff3c4',out={},bad=[];
  for(const id of ids){
   const p=G.art.palette(id),w=G.world.REG[id]||G.world.REG.hub;
   const samples={sky0:p.sky0,sky1:p.sky1,near:p.near,tile:p.tile,side:p.side,worldDeep:w.deep,worldInk:w.ink};
   out[id]={};for(const [name,col] of Object.entries(samples)){const q=G.world.ratio(outline,col);out[id][name]=+q.toFixed(2);if(q<3)bad.push(id+' '+name+' '+q.toFixed(2)+':1');}
  }
  return{bad,out,outline,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error('player rim contrast below 3:1: '+r.bad.join(', '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));return 'player rim '+r.outline+' contrast '+JSON.stringify(r.out);
};