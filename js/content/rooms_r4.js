/* CONTENT: room templates for region r4, Ticket Hall (a buried station hall of booths, turnstiles and stopped clocks).
   Main rooms, one trial (Heavy Cut signal post) and one branch (guarded plinth) live here, next to the Gatewhale's arena. */
(() => {
'use strict';
const G = window.G;
const WALL = '##############################';
// The long concourse: three-route Ticket Hall showcase.
// LOW / SAFE: opposing conveyor runs move the player and enemies but do not deal damage.
// HIGH / FAST: booth canopies form a direct line above the belts.
// SECRET POCKET: a spring beside the far gate reaches a separate maintenance shelf with the lost trunk.
(() => {
  const W = 60, H = 17, g = Array.from({ length: H }, () => Array(W).fill('.'));
  g[0].fill('#'); g[15].fill('#'); g[16].fill('#');
  for (let r = 0; r < H; r++) if (r < 12 || r > 14) { g[r][0] = '#'; g[r][W - 1] = '#'; }
  const fill = (r0, r1, c0, c1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch; };
  const put = (r, c, ch) => { g[r][c] = ch; };

  // Safe low lane: belts create positioning pressure without making forward progress dependent on timing.
  fill(15, 15, 4, 15, '>');
  fill(15, 15, 29, 40, '<');
  fill(12, 14, 20, 24, '#');
  fill(12, 14, 36, 40, '#');

  // Fast canopy line over the moving floor and most ground enemies.
  fill(10, 10, 8, 15, '=');
  fill(9, 9, 18, 25, '=');
  fill(10, 10, 28, 35, '=');
  fill(9, 9, 38, 45, '=');
  fill(10, 10, 48, 54, '=');

  // Separate maintenance pocket.
  put(15, 55, 'j');
  fill(9, 9, 52, 57, '=');
  put(8, 55, 'C');

  put(14, 12, 'E'); put(14, 31, 'E'); put(14, 44, 'E'); put(6, 42, 'F'); put(14, 57, 'D');
  G.defineRoom({ id: 'r4_concourse', region: 'r4', kind: 'main', w: 2, map: g.map(row => row.join('')) });
})();

// Ticket Booth Row — two-screen public hall rather than a stack of boxes.
// Low floor threads through booth islands; their awnings form a continuous optional high route.
// The lost trunk sits above the closed central booth, visible early but reached from the second awning.
(() => {
  const W=60,H=17,g=Array.from({length:H},()=>Array(W).fill('.'));
  g[0].fill('#');g[15].fill('#');g[16].fill('#');
  for(let r=0;r<H;r++)if(r<12||r>14){g[r][0]='#';g[r][W-1]='#';}
  const fill=(r0,r1,c0,c1,ch)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)g[r][c]=ch;};
  const line=(r,c0,c1,ch)=>fill(r,r,c0,c1,ch);

  // three booth islands with generous aisles
  fill(12,14,10,14,'#'); fill(12,14,27,32,'#'); fill(12,14,45,49,'#');
  line(10,7,17,'='); line(9,24,35,'='); line(10,42,52,'=');
  line(7,29,33,'='); g[6][31]='C';

  g[14][19]='E'; g[14][39]='E'; g[8][47]='F';
  G.defineRoom({id:'r4_booths',region:'r4',kind:'main',w:2,map:g.map(row=>row.join(''))});
})();

// A balcony above a turnstile line: climb the steps, walk the balcony, drop to the doorway.
G.defineRoom({
  id: 'r4_balcony', region: 'r4', kind: 'main',
  map: [
    '##############################',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#....................F.......#',
    '#............................#',
    '#.................C..........#',
    '#..........==============....#',
    '#............................#',
    '#............................#',
    '#.......###..................#',
    '........###===................',
    '....###.###...................',
    '....###.###..E....E....E...D..',
    '##############################',
    '##############################'
  ]
});
// Clock Gallery — two-screen pre-Warden hall with one monumental stopped-clock bay.
// The required floor is quiet and broad. Upper maintenance walks frame the clock and lead to the guarded fixed-token doorway.
(() => {
  const W=60,H=17,g=Array.from({length:H},()=>Array(W).fill('.'));
  g[0].fill('#');g[15].fill('#');g[16].fill('#');
  for(let r=0;r<H;r++)if(r<12||r>14){g[r][0]='#';g[r][W-1]='#';}
  const fill=(r0,r1,c0,c1,ch)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)g[r][c]=ch;};

  // clock housing silhouette hangs above the middle but leaves the floor open.
  fill(1,3,26,33,'#');
  fill(8,8,18,26,'=');
  fill(8,8,34,42,'=');
  fill(6,6,27,32,'=');
  fill(11,11,44,53,'=');

  g[5][30]='D';
  g[14][20]='E';
  g[14][46]='E';
  g[10][50]='F';
  G.defineRoom({id:'r4_clocks',region:'r4',kind:'main',w:2,map:g.map(row=>row.join(''))});
})();

