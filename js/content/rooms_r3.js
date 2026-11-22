/* CONTENT: room templates for region r3, Salt Cutting. So far only the arena of the Switchman Idol (id r3_arena).
   Main rooms, trial and branch room are built below with a small grid helper (mk / fill / put / out).
   The arena follows r1_arena: a hall (columns 0 to 2), the boss door (column 3, solid down to row 11, open at rows 12 to 14),
   25 tiles of floor. Instead of perches it has one-way salt ledges: two at row 12 (96 px up, a plain jump reaches them,
   good for shooting the Top Lens straight) and one high ledge at row 9 (192 px up, reached from the low ledges). */
(() => {
'use strict';
const G = window.G;
const WALL = '#'.repeat(30), L = '####' + '.'.repeat(25) + '#';          // 4 + 25 + 1 = 30
const ledge = (s, c0, c1) => s.slice(0, c0) + '='.repeat(c1 - c0 + 1) + s.slice(c1 + 1);
const FLOOR = '.'.repeat(29) + '#';


// ---- grid helper: mk() gives a blank room, fill() paints a rectangle, put() sets one tile, out() makes the rows.
const mk = (w, closed) => {
  const cols = 30 * w, g = [];
  for (let r = 0; r < 17; r++) g.push(Array(cols).fill('.'));
  g[0].fill('#'); g[15].fill('#'); g[16].fill('#');
  for (let r = 0; r < 17; r++) if (closed || r < 12 || r > 14) { g[r][0] = '#'; g[r][cols - 1] = '#'; }
  return g;
};
const fill = (g, r0, r1, c0, c1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch; };
const put = (g, r, c, ch) => { g[r][c] = ch; };
const out = g => g.map(r => r.join(''));

// Brine Flats — two-screen Salt Cutting arrival.
// The basin is safe: long salt shelves teach slide/dissolve over permanent floor. A single upper plank gives a clean route
// and one enemy is staged on each half so the player reads the material before combat density rises.
{
  const g=mk(2);
  fill(g,14,14,6,15,'s');
  fill(g,14,14,21,31,'s');
  fill(g,14,14,38,49,'s');
  fill(g,11,11,10,18,'=');
  fill(g,10,10,27,35,'=');
  fill(g,11,11,44,52,'=');
  put(g,13,12,'E');
  put(g,13,42,'E');
  put(g,9,31,'C');
  G.defineRoom({id:'r3_brines',region:'r3',kind:'main',w:2,map:out(g)});
}

// Crystal terraces: two steps up, a drop, a short spiked trench, a trunk on the top terrace.
{
  const g = mk(1);
  fill(g, 13, 15, 8, 13, '#'); fill(g, 11, 15, 14, 19, '#');
  fill(g, 13, 13, 8, 13, 's'); fill(g, 11, 11, 14, 19, 's');       // exposed salt crust: fast but slippery; Wet erodes the top layer
  fill(g, 15, 15, 3, 7, 's'); fill(g, 15, 15, 24, 27, 's');       // low salt shelves bookend the safer stepped route
  fill(g, 12, 12, 20, 22, '=');   // a step so the 4-tile terrace face can be climbed from the right
  put(g, 10, 15, 'C'); put(g, 12, 10, 'E'); put(g, 10, 18, 'E'); put(g, 14, 21, 'E'); put(g, 14, 27, 'D'); put(g, 2, 7, 'L');
  G.defineRoom({ id: 'r3_terraces', region: 'r3', kind: 'main', map: out(g) });
}

// Rail trestle, two screens wide: three-route Salt Cutting showcase.
// LOW / SAFE: raised salt-crust patches sit over the permanent floor; Wet can dissolve the crust without opening a death pit.
// HIGH / FAST: old rail planks plus crumble transfers skip most of the slippery floor.
// SECRET POCKET: a spring near the far cutting launches to a separate survey shelf with the lost trunk.
{
  const g = mk(2);

  // Safe low route. Salt sits one tile above the permanent floor so dissolving it only drops the player onto ordinary ground.
  fill(g, 14, 14, 5, 13, 's');
  fill(g, 14, 14, 18, 27, 's');
  fill(g, 14, 14, 33, 43, 's');

  // High rail line: readable one-way runs broken by two committed crumble transfers.
  fill(g, 11, 11, 8, 14, '=');
  fill(g, 9, 9, 17, 22, '=');
  fill(g, 10, 10, 24, 25, 'c');
  fill(g, 8, 8, 28, 34, '=');
  fill(g, 10, 10, 37, 38, 'c');
  fill(g, 11, 11, 41, 47, '=');

  // Independent survey pocket.
  put(g, 15, 52, 'j');
  fill(g, 9, 9, 50, 56, '=');
  put(g, 8, 53, 'C');

  // Encounters stay mostly on the low line.
  put(g, 13, 11, 'E'); put(g, 13, 24, 'E'); put(g, 13, 39, 'E'); put(g, 14, 56, 'D');
  G.defineRoom({ id: 'r3_trestle', region: 'r3', kind: 'main', w: 2, map: out(g) });
}

// White Cutting — compressed pre-Warden corridor.
// Canyon walls squeeze the view, but the floor stays fair. One exposed upper survey shelf holds the guarded-branch doorway;
// the last enemy has a long empty lane so Mirage/Boiler tells remain readable.
{
  const g=mk(1);
  fill(g,1,8,1,6,'#');
  fill(g,1,7,23,28,'#');
  fill(g,12,14,8,10,'#');
  fill(g,12,14,19,21,'#');
  fill(g,9,9,11,18,'=');
  put(g,8,15,'D');
  put(g,14,12,'E');
  put(g,14,24,'E');
  G.defineRoom({id:'r3_cutting',region:'r3',kind:'main',map:out(g)});
}

// A toad pond under a low ceiling: a shallow dip, a hanging crystal, a shelf with a trunk.
{
  const g = mk(1);
  fill(g, 1, 8, 1, 28, '#'); fill(g, 9, 10, 13, 16, '#');
  fill(g, 15, 15, 8, 19, '.');
  fill(g, 13, 15, 21, 24, '#');
  put(g, 14, 6, 'E'); put(g, 15, 11, 'E'); put(g, 15, 18, 'E'); put(g, 12, 23, 'C'); put(g, 14, 27, 'D'); put(g, 9, 20, 'L');
  G.defineRoom({ id: 'r3_pond', region: 'r3', kind: 'main', map: out(g) });
}

// A salt spire: climb the planks over a central column; the doorway is on its top, a trunk on a high plank.
{
  const g = mk(1);
  fill(g, 7, 15, 12, 17, '#');
  fill(g, 12, 12, 6, 9, '='); fill(g, 9, 9, 9, 11, '='); fill(g, 9, 9, 18, 20, '='); fill(g, 12, 12, 21, 24, '='); fill(g, 6, 6, 22, 25, '=');
  put(g, 6, 13, 'D'); put(g, 6, 16, 'E'); put(g, 14, 8, 'E'); put(g, 14, 22, 'E'); put(g, 5, 23, 'C');
  G.defineRoom({ id: 'r3_spire', region: 'r3', kind: 'main', map: out(g) });
}

// Trial: planks and a ledge up to the Double Jump signal post, then a nine-tile gap only a double jump crosses.
{
  const g = mk(1, true);
  fill(g, 12, 12, 6, 9, '='); fill(g, 9, 15, 11, 15, '#'); fill(g, 9, 9, 25, 28, '#'); fill(g, 14, 14, 25, 28, '#');
  fill(g, 10, 14, 25, 28, '#');
  put(g, 14, 3, 'D'); put(g, 8, 13, 'M');
  G.defineRoom({ id: 'r3_trial', region: 'r3', kind: 'trial', label: 'Switch tower', map: out(g) });
}

// Branch (needs Wall Grip): a three tile chimney, nine tiles tall and with no shelves, climbs to the ledge that holds the plinth. A crab guards
// the ledge, a pair guard the floor. Without Wall Grip the ledge is 9 tiles up: nothing reaches it.
{
  const g = mk(1, true);
  fill(g, 6, 14, 9, 11, '#'); fill(g, 6, 14, 15, 28, '#');          // the chimney is columns 12 to 14; the right ledge is its top
  put(g, 14, 3, 'D'); put(g, 14, 6, 'E'); put(g, 14, 12, 'E'); put(g, 7, 5, 'F'); put(g, 5, 21, 'E'); put(g, 5, 26, 'I');
  G.defineRoom({ id: 'r3_hold', region: 'r3', kind: 'branch', label: 'Brine-bound plinth', needs: ['grip'], map: out(g) });
}

G.defineRoom({
  id: 'r3_arena', region: 'r3', kind: 'arena',
  decor:[{type:'crate_decor',c:5,r:14},{type:'banner_decor',c:15,r:14},{type:'crate_decor',c:27,r:14}],
  map: [
    WALL,
    L, L, L, L, L, L, L, L,
    ledge(L, 12, 17),
    L,
    '...#' + '.'.repeat(25) + '#',
    ledge(ledge(FLOOR, 4, 13), 21, 28),
    FLOOR,
    '.'.repeat(22) + 'B' + '.'.repeat(6) + '#',
    WALL, WALL
  ]
});

/* ---------- Authored Salt Cutting campaign spine ---------- */
(() => {
  const wide=(id,build,signs=[])=>{
    const W=60,H=17,g=Array.from({length:H},()=>Array(W).fill('.'));
    g[0].fill('#');g[15].fill('#');g[16].fill('#');
    for(let r=0;r<H;r++)if(r<12||r>14){g[r][0]='#';g[r][W-1]='#';}
    const fill=(r0,r1,c0,c1,ch)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)g[r][c]=ch;};
    const put=(r,c,ch)=>g[r][c]=ch;
    build({g,fill,put,W,H});
    G.defineRoom({id,region:'r3',kind:'main',w:2,map:g.map(x=>x.join('')),signs});
  };

  // 1. Brine Flats — readable introduction to slippery salt. Salt sits over permanent floor, so Wet never creates a death trap.
  wide('r3_brines',({fill,put})=>{
    fill(14,14,5,15,'s'); fill(14,14,22,33,'s'); fill(14,14,41,52,'s');
    fill(15,15,34,38,'>');
    fill(12,14,17,19,'#'); fill(13,14,35,37,'#');
    fill(10,10,9,15,'='); fill(9,9,26,32,'='); fill(10,10,44,50,'=');
    put(13,12,'E'); put(13,29,'E'); put(13,47,'E');
    put(14,56,'D'); put(13,5,'?');
  },['Salt keeps the shape of the vanished sea better than stone does.']);

  // 2. Salt Trestle — low safe salt line, exposed crumble rail above, independent spring survey pocket.
  wide('r3_trestle',({fill,put})=>{
    fill(14,14,4,14,'s'); fill(14,14,18,28,'s'); fill(14,14,33,44,'s');
    fill(13,14,15,17,'#'); fill(13,14,29,31,'#'); fill(13,14,45,47,'#');
    fill(11,11,7,13,'='); fill(9,9,16,22,'='); fill(10,10,24,25,'c');
    fill(8,8,28,34,'='); fill(10,10,37,38,'c'); fill(11,11,41,48,'=');
    put(15,53,'j'); fill(9,9,51,57,'='); put(8,54,'C');
    put(13,10,'E'); put(13,26,'E'); put(13,42,'E');
    put(14,56,'D'); put(14,4,'?');
  },['The old survey rail crosses the cutting where the sea floor cracked first.']);

  // 3. Crystal Terraces — a broad stepped room where low salt and high stable shelves weave around each other.
  wide('r3_terraces',({fill,put})=>{
    fill(14,14,5,12,'s'); fill(13,14,16,20,'#'); fill(12,14,24,28,'#'); fill(11,14,32,36,'#'); fill(13,14,42,46,'#');
    // Crystal-like salt shelves are solid, but each has a stable stone landing beside it.
    fill(10,10,8,14,'s'); fill(9,9,18,24,'s'); fill(8,8,28,34,'s'); fill(9,9,38,44,'s'); fill(10,10,48,54,'s');
    fill(11,11,13,16,'='); fill(10,10,23,26,'='); fill(9,9,33,36,'='); fill(10,10,43,46,'=');
    // Mirage territory: generous recovery floor around every ambush point.
    put(13,11,'E'); put(12,19,'E'); put(8,35,'E'); put(14,48,'E');
    put(14,56,'D'); put(13,5,'?');
  },['Nine days from tide mark to dry rail. The survey crew numbered each new shelf.']);

  // 4. Salt Spire — combines salt footing, crumble transfers and a spring bypass before the Switchman.
  wide('r3_spire',({fill,put})=>{
    fill(14,14,4,12,'s'); fill(13,14,15,18,'#'); fill(12,14,22,25,'#'); fill(11,14,29,32,'#'); fill(12,14,36,39,'#'); fill(13,14,44,47,'#');
    fill(10,10,8,14,'='); fill(8,8,17,23,'='); fill(9,9,25,26,'c'); fill(7,7,30,36,'='); fill(9,9,39,40,'c'); fill(10,10,43,50,'=');
    put(15,28,'j'); // optional central launch straight to the high line
    // A dissolvable salt cache is off-route and never required.
    fill(7,9,52,53,'s'); fill(10,10,51,55,'='); put(9,55,'C');
    put(13,10,'E'); put(11,24,'E'); put(14,43,'E'); put(8,34,'F');
    put(14,56,'D'); put(14,5,'?');
  },['SWITCH APPROACH — route conflict remains unresolved.']);
})();


