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