// A low baggage tunnel with two spike beds; a trunk on a crate stack between them.
G.defineRoom({
  id: 'r4_baggage', region: 'r4', kind: 'main',
  map: [
    '##############################',
    '##############################',
    '##############################',
    '##############################',
    '##############################',
    '##############################',
    '##############################',
    '##############################',
    '##############################',
    '#............................#',
    '#............................#',
    '#....................F.......#',
    '.................C............',
    '................###...........',
    '........E.....E.###.......D...',
    '##########^^^^######^^^^######',
    '##############################'
  ]
});
// The gate line: a long hall with a spiked rail trench crossed by two luggage perches, then a turnstile run.
G.defineRoom({
  id: 'r4_gateline', region: 'r4', kind: 'main', w: 2,
  map: [
    '############################################################',
    '#..........................................................#',
    '#..........................................................#',
    '#..........................................................#',
    '#..........................................................#',
    '#..........................................................#',
    '#..........................................................#',
    '#.............................F............................#',
    '#..........................................................#',
    '#..........................................................#',
    '#..........................................................#',
    '#..........................................................#',
    '..........................===...===.............###.........',
    '................................................###.........',
    '..........E......E..........................E...###.D.......',
    '########################^^^^^^^^^^^^########################',
    '############################################################'
  ]
});
// Switchyard: an always-open conveyor floor and an optional upper mechanical shortcut.
// Throw Y to open Z for 4.5 seconds. A player who reaches A can hold the gate open for a co-op partner.
(() => {
  const W=60,H=17,g=Array.from({length:H},()=>Array(W).fill('.'));
  g[0].fill('#');g[15].fill('#');g[16].fill('#');
  for(let r=0;r<H;r++)if(r<12||r>14){g[r][0]='#';g[r][W-1]='#';}
  const fill=(r,c0,c1,ch)=>{for(let c=c0;c<=c1;c++)g[r][c]=ch;};
  fill(15,4,17,'>');fill(15,22,35,'<');fill(15,40,52,'>');
  fill(11,7,18,'=');fill(11,22,29,'=');fill(11,30,39,'=');fill(11,42,51,'=');
  g[10][14]='Y';g[10][29]='Z';g[10][35]='A';
  g[14][10]='E';g[14][26]='E';g[14][45]='E';g[7][40]='F';g[14][55]='D';
  G.defineRoom({id:'r4_switchyard',region:'r4',kind:'main',w:2,map:g.map(row=>row.join(''))});
})();

