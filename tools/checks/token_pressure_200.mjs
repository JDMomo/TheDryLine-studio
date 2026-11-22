// 200-seed token-pressure report: classify drawn token supply against the 15 charted Warden slots.
// This is a reporting check, not a balance assertion; Systems uses its distribution to tune scarcity.
export default async ({page})=>{
 const rows=await page.evaluate(()=>{
  const out={short:0,exact:0,over:0,drawn:{},examples:[]};
  for(let seed=1;seed<=200;seed++){G.debug.newRun(seed);const d=G.run.graph.draw,all=(d&&d.all||[]).filter(Boolean),need=5*3,delta=all.length-need;
    const k=delta<0?'short':delta===0?'exact':'over';out[k]++;out.drawn[all.length]=(out.drawn[all.length]||0)+1;if(out.examples.length<8)out.examples.push([seed,all.length,k]);}
  return out;
 });
 return '200 seeds '+JSON.stringify(rows);
};