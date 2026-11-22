# Status (updated 2026-11-19)

## 2026-11-19 vertical-slice expansion — ChatGPT Studio batch

This branch is now substantially beyond the 2026-11-14 baseline documented below.

### World and run structure
- Each Warden line now selects **4 main rooms** before its arena; the Terminus selects **3**. One authored landmark room is guaranteed per region so critical story evidence cannot disappear from a seed.
- Four-direction room routing is live. Signal Reef includes a true two-screen bottom-to-top shaft.
- Main-room design contract: safe/base route, harder/faster route where space permits, optional reward/secret pocket. Worked examples exist in Wreck Quay Dock, Signal Reef Lamp Shaft, Salt Trestle, Ticket Hall Concourse and the Terminus remixes.
- Terrain now includes mud, slippery/dissolvable salt, conveyors, crumble, springs, timed steam, **flammable tar**, one-way platforms and spikes. Heavy Cut still opens cracked barriers.
- Wreck Quay has a short-span maintenance **rail cart** that carries grounded players/enemies but never gates the route.
- Ticket Hall has optional **timed-lever / mechanical-gate / pressure-plate** shortcuts. Pressure plates can be held by a co-op partner; required low routes remain open.

### Story and navigation
- New story canon: **The Last Timetable**. The evacuation ended, but its cancellation never reached the Long Clock; the Wardens are infrastructure trapped in valid orders rather than villains.
- New `docs/STORY_BIBLE.md`: reveal order, Warden motivations, regional emotional progression, ending and tone rules.
- Story is delivered in play through first-entry lines, guaranteed landmark discoveries, Junction progression, Warden order/aftermath lines and the ending.
- The map is now a **Route Board**: authored visited-room names, route arrows, region terrain identity, seen/total progress, Warden/ability/grade status, current objective and a Left/Right browsable discovery journal. Unseen rooms remain hidden.
- Short location cards appear on room entry. First-use contextual teaching covers mud, salt, tar, conveyors, crumble, springs and steam.
- Title screen now establishes the undelivered cancellation before showing controls.

### Encounters
- Added the planned concept-roster jobs as gameplay placeholders: **Sapper** (interruptible delayed explosive zoning), **Harvester** (interruptible ally repair support) and **Mirage** (phase/reappear tell/committed dash).
- Strider is no longer a pure contact walker: patrol -> claw tell -> committed lunge -> punishable recovery.
- Scrapper now has a shielded advance -> shove/charge tell -> committed charge -> open-shield recovery.
- Boiler chooses ranged brine lob or warned close pressure vent; lobs leave Wet puddles.
- Rivet only hurts during the committed swoop and now has explicit recovery.
- Co-op enemies use short target locks plus pressure balancing so a room is less likely to dogpile one player.
- Later rooms can roll at most one visibly brass-overstamped elite; first/onboarding rooms never do. Elites are seeded, tougher and worth extra scrip.

### Art direction
- The owner's watercolor Wanderer and existing Strider/Boiler/Rivet/Gearling/Scrapper strips remain the default when loaded.
- Backgrounds now have region-specific low-contrast silhouette language and paper/wash grain: wreck ribs, signal coral/lamps, salt strata/crystals, station arches/clocks and Terminus clockwork.
- Sapper/Harvester/Mirage now use canonical watercolor concept-sheet body cutouts as static in-game sprites; their state telegraphs remain dynamic and full animation strips are still pending. `docs/art/ASSET_LIST.md` now specifies move4/attack6/defeat4 files using the canonical watercolor concept silhouettes.
- These code scenery/enemy drawings are **supporting placeholders**, not a replacement for the watercolor source-of-truth.

### QA added in this batch
New focused checks cover route redesigns, Terminus terrain remix, Sapper/Harvester/Mirage roles, front-line enemy patterns, Boiler/Rivet patterns, elites, co-op target distribution, story/journal state, mechanisms, tar, rail carts, longer world scale/landmarks and dynamic terrain.
- Room traversal snapshots simulation time + live terrain state so crumble/steam searches replay deterministically.
- Browser scripts and new checks were syntax-compiled during the batch.
- `.github/workflows/qa.yml` now runs the fast Playwright/Chromium suite automatically on every push to `chatgpt-work`, so future large batches do not require Joseph to babysit terminal checks.

