/* CONTENT: the home area, The Junction. A dry-dock rail yard on the old seabed, five screens wide and three storeys tall, plus two
   connector rooms that carry its vertical routes to the lines that cannot meet it edge to edge.

   The area is one 'hub' room. Its routes out are edge openings (def.portals), each the mouth of one line:
     Wreck Quay    right edge, ground storey (rows 44-46)        walk east from the start: the gentlest line
     The Terminus  right edge, middle storey (rows 28-30)        along the high viaduct, up the east stairs
     Salt Cutting  right edge, upper storey (rows 13-15)         up the clock tower and along the high walk, or the east ladder from the viaduct
     Signal Reef   top edge (cols 38-41)                         climb the Signal Mast to the roof hatch; junction_signal_stair carries on
     Ticket Hall   bottom edge (cols 121-124)                    drop through the grating (Down + Jump) into junction_hall_stair
   A gate G stands at each mouth: it shows the Warden, the lock chart and (the Terminus) what the Long Clock borrows; Up takes that route.

   Things to do here: the Station Keeper (N) under the canopy, the kiosk (three S), the ticket machine (R), the standpipe (H), the Route
   Board and the Timetable plate on the clock balcony, the Drill Yard (west: every terrain of the line in one safe corner), small secrets
   (six scrip stashes: a spring shelf, a tar-sealed pocket, a lever-gated closet, a double-jump loft, the clock top over crumbling ledges,
   the Lost Property office), and two kinds of shortcut:
     - freight gates (Z on a 'beaten:<region>' channel) that open as each Warden falls: Tollkeeper the mast bridge (Signal Mast <-> gallery),
       Lamp-Heron the high west walk (mast top <-> clock balcony), Switchman Idol the high east walk (balcony <-> Salt Cutting landing; without it, the east ladder from the viaduct),
       Gatewhale the Lost Property office inside the clock;
     - loop-back hatches (fixtures 'shortcut'), bolted until opened from their far end deep in each line (worldgen puts that end in the
       line's last main room, near the way on to the Warden).
   Every mouth, gate and service is reachable from the start with run and jump only (the rooms check walks start -> every gate and portal,
   and back). Layout notes for world-art and later edits: docs/HOME_AREA.md. */
