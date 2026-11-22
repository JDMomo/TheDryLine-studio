# HANDOFF — SYSTEMS

All changes are **UNTESTED** here.

## Round 2 — opening-loop trunk location
- **Failing check addressed:** `opening_loop`.
- **Choice:** fix the check, not worldgen. Teaching goal is a guaranteed useful token before the first Warden, not necessarily room one.
- **File / function:** `tools/checks/opening_loop.mjs`.
- **Hand trace:** `worldgen.balance()` keeps an early trunk from region r1 when present and assigns the first drawn trunk through the retained trunk queue. The old check inspected only `graph.regions.r1.first`. The revised check filters `graph.regions.r1.nodes` to room definitions whose kind is `main`, then searches those ids for marker-content or extra trunks, matching the generator guarantee while still requiring a pre-arena r1 trunk.
- **Expected:** accepts the actual guaranteed Wreck Quay main-room trunk; still fails if r1 mains contain none.
- **Test:** `node tools/smoke.mjs opening_loop --serial`.

## Next — 200-seed token coverage table
- **Change:** added reporting-only `token_coverage.mjs`; it does not tune balance.
- **Hand trace:** `G.debug.newRun(seed)` builds `G.run.graph`; `drawTokens()` stores every drawn token id in `graph.draw.all`; `rollChart()` stores each Warden's cut array in `graph.chart`. The check counts non-null supply and sums chart cut counts, buckets every seed exactly once, and asserts only that the three buckets total 200.
- **Expected:** prints exactly-enough / too-few / too-many rows for seeds 1–200 without treating any distribution as a failure.
- **Test:** `node tools/smoke.mjs token_coverage --serial`. **UNTESTED.**
