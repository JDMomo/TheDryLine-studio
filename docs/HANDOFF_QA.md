# HANDOFF — QA

All entries are **UNTESTED** in this environment.

## D — built-in-only release builder
- **Change:** release builder now copies only `index.html`, `css/`, `js/`, and `assets/` directly into `dist/`, then writes `dist/TheDryLine-<date>.zip` with a small ZIP-store writer using Node built-ins. No `zip` executable or npm archive package is used.
- **File / function:** `tools/build_release.mjs`; recursive `copy()`, `crc32()`, ZIP record writer.
- **Expected:** `dist/index.html`, `dist/css/`, `dist/js/`, `dist/assets/`, and one dated zip. No tools/docs/lab/node_modules inside the archive.
- **Test:** run `node tools/build_release.mjs 2026-11-22`; inspect with `unzip -l dist/TheDryLine-2026-11-22.zip`; extract elsewhere and open its `index.html`.
- **Docs:** `docs/RELEASE.md` gives the verification sequence; `docs/KNOWN_ISSUES.md` carries unresolved items from `docs/PLAYTEST_REPORT.md`.

## Round 2 — release kit check
- **Change:** builder accepts an optional `--out=<dir>` solely so the check can isolate artifacts; added `release_kit.mjs` using Node built-ins to spawn the builder and inspect ZIP central-directory filenames.
- **File / function:** `tools/build_release.mjs` output selection; `tools/checks/release_kit.mjs`.
- **Hand trace:** builder's only roots are exactly `index.html/css/js/assets`; recursive copy records those relative paths; ZIP entries are written from that list. The check searches the ZIP central directory, requires index.html and prefixes css/js/assets, and rejects tools/docs/reference. `--out` changes only destination, not roots.
- **Expected:** isolated release zip contains the four shipping roots and no development roots.
- **Test:** `node tools/smoke.mjs release_kit --serial`. **UNTESTED.**

## Round 2 — known issues refresh
- **Change:** rewrote `docs/KNOWN_ISSUES.md` from the studio-lead round-2 review as eight plain player-facing/test-facing lines, explicitly marking test-only items.
- **Expected:** release reviewers see the current merged-build blockers rather than the older generic list.
- **Test:** compare the file line-by-line with the round-2 review; no runtime test required. **UNTESTED as integrated status.**

## Round 3 — known issues
- Replaced Round-2 issue list with the lead's Round-3 merged-build state: audio blocker, engine presentation check, two level items, world-art merge/readability items, line-art review gate, and the three green teams.
- Test: compare to Round-3 studio-lead report; no runtime assertion. **UNTESTED as integrated state.**

## Round 4 — known issues refresh
- Replaced Round-3 list with the lead's Round-4 blockers and explicitly separated test/tooling failures from player-facing regressions.
- Test: compare against Round-4 review after merging branch heads. **UNTESTED as integrated state.**