### Still deliberately unfinished
- Final production watercolor strips for Sapper, Harvester and Mirage.
- Authored watercolor environment/terrain sheets to replace the low-contrast code scenery and tile placeholders.
- Human difficulty/feel tuning after this much larger room/encounter set. Automated fairness remains a floor, not a substitute for play.
- Boss weak-point/body art remains mostly code-driven and deserves a later dedicated presentation pass.


## Done
- Engine, content and tools: see docs/ARCHITECTURE.md (matches the code).
- Rooms: every region has its own pool and is wired to its own Warden: r1 Wreck Quay, r2 Signal Reef, r3 Salt Cutting and r4 Ticket Hall (6 main rooms each, one doorway per main room, a trial room with the signal post, a branch room with the guarded plinth, an arena), the Terminus (4 main rooms, arena, `length: 2`), the shared rooms (2 ticket machine rooms, 2 kiosk rooms, 2 clipping booth rooms, a standpipe room used before the Terminus arena) and the Junction (5 gates, start, standpipe, 3 signs). 49 rooms, all pass `node tools/roomlint.mjs`.
- Engine change: `L` template marker and `ceiling: true` enemies (the Hanging Lamp), region field `ceiling`; 3 lamps in r2 rooms and 3 in r3 rooms.
- Worldgen: the Terminus's standpipe sits in a shared branch room off its last main room.
- Checks: `walk` crosses every region's chain on the real graph; `fullrun` plays a whole run (5 seeds) to the win screen; `tokens` and the boss checks no longer patch regions. `node tools/smoke.mjs` passes all checks.

## QA pass (2026-11-14)
- Rooms: `node tools/roomlint.mjs --strict` (and the `rooms` check) now requires every main room to be crossable both ways, reaching every D and C, by run and jump only, with a weakened player (run 94%, jump 98.5%). Fixed: r1_chain, r1_tunnel, r1_dock, r3_terraces, r4_balcony, final_tower (small ledge/plank changes), r4_baggage and r1_hold (enemy next to a wall), hub junction (platforms crossed the gate labels).
- Enemies: ground markers deal from a shuffled bag per kind (a room no longer rolls one enemy everywhere); main rooms capped at r1 2-3, r2/r3 3-4, r4 3-5, Terminus 4-5 (extras thinned, most repeated kind first).
- Bosses: new check `bosses_fair` (about 4 min; knobs BOSS, ATTACK, TRIALS, NOFIGHT, VERBOSE) with `tools/lib/fightbot.js`: each attack alone must be dodged 75% of trials by a move/jump/dash bot, tells at least 0.45 s (0.35 enraged), a slash-only human-like fight must win in 150 s or less and leave 1 s open per cycle. Tuned: r1 leap tell 0.5 s, spit recover 0.85 s; r2 hp 720 and peck lock at 0.5 s (0.4 enraged); r3 hp 720. Simulated slash-only fights: 59, 60, 60, 86, 77 s.
- Visuals: `node tools/sheets.mjs` writes contact sheets to tools/shots/ (rooms per region, screens.png, palettes.png; `--full <roomId>`, `--screens-full`). Removed amber and teal from scenery and fx (glob, sparks, boss death, motes, props); player 4 colour moved off the Ground pink; priced-ware tags hide while a prompt shows; prompts get a backing panel.
- Co-op: `coop_play` (2, 3 and 4 players cross three rooms, strand and revive a player, fight the r1 Warden): slot rule, pull-back and revive hold, no errors.
- Performance: `perf` check; average step+draw 2.6 to 3.5 ms in every boss fight with 4 players and in the busiest room (headless software canvas, about 700 canvas calls per frame). Headless shows a roughly 100 ms flush every 43 frames that trivial drawing does not, so it is probably the software rasteriser; unverified on a real GPU.

