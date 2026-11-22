# Known issues — studio lead round 4

- **Audio — blocker until merged:** Signal Reef Last Timetable part B has one extra hold token, causing track validation failure.
- **Level:** region-signature detection does not currently see marker-backed rail carts, pressure plates or timed gates because room parsing stores markers separately from terrain grid.
- **World Art — test-only crash:** the prior contrast check reads canvas pixels under file:// and can hit Chromium's cross-origin taint rule.
- **Line Art — tooling:** engine_v4.js had a literal backslash+n inside a line comment, commenting out its palette declaration and breaking the browser renderer.
- **Line Art — proof:** the live v4 index/comparison paths and committed Pass-73 raster still require studio-lead visual review.
- **Engine/Combat/Systems/QA:** Round-3 suite checks are green; new next-item checks remain subject to the next integrated rerun.