// Trial: climb the one-way ledges to the signal post; turnstiles wait on the platform beyond it.
G.defineRoom({
  id: 'r4_trial', region: 'r4', kind: 'trial', label: 'Signal post',
  map: [
    '##############################',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#....................M.......#',
    '#.................=====......#',
    '#............................#',
    '#........................E.E.#',
    '#...........=====.......######',
    '#.......................######',
    '#.......................######',
    '#.....=====.............######',
    '#.......................######',
    '#..D....................######',
    '##############################',
    '##############################'
  ]
});
// Branch (needs Double Jump): the plinth stands on a block five tiles tall (160 px up). A plain jump rises about 125 px; with the second jump in the
// air it clears the top with room to spare. No shelves, no walls to climb besides the block itself. Crabs guard the floor.
G.defineRoom({
  id: 'r4_vault', region: 'r4', kind: 'branch', label: 'Guarded plinth', needs: ['double'],
  map: [
    '##############################',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#.........................I..#',
    '#.....................########',
    '#.....................########',
    '#.....................########',
    '#.....................########',
    '#..D....E.....E...E...########',
    '##############################',
    '##############################'
  ]
});
// The Gatewhale's arena: the boss door at column 3 (same layout as r1's), then 25 tiles of rail floor (columns 4 to 28).
// Low one-way boarding platforms (3 tiles up, a safe perch from the rolling body) near both walls, and a high platform
// in the middle that is reached from them. The whale's crates (2 tiles tall) are the other way over its body.
G.defineRoom({
  id: 'r4_arena', region: 'r4', kind: 'arena',
  decor:[{type:'banner_decor',c:5,r:14},{type:'lamp_decor',c:14,r:14},{type:'banner_decor',c:27,r:14}],
  map: [
    WALL,
    '####.........................#', '####.........................#', '####.........................#',
    '####.........................#', '####.........................#', '####.........................#',
    '####.........................#', '####.........................#',
    '####.........=====...........#',                     // row 9: high platform (columns 13 to 17)
    '####.........................#',
    '...#.........................#',
    '....======............=======#',                  // row 12: low platforms (columns 4 to 9 and 22 to 28), against both walls
    '.............................#',
    '......................B......#',
    WALL, WALL
  ]
});

/* ---------- Authored Ticket Hall campaign spine ---------- */
(() => {
  const wide=(id,build,signs=[])=>{
    const W=60,H=17,g=Array.from({length:H},()=>Array(W).fill('.'));
    g[0].fill('#');g[15].fill('#');g[16].fill('#');
    for(let r=0;r<H;r++)if(r<12||r>14){g[r][0]='#';g[r][W-1]='#';}
    const fill=(r0,r1,c0,c1,ch)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)g[r][c]=ch;};
    const put=(r,c,ch)=>g[r][c]=ch;
    build({g,fill,put,W,H});
    G.defineRoom({id,region:'r4',kind:'main',w:2,map:g.map(x=>x.join('')),signs});
  };

  // 1. Grand Concourse — teaches conveyor reading with a calm upper canopy route.
  wide('r4_concourse',({fill,put})=>{
    fill(15,15,4,16,'t'); fill(15,15,23,35,'<'); fill(15,15,42,53,'>');
    put(14,14,'Y'); put(14,16,'A'); put(14,18,'Z');
    // Ticket booth masses create recognizable bays but never close the floor.
    fill(12,14,18,20,'#'); fill(12,14,37,39,'#');
    fill(10,10,7,15,'='); fill(9,9,23,31,'='); fill(10,10,40,48,'=');
    // Separate maintenance shelf / first secret.
    put(15,55,'j'); fill(9,9,51,57,'='); put(8,55,'C');
    put(14,12,'E'); put(14,30,'E'); put(14,47,'E');
    put(14,56,'D'); put(14,5,'?');
  },['GRAND CONCOURSE — all departures remain posted until formally cancelled.']);

  // 2. Switchyard — mechanical interaction lesson. The floor route never closes; the upper shortcut uses Y/Z/A.
  wide('r4_switchyard',({fill,put})=>{
    fill(15,15,4,17,'>'); fill(15,15,22,35,'<'); fill(15,15,40,52,'>');
    fill(12,14,19,21,'#'); fill(12,14,38,40,'#');
    fill(11,11,7,18,'='); fill(11,11,22,30,'='); fill(11,11,31,40,'='); fill(11,11,43,52,'=');
    put(10,14,'Y'); put(10,30,'Z'); put(10,36,'A');
    // The lever side has a spring that makes the shortcut obvious but not mandatory.
    put(15,10,'j');
    put(14,11,'E'); put(14,27,'E'); put(14,46,'E'); put(8,48,'F');
    put(14,56,'D'); put(14,5,'?');
  },['SWITCHYARD — maintenance gates may be held locally when central power fails.']);

  // 3. Ticket Booths — a denser social/administrative space with multiple short lanes and support enemies.
  wide('r4_booths',({fill,put})=>{
    // Booth banks. Gaps between them are wide enough for combat and camera readability.
    fill(12,14,8,12,'#'); fill(12,14,20,24,'#'); fill(12,14,32,36,'#'); fill(12,14,44,48,'#');
    fill(9,9,6,14,'='); fill(8,8,18,26,'='); fill(9,9,30,38,'='); fill(8,8,42,50,'=');
    fill(15,15,14,18,'t'); fill(15,15,26,30,'<'); fill(15,15,38,42,'>');
    put(14,15,'Y'); put(14,17,'A'); put(14,19,'Z');
    // Counter windows / small upper passage.
    fill(6,6,10,22,'='); fill(6,6,34,46,'=');
    put(14,16,'E'); put(14,28,'E'); put(14,40,'E'); put(14,52,'E');
    put(7,22,'F'); put(7,43,'F');
    put(14,56,'D'); put(14,5,'?');
  },['Every booth is closed. Every validator is still powered.']);

  // 4. Gate Line — formal final approach: long sightline, armored lanes, optional high bypass, no mandatory spike trench.
  wide('r4_gateline',({fill,put})=>{
    fill(15,15,5,16,'>'); fill(15,15,21,33,'<'); fill(15,15,39,51,'>');
    // Three gatehouse masses divide the room into deliberate encounter arenas.
    fill(12,14,17,19,'#'); fill(12,14,34,37,'#'); fill(12,14,52,54,'#');
    fill(9,9,7,16,'='); fill(8,8,21,31,'='); fill(7,7,38,48,'=');
    // Short crumble transfers make the high line faster but visibly risky.
    fill(9,9,18,19,'c'); fill(8,8,32,33,'c'); fill(7,7,49,50,'c');
    put(14,12,'E'); put(14,27,'E'); put(14,45,'E');
    put(8,14,'F'); put(6,44,'F');
    put(14,56,'D'); put(14,5,'?');
  },['GATE LINE — TICKET INVALID until the final authority is punched.']);
})();


