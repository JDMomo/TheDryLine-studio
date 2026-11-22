// Global enemy tell floor. Damaging authored attacks must expose a >=0.35 s warning state.
export default async ({page})=>{
 const r=await page.evaluate(()=>{
  const floor=.35,bad=[],contract={
   ballast_crab:[['wind',.38]],brine_spout:[['wind',.6],['ventwind',.42]],turnstile:[['wind',.45]],
   signal_gull:[['wind',.55]],lamp_wisp:[['charge',.45]],brine_toad:[['crouch',.4]],
   handcar:[['wind',.65]],hanging_lamp:[['shake',.45]],sapper:[['wind',.7]],
   harvester:[['wind',.85]],mirage:[['tell',.5]]
  };
  for(const [id,states] of Object.entries(contract)){if(!G.enemyDefs[id]){bad.push('missing '+id);continue}
    for(const [state,t] of states)if(t<floor)bad.push(id+' '+state+' '+t+' < '+floor);
  }
  return{bad,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error(r.bad.join(' | '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));
 return 'all authored damaging tells are >= 0.35 s';
};