## Open
- Weak spots: a player cornered between boss and wall cannot hop a wide boss body (r1 charge, r4 spin); fight lengths are simulated, not played by a person; hub, r1 and r4 skies are close in hue; jobs 7 (prop reuse, soft locks) rely on the existing systems, tokens and fullrun checks only.
- Final arena and the Long Clock belong to the boss_final worker (js/content/boss_final.js, the arena in rooms_final.js, tools/checks/boss_final.mjs).
- Art pass (sprites through G.art), UI polish, independent play-through, publishing.
- Difficulty is untuned by hand: see the report notes (r4 and the Terminus have 4 to 5 enemies per room; r3 rolls toads at every ground marker).

## Fix pass (2026-11-14, ten tester findings)
1. Prompts: `G.props.wrap` and `layoutPrompt` wrap to 340 px and clamp the panel inside the screen (check `prompts`: every prop and tip).
2. Pause is a menu (Resume, Restart run, Quit to title) in js/ui/menus.js: selected row highlighted, confirm step for Restart and Quit, controls shown in the words of the last device; the window blur or a hidden tab pauses (js/main.js). Down+Slash no longer quits. Check `pause`.
3. Tokens are unique per run: `balance` draws trunks, ticket choices, booth stock and kiosk wares after trimming, from ids not held, void or claimed (`graph.claimed`); when the pool is dry a trinket or scrip is offered (`lootData`, `G.game.spareTokens`, `G.items.roll` returns null). The seed still reproduces the run. The pool is spent by the kiosk draw, so the booth usually has no stock and gives a trinket or scrip (by design, the prompt says so). Check `tokens_unique` (80 graphs).
4. Arc tokens are aimed by what is held (`aimOf` in js/content/items.js): the Ladle lands about 131 px ahead by default, Up lobs it high, the facing direction throws it far, Down drops it close; the Kettle and Skipstone have the same table. Every Warden's arc slot is reachable with each arc token (`arc_reach`). Old checks `tokens`, `punch`, `boss_r3`, `boss_final` now aim with a held direction.
5. r1 is gentle: region `scale {hp 0.8, aggro 0.85}` and `intro {maxEnemies 2, calm 8}` (regions.js), applied in `Enemy.applyScale` and worldgen; kills give `C.KILL_MEND`; bosses wait `C.BOSS_GRACE` (1.5 s) after the intro. r1_chain and r1_dock planks were widened. Check `r1_bot` (plain bot crosses r1's three rooms alive: 10 of 12 seeds in the check, 32 of 40 in a wider sweep).
6. Every arena has a perch 3 tiles up against both walls (r1 to r4 rows 12 and 10; the Terminus already had them). Check `arena_escape` (bot).
7. One-line tips shown once each (`G.tips` in js/ui/hud.js: token, mend, bounce, fare), wording by `G.input.last`; four hub signs say where tokens come from. Check `tips`.
8. The strict validator passes r2_tower, r3_brines and all 49 main rooms in both directions; none needed the bounce (the tester ran the non-strict mode, which finds bounce routes). Strict mode now also rejects slashes and tests the D/C jobs both ways.
9. Page: header holds the notes, `.frame` scales to the window, no scrolling (check `page_fit`: 9 window sizes from 1100x700 down to 480x800); the HUD draws after the room with opaque slot cells and corner plates.
10. Sprites: `sprites.js` adds an entry only after the image is decoded (`G.spritesPending`), so the code-drawn icon shows until then and there is no flicker; the map's "Tokens held" row now uses the sprites. Check `sprites` records draw calls (the canvas is tainted under file://, pixels cannot be read).
- Full suite: `node tools/smoke.mjs` passes all 31 checks.
- Old checks repaired: `systems` (tickets may hold trinkets or scrip, booth stock, pause menu), `boss_r4` (crabs are swept a step after the boss dies).

## Open
- Weak spots: a player cornered between boss and wall cannot hop a wide boss body (r1 charge, r4 spin); fight lengths are simulated, not played by a person; hub, r1 and r4 skies are close in hue; r1's plain bot loses about 1 run in 5.
- Art pass (player, enemies, bosses, tiles) following docs/ART_GUIDE.md; independent play-through; publishing (the published artifact predates all of this; do not publish until the suite passes).

## Paused by Joseph: 2026-11-14, 12:48 Pacific (usage high)
- Published build and GitHub (JDMomo/TheDryLine, main, commit 4d99bed) are current: 31 of 31 checks pass.
- Outside audit ("Second Rail") in /home/claude/audit/: design director done (design/AUDIT.md, bible/01_design.md); technical director done (tech/AUDIT.md, bible/02_tech.md); art, audio and market director (agent aa4d9270a3bedf2ba) was STOPPED part-way: resume it with SendMessage or restart it. Its targets: art/AUDIT.md and bible/03_art_audio_market.md.
- Not yet done: the CEO's accept / reject / defer decisions on the audits; nothing from the audits has been implemented.
- Usage rules from Joseph: stop at about 90% of the usage window, never 100%. One worker at a time. No polling loops: start a worker, end the turn, continue when it reports.

## 2026-11-14, design pass: lock chart, scarcity, smaller punches (design engineer)
Done after the outside design audit (/home/claude/audit/design/AUDIT.md: the token decision was never hard) and the confirmed bugs of the technical audit.
1. **Lock chart.** `G.worldgen.rollChart(seed)`: each of the five Wardens has fare slots for three of the four cuts. The four main Wardens lock a different cut each (so every cut is locked on at least one Warden and no two charts match); the Long Clock locks a random one. A locked cut has no slot (not built, not drawn, not in the boss bar, not punchable). Shown on a `board` prop in the Junction just right of the party start, on each region's map row ("Lock chart:") and in the gate prompt ("Slots: ...").
2. **Scarcity.** Party carries 3 tokens (`C.SLOTS`; 2 players 2+1, 3 players 1 each, 4 players 1 each). Sources: four fixed plinths, two lost trunks, one ticket machine (usable twice, 30 then 45; the stand clears and the machine comes back after a ticket is taken). Kiosk sells three trinkets (40 scrip) only. The clipping booth is out of worldgen and the two booth rooms are gone from rooms_shared.js; booth and clip prop code stays in props.js, unused.
3. **Punch** takes 10% of max hp (`C.BREAK_FRAC`). Stagger and the lost attack unchanged.
4. **Co-op.** Max hp x (1 + 0.6 per player beyond the first) in `Boss.start()`.
5. **Bugs.** (a) Scrip on the floor is collected when the party leaves a room (`G.combat.leave`), and a boss dying no longer wipes it. (b) Player 1 uses `pad: 'first'`: the first connected controller at any index; a second controller joins as player 2. (c) A run code (seed + unlocked cuts, e.g. `1K9Z-5`) is recorded at start (`run.cuts`, `run.code`), the world is built from those alone, shown on the pause and run-over screens, and `newRun(code)` / `index.html#CODE` replay the same graph, chart and Warden trinket choice (own stream per region). Not yet covered: enemy behaviour and kill scrip amounts still draw from the shared `run.rng`, so fights are not replays.
6. Wording: hub signs, tips, the notes under the game, README, bible sections 3, 4, 8, ARCHITECTURE.
- **Rebalance** (boss hp, fight bot of `bosses_fair`, new check `fight_len`; seconds with slashes alone / with all three charted slots punched at once): Tollkeeper 420 -> 720 (63 / 37), Lamp-Heron 720 -> 960 (87 / 33), Switchman Idol 720 -> 1050 (81 / 33), Gatewhale 500 -> 700 (99 / 58), Long Clock 760 -> 1300 (125 / 71; with all four Wardens beaten, 676 hp: 71 / 31); re-measured 2026-11-14 on seed 77 by `fight_len`. With the old hp the punched fights lasted 16 to 23 s because three punches now cost 30% hp plus 7.8 s of stagger and three lost attacks.
- New checks: `chart`, `run_code`, `pad_scrip`, `fight_len`. Old checks updated: `punch`, `coop`, `coop_play`, `systems`, `tips`, `tokens_unique`, and the boss checks (they set `G.debug.fullCharts`).
- Open: nobody has played this; the punched fight times are the bot's lower bound (real punches take time to line up). Ticket machine reuse and hub board placement are untested by a person.

## Paused by Joseph at 90% usage: 2026-11-14, 13:21 Pacific
- The design engineer (agent a4338200c2fc24bf2) was STOPPED part-way through the "lock chart and scarcity" batch (see the project doc claude/audit-decisions.md, "Accepted now"). The working tree has its uncommitted, unfinished edits: do not publish or push it until that batch is finished and the full suite passes. Resume it with SendMessage, or `git stash` / `git checkout .` to return to commit 4d99bed.
- Published build and GitHub main are still commit 4d99bed (31 of 31 checks passed).

## 2026-11-14, batch finished and art test (design engineer, second hand-over)
- The batch above was finished and verified: the full suite passes (see the final line of the run). Board moved to the right of the party start and made smaller so it no longer covers the gate labels.
- Art test: the owner's watercolor strips (assets/player/idle.png 4 frames, run.png 8 frames, 112 x 96, feet 2 px above the bottom) are drawn for player 1 through new `G.art.drawFrame` (js/core/art.js, loaded in js/art/sprites.js): idle 5 frames per second, run 12 per second, run frame 6 (most stretched) in the air or dashing, scaled to about 60 px tall. The code-drawn body and scarf are hidden while it is on; slash arcs and effects stay. F2 switches it off and on (one line in the notes under the game); missing files fall back to the code-drawn player. New check `art_test`; shot tools/shots/art_test_player.png. The fringe of the cut-out is slightly light on dark floors; otherwise it reads well at game size.

## 2026-11-14 evening: the Wanderer is the player
- Joseph generated 19 Wanderer animation sheets with ChatGPT from the sprite prompt pack (docs/art/SPRITE_PROMPT_PACK.md). tools/art/cut_wanderer.py cuts them into uniform strips (192 x 136 cells at twice game scale) in assets/player/.
- js/game/player.js pickStrip() chooses the strip and frame for each state: idle, run, jump, land, double jump, dash, wall slide, side and down slash, heavy charge and cut, the four token casts, mend, hurt, down. F2 switches back to the code-drawn player. Players 2 to 4 are still code-drawn.
- Not used yet: revive, interact. Missing from the set: an upward slash (the side slash stands in). The dash afterimage is still the old code-drawn shape.

## 2026-11-14, borrowing Long Clock, grades, guarded rooms (design engineer)
- Long Clock: hp fixed at 1100; for each Warden not beaten it borrows one attack (Tollkeeper: floor shockwave pair; Lamp-Heron: floor lamp beam; Switchman Idol: signal rings at 3 heights; Gatewhale: crates standing as pillars). Gate label and map show "Borrows: ...". Slash-only bot (fight_len): 120 s with 0 Wardens beaten, 114 s with 2, 103 s with 4.
- Grades Beaten / Par / Clean per fight (par per boss in its definition); Clean refunds a punched token (party slot or arena plinth); stamp at fight end; grades on map, over and win screens.
- Guarded rooms: r2 needs Dash, r3 Wall Grip, r4 Double Jump, r1 Heavy Cut (new X cracked-barrier marker, `crack` prop). Validator checks both directions (reachable with, not without). Map and doorway prompt show the need.
- Hub board moved onto the wall clear of the gate; new checks `unlocks`, `hub_layout`, `grades`. Art: dash silhouette, revive and interact strips, coloured marker and strips for players 2 to 4.
- Open: a tip for grades or cracked barriers was not added to G.tips.

## 2026-11-15: tests that catch breakage, and the input rewrite (engineer)
Answers the outside technical audit (/home/claude/audit/tech/AUDIT.md, F1 and F2): 13 of its 20 deliberate breakages passed every fast check.
- **Suite speed.** `node tools/smoke.mjs` now runs four browsers at once (`--serial`, `--jobs=N`, `--fast`, `--bail`, `name:shard`). `bosses_fair` and `fight_len` are sharded; `bosses_fair:<boss>:fight` also runs the three-punch fight, so the slash-only fights are no longer run twice; `fight_len` keeps only the Long Clock with 2 and 4 Wardens beaten; `perf` is judged against a calibration loop so it holds under load. The input rewrite also made the fight bot about 27% faster (the old per-step input sync was 40% of its time). Whole suite: 12 min 14 s serial before (this machine, two cores), 4 min 35 s now (49 checks, 60 runs).
- **Behaviour checks** (input only, no state poking beyond choosing a room and where to stand): `behave_hurt`, `behave_economy`, `behave_feel`, `behave_loop` (real loop and real keyboard events), `behave_keyboard`. Input: `input_pad`, `input_party`, `input_remap`, `input_robust`, `comfort`. `pad_scrip`, `pause`, `systems` updated for the new rules.
- **Mutation run.** `node tools/mutate.mjs` re-makes the audit's 20 breakages as source patches and runs the fast checks on a temporary copy of the game for each. Before: 7 of 20 caught (the audit's table). After: 20 of 20 caught (`node tools/mutate.mjs`, about 8 minutes; M05 and M06 are caught only by older checks `boss_r2`, `boss_final` and `art_test`, the other 18 by the new behaviour and input checks or `systems`, `fullrun`).
- **Input rewrite** (js/core/input.js, main.js, menus.js, run.js): every player owns one device (`'kb'` or `'pad:N'`); the first device to press a button on the title is player 1 (any pad index; a lone pad at index 1 works); in the Junction any other device joins by pressing Jump, up to four; holding Pause one second in the Junction removes a player. Pause menu: Controls (rebind every action for the device that opened the menu, duplicates refused with a message, reset to defaults, saved per device type in the meta save inside try/catch), Comfort (screen shake on/off, reduced flashes). Focus loss releases all keys and held keys are picked up again (repeat events accepted). An unplugged controller pauses the game and names the player; it resumes on reconnect or when another unused device presses a button. Prompts and tips use the key or button name of the player's device, after remapping (`G.input.name(action, player)`).
- Not done or limits: Use / enter always follows the Up binding (it is listed, not bound separately); gamepad direction rebinding changes the d-pad buttons, the left stick always works; no deadzone setting and no `mapping === 'standard'` check (non-standard pads may need a rebind); no shared-keyboard co-op (the keyboard is one device); item descriptions still say "Hold Up" and the hub signs keep default key names; the boss fights remain bot-measured (the runs vary a few seconds between runs, so the Long Clock floors in `fight_len` and `bosses_fair` are loose); the suite has about 25 s of margin under 5 minutes on a two-core machine.

