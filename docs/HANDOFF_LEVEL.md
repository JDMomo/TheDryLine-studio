# HANDOFF — LEVEL

All changes below are **UNTESTED** in this environment.

## Round 2 — hub_layout overlap fix
- **Failing check addressed:** `hub_layout`.
- **Change:** moved the Dash drill cache from tile (27,37) to (19,37), away from the rail cart at (28,37); moved the Heavy Cut drill cache from (30,28) to (12,28), away from the timed lever at (30,28).
- **File / function:** `js/content/rooms_hub.js`, Junction `fixtures`.
- **Hand trace:** `hub_layout` constructs boxes from every room prop and rejects any `G.util.overlap`. The reported overlaps were caused by caches sharing/nearly sharing the exact marker positions. Each moved cache is now at least 7 tiles from the conflicting prop, exceeding the requested 2-tile clearance. Neither cache is an exit/gate/portal.
- **Expected:** the two reported Drill Yard overlaps disappear without changing route geometry.
- **Test:** `node tools/smoke.mjs hub_layout --serial`; also enter the Drill Yard and confirm both moved reward tins remain approachable. 

## Round 2 — Wreck Quay signature coverage
- **Failing check addressed:** `region_signature` r1.
- **Change:** added a short mud strip and a rail cart to `r1_wreck`. `r1_dock` already contains mud, crumble and a cart; `r1_gangway` already contains mud.
- **File / function:** `js/content/rooms_r1.js`, `r1_wreck` map builder.
- **Hand trace:** `region_signature` counts a main room when its flattened grid contains any of `m/Q/c`, and separately requires at least one room for each character. After this change r1 has signature characters in `r1_gangway`, `r1_wreck`, and `r1_dock`; `r1_dock` supplies `c` and both `r1_wreck`/`r1_dock` supply `Q`. The new mud/cart are on the broad permanent floor; no exit or trunk moved.
- **Expected:** r1 reports at least 3 signature main rooms and no missing mud/cart/crumble.
- **Test:** `node tools/smoke.mjs region_signature --serial`, then traverse `r1_wreck` using run+jump only.

## Round 2 — Salt Cutting conveyor
- **Failing check addressed:** `region_signature` r3.
- **Change:** added an existing `>` conveyor floor segment to `r3_brines`.
- **File / function:** `js/content/rooms_r3.js`, `r3_brines`.
- **Hand trace:** the check requires at least one `<` or `>` in an r3 main and salt `s`; `r3_brines` already contains salt and now contains `>`. The conveyor replaces permanent floor under an open lane and `>` is solid terrain, so the run+jump route remains continuous.
- **Expected:** r3 no longer reports missing conveyor.
- **Test:** `node tools/smoke.mjs region_signature --serial`; walk across the new Brine Flats belt and confirm the exit remains reachable.

## Round 2 — Ticket Hall signature coverage
- **Failing check addressed:** `region_signature` r4.
- **Change:** `r4_concourse` and `r4_booths` now use existing tar `t`, pressure plate `A`, timed lever `Y`, and gate `Z` characters. `r4_switchyard` already contains `Y/Z/A`; it also receives tar in the same signature family through its existing floor language on the next art/route pass if needed.
- **File / function:** `js/content/rooms_r4.js`, authored main builders.
- **Hand trace:** `region_signature` requires r4 signature presence in >=3 mains, plus at least one `t`, `A`, and `Y/Z`. Concourse, Switchyard, and Booths now each contain at least one requested signature character; tar is present in Concourse/Booths. The new control characters sit in open floor lanes and do not replace exits/trunks.
- **Expected:** r4 signature room count is at least 3 and all required categories are nonempty.
- **Test:** `node tools/smoke.mjs region_signature --serial`; traverse Concourse/Switchyard/Booths without using the controls and confirm the public floor route stays open.
