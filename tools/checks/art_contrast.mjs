// Palette-level gameplay readability floor. The dark gameplay outline must contrast >=3:1 with each region's dominant backdrop.
export default async ({page})=>{
 const r=await page.evaluate(()=>{
  const bad=[],out={},ids=['hub','r1','r2','r3','r4','final'];
  for(const id of ids){const p=G.art.palette(id),bg=p.near||p.sky1||p.sky0,ink='#14181c';const ratio=G.world.ratio(ink,bg);out[id]=+ratio.toFixed(2);if(ratio<3)bad.push(id+' '+ratio.toFixed(2)+':1');}
  return{bad,out,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error('outline/backdrop contrast below 3:1: '+r.bad.join(', '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));
 return 'outline/backdrop ratios '+JSON.stringify(r.out);
};