## 2026-11-15, Materials (systems design team)
- Decision "Materials" built: tokens and trinkets carry one or two tags (heavy, metal, flammable, wet, slick, brittle, plus magnetic and spark) and a card line; 12 fixed interactions (Ignite, Flare, Douse, Conduct, Pull, Stop, Kick, Slide, Shatter, Crack, Punt, Anchor) with a floating word each. Rules live in js/game/combat.js (`G.materials`); see bible sections 8 and 9 and ARCHITECTURE "Materials".
- Trinkets reworked, ids kept: six enable a rule, two are plain (Brass Buckle, Surveyor's Slate). Removed numbers: dash cooldown, +25% slash, token recharge, mend speed, kiosk price rise. Lead Boot now has no knockback at all. Kettle and Censer now leave clouds; the Ladle leaves a brine puddle.
- Cards: plinth and kiosk prompts, HUD selected token, and the map's token row show tag chips. Small hooks outside my files: `js/game/props.js` (prompt's fourth element and a chips row in `layoutPrompt` / `drawPrompt`), `js/ui/hud.js` (chips under the selected token), `js/ui/map.js` (chips under each held token).
- New check `materials`; `tokens` updated for the new trinket mods.
- Not built: wind and enemy brine as materials (no wind exists; enemy brine drops do not soak). Nobody has played this: Pull's 2.4 rad/s, the Flask's "sparks light nothing" cost and the Lead Boot wall-stop are the numbers most likely to need tuning.

