/* The placeholder soundtrack, as data. docs/AUDIO_BIBLE.md says what each track is for; js/core/audio.js plays this; tools/audio/export_midi.mjs
   writes the same patterns as MIDI files for Ableton Live. Everything here is original: the motifs are written in the bible.

   A track: { id, title, bpm (quarter notes per minute), sig: [beats, unit], bars, loopStart, loopEnd (bars), loop, swing, key, mood, layers }.
   The grid is sixteenth notes: a bar has beats * 16 / unit steps (4/4: 16, 3/4: 12, 6/8: 12, 7/8: 14, 5/4: 20).
   A layer: { id, role, inst, vol, pan, rev, dly, on, live, parts: { A: 'tokens' }, order: 'AABA' }. order has one letter per bar ('_' = silent bar;
   a single letter repeats for every bar). A part is one bar of space-separated tokens, one token per step:
     .            rest                          -          hold the note before it for one more step (may run on into the next bar)
     D4  F#3  Bb2 a note (C1 to C7 are accepted)   D3+A3+F4 a chord   (add ^ for an accent: D4^)
     drums only:  k kick, s snare, h hat, H open hat, c clap, r rim, t tom, m clock tick     (join with +: k+h)
   Roles drive the adaptive plan (audio.js): bed, bass, lead, perc, arp, motif, tense (low health), rage (boss below half health),
   slot:<cut> (one per charted cut; fades when that slot is punched), lift and lift2 (one and two slots punched), borrow:<region> (Long Clock). */
(() => {
'use strict';
const G = window.G || (window.G = {});
const fail = m => (G.fail ? G.fail(m) : console.error(m));

const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function noteToMidi(n) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) return NaN;
  return NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
}
const midiToNote = v => SHARP[((v % 12) + 12) % 12] + (Math.floor(v / 12) - 1);
const DRUMS = 'kshHcrtm';
const LO = 24, HI = 96;           // C1 to C7

const stepsPerBar = t => Math.round(t.sig[0] * 16 / t.sig[1]);
// How many steps one "beat" is, for layer changes that wait for a beat: a quarter in x/4, a dotted quarter in 6/8, an eighth in 7/8.
const beatSteps = t => t.beatSteps || (t.sig[1] === 4 ? 4 : t.sig[0] % 3 === 0 && t.sig[0] >= 6 ? 6 : 2);

// order -> one letter per bar
function orderOf(layer, bars) {
  let o = layer.order || 'A';
  if (o.length === 1) o = o.repeat(bars);
  return o;
}

/* Turns a track into events, the form both the synth and the MIDI exporter use:
   { stepsPerBar, steps, loopStartStep, loopEndStep, layers: [{ id, events: [{ s, len, n: [midi...] | d: [drum letters], v }] }] }.
   Held notes run across bar lines. A note that runs past the end of the loop is cut at the loop end in the file export and rings in the synth. */
function compile(t) {
  const spb = stepsPerBar(t), total = spb * t.bars, out = { stepsPerBar: spb, steps: total, loopStartStep: (t.loopStart || 0) * spb, loopEndStep: (t.loopEnd == null ? t.bars : t.loopEnd) * spb, layers: [] };
  for (const L of t.layers) {
    const order = orderOf(L, t.bars), toks = [];
    for (let b = 0; b < t.bars; b++) {
      const part = order[b] === '_' ? null : L.parts[order[b]];
      if (part == null) { for (let i = 0; i < spb; i++) toks.push('.'); continue; }
      for (const x of part.trim().split(/\s+/)) toks.push(x);
    }
    const events = [];
    for (let s = 0; s < toks.length; s++) {
      const tk = toks[s];
      if (tk === '.' || tk === '-') continue;
      let len = 1; while (s + len < toks.length && toks[s + len] === '-') len++;
      const accent = tk.endsWith('^'), body = accent ? tk.slice(0, -1) : tk, v = accent ? 1 : 0.75;
      if (L.inst === 'drums') events.push({ s, len: 1, d: body.split('+'), v });
      else events.push({ s, len, n: body.split('+').map(noteToMidi), v });
    }
    out.layers.push({ id: L.id, events });
  }
  return out;
}

