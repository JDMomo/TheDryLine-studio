# Team 3 — Bosses & Engine — 2026-11-22

Implemented the shared set-piece presentation in the Warden base rather than forking five bosses: 1.5 s camera cue/title intro, a harmless half-health Phase II beat before each boss's existing enraged pattern/twist, and a short slow-motion/wash death accent before the existing grade/reward flow. Fare-slot badges already expose cut colour/icon and crack count; this pass keeps that shared system and adds a regression check.

Corrected combat collision to use the boss definition's live multipart `shapes()` for token bodies, projectiles and melee instead of the bounding `rect()`, while fare-slot punches still test the slot circle first.

Existing boss files already add enraged attack twists (extra Tollkeeper spit, Lamp-Heron sparks, Switchman extra ring/geyser marks, Gatewhale steam reversal and the Long Clock pendulum phase), so the shared transition exposes those rather than inventing a duplicate attack table.

The requested 3x-per-Warden human fight table and real-Chrome Performance-panel 99th percentile cannot be honestly produced through the GitHub connector; existing bot checks remain the executable floor. Do not interpret this note as a human playtest.
