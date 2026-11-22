# HANDOFF — ENGINE

All changes are **UNTESTED** here.

## Round 2 — Long Clock pendulum regression
- **Failing check addressed:** `boss_final`, simple-bot pendulum at distance 140.
- **Change:** the shared half-health Phase II presentation no longer applies to the Long Clock, which already owns its `flags.p2` + `transition` phase system; for regional Wardens the shared beat may start only from `idle` or `recover`, never during active attack frames.
- **File / function:** `js/game/bosses.js`, `Boss.update()`.
- **Hand trace:** `boss_final` sets Long Clock hp to 40%, sets `idle`, then steps twice before forcing its own phase-two pendulum. The branch's shared phase hook saw hp <= 50% and replaced `idle` with a 0.7 s `stagger`, shifting the test setup that main leaves untouched. Excluding `region==='final'` restores the Long Clock's original phase transition path. The check's manual `D.step()` calls `step(C.STEP)` directly, so the frame-loop slowScale path is not involved in this failure. Death slow-motion begins only after hp <= 0 and therefore cannot affect a live pendulum probe.
- **Expected:** Long Clock reaches its own `transition`/pendulum timing without the extra shared stagger; regional Warden phase beats cannot cancel an active attack.
- **Test:** `node tools/smoke.mjs boss_final --serial`; specifically verify `pendulum 140` reports zero hurt. Also run the shared boss presentation check and verify r1-r4 still receive a Phase II beat. 

## Round 3 — Long Clock non-stagger Phase II beat
- **Failing check:** `boss_presentation` final half-health beat.
- **Change:** crossing half health queues the shared presentation until `idle`/`recover` for every Warden. Long Clock gets banner/ring/jolt and sets `phase2`, but does not enter `stagger`; regional Wardens retain the stagger beat.
- **Hand trace:** active attack states are neither `idle` nor `recover`, so no attack/hazard is interrupted. In `boss_final`, the Clock at 40% and idle receives only effects/flag; its state/timer remain untouched, preserving the pendulum timing fixed in Round 2. `boss_presentation` now requires phase2 for all, stagger for r1-r4, and explicitly no stagger for final.
- **Expected:** `boss_final` remains green and `boss_presentation` accepts final's non-stagger beat.
- **Test:** `node tools/smoke.mjs boss_final boss_presentation --serial`. **UNTESTED.**

## Next — weak-point glow / crack / shatter
- Existing shared `Boss.paintSpot()` already paints open slots in `G.CLASSES[sp.cls].color` with a pulsing outer glow, draws one radial crack for each lost HP, and switches to the broken dark/shattered badge after hit 3. `hitSpot()` also emits cut-colour spark/ring on each hit and a larger spark/ring on break.
- Added `boss_weakpoints.mjs` to drive one slot through hits 1, 2 and 3 on all five Wardens and assert the state transitions behind those visuals.
- **Hand trace:** `C.SPOT_HP` starts each slot at 3; `hitSpot` decrements before the `sp.hp>0` return, so paintSpot sees 2 then 1 and draws 1 then 2 cracks; third hit reaches 0 and sets `broken=true`.
- Test: `node tools/smoke.mjs boss_weakpoints --serial`; visually punch a slot three times and verify cut-colour glow, 1/2 cracks, then shatter. **UNTESTED.**