// Every problem found in a track, as plain sentences ([] = fine).
function validate(t) {
  const bad = [], at = (L, m) => bad.push(t.id + (L ? '/' + L.id : '') + ': ' + m);
  if (!(t.bpm >= 40 && t.bpm <= 220)) at(null, 'bpm out of range');
  if (!Array.isArray(t.sig) || !(t.sig[0] > 0) || ![4, 8].includes(t.sig[1])) { at(null, 'sig must be [beats, 4 or 8]'); return bad; }
  const spb = stepsPerBar(t);
  if (!Number.isInteger(spb)) at(null, 'bar is not a whole number of sixteenths');
  if (!(t.bars >= 1)) at(null, 'needs bars');
  const le = t.loopEnd == null ? t.bars : t.loopEnd, ls = t.loopStart || 0;
  if (t.loop !== false && !(ls >= 0 && le <= t.bars && le > ls)) at(null, 'loop points outside the track (loopStart ' + ls + ', loopEnd ' + le + ', bars ' + t.bars + ')');
  if (t.loop !== false && le !== t.bars) at(null, 'loopEnd must equal bars so every stem has the same length');
  if (!t.layers || !t.layers.length) at(null, 'no layers');
  const ids = new Set();
  for (const L of t.layers || []) {
    if (ids.has(L.id)) at(L, 'duplicate layer id'); ids.add(L.id);
    if (!L.role || !L.inst || !L.parts) { at(L, 'needs role, inst and parts'); continue; }
    const order = orderOf(L, t.bars);
    if (order.length !== t.bars) at(L, 'order has ' + order.length + ' letters, the track has ' + t.bars + ' bars');
    for (const c of new Set(order)) if (c !== '_' && !L.parts[c]) at(L, 'order uses part ' + c + ' which does not exist');
    for (const k in L.parts) {
      const toks = L.parts[k].trim().split(/\s+/);
      if (toks.length !== spb) at(L, 'part ' + k + ' has ' + toks.length + ' steps, a bar is ' + spb);
      toks.forEach((tk, i) => {
        if (tk === '.' || tk === '-') return;
        const body = tk.endsWith('^') ? tk.slice(0, -1) : tk;
        for (const x of body.split('+')) {
          if (L.inst === 'drums') { if (x.length !== 1 || !DRUMS.includes(x)) at(L, 'part ' + k + ' step ' + i + ': "' + x + '" is not a drum'); }
          else { const m = noteToMidi(x); if (!(m >= LO && m <= HI)) at(L, 'part ' + k + ' step ' + i + ': "' + x + '" is not a note from C1 to C7'); }
        }
      });
    }
    // a hold may only follow a note in the same layer: a bar that starts with '-' needs the bar before it to end on a note
    const toks = [];
    for (let b = 0; b < t.bars; b++) { const p = order[b] === '_' ? null : L.parts[order[b]]; if (p == null) { for (let i = 0; i < spb; i++) toks.push('.'); } else toks.push(...p.trim().split(/\s+/)); }
    toks.forEach((tk, i) => { if (tk === '-' && (i === 0 || toks[i - 1] === '.')) at(L, 'a hold at step ' + i + ' follows a rest'); });
  }
  return bad;
}

const chord = (c, n) => c + ' ' + Array(n - 1).fill('-').join(' ');              // one chord held for n steps
const rep = (s, n) => Array(n).fill(s).join(' ');
const up = (s, n = 12) => s.split(' ').map(x => (x === '.' || x === '-') ? x : x.split('+').map(y => { const a = y.endsWith('^'); const b = a ? y.slice(0, -1) : y; return midiToNote(noteToMidi(b) + n) + (a ? '^' : ''); }).join('+')).join(' ');

// The low-health layer every explore and boss track carries, off until a player is on their last pip: a root and the semitone above it.
const tenseLayer = (spb, root, minor2) => ({ id: 'tense', role: 'tense', inst: 'pad', vol: 0.5, rev: 0.3, on: false, params: { cutoff: 500 }, parts: { A: chord(root + '+' + minor2, spb) }, order: 'A',
  live: 'Wavetable, low-pass 500 Hz, two notes a semitone apart, Chorus-Ensemble. Muted until low health.' });

const tracks = {}, order = [];
function defineTrack(t) {
  const bad = validate(t);
  if (bad.length) { bad.forEach(fail); return; }
  if (!tracks[t.id]) order.push(t.id);
  tracks[t.id] = t;
}

const music = G.music = {
  version: 1,
  tracks, order, defineTrack, compile, validate, noteToMidi, midiToNote, stepsPerBar, beatSteps,
  // Which tracks have real exports in assets/audio/ (the engine then plays the file in place of the synth). See assets/audio/README.md.
  //   id: true                         assets/audio/<id>.ogg, one full mix (layers cannot change, only the whole track filters and ducks)
  //   id: { stems: ['bed', 'lead'] }   assets/audio/<id>__<layer>.ogg for every layer listed (the adaptive plan keeps working)
  files: {},
  // The room-to-track map the director uses (audio.js): region id -> track id.
  regionTrack: { r1: 'r1', r2: 'r2', r3: 'r3', r4: 'r4', final: 'final' },
  // The Warden fight track is played in a key per Warden (semitones above the written key).
  variants: { boss_warden: { r1: 0, r2: 2, r3: -2, r4: 5 } },
  // Ableton Live starting points per instrument (used as the MIDI track names and in assets/audio/README.md).
  live: {
    pad: 'Wavetable (Basic Shapes: two saws, detune 12 cents), low-pass 12 dB about 1.2 kHz, attack 0.4 s, release 1.2 s; Chorus-Ensemble; Reverb 3 s',
    pulse: 'Operator (square oscillator, pulse width 25 percent) or Wavetable; short vibrato from LFO; Echo dotted eighth at 20 percent',
    lead: 'Wavetable (Basic Shapes: saw plus triangle), low-pass 2.5 kHz, slight vibrato; Reverb 1.8 s',
    bass: 'Operator (sine plus saw, sub) with Auto Filter low-pass, fast envelope; Saturator soft',
    sub: 'Operator, sine only, attack 80 ms; nothing else',
    bell: 'Operator (algorithm with two sines, ratio 3.5, fast mod decay) or Collision (Marimba); Reverb 2.5 s',
    pluck: 'Operator (square pulse 12 percent, short decay) or Collision (Marimba), Echo; Reverb 1.5 s',
    arp: 'Wavetable or Operator, triangle, decay 150 ms; Echo dotted eighth',
    epiano: 'Electric (Live Instruments: Rhodes-like) or Operator; Chorus-Ensemble, Vinyl Distortion (light), Redux off; tape-style pitch wobble from Auto Filter LFO',
    drums: 'Drum Rack: 808 Core kit or Kit-Core 808; hats at low velocity; Glue Compressor; Saturator'
  }
};

