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
