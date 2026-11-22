# HANDOFF — WORLD ART

All changes are **UNTESTED** here.

## Round 2 — rendered contrast sampling
- **Failing check:** `art_contrast`.
- Replaced palette-vs-palette comparison with pixels from `#game` after a full animation frame. Player-space is transformed by current camera/view scale. The sampler takes the darkest 18% of pixels inside the player box as outline candidates and the median colour of a 6–10 game-pixel ring outside the box as backdrop, then applies WCAG sRGB relative luminance and contrast ratio.
- Hand trace: `Player.draw` renders through `G.art.draw('player')` in world space; `rooms.draw` applies camera transform before players; `main.render` applies `G.view.scale/sy`. The check mirrors those transforms before reading the game canvas, so it no longer samples the same palette value twice.
- Test: `node tools/smoke.mjs art_contrast --serial`. If any real ratio is <3:1, change art, not threshold. **UNTESTED.**

## Next — tar vs mud
- Mud remains matte brown with low-contrast ripple/pit marks. Tar is now near-black, much darker than mud, with a pale hard highlight and bubbles/ember flecks. Collision/material behavior is unchanged.
- Test: enter rooms containing `m` and `t`; confirm mud reads brown/matte and tar black/glossy at gameplay zoom. **UNTESTED.**
