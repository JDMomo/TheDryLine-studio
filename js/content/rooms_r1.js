/* CONTENT: room templates for region r1, Wreck Quay. THE WORKED EXAMPLE for rooms (characters: js/game/rooms.js).
   A region needs: at least three 'main' rooms (open at rows 12 to 14 on both edges, crossable left to right with run and
   jump only, about one doorway D each), one 'arena' (open on the left, a boss door, a B marker), one 'trial' (signal
   post M, reached by a short platforming test) and one 'branch' room of its own (a guarded plinth I: enemies must be
   cleared before it can be taken). Rows are 30 characters per screen cell wide and 17 per cell tall; G.defineRoom
   reports any row of the wrong length. Base moves: a full jump rises about 4 tiles and carries about 6 across. */
(() => {
'use strict';
const G = window.G;
const WALL = '##############################';



/* Painter: a room starts as a box with a solid floor (rows 15 and 16) and open side exits at rows 12 to 14; put(row, col, text)
   stamps text over it ('~' leaves a tile as it is). Rows are numbered from the top of the room. */
function paint(w, closed, edits) {
  const cols = 30 * w, g = [];
  for (let r = 0; r < 17; r++) {
    let s = '';
    for (let c = 0; c < cols; c++) {
      let ch = '.';
      if (r === 0 || r >= 15) ch = '#';
      else if ((c === 0 || c === cols - 1) && (closed || r < 12 || r > 14)) ch = '#';
      s += ch;
    }
    g.push(s.split(''));
  }
  const put = (r, c, t) => { for (let i = 0; i < t.length; i++) if (t[i] !== '~') g[r][c + i] = t[i]; };
  const fill = (r0, r1, c0, c1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch; };
  edits({ put, fill });
  return g.map(r => r.join(''));
}

// 1. Hull ribs as stepped platforms, a lost trunk on a high plank, the doorway on the lee side.
G.defineRoom({
  id: 'r1_ribs', region: 'r1', kind: 'main',
  map: paint(1, false, ({ put, fill }) => {
    fill(12, 14, 8, 10, '#');                 // first rib, 3 high
    fill(10, 14, 13, 15, '#');                // second rib, 5 high (reached by the plank)
    put(11, 11, '==');                        // plank between the ribs
    put(8, 17, '=====');                      // high plank
    put(7, 19, 'C');
    fill(12, 14, 19, 21, '#');                // third rib, low again
    put(14, 24, 'E');     put(11, 20, 'E');                         // crab on the third rib
    put(14, 26, 'D');
    put(14, 23, 'E');
  })
});

// 2. A chain-hung crossing over a spike pit, trunk on a plank above the middle. The planks are six tiles long with two-tile gaps: a plain
//    running jump from the end of one plank lands in the middle of the next, so a new player can cross by just jumping at each edge.
G.defineRoom({
  id: 'r1_chain', region: 'r1', kind: 'main',
  map: paint(1, false, ({ put, fill }) => {
    put(15, 7, '^^^^^^^^^^^^^^^');            // pit, cols 7 to 21 (spikes visible, floor row 15)
    put(13, 8, '======');                     // chain plank 1, cols 8 to 13
    put(13, 16, '======');                    // chain plank 2, cols 16 to 21
    put(10, 12, '====');                      // upper plank over the pit (3 tiles above the chain planks)
    put(9, 13, 'C');
    put(14, 24, 'E');
    put(11, 14, '~');
    put(14, 27, 'D');
    put(14, 22, 'E');
  })
});

// 3. Arrival Gangway — authored onboarding, two screens wide.
// SCREEN 1 is intentionally calm: room to move, a one-tile hop, then one readable Strider in open ground.
// SCREEN 2 introduces Wreck Quay's route language: mud is the slow safe floor while a short upper plank line stays clean.
// No spike pit, no crumble, no spring and no mandatory side room: the player learns the verbs before the line asks for execution.
G.defineRoom({
  id: 'r1_gangway', region: 'r1', kind: 'main', w: 2,
  signs: ['WRECK QUAY — PASSENGER PRIORITY. Freight markings remain beneath the evacuation chalk.'],
  decor:[{type:'crate_decor',c:7,r:14},{type:'crate_decor',c:15,r:14},{type:'banner_decor',c:19,r:14},{type:'crate_decor',c:49,r:14}],
  map: paint(2, false, ({ put, fill }) => {
    // Arrival shelter: a low but generous roof frames the first twenty tiles without restricting the jump arc.
    fill(5, 6, 3, 17, '#');                   // (a two-row roof slab: the solid block above it read as a black void, playtest issue 7)
    put(10, 5, '===========');                 // old awning/catwalk; optional, not required
    fill(14, 14, 18, 19, '#');                // first one-tile threshold
    put(14, 11, '?');

    // First enemy gets a whole flat lane to itself. Intro rules force this to the basic Strider job.
    put(14, 23, 'E');

    // First regional terrain lesson: the floor remains safe, mud merely slows.
    put(15, 28, 'mmmmmmmm');
    put(11, 29, '======');                    // clean upper bypass
    fill(13, 14, 38, 40, '#');                // wreck rib step to/down from upper route

    // No second enemy here: the remainder of the opener is movement/terrain breathing room.
    put(10, 42, '========');                  // observation plank / readable upper line
    fill(13, 14, 52, 54, '#');                // broken buffer before the exit
  })
});

// 4. Beached Deck — a two-screen ship-hull landmark.
// The base route climbs onto the broken deck, crosses the open hold, then descends the bow.
// A continuous upper mast/plank route is faster and carries the signal-trial doorway; falling from it returns to the safe deck.
G.defineRoom({
  id: 'r1_wreck', region: 'r1', kind: 'main', w: 2,
  signs:['QUAY SERVICE — potable brine. Emergency passengers first.'],
  decor:[{type:'banner_decor',c:16,r:10},{type:'crate_decor',c:31,r:11},{type:'crate_decor',c:45,r:11},{type:'lamp_decor',c:35,r:14},{type:'furnace_decor',c:37,r:14}],
  map: paint(2, false, ({ put, fill }) => {
    // Stern ascent and broad deck: chunky ship silhouette, not a scatter of unrelated boxes.
    fill(13, 14, 7, 10, '#');
    fill(11, 14, 11, 18, '#');
    fill(12, 14, 19, 34, '#');
    fill(13, 14, 35, 38, '#');

    // Open hold cut through the deck; safe floor remains below.
    fill(12, 14, 24, 28, '.');
    put(14, 26, 'E');

    // Mast / upper traverse. Every gap is a plain running jump; falling returns to deck or floor.
    put(8, 13, '======');
    put(6, 21, '======');
    put(8, 29, '======');
    put(7, 34, 'D');                          // signal-mast access: authored parent for Dash trial
    put(9, 38, '======');

    // Wreck Quay signature on the safe deck: mud slows but does not block; the cart is a readable moving landmark.
    put(15, 35, 'mmmm');
    put(14, 41, 'Q');

    // Quiet service pocket: one deliberate breath after the landmark climb and before the final encounter lane.
    put(14, 39, 'H');
    put(14, 40, '?');

    // Bow descent and final open fight lane. No enemy can pressure the repair point.
    fill(12, 14, 42, 46, '#');
    fill(14, 14, 47, 49, '#');
    put(14, 49, 'E');
    put(14, 55, 'E');
  })
});

// 5. A low tunnel with brine spouts; a chimney in the roof holds a trunk.
G.defineRoom({
  id: 'r1_tunnel', region: 'r1', kind: 'main',
  signs:[
    'BRINE PURGE — keep the service lane clear. Pressure equipment may vent without warning.',
    'TOLL HOUSE AHEAD — present fare authority at the inspection line.'
  ],
  decor:[{type:'lamp_decor',c:5,r:14},{type:'crate_decor',c:25,r:14}],
  map: paint(1, false, ({ put, fill }) => {
    fill(1, 10, 1, 28, '#');                  // roof (rows 11 to 14 open)
    fill(1, 10, 1, 28, '#');
    fill(6, 10, 14, 17, '.');                 // chimney
    fill(8, 10, 18, 19, 't');                 // optional tar pocket beside the chimney; fire opens it, main route ignores it
    fill(14, 14, 14, 17, '#');                // one-tile service curb under the low roof; plain jump stays readable
    put(13, 15, '#');                         // one-tile stair post under the open chimney (full headroom there): curb, post, then the ledge
    put(10, 14, '===');                       // 3 tiles above the stair post; column 17 stays open so you can walk off it (no Down + Jump needed)
    put(9, 15, 'C');
    put(14, 4, '?');                           // same emergency-sign language as the arrival/service rooms
    put(14, 9, 'E');
    put(13, 16, 'E');                         // on top of the curb (it used to be stamped INTO the curb at row 14, which cut a one-tile slot that boxed the enemy in: playtest round 2, issue 6)
    put(14, 21, 'E');
    put(14, 25, '?');                           // quiet final warning before the main exit / Toll House
    put(14, 27, 'D');
  })
});

// 6. Dockyard split route, two screens wide.
//    LOW / SAFE: stay on the floor through sucking mud and small wreck steps. Slow, readable and always base-move safe.
//    HIGH / FAST: climb the first wreck and chain jumps across planks plus two crumbling ledges, bypassing most mud and ground enemies.
//    SECRET POCKET: a separate spring at the far quay launches into a high maintenance alcove holding the lost trunk; it is never required.
G.defineRoom({
  id: 'r1_dock', region: 'r1', kind: 'main', w: 2,
  decor:[{type:'crate_decor',c:17,r:14},{type:'banner_decor',c:34,r:14},{type:'crate_decor',c:46,r:14}],
  map: paint(2, false, ({ put, fill }) => {
    // Safe low lane: no spikes, crumble or forced launch. Mud is the cost of taking the forgiving route.
    put(15, 4, 'mmmmmmmm');
    fill(13, 14, 14, 16, '#');                // low wreck step, only two tiles high
    put(15, 19, 'mmmmmmmmmm');
    fill(13, 14, 31, 33, '#');
    put(15, 36, 'mmmmmmmmmm');
    fill(13, 14, 48, 50, '#');

    // Fast upper lane. Every ordinary gap is within a base running jump; c tiles demand commitment but never block the low route.
    put(11, 12, '======');                    // climb from the first low wreck
    put(9, 20, '=====');
    put(10, 26, 'cc');                        // first collapsing transfer
    put(8, 29, '======');
    put(10, 36, 'cc');                        // second collapsing transfer
    put(11, 39, '======');                    // drops back beside the far quay

    // Independent secret/reward detour. Spring launch reaches the alcove; the player drops back to either route.
    put(15, 52, 'j');
    put(9, 49, '======');
    put(8, 52, 'C');

    // Encounters bias the slow lane; the high lane trades footing risk for fewer bodies and speed.
    put(14, 6, 'Q');                         // maintenance cart shuttles across the first mud stretch
    put(14, 9, 'E');
    put(14, 24, 'E');
    put(14, 42, 'E');
    put(14, 56, 'D');
  })
});

// Toll House — two-screen authored boss approach.
// The first twenty columns are a quiet inspection vestibule. Crossing the iron threshold wakes the Tollkeeper.
// The fight floor keeps the proven corner escape shelves: one jump up, then a jump past the Warden.
G.defineRoom({
  id:'r1_arena', region:'r1', kind:'arena', w:2,
  signs:['TOLL HOUSE — EVACUATION LEDGER CLOSED. AWAIT CANCELLATION AUTHORITY.'],
  decor:[
    {type:'crate_decor',c:7,r:14},{type:'crate_decor',c:15,r:14},{type:'banner_decor',c:19,r:14},
    {type:'lamp_decor',c:22,r:14},{type:'furnace_decor',c:24,r:14},{type:'banner_decor',c:27,r:14},
    {type:'banner_decor',c:55,r:14},{type:'lamp_decor',c:57,r:14}
  ],
  map: paint(2, false, ({put,fill})=>{
    // Arena rooms close on the right. The normal painter leaves a main-room exit there, so seal it explicitly.
    fill(1,14,59,59,'#');

    // Inspection office / vestibule: a roof mass and ledger shelves create a place before the battle.
    fill(2,8,3,12,'#');
    put(10,5,'========');
    fill(2,10,14,19,'#');
    put(14,6,'?');

    // Iron boss threshold. Arena parsing chooses the FIRST row-11 solid over a 3-tile opening,
    // so clear the painter's ordinary left wall along the vestibule before stamping the intended threshold.
    fill(11,11,0,19,'.');
    put(11,20,'#');

    // Escape shelves exactly three tiles above the floor and tight to both fight walls.
    put(12,21,'====');
    put(12,55,'====');

    // Sparse upper ledgers give the room silhouette without obstructing charges or jumps.
    put(8,28,'======');
    put(8,45,'======');

    // Boss wakes on the broad inspection floor. No interior solid blocks interrupt charge/leap trajectories.
    put(14,43,'B');
  })
});

// Trial: climb the planks to the Dash signal post (base moves). Past the post an 8 tile gap leads to a slab that only a dash
// reaches; the way back is a drop to the floor, so skipping the gap costs nothing.
G.defineRoom({
  id: 'r1_trial', region: 'r1', kind: 'trial', label: 'Signal post',
  map: paint(1, true, ({ put, fill }) => {
    put(14, 3, 'D');
    put(12, 7, '====');
    put(9, 11, '====');
    put(6, 14, '======'); put(5, 17, 'M');
    fill(6, 7, 26, 28, '#');                  // far slab, 8 tiles of air from the post plank
    put(15, 22, '^^^^');                      // spikes under the drop, visible
    put(15, 22, '....');
  })
});

// The region's own branch room: the Sealed Cell. Its plinth lies at the end of a low tunnel (3 tiles of headroom, rock above) shut by a
// cracked barrier. Only a heavy cut (Heavy Cut, found in Ticket Hall's trial) breaks it; there is no way over, under or round.
G.defineRoom({
  id: 'r1_hold', region: 'r1', kind: 'branch', label: 'Sealed cell', needs: ['heavy'],
  signs: [],
  map: paint(1, true, ({ put, fill }) => {
    fill(1, 11, 12, 28, '#');                 // rock over the tunnel: rows 12 to 14 are all the headroom there is
    put(14, 3, 'D');
    put(14, 7, 'E'); put(14, 10, 'E'); put(6, 8, 'F');
    put(14, 17, 'X');                         // the cracked barrier, 3 tiles tall (rows 12 to 14)
    put(14, 22, 'E');                         // a crab inside, which the plinth's guard rule counts
    put(14, 26, 'I');
  })
});

Object.assign(G.roomDefs.r1_trial,{decor:[{type:'banner_decor',c:5,r:14},{type:'lamp_decor',c:13,r:14},{type:'banner_decor',c:26,r:7}]});
Object.assign(G.roomDefs.r1_hold,{decor:[{type:'crate_decor',c:5,r:14},{type:'lamp_decor',c:14,r:14},{type:'crate_decor',c:25,r:14}]});
Object.assign(G.roomDefs.r1_gangway,{enemyPlan:['ballast_crab'],wakePlan:[240]});
Object.assign(G.roomDefs.r1_dock,{enemyPlan:['ballast_crab','sapper','turnstile'],wakePlan:[230,260,270]});
Object.assign(G.roomDefs.r1_tunnel,{enemyPlan:['brine_spout','sapper','ballast_crab'],wakePlan:[230,240,230]});
Object.assign(G.roomDefs.r1_wreck,{enemyPlan:['turnstile','ballast_crab','sapper'],wakePlan:[250,235,250]});

})();