/* ------------------------------------------------------------------------------------------------------------------------
   Motifs (original), also written out in docs/AUDIO_BIBLE.md.
   THE LINE (main theme, in D dorian; 4/4, sixteenth grid):  D4 (6) A4 (2) G4 (2) F4 (2) E4 (4) | F4 (4) E4 (2) D4 (6) A3 (4) | D4 (6) A4 (2) B4 (2) C5 (2) A4 (4) | G4 (4) F4 (2) E4 (2) D4 (8)
   THE TOLL (Warden motif, in E minor):  E4 (2) E4 (2) B4 (4) Bb4 (4) A4 (4) | G4 (4) E4 (6) E4 (2) G4 (2) E4 (2)
   THE FARE (token motif, in any key; shown in G):  G5 (2) B5 (2) D6 (2) B5 (2) G6 (6)
   ------------------------------------------------------------------------------------------------------------------------ */

const D = '. . . . . . . . . . . . . . . .';

// Last Timetable: new four-bar railway leitmotif; data only, no engine changes.
const LAST_TIMETABLE = {
  A: 'D4 - - A4 - F4 - E4 - - C4 - D4 - - -',
  B: 'F4 - - A4 - G4 - E4 - D4 - - A3 - - -',
  C: 'D4 - F4 - A4 - C5 - A4 - G4 - F4 - E4 -',
  D: 'E4 - - G4 - F4 - D4 - C4 - - D4 - - -'
};
const lastTimetableLayer = () => ({ id:'last_timetable', role:'motif', inst:'bell', vol:0.24, pan:-0.12, rev:0.55, dly:0.28, parts:LAST_TIMETABLE, order:'____________ABCD' });

// ---- title: The Line Waits (D dorian, 4/4, 84, 16 bars)
defineTrack({ id: 'title', title: 'The Line Waits', bpm: 84, sig: [4, 4], bars: 16, key: 'D dorian', mood: 'a lamp left on; warm, unhurried, a little sad', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.5, rev: 0.5, parts: { A: chord('D3+A3+F4', 16), B: chord('G3+B3+D4', 16), C: chord('C3+G3+E4', 16), D: chord('A2+E3+C4', 16) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.55, parts: { A: 'D2 . . D2 . . D3 . D2 . . D2 . . A2 .', B: 'G2 . . G2 . . G3 . G2 . . G2 . . D3 .', C: 'C2 . . C2 . . C3 . C2 . . C2 . . G2 .', D: 'A1 . . A1 . . A2 . A1 . . A1 . . E2 .' }, order: 'ABCD'.repeat(4) },
  { id: 'lead', role: 'lead', inst: 'pulse', vol: 0.4, pan: 0.1, rev: 0.3, dly: 0.25, params: { duty: 0.25 }, parts: {
      a: 'D4 - - - - - A4 - G4 - F4 - E4 - - -', b: 'F4 - - - E4 - D4 - - - - - A3 - - -', c: 'D4 - - - - - A4 - B4 - C5 - A4 - - -', d: 'G4 - - - F4 - E4 - D4 - - - - - - -',
      e: 'D5 - - - - - A5 - G5 - F5 - E5 - - -', f: 'F5 - - - E5 - D5 - - - - - A4 - - -', g: 'D5 - - - - - A5 - B5 - C6 - A5 - - -', h: 'G5 - - - F5 - E5 - D5 - - - - - - -' }, order: '____abcdabcdefgh' },
  { id: 'arp', role: 'arp', inst: 'arp', vol: 0.3, pan: -0.25, rev: 0.4, dly: 0.35, parts: {
      A: 'D4 - F4 - A4 - F4 - D4 - F4 - A4 - F4 -', B: 'G4 - B4 - D5 - B4 - G4 - B4 - D5 - B4 -', C: 'E4 - G4 - C5 - G4 - E4 - G4 - C5 - G4 -', D: 'A3 - C4 - E4 - C4 - A3 - C4 - E4 - C4 -' }, order: '________ABCDABCD' },
  { id: 'perc', role: 'perc', inst: 'drums', vol: 0.4, parts: { A: 'k . h . r . h . k . h . r . h .', B: 'k . h . r . h . k . h . r . r k' }, order: '________AAAAAAAB' },
  lastTimetableLayer()
] });

// ---- hub: The Junction (F lydian, 3/4, 96, 16 bars). The Line as a music-box waltz.
defineTrack({ id: 'hub', title: 'The Junction', bpm: 96, sig: [3, 4], bars: 16, key: 'F lydian', mood: 'a turntable at rest; home, music box and lamp light', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.45, rev: 0.5, parts: { A: chord('F3+A3+C4', 12), B: chord('D3+F3+A3', 12), C: chord('Bb2+D3+F3', 12), D: chord('C3+E3+G3', 12) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.5, parts: { A: 'F2 - - - C3 - - - C3 - - -', B: 'D2 - - - A2 - - - A2 - - -', C: 'Bb1 - - - F2 - - - F2 - - -', D: 'C2 - - - G2 - - - G2 - - -' }, order: 'ABCD'.repeat(4) },
  { id: 'lead', role: 'lead', inst: 'bell', vol: 0.42, pan: 0.1, rev: 0.5, dly: 0.3, parts: {
      a: 'F4 - - - - - C5 - B4 - A4 -', b: 'G4 - - - F4 - E4 - D4 - - -', c: 'F4 - - - - - C5 - D5 - C5 -', d: 'E4 - - - D4 - C4 - - - - -',
      e: 'F5 - - - - - C6 - B5 - A5 -', f: 'G5 - - - F5 - E5 - D5 - - -', g: 'F5 - - - - - C6 - D6 - C6 -', h: 'E5 - - - D5 - C5 - - - - -' }, order: 'abcdabcdefghabcd' },
  { id: 'chords', role: 'arp', inst: 'epiano', vol: 0.35, pan: -0.2, rev: 0.4, parts: {
      A: '. . . . F4+A4+C5 - - - F4+A4+C5 - - -', B: '. . . . D4+F4+A4 - - - D4+F4+A4 - - -', C: '. . . . Bb3+D4+F4 - - - Bb3+D4+F4 - - -', D: '. . . . C4+E4+G4 - - - C4+E4+G4 - - -' }, order: '____ABCDABCDABCD' },
  { id: 'fare', role: 'motif', inst: 'bell', vol: 0.35, pan: 0.3, rev: 0.6, dly: 0.4, parts: { A: 'F5 - A5 - C6 - A5 - F6 - - -' }, order: '_______A_______A' },
  { id: 'perc', role: 'perc', inst: 'drums', vol: 0.3, parts: { A: 'k . . . h . . . h . . .' }, order: '________AAAAAAAA' }
] });

