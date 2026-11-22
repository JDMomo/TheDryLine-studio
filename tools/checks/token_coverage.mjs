// UNTESTED here. Reporting only: 200 generated runs, no tuning or assertion on distribution.
export default async ({page})=>{
 const out=await page.evaluate(()=>{
  const t={exactlyEnough:0,tooFew:0,tooMany:0};
  for(let seed=1;seed<=200;seed++){
   G.debug.newRun(seed);
   const g=G.run.graph,supply=(g.draw&&g.draw.all||[]).filter(Boolean).length;
   const need=Object.values(g.chart||{}).reduce((n,cuts)=>n+cuts.length,0);
   t[supply===need?'exactlyEnough':supply<need?'tooFew':'tooMany']++;
  }
  return t;
 });
 console.log('TOKEN COVERAGE 200 SEEDS');
 console.table([{result:'exactly enough',seeds:out.exactlyEnough},{result:'too few',seeds:out.tooFew},{result:'too many',seeds:out.tooMany}]);
 if(out.exactlyEnough+out.tooFew+out.tooMany!==200)throw new Error('coverage buckets do not total 200');
 return JSON.stringify(out);
};