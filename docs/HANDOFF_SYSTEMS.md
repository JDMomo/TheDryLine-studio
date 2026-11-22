# HANDOFF — SYSTEMS

All changes are **UNTESTED** here.

## Round 2 — opening-loop trunk location
- **Failing check addressed:** `opening_loop`.
- **Choice:** fix the check, not worldgen. Teaching goal is a guaranteed useful token before the first Warden, not necessarily room one.
- **File / function:** `tools/checks/opening_loop.mjs`.
- **Hand trace:** `worldgen.balance()` keeps an early trunk from region r1 when present and assigns the first drawn trunk through the retained trunk queue. The old check inspected only `graph.regions.r1.first`. The revised check searches all ids in `graph.regions.r1.mains` for marker-content or extra trunks, matching the generator guarantee while still requiring a pre-arena r1 trunk.
- **Expected:** accepts the actual guaranteed Wreck Quay main-room trunk; still fails if r1 mains contain none.
- **Test:** `node tools/smoke.mjs opening_loop --serial`.
