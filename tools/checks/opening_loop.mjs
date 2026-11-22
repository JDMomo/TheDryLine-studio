// Fresh-save teaching contract: the first five-minute surfaces must state the three core choices.
export default async ({page})=>{
 const r=await page.evaluate(()=>{
  const bad=[],src={
   signs:G.worldgen&&G.worldgen.HUB_SIGNS||[],
   story:String(G.story&&G.story.enter),
   objective:G.story&&G.story.objective?G.story.objective():''
  };
  G.debug.newRun(101);G.debug.gotoRoom('junction');G.debug.step(2);
  const notes=G.story.notes().map(n=>n.text).join(' ');
  const all=(notes+' '+src.objective).toLowerCase();
  if(!/token/.test(all)||!/(fare|slot)/.test(all))bad.push('arrival does not teach token/slot');
  if(!/(void|spent)/.test(all))bad.push('arrival does not teach token loss');
  if(!/(borrow)/.test(all))bad.push('arrival does not teach Long Clock borrowing');
  const rr=G.run.graph.regions.r1, mains=(rr.nodes||[]).filter(id=>G.roomDefs[G.run.graph.nodes[id].def].kind==='main');
  const trunk=mains.some(id=>{const node=G.run.graph.nodes[id];return (node.content||[]).some(c=>c&&c.type==='trunk')||(node.extras||[]).some(e=>e.type==='trunk');});
  if(!trunk)bad.push('Wreck Quay mains have no guaranteed pre-Warden teaching trunk');
  return{bad,notes,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error(r.bad.join(' | '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));
 return 'fresh arrival states token slots, void spend and borrowed attacks; pre-Warden Wreck Quay trunk exists';
};