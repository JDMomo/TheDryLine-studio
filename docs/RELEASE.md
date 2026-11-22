# Release procedure

1. From a clean checkout, run `npm install`, then `npm test` and `npm run roomlint -- --strict`.
2. Run `node tools/build_release.mjs YYYY-MM-DD`. It creates `dist/TheDryLine-YYYY-MM-DD/` and a zip beside it, excluding `tools/`, `docs/`, `reference/`, `lab/`, git metadata and dependencies.
3. Unzip into a new temporary folder. Open `index.html` in a fresh browser profile.
4. Verify title/start, keyboard controls, one controller, pause/remap/comfort, map, all five Junction exits, all four loop-back hatches, one token punch, one Warden, Long Clock entry, win/lose screens, audio mute/volume and no console errors.
5. Confirm `G.errors` is empty and `G.audio.rebuilds` remains 0.
6. Do not publish until the second-pass verification table in PLAYTEST_REPORT is complete.

The release zip is a local artifact only; do not upload it automatically.
