# HANDOFF — AUDIO

All entries are **UNTESTED** in this environment.

## E — Last Timetable leitmotif data
- **Change:** added a new original four-bar 4/4 leitmotif named `LAST_TIMETABLE` in the existing sixteenth-note token format, plus a `last_timetable` motif layer on the 4/4 title track. No audio engine code changed.
- **File / function:** `js/content/music.js`; constants `LAST_TIMETABLE`, `lastTimetableLayer()`, title `defineTrack` layer list.
- **Expected:** the title's first 12 bars are unchanged; bars 13–16 add the new bell motif. Existing adaptive roles treat it as a normal `motif` layer.
- **Test:** run `node tools/smoke.mjs audio --serial` and `node tools/audio/export_midi.mjs`. Confirm validation reports no bad bar lengths and title MIDI contains `last_timetable`; listen to the last four title bars for a clean loop return. **UNTESTED.**

## Round 2 — pogo SFX
- **Failing check addressed:** `audio_contract` missing `pogo`.
- **Change:** added only one `SFX.pogo` entry (400→900 Hz sine sweep over 60 ms plus a soft high-passed click) and extended the existing audio wrapper around `Player.slashLanded` to play it after a successful down-slash landing.
- **File / function:** `js/core/audio.js`, `SFX` table and existing `install()` wrapper for `slashLanded`.
- **Hand trace:** `Player.slashLanded` is called by combat only when the slash connects with boss/enemy/spike; its down branch applies `vy=-POGO_V`. Audio already wraps this method and sets `_audPogo` to suppress the normal jump chirp. The new call is inside that same successful-down-hit wrapper. `G.audio.SFX_NAMES` is `Object.keys(SFX)`, so adding the entry makes `audio_contract` find `pogo`.
- **Expected:** one pogo chirp per successful down-slash bounce; no chirp on an air down-slash that hits nothing.
- **Test:** `node tools/smoke.mjs audio_contract --serial` and the existing audio check; in game, down-slash an enemy and a spike and listen for the short upward chirp. **UNTESTED.**

## Next — Last Timetable in all four regions
- **Change:** added note-data-only `last_timetable` motif layers to r1-r4, adapted to each track's meter/key and a different instrument voice: r1 pluck, r2 bell, r3 arp, r4 epiano. No audio engine change.
- **Hand trace:** each new part has exactly the track's steps-per-bar (r1/r4 16, r2 14, r3 12) and each order is 16 bars. Existing `defineTrack` validation therefore sees matching bar lengths; each layer role is `motif`, satisfying the contract without replacing the pre-existing Line motif.
- **Expected:** the four region tracks each contain a second, quieter Last Timetable quotation with distinct timbre/mode adaptation.
- **Test:** `node tools/smoke.mjs audio_contract --serial` plus the normal audio validation/export; listen to r1-r4 for the added quiet quotation. **UNTESTED.**

## Round 3 — bar-length repair
- **Blocking failure:** music validator dropped r2/r3, cascading into all checks.
- **Validator traced:** `stepsPerBar(t)=round(sig[0]*16/sig[1])`; `validate()` splits every part on whitespace and rejects `toks.length !== spb`. Layer entries in title/r1-r4 are comma-separated; `lastTimetableLayer()` is the final title layer and therefore needs no following comma.
- **Hand-count table:** title 4/4 = 16: A=16 B=16 C=16 D=16. r1 4/4 = 16: A=16 B=16. r2 7/8 = 14: A=14 B=14 after adding one terminal hold to each. r3 6/8 = 12: A=12 B=12 after adding one terminal hold to each. r4 4/4 = 16: A=16 B=16.
- **audio_contract trace:** once all tracks survive `defineTrack`, `M.tracks[id]` exists before `.layers` access; r1-r4 each have bed plus lead/motif, boss_clock remains present, and SFX_NAMES includes pogo from Round 2.
- **Expected:** no music validation errors; r2/r3 remain registered; `audio_contract` no longer dereferences a missing track.
- **Test:** full smoke suite, then `node tools/smoke.mjs audio_contract --serial` and audio validation/export. **UNTESTED.**

## Round 4 — final r2 motif recount
- **Blocking failure addressed:** r2 Last Timetable part B had 15 tokens for a 14-step 7/8 bar.
- **Change:** removed the extra rest immediately before C#4.
- **Validator trace:** `stepsPerBar` gives title=16, r1=16, r2=14, r3=12, r4=16. Whitespace-token recount after this edit: title A/B/C/D = 16/16/16/16; r1 A/B = 16/16; r2 A/B = 14/14; r3 A/B = 12/12; r4 A/B = 16/16. Layer commas were re-read: each inserted regional layer is followed by a comma before `tenseLayer`; title's `lastTimetableLayer()` is the final array entry and needs no trailing comma.
- **Expected:** r2 survives `defineTrack`; `audio_contract` can read every required track's `.layers`.
- **Test:** full suite plus `node tools/smoke.mjs audio_contract --serial`. **UNTESTED.**