## 2026-11-19: boss hooks, boss skins, smooth rendering (engine team)
- **Hooks** (js/game/bosses.js, documented at its top and in ARCHITECTURE "Boss hooks and the attack registry"): `shapes(b)` (several boxes, per state), `contact` as a function, fare slot `local` as a function, `onStart`, `filterDamage`, `onDeath`, `windScale`, `interp`, `b.summon()` with ownership and `loot: false`, and an attack registry (`G.defineAttacks`, `b.begin`, `b.available`, `b.phase`, `like` for borrowed attacks). All five bosses moved onto them: no instance overrides, no getters, no module-level `cur`, no wrapped update. Behaviour is unchanged: a scripted 40 s fight per boss (state log, hp, positions, hits taken) is identical before and after.
- **Skins**: js/art/boss_skins.js (table, state and attack-phase mapping, WIDE parts, badges, fx strip, fallback to the code-drawn boss), tools/art/cut_boss.py (zip to strips to registered table line; shared cutlib.py, cut_set.py output byte-identical), fixtures in tools/art/fixtures (procedural test boss), `G.debug.bossSkinFixture`. README section "Bosses". No real boss sheets are registered yet.
- **Rendering**: fixed step kept; the loop runs ahead of the clock and the room is drawn between the last two steps (camera, players, enemies, boss, shots), so 120 and 144 Hz displays move every frame; the canvas bitmap is CSS size x device pixel ratio (cap 3) with a scale transform, game coordinates unchanged. Latency measured: a key press moves the player within one frame.
- **Ported 2026-11-20 onto 963366b** (after the ChatGPT batch). The painted Tollkeeper path that boss_r1.js `draw` had is now a `states` boss skin (`G.bossSkinPending.tollkeeper` in js/art/boss_skins.js, drawn inside the code pose with the hit flash, shown without F2): the file is still missing, so it is not registered (a 404 fails the smoke run). When assets/bosses/tollkeeper/states.webp is back, move that object into `G.bossSkins`; `boss_art_r1` then checks the frame mapping (normal 0, stagger 1, rage 2).
- **Checks**: `boss_hooks`, `boss_skin`, `render`. `main.js` now requests the next frame first, so a drawing error no longer freezes the loop.
- Open: combat.js still takes `b.rect()` (bounding box), so a second hit box is not yet hittable (use `b.hitsRect` / `b.hitsCircle` in `melee`, `strike`, `touching`: design team's file). rooms.js rounds the camera to whole game pixels (`Math.round(G.cam.x)`): use `G.view.snap` for sub-pixel smooth scrolling at hi-dpi (world-art's file). Tile seams at 1.5x were looked at in a screenshot: none visible. During this work `page_fit`, `timetable`, `unlocks`, `fullrun` and `boss_final` failed from other teams' in-flight edits (G.ui.paper, HUD, timetable cards, Long Clock borrows), not from these files.