(() => {
'use strict';
const G = window.G, W = 150, H = 51;
const g = Array.from({ length: H }, () => Array(W).fill('.'));
const fill = (r0, r1, c0, c1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && r < H && c >= 0 && c < W) g[r][c] = ch; };
const put = (r, c, ch) => { g[r][c] = ch; };

// ---- shell: roof, ground (rows 47-50), side walls
fill(0, 1, 0, W - 1, '#'); fill(47, 50, 0, W - 1, '#');
fill(0, H - 1, 0, 1, '#'); fill(0, H - 1, W - 2, W - 1, '#');

// ---- the five mouths
fill(0, 1, 38, 41, '.');                       // Signal Reef: the roof hatch over the Signal Mast
fill(44, 46, W - 2, W - 1, '.');               // Wreck Quay: the low east arch
fill(28, 30, W - 2, W - 1, '.');               // The Terminus: the end of the viaduct
fill(13, 15, W - 2, W - 1, '.');               // Salt Cutting: the high east cutting
fill(48, 50, 121, 124, '.'); fill(47, 47, 121, 124, '=');   // Ticket Hall: a well under a grating (one-way: walk over it, Down + Jump to drop)

// ---- DRILL YARD (west, cols 2-33): three floors of practice terrain, all safe to fall from
// ground floor (rows 39-46 under floor B): a plain yard by the west wall (the arrival floor tests use), a hurdle, then mud, salt crust
// and a conveyor running back toward the wall
fill(46, 46, 18, 18, '#');                     // a low hurdle where the stations begin
fill(47, 47, 19, 24, 'm');                     // mud: slow going
fill(47, 47, 25, 29, 's');                     // salt crust: slippery (wet dissolves it, then it grows back)
fill(47, 47, 30, 33, '<');                     // conveyor: pushes west
// floor B (row 38): a spring to a high shelf, a crumbling bridge over a drop back to the ground floor, a steam vent, a rail cart,
// a tar-sealed pocket
fill(38, 38, 2, 33, '#');
put(38, 10, 'j');                              // spring: throws you five tiles up to the shelf (a plain jump falls short)
fill(33, 33, 8, 11, '=');                      // spring shelf (stash)
fill(38, 38, 12, 17, 'c');                     // crumbling bridge: stand still and it gives way (you land on the salt below)
put(38, 23, 'v');                              // steam vent: rides the next pulse four tiles up to the vent shelf
fill(34, 34, 21, 25, '=');                     // vent shelf
fill(33, 33, 2, 7, '#'); fill(34, 37, 7, 7, 't');   // tar-sealed pocket: burn the tar (a flammable or spark token) to reach the stash
// floor C (row 29): a timed lever and a pressure plate that both hold one gate open; the closet behind it holds a stash
fill(29, 29, 2, 33, '#');
fill(24, 25, 2, 20, '#');                      // closet roof, and the housing over the gate (Z fills rows 26-28 of column 20)
                                               // its top (row 24) is the signal loft: five tiles over floor C, a Double Jump or Wall Grip reaches it
fill(28, 28, 34, 39, '=');                     // bridge from floor C to the mast

// ---- SIGNAL MAST (cols 34-47): stacked one-way ledges to the roof hatch, rising three tiles at a time
fill(46, 46, 34, 38, '#');                     // the mast's foot block
for (const [r, c0, c1] of [[43,34,40],[40,40,47],[37,34,40],[34,40,47],[31,34,40],[28,40,47],[25,34,40],[22,40,47],[19,34,40],[16,40,47],[13,34,40],[10,40,47],[7,34,40],[4,35,44]])
  fill(r, r, c0, c1, '=');

// ---- LOWER YARD (rows 44-46): the start under the Keeper's canopy, the kiosk, the standpipe, the ticket machine
fill(41, 41, 73, 91, '#'); fill(42, 43, 73, 73, '#'); fill(42, 43, 91, 91, '#');   // the canopy: uprights stop above walking height
fill(42, 42, 56, 66, '=');                     // kiosk awning (a step up, too)

// ---- MIDDLE STOREY (row 31): the dispatch gallery and the Terminus viaduct
fill(31, 31, 41, 55, '=');                     // mast bridge (freight gate at col 50, opens when the Tollkeeper falls)
fill(17, 27, 48, 52, '#');                     // the signal box: a pillar from the high walk down to the bridge gate (no hopping over that gate)
fill(19, 25, 49, 51, '.');                     // ... hollow: its lit cabin shows through (sealed, never entered)
fill(31, 31, 56, 111, '=');                    // dispatch gallery
fill(31, 31, 69, 71, '.'); fill(31, 31, 93, 95, '.');   // gaps: from the gallery you can always fall back to the yard (no Down + Jump needed)
fill(31, 32, 112, 147, '#');                   // viaduct
// east stairs, ground -> gallery
for (const [r, c0, c1] of [[44,102,108],[41,98,104],[38,102,108],[35,98,104],[33,102,108]]) fill(r, r, c0, c1, '=');
// east ladder, viaduct -> Salt Cutting landing
for (const [r, c0, c1] of [[28,136,142],[25,140,146],[22,136,142],[19,140,146]]) fill(r, r, c0, c1, '=');   // overlapping: straight hops up

// ---- UPPER STOREY (row 16): the clock tower, its balcony, and the high walks
for (const [r, c0, c1] of [[28,74,79],[25,79,84],[22,74,79],[19,79,84]]) fill(r, r, c0, c1, '=');   // clock tower stair from the gallery
fill(16, 16, 48, 147, '=');                    // high walk: west (to the mast), the clock balcony, east (to Salt Cutting)
fill(16, 16, 62, 63, '.'); fill(16, 16, 100, 101, '.'); fill(16, 16, 120, 121, '.');   // gaps: drop to the gallery or the viaduct
fill(9, 12, 56, 60, '#');                      // west freight gate housing (gate at col 58, opens when the Lamp-Heron falls)
fill(9, 12, 108, 112, '#');                    // east freight gate housing (gate at col 110, opens when the Switchman Idol falls)
// the clock: a hollow block, the Lost Property office inside (freight gate at col 86, opens when the Gatewhale falls)
fill(4, 13, 86, 94, '#'); fill(6, 12, 87, 93, '.'); fill(10, 12, 86, 86, '.');
fill(13, 13, 83, 85, '=');                     // the office step, up from the balcony
// crumbling ledges up the clock's east face to the clock top (stash)
put(13, 96, 'c'); put(13, 97, 'c'); put(10, 99, 'c'); put(10, 100, 'c'); put(7, 96, 'c'); put(7, 97, 'c');

// ---- markers (stamped last so no architecture erases one)
put(46, 78, 'P'); put(46, 86, 'N');
put(46, 58, 'S'); put(46, 61, 'S'); put(46, 64, 'S');
put(46, 69, 'H'); put(46, 96, 'R');
put(46, 52, '?'); put(46, 82, '?'); put(46, 100, '?'); put(46, 113, '?');      // the hub's four signs (texts: HUB_SIGNS in worldgen.js)
put(46, 140, 'G'); put(30, 130, 'G'); put(15, 140, 'G'); put(15, 50, 'G'); put(46, 117, 'G');
put(30, 50, 'Z'); put(15, 58, 'Z'); put(15, 110, 'Z'); put(12, 86, 'Z');            // freight gates
put(28, 20, 'Z'); put(28, 30, 'Y'); put(28, 25, 'A');                              // drill yard: the gate, its timed lever and its plate
put(37, 28, 'Q');                                                                   // drill yard: rail cart

G.defineRoom({
  id: 'junction', region: 'hub', kind: 'hub', w: 5, h: 3,
  map: g.map(row => row.join('')),
  portals: [
    { id: 'r1', side: 'right', from: 44, to: 46, hint: 'East along the ground, through the low arch.' },
    { id: 'final', side: 'right', from: 28, to: 30, hint: 'Up the east stairs and along the viaduct.' },
    { id: 'r3', side: 'right', from: 13, to: 15, hint: 'Up the clock tower and along the high walk, or the east ladder from the viaduct.' },
    { id: 'r2', side: 'top', from: 38, to: 41, via: 'junction_signal_stair', hint: 'Route: west of the start, climb the Signal Mast to the top and jump up through the roof hatch.' },
    { id: 'r4', side: 'bottom', from: 121, to: 124, via: 'junction_hall_stair', hint: 'Drop through the grating: Down and Jump.' }
  ],
  gateFor: { r1: [140, 46], final: [130, 30], r3: [140, 15], r2: [50, 15], r4: [117, 46] },
  channels: { '50,30': 'beaten:r1', '58,15': 'beaten:r2', '110,15': 'beaten:r3', '86,12': 'beaten:r4' },
  board: [79, 15], timetable: [72, 15],
  shortcuts: [{ region: 'r1', c: 54, r: 46 }, { region: 'r4', c: 132, r: 46 }, { region: 'r2', c: 66, r: 15 }, { region: 'r3', c: 126, r: 15 }],
  fixtures: [
    { type: 'shortcut', c: 54, r: 46, data: { region: 'r1', side: 'home' } },
    { type: 'shortcut', c: 132, r: 46, data: { region: 'r4', side: 'home' } },
    { type: 'shortcut', c: 66, r: 15, data: { region: 'r2', side: 'home' } },
    { type: 'shortcut', c: 126, r: 15, data: { region: 'r3', side: 'home' } },
    { type: 'cache', c: 9, r: 32, data: { scrip: 6, name: 'Spring shelf stash' } },
    { type: 'cache', c: 4, r: 37, data: { scrip: 8, name: 'Tar-sealed tin' } },
    { type: 'cache', c: 4, r: 28, data: { scrip: 8, name: 'Drill closet tin' } },
    { type: 'cache', c: 4, r: 23, data: { scrip: 12, name: 'Signal loft tin' } },
    { type: 'cache', c: 90, r: 3, data: { scrip: 12, name: 'Clockmaker\'s tin' } },
    { type: 'cache', c: 90, r: 12, data: { scrip: 20, name: 'Lost property' } },
    // Four permanent Drill Yard practice rewards. The geometry demonstrates the move; the cache itself also refuses the reward until that move is owned,
    // so a route shortcut or co-op boost cannot accidentally teach the wrong lesson.
    { type: 'cache', c: 27, r: 37, data: { scrip: 5, name: 'Dash drill tin', need: 'dash', hint: 'Clear the marked gap with one committed Dash.' } },
    { type: 'cache', c: 18, r: 28, data: { scrip: 5, name: 'Wall Grip drill tin', need: 'wall', hint: 'Use the training wall: cling, jump, cling again.' } },
    { type: 'cache', c: 15, r: 23, data: { scrip: 5, name: 'Double Jump drill tin', need: 'double', hint: 'The loft is intentionally above a normal jump.' } },
    { type: 'cache', c: 30, r: 28, data: { scrip: 5, name: 'Heavy Cut drill tin', need: 'heavy', hint: 'Heavy Cut is the answer to cracked barriers on the line.' } },
    { type: 'sign', c: 3, r: 46, data: { text: 'DRILL YARD. Mud drags at your boots. Salt crust is slick, and wet tokens dissolve it. Belts push. Springs throw.' } },
    { type: 'sign', c: 10, r: 37, data: { text: 'Crumbling ledges give way if you stand on them. Keep moving. Steam vents lift you when they puff.' } },
    { type: 'sign', c: 8, r: 37, data: { text: 'Tar burns. A flammable or spark token clears it.' } },
    { type: 'sign', c: 32, r: 28, data: { text: 'The lever holds the gate open for a few seconds. The plate holds it while someone stands on it: one holds, one runs.' } },
    { type: 'sign', c: 108, r: 46, data: { text: 'East stairs: the gallery, the viaduct and the Terminus. Wreck Quay is through the low arch.' } },
    { type: 'sign', c: 120, r: 46, data: { text: 'TICKET HALL, BELOW. Stand on the grating, hold Down and Jump.' } },
    { type: 'sign', c: 44, r: 46, data: { text: 'SIGNAL MAST to SIGNAL REEF. Climb the ledges to the very top, then jump up through the roof hatch.' } },
    { type: 'sign', c: 43, r: 3, data: { text: 'The roof hatch is right above you. Jump up through it: Signal Reef.' } },
    { type: 'sign', c: 71, r: 46, data: { text: 'ROUTES. Wreck Quay: east along the yard, the low arch. Ticket Hall: the grating at the east end (Down + Jump). The Terminus: east stairs, then the viaduct. Salt Cutting: up the clock tower, the high walk east. Signal Reef: west, up the Signal Mast to the roof hatch.' } }
  ],
  decor: [
    // the Signal Mast's lamp chain: violet signal lamps on the ledges, pulsing upward in sequence, lead the eye to the roof hatch
    ...[[46, 36], [43, 34], [37, 34], [31, 34], [25, 34], [19, 34], [13, 34], [7, 34], [40, 46], [34, 46], [28, 46], [22, 46], [16, 46], [10, 46], [4, 36], [4, 43]]
      .map(([r, c]) => ({ type: 'signal_lamp', c, r: r - 1 })),
    { type: 'crate_decor', c: 46, r: 46 }, { type: 'crate_decor', c: 135, r: 46 }, { type: 'crate_decor', c: 116, r: 30 },
    { type: 'banner_decor', c: 72, r: 40 }, { type: 'banner_decor', c: 92, r: 40 }, { type: 'banner_decor', c: 70, r: 15 }, { type: 'banner_decor', c: 145, r: 30 },
    { type: 'lamp_decor', c: 6, r: 46 }, { type: 'lamp_decor', c: 49, r: 46 }, { type: 'lamp_decor', c: 75, r: 46 },
    { type: 'lamp_decor', c: 89, r: 46 }, { type: 'lamp_decor', c: 145, r: 46 },
    { type: 'lamp_decor', c: 60, r: 30 }, { type: 'lamp_decor', c: 92, r: 30 }, { type: 'lamp_decor', c: 120, r: 30 },
    { type: 'lamp_decor', c: 104, r: 15 }
  ],
  signs: []
});

// ---- connector: the Signal Stair. Out of the roof hatch onto the old signal roof, then east into Signal Reef (its first room is entered
// from the left). Arrives from below; dropping back into the hatch returns to the Signal Mast.
(() => {
  const s = Array.from({ length: 17 }, (_, r) => Array.from({ length: 30 }, (_, c) => (r === 0 || r >= 15 || c === 0 || c === 29) ? '#' : '.'));
  const f = (r0, r1, c0, c1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) s[r][c] = ch; };
  f(15, 16, 1, 3, '.');                          // the hatch (bottom route port), against the west wall: you climb out facing the room
  f(12, 14, 29, 29, '.');                        // east, to Signal Reef
  f(14, 14, 10, 13, '#'); f(13, 14, 14, 16, '#'); f(14, 14, 17, 19, '#');   // roof ridges: a step up and down
  f(10, 10, 9, 13, '='); f(7, 7, 14, 18, '=');   // the old lamp gantry overhead (a view, a stash)
  s[6][16] = '.';
  G.defineRoom({ id: 'junction_signal_stair', region: 'hub', kind: 'main', route: ['bottom', 'right'], map: s.map(r => r.join('')),
    fixtures: [{ type: 'cache', c: 16, r: 6, data: { scrip: 6, name: 'Lamp-trimmer\'s tin' } }],
    decor: [{ type: 'lamp_decor', c: 22, r: 14 }, { type: 'banner_decor', c: 8, r: 14 }, { type: 'signal_lamp', c: 6, r: 14 }] });
})();

