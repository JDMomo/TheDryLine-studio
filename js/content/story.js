/* STORY: short in-play narrative beats for The Dry Line. The story is discovered through travel, not cutscenes. */
(() => {
'use strict';
const G = window.G;

const NAMES = {
  junction:'The Junction', junction_signal_stair:'Signal Stair', junction_hall_stair:'Hall Stair',
  r1_ribs:'Hull Ribs', r1_chain:'Chain Crossing', r1_gangway:'Turnstile Gangway', r1_wreck:'Beached Deck', r1_tunnel:'Brine Tunnel', r1_dock:'Wreck Dock',
  r1_trial:'Signal Gantry', r1_hold:'Sealed Cell', r1_arena:'Toll House',
  r2_spire:'Coral Stair', r2_shelves:'Signal Shelves', r2_shaft:'Lamp Shaft', r2_roost:'Gull Roost', r2_ledges:'Ledge Row', r2_tower:'Beacon Tower',
  r2_trial:'Lamp Mast', r2_hold:'Gull Roost Vault', r2_arena:'Heron Basin',
  r3_brines:'Brine Pools', r3_terraces:'Crystal Terraces', r3_trestle:'Salt Trestle', r3_cutting:'White Cutting', r3_pond:'Toad Pond', r3_spire:'Salt Spire',
  r3_trial:'Switch Tower', r3_hold:'Brine-bound Plinth', r3_arena:'Signal Court',
  r4_concourse:'Grand Concourse', r4_booths:'Ticket Booths', r4_balcony:'Upper Balcony', r4_clocks:'Clock Gallery', r4_baggage:'Baggage Tunnel', r4_gateline:'Gate Line',
  r4_trial:'Closed Platform', r4_vault:'Ticket Vault', r4_arena:'Departure Hall',
  final_buffers:'Last Buffers', final_vents:'Steam Gallery', final_gearworks:'Clockworks', final_tower:'Minute Tower', final_arena:'The Long Clock'
};

const INTROS = {
  r1:['Wreck Quay','The tide left first. The tolls did not. A fare token opens a matching slot; punching it spends that token for the run.'],
  r2:['Signal Reef','Dead lamps still repeat a departure code no train can answer.'],
  r3:['Salt Cutting','The old sea lies here as stone. The rails cut straight through it.'],
  r4:['Ticket Hall','Every window is closed. Every machine still asks for fare.'],
  final:['The Terminus','The last timetable ends beneath the great clock.']
};
const DISCOVERIES = {
  r1_dock:['Freight chalk on the wrecks','EVACUATION LOAD. EASTBOUND ONLY. The word “cancelled” was never stamped.'],
  r2_shaft:['Signal record','The lamps are not calling trains in. They are relaying the same unsent message toward the Terminus.'],
  r3_trestle:['Survey mark','The sea withdrew in nine days. The railway was ordered to carry people, not freight, until the final bell.'],
  r4_concourse:['Last timetable','One departure remains uncancelled: TERMINUS 00:00. Authority: LONG CLOCK.'],
  final_gearworks:['Maintenance slate','The Clock cannot disobey a valid timetable. Someone must reach it and punch the final authority by hand.']
};
const FALL = {
  r1:['Tollkeeper released','Its ledger opens to the last page: “All passengers through. Await cancellation.”'],
  r2:['Lamp-Heron darkened','The repeating signal changes once: RECEIVED — TOO LATE.'],
  r3:['Switchman Idol lowered','Its lenses point every surviving route toward the Junction, as if sending people home.'],
  r4:['Gatewhale stopped','Behind its jaw is the original cancellation punch, never delivered to the Terminus.'],
  final:['The final bell','For the first time since the sea withdrew, the railway has no order left to obey.']
};
const ORDERS = {
  r1:['Tollkeeper','FARE UNPAID. PASSAGE DENIED.'],
  r2:['Lamp-Heron','SIGNAL UNRESOLVED. HOLD POSITION.'],
  r3:['Switchman Idol','ROUTE CONFLICT. AWAIT SWITCHING.'],
  r4:['Gatewhale','TICKET INVALID. GATE REMAINS CLOSED.'],
  final:['Long Clock','TIMETABLE VALID. SERVICE CONTINUES.']
};

function ensure() {
  const r=G.run;
  if (!r) return null;
  if (!r.story) r.story={seen:{},notes:[],hubBeat:-1};
  return r.story;
}
function add(id,title,text,show=true,portrait=null) {
  const s=ensure(); if(!s || s.seen[id]) return false;
  s.seen[id]=true; s.notes.push({id,title,text});
  if (show && G.fx) G.fx.say(title,text,4.4,portrait);
  return true;
}
const story=G.story={
  NAMES,
  roomName(id){ return NAMES[id] || String(id||'').replace(/^(r\d|final)_/,'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); },
  enter(room,firstVisit) {
    const s=ensure(); if(!s||!room) return;
    if (firstVisit && INTROS[room.region]) {
      const x=INTROS[room.region]; add('intro:'+room.region,x[0],x[1],true);
    }
    if (firstVisit && DISCOVERIES[room.def.id]) {
      const x=DISCOVERIES[room.def.id]; add('room:'+room.def.id,x[0],x[1],true);
    }
    if (room.kind==='hub') {
      const n=['r1','r2','r3','r4'].filter(k=>G.run.beaten[k]).length;
      if (n!==s.hubBeat) {
        s.hubBeat=n;
        if(n===0) add('hub:0','The Last Timetable','Five routes leave the Junction, every one still open. Tokens punch matching fare slots and are void when spent. The Long Clock borrows one attack from every Warden you leave active. Wreck Quay is the gentlest first line.',true,'guide');
        else if(n===1) add('hub:1','The Junction wakes','One line has gone quiet. Somewhere under the platform, a relay clicks to the next page.',true);
        else if(n===2) add('hub:2','Half the line is silent','The board no longer looks like a challenge. It looks like a chain of messages that failed to arrive.',true);
        else if(n===3) add('hub:3','One Warden remains','Three old machines have released their orders. The Terminus gate sounds different now.',true);
        else if(n===4) add('hub:4','All local orders cleared','Nothing remains between the Junction and the Long Clock except the last timetable itself.',true);
      }
    }
  },
  wardenAwake(region) {
    const x=ORDERS[region]; if(x && G.fx) G.fx.say(x[0],x[1],2.8);
  },
  wardenFell(region) {
    const x=FALL[region]; if(x) add('fall:'+region,x[0],x[1],true);
  },
  objective() {
    if(!G.run) return '';
    const n=['r1','r2','r3','r4'].filter(k=>G.run.beaten[k]).length;
    if(G.run.beaten.final) return 'The line is finally still.';
    if(n===4) return 'Reach the Terminus. Deliver the cancellation to the Long Clock.';
    if(n===0) return 'Wreck Quay is the gentlest first line. All five routes remain open.';
    return 'Clear the remaining Wardens, or risk the Terminus while it still borrows their attacks.';
  },
  latest() { const s=ensure(); return s&&s.notes.length?s.notes[s.notes.length-1]:null; },
  notes() { const s=ensure(); return s?s.notes.slice():[]; },
  epilogue(won) {
    if(won) return 'The last order is cancelled. Lamps go dark one by one, not as a failure, but as permission to stop.';
    return 'The timetable keeps running without you. The next attempt begins with the same old bell.';
  }
};
})();