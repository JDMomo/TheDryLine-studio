# Team 3 cross-lane note

The brief explicitly requires combat hit testing to respect Warden multipart shapes. That call site lives in `js/game/combat.js`, outside Team 3's nominal ownership. This branch makes only the three boss collision substitutions there: token body strike, projectile touching and melee. No player/enemy combat rules were changed.
