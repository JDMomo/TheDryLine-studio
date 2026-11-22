# Known issues — studio lead round 2

- **Level / hub_layout:** Drill Yard reward props can overlap working props, making the yard visually/collision-wise crowded.
- **Level / region_signature:** several region main rooms are missing the terrain/mechanism mix that should make their line immediately recognizable.
- **Combat / enemy_materials — TEST-ONLY metadata failure:** Harvester and Mirage material tags/check vocabulary are incomplete; current gameplay attacks are not reported broken by this failure.
- **Bosses / boss_final:** the Long Clock pendulum can hit the simple jump bot at the 140 px setup after the branch's phase-presentation changes.
- **Systems / opening_loop — TEST-ONLY placement mismatch:** the teaching check looks only in Wreck Quay room one although worldgen guarantees the useful trunk somewhere in Wreck Quay before its Warden.
- **World Art / art_contrast — TEST-ONLY sampling failure until resampled:** the current contrast check compares palette values incorrectly and reports ~1:1; actual on-canvas player/background contrast has not yet been established.
- **Audio / audio_contract:** pogo/down-slash bounce has no dedicated sound, so that movement confirmation is missing.
- **Line Art / visual review — REVIEW-ONLY, not a smoke failure:** pass 72 still needs a repository proof beside the decoded painted references before the visual gate can be accepted.
