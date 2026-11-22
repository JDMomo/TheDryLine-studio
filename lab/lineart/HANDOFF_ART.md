# HANDOFF — ART / LINE ART

All browser visual results are **UNTESTED** here; repository inputs and code paths were inspected directly.

## Review of Pass 72
- The three painted references are stored as base64 PNG payloads in `lab/lineart/_refs/player_idle.b64`, `strider_move.b64`, and `gearling_move.b64`.
- Added `lab/lineart/decode_refs.mjs`: Node built-ins decode those exact payloads to sibling PNGs. No recreation/substitution.
- Added `pass_72_vs_painted.html`: side-by-side proof uses those decoded PNGs directly, never the proxy renderer in `render_pass.py`.
- Added `engine_v4.js` as the in-browser engine derived from v3; v4 tightens density to 1.08 and calm boil to .08 while critical poses remain zero-boil. Anatomy/specs stay data-driven.
- Hand trace: compare page loads `engine_v4.js`, reads `G.lineartV4.specs`, and renders Wanderer/Strider/Gearling beside the exact decoded files named above. Thus the proof cannot silently compare procedural art against `proxy_ref()`.
- Test: `node lab/lineart/decode_refs.mjs`, open `lab/lineart/pass_72_vs_painted.html`, visually inspect all three rows. **UNTESTED.**

## Pass 73
- Pass 73 is the first v4 browser pass: slightly denser interior value strokes, reduced idle boil, zero critical-pose boil, no anatomy change. This specifically targets the painted references' steadier silhouettes while retaining procedural hatch texture.
- Test in the compare page at gameplay scale and 200% zoom; reject if contour chatter or part drift appears. **UNTESTED.**

## Round 3 — binary proof path
- Added `build_painted_proof.mjs`, Node-built-ins only. It decodes the exact three `_refs/*.b64` payloads and writes a real PNG proof file path under `passes/`; it never invokes `proxy_ref()`.
- `engine_v4.js` and the HTML side-by-side proof are already present on this branch from the prior commit; this commit makes the missing binary-proof generation reproducible in the repository.
- Test: `node lab/lineart/build_painted_proof.mjs`, then inspect `passes/pass_72_vs_painted.png` and the browser compare page. **UNTESTED.**

## Round 4 — JS file integrity and live index
- **File-writing bug addressed:** `engine_v4.js` comment and `const P` are separate physical lines; no literal backslash+n is used there.
- `index.html` now loads `./engine_v4.js` and draws Wanderer/Strider/Gearling live at 1x and 4x on canvas; it no longer presents a saved PNG as the current engine proof.
- `pass_72_vs_painted.html` uses existing relative paths `./engine_v4.js` and `./_refs/*.png`; those PNGs are generated from the branch's own b64 files by `decode_refs.mjs`.
- **Test:** decode refs, open both HTML files, verify no console error and all six live index renders plus three painted comparison rows appear. **UNTESTED.**

## Round 4 — committed Pass 73
- Replaced v4 with the compact browser renderer used as the Pass-73 geometry/hatching source: Wanderer is explicitly multipart (instrument, two scarf tails, layered cloak, two sleeves/hands, face/hair/collar, brim/crown/frog, legs/boots); Strider and Gearling remain multipart.
- Committed `passes/pass_73.png`, rendered from the same authored geometry and hatch/value algorithm in the local raster proof port. The browser engine remains the authoritative live implementation.
- **File-integrity re-read:** engine begins with IIFE, G/TAU declaration, then PAL declaration on separate physical lines; no literal `\\n` token was introduced by the write.
- Test: open `index.html` and compare its live 1x/4x renders to `passes/pass_73.png`; inspect painted comparison after decoding refs. **UNTESTED in game.**

## Round 4 — decoded painted files committed
- Committed real PNG siblings for all three repository reference payloads: `_refs/player_idle.png`, `strider_move.png`, `gearling_move.png`. The compare page's relative paths now exist without requiring a pre-step.
- Each PNG blob is decoded directly from its existing branch `.b64` text via GitHub base64 blob creation; no redraw/substitution.
