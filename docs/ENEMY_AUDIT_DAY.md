# Enemy code audit — 2026-11-22

**UNTESTED:** this is a static audit of `js/content/enemies.js`. No play session or automated check was run in this environment.

| Enemy / id | Harmful action | Wind-up in code | Counter visible in code |
|---|---|---:|---|
| Strider / `ballast_crab` | committed claw lunge | 0.38 s `wind` | bait the lunge, jump/pogo over it, punish 0.50 s recovery |
| Boiler / `brine_spout` | arcing brine lob | 0.60 s `wind` | move before release; projectile is `cut:true`, so a slash can destroy it |
| Boiler / `brine_spout` | close steam/brine vent | 0.42 s `ventwind` | bait the close-range branch, then leave the 58 px burst radius |
| Scrapper / `turnstile` | shield charge | 0.55 s `wind` | down-slash/pogo bypasses guard; back hit works; 0.72 s recovery is open |
| Rivet / `signal_gull` | arcing swoop | 0.55 s `wind` | bait the committed arc, sidestep/change height, punish 0.48 s recovery |
| Lamp Wisp / `lamp_wisp` | death burst | 0.45 s `pop` | killing blow starts a harmless warning; leave the 56 px burst radius |
| Brine Toad / `brine_toad` | hop + landing splashes | 0.40 s `crouch` | bait the hop/landing point; jump or pogo over the committed approach |
| Gearling / `handcar` | floor dash | 0.65 s `wind` | bait the lane, jump/pogo over it, punish 0.90 s rest |
| Hanging Lamp / `hanging_lamp` | ceiling drop | 0.45 s `shake` | step out from beneath the lamp during the shake |
| Sapper / `sapper` | plant timed charge | 0.70 s `wind` | any hit causing `kbT > 0.02` interrupts the plant; leave/cut the warned charge |
| Harvester / `harvester` | repair pulse (support, not player damage) | 0.85 s `wind` | any hit causing `kbT > 0.02` interrupts the repair |
| Mirage / `mirage` | teleport dash | 0.50 s `tell` after 0.42 s `fade` | hit/pogo during tell to force recovery, or bait the committed dash |

## Wind-up floor

The shortest harmful wind-up found is Strider at **0.38 s**. No harmful wind-up is below the requested 0.35 s floor, so this audit makes no timing change. The file header should describe the floor as 0.35 s, not 0.30 s.

## Review note

Counters above are code-path interpretations only. They are **not hand-play findings**. The studio lead should verify readability and practical counter timing in play.
