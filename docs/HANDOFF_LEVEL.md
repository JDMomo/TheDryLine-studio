# HANDOFF — LEVEL

All changes below are **UNTESTED** in this environment.

## Round 2 — hub_layout overlap fix
- **Failing check addressed:** `hub_layout`.
- **Change:** moved the Dash drill cache from tile (27,37) to (19,37), away from the rail cart at (28,37); moved the Heavy Cut drill cache from (30,28) to (12,28), away from the timed lever at (30,28).
- **File / function:** `js/content/rooms_hub.js`, Junction `fixtures`.
- **Hand trace:** `hub_layout` constructs boxes from every room prop and rejects any `G.util.overlap`. The reported overlaps were caused by caches sharing/nearly sharing the exact marker positions. Each moved cache is now at least 7 tiles from the conflicting prop, exceeding the requested 2-tile clearance. Neither cache is an exit/gate/portal.
- **Expected:** the two reported Drill Yard overlaps disappear without changing route geometry.
- **Test:** `node tools/smoke.mjs hub_layout --serial`; also enter the Drill Yard and confirm both moved reward tins remain approachable. 