// ---- r1 Wreck Quay: Hulls and Chains (E minor, 4/4, 108, swing, 16 bars)
const R1_SW = (a, b, c, d) => ({ A: a, B: b, C: c, D: d });
defineTrack({ id: 'r1', title: 'Hulls and Chains', bpm: 108, sig: [4, 4], bars: 16, swing: 0.25, key: 'E aeolian', mood: 'rust and tide marks; a bouncing walk past beached hulls', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.42, rev: 0.45, parts: { A: chord('E3+B3+G4', 16), B: chord('C3+G3+E4', 16), C: chord('G2+D3+B3', 16), D: chord('D3+A3+F#4', 16) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.6, parts: R1_SW('E2 . . E2 . . E3 . E2 . . E2 . . B2 .', 'C2 . . C2 . . C3 . C2 . . C2 . . G2 .', 'G2 . . G2 . . G3 . G2 . . G2 . . D3 .', 'D2 . . D2 . . D3 . D2 . . D2 . . A2 .'), order: 'ABCD'.repeat(4) },
  { id: 'perc', role: 'perc', inst: 'drums', vol: 0.5, parts: { A: 'k . h . s . h . k . h k s . h .', B: 'k . h . s . h . k . h . s . s s' }, order: 'AAAAAAAB'.repeat(2) },
  { id: 'lead', role: 'lead', inst: 'pluck', vol: 0.45, pan: 0.15, rev: 0.3, dly: 0.3, parts: {
      a: '. . B4 . E5 . . G5 . . F#5 . E5 . . .', b: '. . G4 . C5 . . E5 . . D5 . C5 . . .', c: '. . D5 . G5 . . B5 . . A5 . G5 . . .', d: '. . A4 . D5 . . F#5 . . E5 . D5 . A4 .',
      e: '. B4 . E5 . G5 . B5 . A5 . G5 . E5 . .', f: '. G4 . C5 . E5 . G5 . F5 . E5 . C5 . .', g: '. D5 . G5 . B5 . D6 . C6 . B5 . G5 . .', h: '. A4 . D5 . F#5 . A5 . G5 . F#5 . D5 . .' }, order: '____abcdefghabcd' },
  { id: 'line', role: 'motif', inst: 'bell', vol: 0.3, pan: -0.3, rev: 0.6, dly: 0.3, parts: { a: 'E4 - - - - - B4 - A4 - G4 - F#4 - - -', b: 'G4 - - - F#4 - E4 - - - - - B3 - - -' }, order: '______ab______ab' },
  tenseLayer(16, 'E2', 'F3')
] });

// ---- r2 Signal Reef: Lamps in the Dusk (F# dorian, 7/8, 132, 16 bars). Groups of 2 + 2 + 3 eighths.
defineTrack({ id: 'r2', title: 'Lamps in the Dusk', bpm: 132, sig: [7, 8], bars: 16, key: 'F# dorian', mood: 'tall rooms, signal lamps flickering in a violet dusk; an odd, gliding count', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.45, rev: 0.6, parts: { A: chord('F#3+C#4+A4', 14), B: chord('B2+F#3+D#4', 14), C: chord('E3+B3+G#4', 14), D: chord('C#3+G#3+E4', 14) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.55, parts: { A: 'F#2 . . . F#2 . . . F#3 . . F#2 . .', B: 'B1 . . . B1 . . . B2 . . B1 . .', C: 'E2 . . . E2 . . . E3 . . E2 . .', D: 'C#2 . . . C#2 . . . C#3 . . C#2 . .' }, order: 'ABCD'.repeat(4) },
  { id: 'lead', role: 'lead', inst: 'bell', vol: 0.4, pan: 0.2, rev: 0.6, dly: 0.5, parts: {
      A: 'F#5 . A5 . C#6 . A5 . . F#5 . E5 . .', B: 'B4 . D#5 . F#5 . D#5 . . B4 . A4 . .', C: 'E5 . G#5 . B5 . G#5 . . E5 . D5 . .', D: 'C#5 . E5 . G#5 . E5 . . C#5 . B4 . .' }, order: '____ABCDABCDABCD' },
  { id: 'perc', role: 'perc', inst: 'drums', vol: 0.4, parts: { A: 'k . . . h . . . r . . h . h', B: 'k . . . h . . . r . r . r .' }, order: '________AAAAAAAB' },
  { id: 'line', role: 'motif', inst: 'epiano', vol: 0.35, pan: -0.25, rev: 0.5, parts: { a: 'F#4 - - - - - C#5 - B4 - A4 - G#4 -', b: 'A4 - - - G#4 - F#4 - - - - - C#4 -' }, order: '______ab______ab' },
  tenseLayer(14, 'F#2', 'G3')
] });

