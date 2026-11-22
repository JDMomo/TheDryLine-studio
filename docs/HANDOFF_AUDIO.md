# HANDOFF — AUDIO

All entries are **UNTESTED** in this environment.

## E — Last Timetable leitmotif data
- **Change:** added a new original four-bar 4/4 leitmotif named `LAST_TIMETABLE` in the existing sixteenth-note token format, plus a `last_timetable` motif layer on the Junction track. No audio engine code changed.
- **File / function:** `js/content/music.js`; constants `LAST_TIMETABLE`, `lastTimetableLayer()`, Junction `defineTrack` layer list.
- **Expected:** the Junction's first 12 bars are unchanged; bars 13–16 add the new bell motif. Existing adaptive roles treat it as a normal `motif` layer.
- **Test:** run `node tools/smoke.mjs audio --serial` and `node tools/audio/export_midi.mjs`. Confirm validation reports no bad bar lengths and hub MIDI contains `last_timetable`; listen to the last four hub bars for a clean loop return. **UNTESTED.**