// ---- connector: the Hall Stair. The well under the grating drops straight to the buried booking hall's landing, then east into Ticket Hall
// (its first room is entered from the left). The stair zig-zags back up beside the drop; a side pocket off the stair holds a stash.
(() => {
  const s = Array.from({ length: 34 }, (_, r) => Array.from({ length: 30 }, (_, c) => (r === 0 || r >= 32 || c === 0 || c === 29) ? '#' : '.'));
  const f = (r0, r1, c0, c1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) s[r][c] = ch; };
  f(0, 0, 13, 16, '.');                          // the well (top route port), under the Junction's grating
  f(29, 31, 29, 29, '.');                        // east, to Ticket Hall
  // landings alternate west and east of the drop column (cols 14-15 stay clear, so the fall lands on the hall floor)
  for (const [r, c0, c1] of [[29,4,13],[26,16,25],[23,4,13],[20,16,25],[17,4,13],[14,16,25],[11,4,13],[8,16,25],[5,4,13],[3,9,13]]) f(r, r, c0, c1, '=');
  f(12, 12, 26, 28, '#');                        // the side pocket's shelf (stash), a hop east off the row-14 landing
  G.defineRoom({ id: 'junction_hall_stair', region: 'hub', kind: 'main', h: 2, route: ['top', 'right'], map: s.map(r => r.join('')),
    fixtures: [{ type: 'cache', c: 27, r: 11, data: { scrip: 8, name: 'Porter\'s tin' } }],
    decor: [{ type: 'lamp_decor', c: 20, r: 31 }, { type: 'lamp_decor', c: 8, r: 28 }, { type: 'banner_decor', c: 24, r: 25 }] });
})();
})();