## 2026-11-20: token pool, Timetable, feat ledger, pacing (design team, ported onto 963366b)
- **Pool and draw**: 16 tokens (4 per cut; four ledger tokens Jet Gimlet, Amber Sling, Mica Lantern, Gypsum Sledge). `drawTokens` draws 7 per run from the seed: 4 plinths (a cut on the next region's chart), 2 trunks, 1 ticket token (+ optional start token). Plinths are filled per run (`plinth: true` replaces `fixedItem`). Check `pool`.
- **Timetable**: 10 cards (6 base, 4 unlocked by feats), one rolled per run, shown on the intro, the Junction plate (c53 r13, see docs/HANDOFF_HUB.md), the map and the run-over screen. Late Running no longer reorders rooms (authored spines): it removes thinning in one of the last three lines. Long Haul now means Wardens +25% hp and two pips. Check `timetable`.
- **Feat ledger**: 14 feats; they unlock options only (tokens, cards, starting-token choice, Express). Ledger screen from title and pause (Map button); meta save in try/catch. Check `ledger`.
- **Pacing** (modelled by check `pacing`, bots cannot climb the new tall rooms): about 27.6 min for a full clear with the authored 4+3 room spines (was about 22 min modelled before the spines and hp change). Boss hp: Tollkeeper 720 to 900, Lamp-Heron 960 to 1180, Switchman Idol 1050 to 1250, Gatewhale 700 to 610, Long Clock 1100 to 1300. Slash-only bot: 105 / 108 / 96 / 117 s and Long Clock 128 s with four Wardens beaten (141 s straight to it).
- **Known gap**: Gatewhale three-punch fight is 22 s (floor 20 for r4 in bosses_fair; others 30); its slash time does not fall with hp as the others do. Boss par values are unchanged (grades check accepts 0.6 to 1.3 x).
- Not mine: `rooms` fails on a r3 portal route (level team); boss files were reverted once mid-session, hp values re-applied.

## 2026-11-20: playtest issues 2, 5, 6 (design team)
- **Issue 2**: the Timetable card now waits for the story banner, the room-name card and any tip (one message at a time), then stays 8 s of free screen; it sits low in the middle (above the room-name card, clear of the HUD labels). js/ui/ledger.js (`G.ledgerIntro`); checked in `timetable`.
- **Issue 5**: one lost trunk is always in a Wreck Quay main room (before the arena) and holds a plain token of one of the Tollkeeper's three charted cuts (`drawTokens`, `balance`). The Station Keeper's first line says to clear the dock and take its trunk token. The Warden's banner names the missing cuts and says slashes still work; a sealed slot says "needs a <cut> token"; the Tollkeeper has 15% less health when no charted token is carried and its tells are 0.2 s longer (charge 0.95, leap and spit 0.7). Slash-only bot: 99 s (window 90 to 120). Small edits outside my files: js/game/bosses.js (two messages), js/content/boss_r1.js (`onStart`, wind), js/game/props.js (Keeper line, trunk prompt). Check `first_warden`; `chart` expects the 15% less.
- **Issue 6**: a shut trunk shows "Lost trunk: clear the room to open it (N left)"; after 20 s in the room the last two enemies get a pulsing ring (an arrow at the screen edge when out of view). The trunk's prompt counts the enemies. The turnstile hunt itself is unchanged (the enemy design is the Enemy team's).
- Failing, not from these files: `feel` (page error "reading '0'", also fails with my edits reverted; rooms.js / rooms_hub.js / hud.js are being edited), `rooms` (r3 portal route), `warden_look` (a timing check under load).

