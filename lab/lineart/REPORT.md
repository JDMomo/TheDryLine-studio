# Team 8 report — 2026-11-22
Dependency-free Canvas research engine with seeded strokes, form-following hatch fields, density-as-value, contour hierarchy, palette swaps, six-frame motion proof and `G.lineart.bake` cached-strip API.

Day-one items 1–6 are implemented at prototype level: lab UI, Wanderer idle/run proof, Strider/Gearling + palette swaps, memory measurement, README and integration doc. Fifteen critique passes were completed locally. Raw six-frame memory is ~96 KiB, within 2 MiB. Reliable target-Chrome bake timing remains open. The contact-sheet busy background is a stress test, not a real game screenshot, because repository binaries were unavailable to the local renderer.

Score table: pass 01 = silhouette 5/value 4/form 4/line 4/colour 5/motion 5/consistency 5/identity 4/finish 4. Best/final pass 15 = 7 across all nine categories. **Shipping gate NOT MET**: no two consecutive all-8+ passes. The prototype is credible research, not art-director-shippable art.

Recommended: count 1550, length 5.4, width .87, contour 1.45, density 1.8, bend .60, jitter 4, boil .15 calm / 0 telegraphs.

Open: geometric specs, no true taper, silhouette tangencies, motion is pose variation rather than authored locomotion, real game-background screenshot missing, target-Chrome benchmark missing.

Next three: (1) tapered pressure ribbons/material stroke primitives; (2) silhouette-first redesign + authored run keys with stable stroke IDs; (3) run in actual game Chrome, capture real room background, benchmark and continue until two all-8+ passes.

Changed: index.html, lineart.js, README.md, INTEGRATION.md, DECISIONS.md, REFERENCES.md, CRITIQUE.md, SPECS.md, REPORT.md. Local delivery zip additionally contains passes/pass_01.png…pass_15.png, shots/final_contact.png and shots/wanderer_run.gif.