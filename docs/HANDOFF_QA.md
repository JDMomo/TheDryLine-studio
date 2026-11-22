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