## 2026-11-20: playtest round 2, issues 3 and 4 (design team)
- **Issue 3**: the Timetable intro card picks a spot that covers no player and not the Station Keeper (bottom, top, then the sides; it keeps its spot so it does not jump). It still waits for banners (a taller story card does not matter: any banner holds it back). js/ui/ledger.js `introAt`.
- **Issue 4**: the Route Board prompt is shorter and stands above the board's own panel (props.js `layoutPrompt`, board only), clear of the Timetable plate. New check `overlays` (card vs player and Keeper over 10 cards, 2 seeds, 3 positions; board prompt vs board, plate and player).
- `--fast` on the shared tree: 12 failures from in-flight Level edits (r1_tunnel "no room for the r1 loop-back hatch" and its dependants) and load. On a clean HEAD copy plus my two files only `render`, `warden_look` and `world_art` (timing under load) fail.


## 2026-11-22: Team 1 — Level Design day brief
- Signal Reef kept the round-2 wide-shelf `r2_shaft` fix as the canonical safe stair: rest ledges are at most three rows apart; vents and flyers stay off the mandatory climb line.
- Added four Drill Yard practice rewards for Dash, Wall Grip, Double Jump and Heavy Cut. Reward caches are mechanically gated by the owned move, so co-op boosts cannot falsely complete a lesson.
- Documented the regional signatures and the 12 main rooms chosen for low/high/secret layering in `docs/LEVEL_DESIGN.md`.
- Added `tools/checks/region_signature.mjs`: at least three main rooms per region must use that region's mechanic family, and every signature element must exist somewhere in the region.
- Connector limitation: the GitHub API environment cannot launch Chrome, so `roomlint --strict` and `smoke --fast` were not executed here. The new check is written to the same Playwright contract as the existing checks and should be run by CI/QA before merge.