// ---- r3 Salt Cutting: White Canyon (A lydian, 6/8, 92, 16 bars). Wide, slow, glassy.
defineTrack({ id: 'r3', title: 'White Canyon', bpm: 92, sig: [6, 8], bars: 16, key: 'A lydian', mood: 'a bright canyon of salt and brine pools; vast, still, glittering', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.5, rev: 0.7, parts: { A: chord('A2+E3+C#4+G#4', 12), B: chord('B2+F#3+D#4', 12), C: chord('F#2+C#3+A3+E4', 12), D: chord('E2+B2+G#3+D#4', 12) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'sub', vol: 0.55, parts: { A: chord('A1', 12), B: chord('B1', 12), C: chord('F#1', 12), D: chord('E1', 12) }, order: 'ABCD'.repeat(4) },
  { id: 'lead', role: 'lead', inst: 'bell', vol: 0.4, pan: 0.2, rev: 0.7, dly: 0.45, parts: {
      A: 'A5 . . . . . E5 . . C#5 . .', B: 'B5 . . . . . F#5 . . D#5 . .', C: 'C#5 . . . . . A5 . . F#5 . .', D: 'B5 . . . . . G#5 . . E5 . .' }, order: 'ABCD'.repeat(4) },
  { id: 'arp', role: 'arp', inst: 'pluck', vol: 0.25, pan: -0.3, rev: 0.6, dly: 0.5, parts: {
      A: 'A4 - E5 - C#5 - G#4 - E5 - C#5 -', B: 'B4 - F#5 - D#5 - B4 - F#5 - D#5 -', C: 'F#4 - C#5 - A4 - E5 - C#5 - A4 -', D: 'E4 - B4 - G#4 - D#5 - B4 - G#4 -' }, order: '____ABCDABCDABCD' },
  { id: 'perc', role: 'perc', inst: 'drums', vol: 0.3, parts: { A: 'k . . . . . . . h . . .' }, order: '________AAAAAAAA' },
  { id: 'line', role: 'motif', inst: 'lead', vol: 0.3, rev: 0.7, parts: { a: 'A3 - - - - - E4 - D#4 - C#4 -', b: 'C#4 - - - B3 - A3 - - - - -' }, order: '______ab______ab' },
  tenseLayer(12, 'A1', 'Bb2')
] });

// ---- r4 Ticket Hall: Stopped Clocks (C minor, 4/4, 76, 16 bars). Warm detuned keys, a ticking that never lands.
defineTrack({ id: 'r4', title: 'Stopped Clocks', bpm: 76, sig: [4, 4], bars: 16, key: 'C aeolian', mood: 'dark green and brass; a station hall where the clocks all stopped at different times', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.45, rev: 0.55, parts: { A: chord('C3+G3+Eb4', 16), B: chord('Ab2+Eb3+C4', 16), C: chord('Eb3+Bb3+G4', 16), D: chord('Bb2+F3+D4', 16) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.55, parts: { A: 'C2 - - - - - - . . . C2 - - - G1 .', B: 'Ab1 - - - - - - . . . Ab1 - - - Eb2 .', C: 'Eb2 - - - - - - . . . Eb2 - - - Bb1 .', D: 'Bb1 - - - - - - . . . Bb1 - - - F2 .' }, order: 'ABCD'.repeat(4) },
  { id: 'keys', role: 'arp', inst: 'epiano', vol: 0.4, pan: -0.15, rev: 0.45, dly: 0.25, parts: {
      A: '. . . . C4+Eb4+G4 - - . . . C4+Eb4+G4 - - - . .', B: '. . . . Ab3+C4+Eb4 - - . . . Ab3+C4+Eb4 - - - . .', C: '. . . . Eb4+G4+Bb4 - - . . . Eb4+G4+Bb4 - - - . .', D: '. . . . Bb3+D4+F4 - - . . . Bb3+D4+F4 - - - . .' }, order: 'ABCD'.repeat(4) },
  { id: 'perc', role: 'perc', inst: 'drums', vol: 0.4, parts: { A: 'k . m . . . m . s . m . . . m .', B: 'k . m . . . m . s . m . k . m m' }, order: '____AAABAAABAAAB' },
  { id: 'lead', role: 'lead', inst: 'bell', vol: 0.38, pan: 0.2, rev: 0.6, dly: 0.4, parts: {
      a: 'G4 - - - - - - - Eb4 - - - D4 - - -', b: 'C5 - - - - - - - Bb4 - - - Ab4 - - -', c: 'G4 - - - Bb4 - - - C5 - - - Bb4 - - -', d: 'D5 - - - - - - - C5 - - - Bb4 - - -' }, order: '________abcdabcd' },
  { id: 'line', role: 'motif', inst: 'lead', vol: 0.28, pan: 0.3, rev: 0.6, parts: { a: 'C4 - - - - - G4 - F4 - Eb4 - D4 - - -', b: 'Eb4 - - - D4 - C4 - - - - - G3 - - -' }, order: '______ab______ab' },
  tenseLayer(16, 'C2', 'Db3')
] });

