# Effects and motion rules
- **Telegraph:** do not replace the character. Re-render its stable strokes and add a sparse rust-red outer echo for the warning interval. Stroke IDs/positions stay fixed.
- **Hit flash:** briefly lift existing stroke colours toward paper white; no new silhouette noise.
- **Defeat:** detach the existing stroke set from its owning parts and advect it outward over 0.6–0.9 s; this is a transformation of existing strokes, not a particle sprite.
- **Metal:** sharp, long, nearly parallel marks with bright edge omissions.
- **Cloth:** curved marks that bunch around folds; lower contour certainty at trailing hems.
- **Glow/glass:** sparse marks and paper-negative cores; additive colour is reserved for the small effect pass.
- **Boil:** stable stroke IDs; only control points move. Recommended 0.15 at 8 fps for calm idles, 0 for attacks/telegraphs and small enemies.

Animation next: author per-part transforms rather than re-sampling. Wanderer run uses six pose keys in the research proof; production target should match the game's eight-frame run strip before integration.