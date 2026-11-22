# HANDOFF — ENGINE

All changes are **UNTESTED** here.

## Round 2 — Long Clock pendulum regression
- **Failing check addressed:** `boss_final`, simple-bot pendulum at distance 140.
- **Change:** the shared half-health Phase II presentation no longer applies to the Long Clock, which already owns its `flags.p2` + `transition` phase system; for regional Wardens the shared beat may start only from `idle` or `recover`, never during active attack frames.
- **File / function:** `js/game/bosses.js`, `Boss.update()`.
- **Hand trace:** `boss_final` sets Long Clock hp to 40%, sets `idle`, then steps twice before forcing its own phase-two pendulum. The branch's shared phase hook saw hp <= 50% and replaced `idle` with a 0.7 s `stagger`, shifting the test setup that main leaves untouched. Excluding `region==='final'` restores the Long Clock's original phase transition path. The check's manual `D.step()` calls `step(C.STEP)` directly, so the frame-loop slowScale path is not involved in this failure. Death slow-motion begins only after hp <= 0 and therefore cannot affect a live pendulum probe.
- **Expected:** Long Clock reaches its own `transition`/pendulum timing without the extra shared stagger; regional Warden phase beats cannot cancel an active attack.
- **Test:** `node tools/smoke.mjs boss_final --serial`; specifically verify `pendulum 140` reports zero hurt. Also run the shared boss presentation check and verify r1-r4 still receive a Phase II beat. 