// ---- final The Terminus: End of the Line (B aeolian, 5/4, 100, 16 bars). A clock in five.
defineTrack({ id: 'final', title: 'End of the Line', bpm: 100, sig: [5, 4], bars: 16, key: 'B aeolian', mood: 'night indigo and white steam; a great clock counting something that must not arrive', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.45, rev: 0.65, parts: { A: chord('B2+F#3+D4', 20), B: chord('G2+D3+B3', 20), C: chord('D3+A3+F#4', 20), D: chord('A2+E3+C#4', 20) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.55, parts: {
      A: 'B1 - - - B1 - - - B1 - - - B2 - - - B1 - - -', B: 'G1 - - - G1 - - - G1 - - - G2 - - - G1 - - -', C: 'D2 - - - D2 - - - D2 - - - D3 - - - D2 - - -', D: 'A1 - - - A1 - - - A1 - - - A2 - - - A1 - - -' }, order: 'ABCD'.repeat(4) },
  { id: 'perc', role: 'perc', inst: 'drums', vol: 0.45, parts: { A: 'k . . . h . . . s . . . h . . . k . h .', B: 'k . . . h . . . s . . . h . . . k . s s' }, order: '____AAABAAABAAAB' },
  { id: 'lead', role: 'lead', inst: 'pulse', vol: 0.36, pan: 0.15, rev: 0.4, dly: 0.35, params: { duty: 0.125 }, parts: {
      a: 'B4 - - - D5 - - - F#5 - - - E5 - - - D5 - - -', b: 'D5 - - - B4 - - - G4 - - - B4 - - - D5 - - -', c: 'A4 - - - D5 - - - F#5 - - - A5 - - - F#5 - - -', d: 'E5 - - - C#5 - - - A4 - - - C#5 - - - E5 - - -' }, order: '____abcdabcdabcd' },
  { id: 'line', role: 'motif', inst: 'bell', vol: 0.3, pan: -0.3, rev: 0.7, parts: { a: 'B3 - - - - - F#4 - E4 - D4 - C#4 - - - . . . .', b: 'D4 - - - C#4 - B3 - - - - - F#3 - - - . . . .' }, order: '______ab______ab' },
  tenseLayer(20, 'B1', 'C3')
] });

// ---- boss_warden: Fare Slots (E minor, 4/4, 150, 16 bars). One track for all four Wardens, played in a different key for each (variants).
// One layer per fare slot: each fades out when that slot is punched, so the music thins as the machine comes apart.
defineTrack({ id: 'boss_warden', title: 'Fare Slots', bpm: 150, sig: [4, 4], bars: 16, key: 'E aeolian', mood: 'a toll-engine waking; driving, metallic, fair; it comes apart as you punch it', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.4, rev: 0.4, parts: { A: chord('E3+B3+G4', 16), B: chord('C3+G3+E4', 16), C: chord('A2+E3+C4', 16), D: chord('B2+F#3+D#4+A4', 16) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.6, parts: { A: 'E2 . E2 . E2 . E3 . E2 . E2 . E2 . B2 .', B: 'C2 . C2 . C2 . C3 . C2 . C2 . C2 . G2 .', C: 'A1 . A1 . A1 . A2 . A1 . A1 . A1 . E2 .', D: 'B1 . B1 . B1 . B2 . B1 . B1 . B1 . F#2 .' }, order: 'ABCD'.repeat(4) },
  { id: 'drums', role: 'perc', inst: 'drums', vol: 0.55, parts: { A: 'k . h . s . h . k . h . s . h h', B: 'k . h k s . h . k k h . s . h h' }, order: 'AAAB'.repeat(4) },
  { id: 'rage', role: 'rage', inst: 'drums', vol: 0.4, on: false, parts: { A: 'h . h h h . h h h . h h h . h h', B: 't . . . . . t . h h t t . . t t' }, order: 'AAAB'.repeat(4) },
  { id: 'lead', role: 'lead', inst: 'pulse', vol: 0.4, pan: 0.1, rev: 0.25, dly: 0.2, params: { duty: 0.25 }, parts: {
      a: 'E4 - E4 - B4 - - - Bb4 - - - A4 - - -', b: 'G4 - - - E4 - - - - - E4 - G4 - E4 -', c: 'A4 - A4 - E5 - - - Eb5 - - - D5 - - -', d: 'D#5 - - - B4 - - - - - A4 - F#4 - D#4 -',
      e: 'E5 - E5 - B5 - - - Bb5 - - - A5 - - -', f: 'G5 - - - E5 - - - - - E5 - G5 - E5 -', g: 'A5 - A5 - E6 - - - Eb6 - - - D6 - - -', h: 'D#6 - - - B5 - - - - - A5 - F#5 - D#5 -' }, order: 'abcdabcdefghabcd' },
  { id: 'slot_pierce', role: 'slot:pierce', inst: 'arp', vol: 0.3, pan: 0.35, rev: 0.2, dly: 0.3, parts: { A: 'B5 . . B5 . . B5 . B5 . . B5 . . B5 .' }, order: 'A' },
  { id: 'slot_arc', role: 'slot:arc', inst: 'bell', vol: 0.32, pan: -0.35, rev: 0.4, dly: 0.35, parts: { A: 'E6 . . . B5 . . . G5 . . . E5 . . .' }, order: 'A' },
  { id: 'slot_burst', role: 'slot:burst', inst: 'pulse', vol: 0.28, pan: 0.25, rev: 0.2, params: { duty: 0.5 }, parts: { A: '. . E4+B4 . . . E4+B4 . . . E4+B4 . . . E4+B4 .' }, order: 'A' },
  { id: 'slot_ground', role: 'slot:ground', inst: 'bass', vol: 0.4, pan: -0.1, params: { cutoff: 380 }, parts: { A: 'E2 - - - - - - - E2 - - - - - E3 -' }, order: 'A' },
  { id: 'lift', role: 'lift', inst: 'pad', vol: 0.3, on: false, rev: 0.5, params: { cutoff: 3000 }, parts: { A: chord('E5+G5+B5', 16), B: chord('E5+G5+C6', 16), C: chord('E5+A5+C6', 16), D: chord('D#5+F#5+B5', 16) }, order: 'ABCD'.repeat(4) },
  { id: 'lift2', role: 'lift2', inst: 'bell', vol: 0.28, on: false, pan: 0.2, rev: 0.5, dly: 0.4, parts: {
      A: 'E6 . G6 . B6 . G6 . E6 . G6 . B6 . G6 .', B: 'C6 . E6 . G6 . E6 . C6 . E6 . G6 . E6 .', C: 'C6 . E6 . A6 . E6 . C6 . E6 . A6 . E6 .', D: 'D#6 . F#6 . B6 . F#6 . D#6 . F#6 . B6 . F#6 .' }, order: 'ABCD'.repeat(4) },
  tenseLayer(16, 'E2', 'F3')
] });

