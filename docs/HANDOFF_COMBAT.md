# HANDOFF — COMBAT

All entries are **UNTESTED** in this environment unless the studio lead records a result here.

## A — enemy wind-up code audit
- **Change:** replaced subjective/hand-play wording with a static attack audit for all 11 enemy definitions.
- **File / function:** `docs/ENEMY_AUDIT_DAY.md`; source audited: each `G.defineEnemy(...).update` / guard in `js/content/enemies.js`.
- **Expected:** every harmful action has its literal code wind-up listed; no row implies a playtest. Current shortest is Strider at 0.38 s, so no timing code needed changing.
- **Test:** run `node tools/smoke.mjs enemy_patterns2` and `node tools/smoke.mjs enemy_tell_floor`; then manually provoke each attack once and confirm the warning shown matches the table.

## B — enemy hit-stop and weight-scaled knockback
- **Change:** successful enemy damage now requests 0.05 s through `G.fx.hitstop`; knockback uses `220 / weight`, with ordinary enemies defaulting to weight 1 and existing `heavy:true` enemies treated as weight 3.5. Explicit future `def.weight` values can tune this without changing the damage API.
- **File / function:** `js/game/enemies.js`, `Enemy.prototype.damage`. Name and return behavior are unchanged.
- **Expected:** a successful unguarded enemy hit creates a 0.05 s hit-stop request. Ordinary enemies receive ~220 knockback velocity; heavy enemies receive ~62.9. Guarded hits still return before either effect. Summoned/no-loot enemies use the same rule.
- **Test:** add/extend an enemy combat check to record `G.fx.hitstop`, `kbV` and `damage()` return after one normal hit, one heavy-enemy hit and one blocked Scrapper hit. In game, slash Strider then Scrapper and verify the Strider moves substantially farther while both hits get the same brief freeze. **UNTESTED.**

## Round 2 — enemy material metadata
- **Failing check addressed:** `enemy_materials`.
- **Change:** Harvester is `metal+wet`; Mirage is `slick`. Corrected this branch's new check to use only tags actually defined by `G.MATERIALS`.
- **File / function:** `js/content/enemies.js` Harvester/Mirage definitions; `tools/checks/enemy_materials.mjs`.
- **Hand trace:** `G.MATERIALS` in `js/game/combat.js` defines heavy, metal, flammable, wet, slick, brittle, magnetic, spark. The prior check incorrectly demanded unsupported `stone` and `cloth`; those could never be valid material vocabulary. I did not change any pre-existing check. The corrected check now asks Strider for brittle, Harvester for metal+wet, Mirage for slick, all defined tags; both enemy definitions now supply the requested arrays.
- **Expected:** `enemy_materials` finds every requested tag and every region still has at least one tagged cast member.
- **Test:** `node tools/smoke.mjs enemy_materials --serial`. **UNTESTED.**

## Round 2 — hit-stop stacking trace
- **Review item addressed:** confirm new enemy hit-stop does not add to existing slash hit-stop.
- **Code traced:** `combat.melee()` calls `Enemy.damage()`, then `Player.slashLanded()`. `Enemy.damage()` writes `fx.hitstop = Math.max(fx.hitstop, 0.05)`. `slashLanded()` calls `fx.jolt(...)`; `fx.jolt()` also writes `fx.hitstop = Math.max(fx.hitstop, stop)`.
- **Why no code change:** both paths use max, never addition. A normal slash therefore resolves to the larger requested value; heavy slash likewise keeps its larger 0.09 request.
- **Test:** slash one enemy normally and one with Heavy Cut while inspecting `G.fx.hitstop`; verify it is max-request behavior, not 0.05 plus the slash request. **UNTESTED.**

## Next — pogo-top inventory
- **Change:** added `enemy_pogo_tops.mjs`, listing every registered enemy and whether its physical top is pogo-able.
- **Hand trace:** combat melee treats a down slash like every other enemy-body rectangle hit; no enemy definition currently sets a pogo exclusion and all 11 definitions have positive w/h physical bodies. Therefore every current regular enemy has a top and uses the common down-slash hit path.
- **Expected:** table lists all 11 as pogo; check fails if a future enemy explicitly opts out with `noPogo:true`.
- **Test:** `node tools/smoke.mjs enemy_pogo_tops --serial`; manually pogo each enemy type once. **UNTESTED.**
