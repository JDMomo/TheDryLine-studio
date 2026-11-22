# HANDOFF — COMBAT

All entries are **UNTESTED** in this environment unless the studio lead records a result here.

## A — enemy wind-up code audit
- **Change:** replaced subjective/hand-play wording with a static attack audit for all 11 enemy definitions.
- **File / function:** `docs/ENEMY_AUDIT_DAY.md`; source audited: each `G.defineEnemy(...).update` / guard in `js/content/enemies.js`.
- **Expected:** every harmful action has its literal code wind-up listed; no row implies a playtest. Current shortest is Strider at 0.38 s, so no timing code needed changing.
- **Test:** run `node tools/smoke.mjs enemy_patterns2` and `node tools/smoke.mjs enemy_tell_floor`; then manually provoke each attack once and confirm the warning shown matches the table.