// ---- boss_clock: The Count (B minor, 3/4, 156, 24 bars). Borrowed attacks come in as the borrowed Warden's own voice.
const everyOther = (a, n) => (a + '_').repeat(n);
defineTrack({ id: 'boss_clock', title: 'The Count', bpm: 156, sig: [3, 4], bars: 24, key: 'B aeolian', mood: 'a great clock in three; relentless, ceremonial; the Wardens it has borrowed ring through it', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.4, rev: 0.5, parts: { A: chord('B2+F#3+D4', 12), B: chord('G2+D3+B3', 12), C: chord('E2+B2+G3', 12), D: chord('F#2+C#3+A#3+E4', 12) }, order: 'ABCD'.repeat(6) },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.6, parts: { A: 'B1 - - - F#2 - - - F#2 - - -', B: 'G1 - - - D2 - - - D2 - - -', C: 'E1 - - - B1 - - - B1 - - -', D: 'F#1 - - - C#2 - - - C#2 - - -' }, order: 'ABCD'.repeat(6) },
  { id: 'drums', role: 'perc', inst: 'drums', vol: 0.55, parts: { A: 'k . . m . . s . . m . .', B: 'k . k m . . s . s m . s' }, order: 'AAAB'.repeat(6) },
  { id: 'rage', role: 'rage', inst: 'drums', vol: 0.4, on: false, parts: { A: 'h h h h h h h h h h h h', B: 't . . t . . t . t t t t' }, order: 'AAAB'.repeat(6) },
  { id: 'lead', role: 'lead', inst: 'pulse', vol: 0.4, pan: 0.1, rev: 0.3, dly: 0.25, params: { duty: 0.25 }, parts: {
      a: 'B4 - - - F#5 - - - B5 - - -', b: 'G5 - - - D5 - - - B4 - - -', c: 'E5 - - - B4 - - - G4 - - -', d: 'A#4 - - - C#5 - - - E5 - - -',
      e: 'B4 - D5 - F#5 - B5 - F#5 - D5 -', f: 'G5 - D5 - B4 - G4 - B4 - D5 -', g: 'E5 - B4 - G4 - E4 - G4 - B4 -', h: 'A#4 - C#5 - E5 - C#5 - A#4 - C#5 -' }, order: 'abcdabcdabcdefghefghefgh' },
  { id: 'slot_pierce', role: 'slot:pierce', inst: 'arp', vol: 0.3, pan: 0.35, rev: 0.2, dly: 0.3, parts: { A: 'F#6 . . F#6 . . F#6 . . F#6 . .' }, order: 'A' },
  { id: 'slot_arc', role: 'slot:arc', inst: 'bell', vol: 0.32, pan: -0.35, rev: 0.4, dly: 0.35, parts: { A: 'B5 . . F#5 . . D5 . . B4 . .' }, order: 'A' },
  { id: 'slot_burst', role: 'slot:burst', inst: 'pulse', vol: 0.28, pan: 0.25, rev: 0.2, params: { duty: 0.5 }, parts: { A: '. . B3+F#4 . . . B3+F#4 . . . B3+F#4 .' }, order: 'A' },
  { id: 'slot_ground', role: 'slot:ground', inst: 'bass', vol: 0.4, pan: -0.1, params: { cutoff: 380 }, parts: { A: 'B2 - - - - - - - B2 - B3 -' }, order: 'A' },
  { id: 'borrow_r1', role: 'borrow:r1', inst: 'bell', vol: 0.34, on: false, pan: -0.2, rev: 0.5, dly: 0.3, parts: { A: 'B4 - B4 - F#5 - F5 - E5 - - -' }, order: everyOther('A', 12) },
  { id: 'borrow_r2', role: 'borrow:r2', inst: 'arp', vol: 0.3, on: false, pan: 0.3, rev: 0.5, dly: 0.4, parts: { A: 'F#6 - E6 - D6 - C#6 - B5 - A5 -' }, order: '_A'.repeat(12) },
  { id: 'borrow_r3', role: 'borrow:r3', inst: 'bell', vol: 0.3, on: false, pan: 0.15, rev: 0.6, dly: 0.45, parts: { A: 'B5 . . D6 . . F#6 . . D6 . .' }, order: 'A' },
  { id: 'borrow_r4', role: 'borrow:r4', inst: 'sub', vol: 0.45, on: false, parts: { A: 'E2 - - - - - G2 - - - - -' }, order: 'A' },
  { id: 'lift', role: 'lift', inst: 'pad', vol: 0.3, on: false, rev: 0.5, params: { cutoff: 3000 }, parts: { A: chord('B4+D5+F#5', 12), B: chord('B4+D5+G5', 12), C: chord('B4+E5+G5', 12), D: chord('A#4+C#5+E5', 12) }, order: 'ABCD'.repeat(6) },
  tenseLayer(12, 'B1', 'C3')
] });

