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