Object.assign(G.roomDefs.r4_trial,{decor:[{type:'lamp_decor',c:5,r:14},{type:'banner_decor',c:14,r:14},{type:'lamp_decor',c:25,r:8}]});
Object.assign(G.roomDefs.r4_vault,{decor:[{type:'crate_decor',c:5,r:14},{type:'banner_decor',c:18,r:14},{type:'lamp_decor',c:26,r:9}]});
Object.assign(G.roomDefs.r4_concourse,{enemyPlan:['ballast_crab','turnstile','sapper'],wakePlan:[225,245,255],
  decor:[{type:'banner_decor',c:5,r:14},{type:'lamp_decor',c:17,r:14},{type:'crate_decor',c:26,r:14},{type:'lamp_decor',c:43,r:14},{type:'banner_decor',c:56,r:14}]});
Object.assign(G.roomDefs.r4_switchyard,{enemyPlan:['turnstile','handcar','sapper'],flyerPlan:['lamp_wisp'],wakePlan:[235,250,260],flyerWakePlan:[265],
  decor:[{type:'lamp_decor',c:6,r:14},{type:'banner_decor',c:28,r:14},{type:'furnace_decor',c:45,r:14},{type:'lamp_decor',c:56,r:14}]});
Object.assign(G.roomDefs.r4_booths,{enemyPlan:['harvester','turnstile','sapper','harvester'],flyerPlan:['lamp_wisp','lamp_wisp'],wakePlan:[225,235,245,255],flyerWakePlan:[245,260],
  decor:[{type:'banner_decor',c:7,r:14},{type:'lamp_decor',c:18,r:14},{type:'crate_decor',c:30,r:14},{type:'lamp_decor',c:43,r:14},{type:'banner_decor',c:55,r:14}]});
Object.assign(G.roomDefs.r4_gateline,{enemyPlan:['turnstile','handcar','sapper'],flyerPlan:['lamp_wisp','lamp_wisp'],wakePlan:[230,245,260],flyerWakePlan:[245,265],
  decor:[{type:'banner_decor',c:6,r:14},{type:'lamp_decor',c:20,r:14},{type:'lamp_decor',c:39,r:14},{type:'banner_decor',c:55,r:14}]});
delete G.roomDefs.r4_balcony; delete G.roomDefs.r4_clocks; delete G.roomDefs.r4_baggage;

})();
