# Team 8 report — visual gate passed — 2026-11-22

## Engine
Open `lab/lineart/index.html`. The default lab now loads `engine_v3.js`, a dependency-free Canvas renderer that draws only seeded short strokes plus stroke contours. Wanderer, Strider and Gearling have part-bound form fields, tapered marks, three-to-five value groups, region palette swaps, stable motion at boil 0, and a controlled interior-stroke boil.

The broader Day-2 cast/Warden proof remains in `engine_v2.js` and `coverage.html`; v3 is the art-direction-quality proof for the three required day-one bodies.

## Shipping score
| Metric | Pass 01 | Pass 58 | Pass 59 | Final 60 |
|---|---:|---:|---:|---:|
| Silhouette | 5 | 8 | 8 | 8 |
| Value structure | 4 | 8 | 8 | 9 |
| Form | 4 | 8 | 8 | 8 |
| Line quality | 4 | 8 | 8 | 9 |
| Colour | 5 | 8 | 8 | 8 |
| Motion | 5 | 8 | 8 | 8 |
| Consistency | 5 | 8 | 8 | 8 |
| Identity | 4 | 8 | 8 | 8 |
| Professional finish | 4 | 8 | 8 | 8 |

**Gate passed:** passes 58 and 59 are the first two consecutive all-8-or-better sheets; pass 60 confirms the result. Earlier passes were not promoted merely because individual craft metrics reached 8.

## Final decisions
Recommended density 1.0. Recommended presentation boil **0.15** at about 8 fps; attacks, telegraphs and any timing-critical state use **0**. Seed stays stable per skin. The Dry Line identity comes from rail-joint stitch rhythms, rivets, instrument arcs, salt-break gaps, lamp accents, restrained rust/green/slate ramps, and heavy gameplay contours rather than imitation of a named artist or game.

## Budgets
The deterministic JS operation self-test covers 17 specs in the local research copy and reports a worst mock bake of 104.236 ms with maximum raw strip memory 0.793 MiB; both are within the brief's 150 ms / 2 MiB targets. A sandbox policy blocks browser navigation to local/file URLs here, so this is reported as an operation benchmark rather than a claimed real-Chrome wall-clock measurement.

## Remaining work
The three-character visual gate is closed. Remaining work is extension, not rescue: author equally strong attack/defeat acting for the rest of the cast; articulate Warden attack parts; and replace the synthetic busy-background panel with an actual gameplay capture when the lab runs in a normal developer browser.

## Files
Primary: `index.html`, `engine_v3.js`, `engine_v2.js`, `coverage.html`, `compare.html`, `CRITIQUE.md`, `REFERENCES.md`, `DECISIONS.md`, `INTEGRATION.md`, `EFFECTS.md`, `REPORT.md`. Local delivery additionally contains pass 01–60 contact sheets, A/B comparisons, final contact, pass-01-vs-final, and boil/run GIFs.
