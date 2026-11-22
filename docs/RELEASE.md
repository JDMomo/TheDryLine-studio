# Release procedure

1. Clean checkout: `npm install`, `npm test`, `npm run roomlint -- --strict`.
2. `node tools/build_release.mjs YYYY-MM-DD` builds `dist/TheDryLine-YYYY-MM-DD/` and zip, excluding tools/docs/reference/lab/git/dependencies.
3. Unzip to a new folder and open `index.html` in a fresh browser profile.
4. Verify title/start, keyboard, one controller, pause/remap/comfort, map, five Junction exits, four loop-back hatches, token punch, one Warden, Long Clock entry, win/lose, audio mute/volume and no console errors.
5. Confirm `G.errors` empty and `G.audio.rebuilds` 0.
6. Do not publish until PLAYTEST_REPORT second-pass verification is complete.
