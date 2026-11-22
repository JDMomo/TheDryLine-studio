# Playtest report, round 2 (main 5e4065c)

Tool: `node tools/playtest.mjs` (brain `tools/lib/ptbrain.js`). Headless Chrome over http (temp copy of the game, painted art loads), real key events only (Playwright keyboard), 960x560, `--autoplay-policy=no-user-gesture-required`, game clock x3. It reads `G.debug.state()` and the tile grid and never acts through `G.debug`.
Two **coverage setups** are not human input and are labelled so: `--start=<region>` (enter the region's first room with `G.rooms.enter`, used because the bot cannot yet solve the Signal Reef shaft or play the whole home area in a sitting) and `--give` (carry one token per cut of a chart, `G.game.takeItem`, for the armed Long Clock fight). `--assist` turns a lethal hit into a recorded continue. `--leave` stops a run when it leaves the Junction.
Raw data: `tools/playtest_out/{b_r2,c_r2,c_r3,c_r4,c_final,d_*}/` (`run_*.json`, `tables.md`). Screenshots: `tools/shots/playtest_*.png` (14 kept).

## Round-1 fixes, checked in real play

| fix | result |
|---|---|
| banner matte | Fixed. Waystone banners and the Tollkeeper have no white/grey box now (`playtest_s24_room_r1_arena.png`). |
| one card at a time | Fixed. At the start "The Last Timetable" shows alone, then "Fare Surge / Short Shift" after it (`playtest_r2_start_0p5s.png`, `..._5s.png`). Two new problems with the cards: issues 2 and 3 below. |
| first Warden | Better. Tollkeeper beaten in 2 of 2 armed runs (70 s / 103 s, 22 / 26 hits; round 1: 43-67 hits, 141-196 s, 1 win in 7). |
| objectives | Readable: "No token of its cuts (pierce, arc, ground). Slashes still work, slowly: find a trunk, plinth or ticket token." and "Lost trunk: clear the room to open it (1 left)" (`playtest_s23_room_r3_arena.png`, `playtest_s25_death1.png`). |
| safe arrivals | Fixed. `r2_shaft` (n9), `junction_signal_stair` (n13) and `junction_hall_stair` (n28), entered with no input, stay put for 3 s (script). |
| Signal Reef route | The roof hatch works (full jump from the row-4 platform; a tap does not clear it). Signage exists; the bot still needed 740-1170 game-seconds to leave the platform (issue 8). |
| lighter rock | Visible: r3 and r4 rooms read as painted, not black masses (`playtest_s23_room_r3_brines.png`, `playtest_s24_room_r4_concourse.png`). |

## Home area (docs/HOME_AREA.md)

| check | result |
|---|---|
| leave by all five routes, real keys from the start | r1 9 s, r4 23 s, final 19 s, r3 28 s, all left by walking and jumping. r2 via the roof hatch and Signal Stair: reached, but very slowly (issue 8). |
| loop-back hatches (real Up key) | 4 of 4 (r1, r2, r3, r4): the home end stays bolted, the far end unbolts and drops home, the home end then returns to the far room. |
| drill yard | Only by screenshot (`playtest_home_drill_yard.png`) and `roomlint --strict` (42 rooms, 0 failing, start to every gate by run and jump). The bot did not walk it. |
| Route Board | Text overlap, issue 4 (`playtest_home_route_board.png`). |

## Regions and Wardens (assisted bot, start in the region)

| region | rooms walked | Warden | result |
|---|---|---|---|
| Wreck Quay (r1) | all (seeds 23, 24) | Tollkeeper | beaten twice, 22 / 26 hits |
| Salt Cutting (r3) | all 6 | Switchman Idol | beaten, 145 s, 38 hits, 1 token |
| Ticket Hall (r4) | all | Gatewhale | beaten, 30 s, 9 hits |
| Signal Reef (r2) | first room only | not reached | the bot never got through `r2_shaft` (issue 1) |
| The Terminus (final) | all 4 | Long Clock with all 3 chart tokens | beaten, 130 s, 47 hits, run ended on the win screen |

Not 25 runs: the bot is slow (about one game-second per real second), so this is coverage, not statistics.

## Top 10 issues, ranked

1. **Signal Reef shaft (`r2_shaft`, n9) unresolved.** In 5 attempts over 1,800 game-seconds the bot never climbed it: "no path", fell out of the open bottom back to n8, again and again (c_r2: 36 transitions n8/n9). Signal gulls hit it 24 times (c_r3) and 120 times (c_r4) in that loop. `roomlint --strict` says the room is crossable, so this may be a bot gap (vents/bounces) or a real readability problem. It needs a person. Also the Lamp-Heron was never fought.
2. **Story card text is cut off.** The opening card ends mid-sentence ("...the high viaduct leads to the") (`playtest_r2_start_0p5s.png`). Full text: "Five routes leave the Junction, every one still open. Walk east along the yard to Wreck Quay for the gentlest line; the high viaduct leads to the order they all still obey." The card shows three lines only.
3. **Timetable card drawn over the player.** "Fare Surge" / "Short Shift" sits low on screen over the floor, the Keeper and the player (`playtest_r2_start_5s.png`). The queueing is right; the placement hides the hero for about 4 s at the start.
4. **Route Board prompt overlaps the hanging Timetable plate and the board's own text** at the clock balcony (`playtest_home_route_board.png`).
5. **`r2_shaft` background is a heavily blurred, low-resolution painting**, and the "Signal record" card sits on top of a busy lamp area (`playtest_s24_room_r2_shaft.png`).
6. **r1_tunnel "clear the room" took the bot over 100 s in 2 of 2 runs** (stuck log: `hunt:there` seven times, seeds 23 and 24). One enemy it cannot reach or hit; pacing risk if a player wants the trunk.
7. **Long Clock: 43 boss-body hits in 130 s, 10 of them in `recover`, and 6 in the telegraph states** (handsTell 2, sigTell 2, crateTell 1, tollTell 1). Contact during recovery and tells reads as unfair. The 20 hits from "mirage" enemies in the same run are also high.
8. **Junction roof hatch to Signal Reef is slow to find.** The bot needed 740 s (round 1) and 1,169 s (round 2) there, and on arrival in `junction_signal_stair` it starts 16 px from a 3-tile gap over the hole back to the Junction and falls back unless it jumps with a full hold. Humans likely manage, but it is a tight first move.
9. **Music in the Signal Stair connector.** Of 318 transitions inside one region, 4 changed track, all around the connector: the track becomes `r2` in a `hub`-region room and is still `r2` 3 s after you are back in the Junction. Otherwise confirmed: walking between rooms of one region never changes the music (314 of 318).
10. **Draw hitches.** Mean draw cost 0.35-1.65 ms per frame, but the worst frames were 302 ms (hub), 180 ms (r1), 164 ms (r1 in c_r3) and 128 ms (r3); about 1 frame in 200 ran over 16 ms. Probably first-draw of painted art on room entry.

## Softlocks
No hard softlock. Loops seen are the n8/n9 shaft loop (issue 1, possibly bot-only) and the hub/Signal Stair ping-pong before the bot learned to jump.

## Audio watch (real AudioContext, analyser on `G.audio.engine.limiter`, once a second)
Every run was sampled: b_r2, c_r2, c_r3, c_r4, c_final, plus the round-1 audio session (doors, standpipes, token and trinket pickups, Warden fights).

| item | result |
|---|---|
| NaN samples | 0 |
| sustained RMS above 0.3 (3 in a row) | none; max RMS 0.21-0.26 |
| `G.audio.rebuilds` | 0 in every run |
| limiter peak | max 0.96 (round 1: 1.09 once, now under 1.0) |
| context state | `running` throughout |

## Errors
0 page or console errors, 0 `G.errors`, 0 failed requests, 0 undrawn-player frames in the runs above.

## Files
`tools/playtest.mjs`, `tools/lib/ptbrain.js`, this report, screenshots under `tools/shots/playtest_*.png`.


# Round 3 release gate — 2026-11-22

This section does not fabricate the brief's two human start-to-finish sessions or physical keyboard+pad co-op session. Repository APIs are available here; an interactive local browser/controller session is not. Those rows remain REQUIRED before release.

## Top issues to verify
|#|Issue|Owner|Severity|Status|
|---:|---|---|---|---|
|1|Human full run in region order|7 QA|blocker|open|
|2|Human straight-to-Terminus-after-one-Warden run|7 QA|blocker|open|
|3|Physical keyboard+pad join/leave/revive/camera/scaling|7 QA|blocker|open|
|4|Signal Reef shaft human under-60-second climb|1 Level|major|open|
|5|Warden 3x human fight timing/hit tables|3 Bosses|major|open|
|6|11-enemy five-fight subjective feel pass|2 Combat|major|open|
|7|Real Chrome/GPU p99 frame profiling|3 Engine|major|open|
|8|Per-region 1280x720 contrast screenshot sampling|5 Art/UI|major|open|
|9|Browser listening table and r3/r4 arrangement judgement|6 Audio|major|open|
|10|60-second busiest-fight offline audio safety render after integration|6 Audio|major|open|
|11|200-seed token-pressure output after Systems integration|4 Systems|major|open|
|12|All team PRs pass fast suite after conflict resolution|7 QA|blocker|open|
|13|Release zip tested in fresh browser profile|7 QA|blocker|open|
|14|Pending painted files do not 404 when registered|5 Art/UI|minor|open|
|15|Final second-pass regression table across merged team changes|7 QA|blocker|open|

## Second-pass verification
|PR/team|Fixed|Not fixed|Regressed|Evidence|
|---|---|---|---|---|
|Team 1 Level|pending|pending|pending|run after integration|
|Team 2 Combat|pending|pending|pending|run after integration|
|Team 3 Boss/Engine|pending|pending|pending|run after integration|
|Team 4 Systems|pending|pending|pending|run after integration|
|Team 5 Art/UI|pending|pending|pending|run after integration|
|Team 6 Audio|pending|pending|pending|run after integration|
|Team 8 Line-art|research only|n/a|n/a|not wired into game|