// ---- quiet: Waiting Room (G lydian, 4/4, 60, 16 bars). Branch rooms, trial rooms, the quiet between fights.
defineTrack({ id: 'quiet', title: 'Waiting Room', bpm: 60, sig: [4, 4], bars: 16, key: 'G lydian', mood: 'a side room with one lamp lit; held breath, nothing watching', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.5, rev: 0.7, parts: { A: chord('G3+D4+F#4+B4', 16), B: chord('D3+A3+F#4', 16), C: chord('E3+B3+D4+G4', 16), D: chord('C3+G3+B3+F#4', 16) }, order: 'ABCD'.repeat(4) },
  { id: 'bass', role: 'bass', inst: 'sub', vol: 0.5, parts: { A: chord('G1', 16), B: chord('D2', 16), C: chord('E1', 16), D: chord('C2', 16) }, order: 'ABCD'.repeat(4) },
  { id: 'keys', role: 'arp', inst: 'epiano', vol: 0.38, pan: -0.15, rev: 0.6, dly: 0.4, parts: {
      A: 'G3 - - - D4 - - - F#4 - - - B4 - - -', B: 'D4 - - - A4 - - - F#5 - - - A4 - - -', C: 'E4 - - - G4 - - - B4 - - - D5 - - -', D: 'C4 - - - G4 - - - B4 - - - E5 - - -' }, order: 'ABCD'.repeat(4) },
  { id: 'lead', role: 'lead', inst: 'bell', vol: 0.3, pan: 0.25, rev: 0.8, dly: 0.5, parts: { A: '. . . . . . . . D6 - - - . . . .', B: '. . . . B5 - - - . . . . . . . .' }, order: '____ABABABABABAB' },
  { id: 'line', role: 'motif', inst: 'lead', vol: 0.28, pan: 0.2, rev: 0.7, parts: { a: 'G3 - - - - - D4 - C#4 - B3 - A3 - - -', b: 'B3 - - - A3 - G3 - - - - - D3 - - -' }, order: '______ab______ab' }
] });

// ---- win: Departure Cancelled (D major, 4/4, 96, 8 bars, plays once). The Line, resolved.
defineTrack({ id: 'win', title: 'Departure Cancelled', bpm: 96, sig: [4, 4], bars: 8, loop: false, key: 'D major', mood: 'the clock stops; the main theme in the major, then a long breath out', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.5, rev: 0.6, parts: { A: chord('D3+A3+F#4', 16), B: chord('G3+B3+D4', 16), C: chord('F#3+A3+D4', 16), D: chord('A2+E3+C#4', 16), E: chord('B2+F#3+D4', 16), F: chord('D3+A3+D4+F#4', 16) }, order: 'ABCDEBDF' },
  { id: 'bass', role: 'bass', inst: 'bass', vol: 0.5, parts: { A: 'D2 - - - - - - - D3 - - - - - - -', B: 'G2 - - - - - - - G3 - - - - - - -', C: 'F#2 - - - - - - - F#3 - - - - - - -', D: 'A1 - - - - - - - A2 - - - - - - -', E: 'B1 - - - - - - - B2 - - - - - - -', F: 'D2 - - - - - - - - - - - - - - -' }, order: 'ABCDEBDF' },
  { id: 'lead', role: 'lead', inst: 'pulse', vol: 0.4, pan: 0.1, rev: 0.4, dly: 0.3, params: { duty: 0.25 }, parts: {
      a: 'D4 - - - - - A4 - G4 - F#4 - E4 - - -', b: 'F#4 - - - E4 - D4 - - - - - A3 - - -', c: 'D4 - - - - - A4 - B4 - C#5 - A4 - - -', d: 'G4 - - - F#4 - E4 - D4 - - - - - - -', e: 'D5+F#5+A5+D6 - - - - - - - - - - - - - - -' }, order: 'abcd___e' },
  { id: 'bell', role: 'arp', inst: 'bell', vol: 0.34, pan: -0.2, rev: 0.6, dly: 0.4, parts: {
      a: 'D5 - A5 - F#5 - D5 - A5 - F#5 - D5 - A5 -', b: 'G5 - B5 - D6 - B5 - G5 - B5 - D6 - B5 -', c: 'A5 - C#6 - E6 - C#6 - A5 - C#6 - E6 - C#6 -' }, order: '____abc_' }
] });

// ---- lose: The Party Has Fallen (D minor, 4/4, 56, 4 bars, plays once). The Line sinks and does not come home.
defineTrack({ id: 'lose', title: 'The Party Has Fallen', bpm: 56, sig: [4, 4], bars: 4, loop: false, key: 'D aeolian', mood: 'the lamp goes out; the theme falls and stops on a question', layers: [
  { id: 'bed', role: 'bed', inst: 'pad', vol: 0.5, rev: 0.7, params: { cutoff: 700 }, parts: { A: chord('D3+A3+F4', 16), B: chord('Bb2+F3+D4', 16), C: chord('G2+D3+Bb3', 16), D: chord('A2+E3', 16) }, order: 'ABCD' },
  { id: 'bass', role: 'bass', inst: 'sub', vol: 0.5, parts: { A: chord('D2', 16), B: chord('Bb1', 16), C: chord('G1', 16), D: chord('A1', 16) }, order: 'ABCD' },
  { id: 'lead', role: 'lead', inst: 'bell', vol: 0.4, pan: 0.1, rev: 0.8, dly: 0.5, parts: {
      a: 'D4 - - - - - - - A3 - - - - - - -', b: 'G4 - - - - - - - F4 - - - - - - -', c: 'Eb4 - - - - - - - D4 - - - - - - -', d: 'C#4 - - - - - - - - - - - - - - -' }, order: 'abcd' }
] });

// Loudness trim per track (the pad-heavy ones are louder for their notes). 1 = as written.
const LEVELS = { title: 1, hub: 0.9, r1: 1, r2: 1, r3: 0.75, r4: 0.9, final: 0.85, boss_warden: 0.8, boss_clock: 0.7, quiet: 0.75, win: 0.9, lose: 0.8 };
for (const id in LEVELS) if (tracks[id]) tracks[id].level = LEVELS[id];

})();