Object.assign(G.roomDefs.r3_trial,{decor:[{type:'banner_decor',c:5,r:14},{type:'crate_decor',c:9,r:14},{type:'banner_decor',c:24,r:14}]});
Object.assign(G.roomDefs.r3_hold,{decor:[{type:'crate_decor',c:5,r:14},{type:'banner_decor',c:20,r:5},{type:'crate_decor',c:25,r:5}]});
Object.assign(G.roomDefs.r3_brines,{enemyPlan:['brine_toad','brine_spout','ballast_crab'],wakePlan:[225,250,245],
  decor:[{type:'crate_decor',c:6,r:14},{type:'banner_decor',c:28,r:14},{type:'crate_decor',c:52,r:14}]});
Object.assign(G.roomDefs.r3_trestle,{enemyPlan:['ballast_crab','mirage','brine_spout'],wakePlan:[230,245,260],
  decor:[{type:'banner_decor',c:6,r:14},{type:'crate_decor',c:30,r:14},{type:'crate_decor',c:55,r:14}]});
Object.assign(G.roomDefs.r3_terraces,{enemyPlan:['mirage','brine_toad','mirage','ballast_crab'],wakePlan:[225,235,240,250],
  decor:[{type:'crate_decor',c:9,r:14},{type:'banner_decor',c:39,r:14}]});
Object.assign(G.roomDefs.r3_spire,{enemyPlan:['mirage','brine_spout','brine_toad'],flyerPlan:['signal_gull'],wakePlan:[230,250,250],flyerWakePlan:[265],
  decor:[{type:'banner_decor',c:8,r:14},{type:'crate_decor',c:47,r:14},{type:'banner_decor',c:56,r:14}]});
delete G.roomDefs.r3_cutting; delete G.roomDefs.r3_pond;

})();
