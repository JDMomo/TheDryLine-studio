# Known issues — studio lead round 3

- **Audio — BLOCKER:** malformed Last Timetable bars in Signal Reef/Salt Cutting cause those tracks to be rejected and cascade errors across the game.
- **Bosses/Engine — TEST-ONLY presentation regression:** Long Clock no longer satisfies the shared half-health presentation check after its pendulum fix.
- **Level:** the Wreck Quay rail-cart marker is under solid geometry and fails room lint.
- **Level:** regional-signature coverage still needs an active r1 cart and three Ticket Hall main rooms carrying its plate/timed-gate language.
- **World Art — TEST-ONLY until merged:** rendered player/background contrast sampler was not present in the lead's merged build; previous ~1:1 values came from invalid sampling.
- **World Art:** tar and mud need clearly different material reads at gameplay scale.
- **Line Art — REVIEW-ONLY:** repository still needs the actual painted-reference comparison PNG and continuing v4 pass proof before visual acceptance.
- **Combat/Systems/QA:** round-2 failing checks are green in the studio lead's merged suite; their next-item work is not a release regression.
