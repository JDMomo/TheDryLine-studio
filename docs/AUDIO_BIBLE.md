# Audio bible: The Dry Line

Owner of the sound: the owner, who will make the real tracks in Ableton Live. This file is the direction; `js/content/music.js` holds the placeholder patterns, `js/core/audio.js` plays them, `assets/audio/README.md` is the hand-off for Ableton. If this file and the code disagree, the code wins: tell the audio team.

Rule for everything below: the five reference soundtracks are used for feeling and method only. No melody, sample, drum loop or sound from any of them is copied, and the motifs in section 4 are original. Source text is paraphrased; nothing is quoted beyond a few words.

## 1. What defines the five references

What I could confirm from a source is marked with its number. What comes from my own background knowledge and was not checked in this session is marked (memory). Super Monkey Ball is the thinnest: I found little written analysis of it.

| Reference | Instrumentation and production | Harmony and rhythm | How themes recur |
|---|---|---|---|
| Undertale (Toby Fox, 2015) | Written entirely in FL Studio by a self-taught composer; chiptune leads next to piano, guitar, music-box and synth strings; the sound is SNES-RPG-like, with Touhou, Anamanaguchi and a jazz track as named inspirations [1][2]. | Mostly short, loop-friendly pieces. A repeating piano figure sits under many overworld tracks and gains notes and octave jumps in later areas [1]. (memory: sudden genre swerves and jokes in rhythm) | The main melody is the safe-place cue: in at least 13 tracks, as a bare chiptune tune, a guitar, a music box, lift music. One area's melody returns slower and simpler in a quiet room, and again in a boss fight. A cheerful town theme comes back as a shop theme and with swing [1][2]. |
| Chrono Trigger (Mitsuda, with Uematsu on ten tracks, 1995) | Sample-based SNES sound: a small set of instruments reshaped per track (memory: the console's sound chip played compressed samples, eight voices at a time). The composer wanted music that did not sit in one genre and wrote after talking to the director about each setting [3]. | Wide moods from playful to sad to dark, each track small and strongly melodic (memory: odd meters in a few tracks, modal colour). | Leitmotifs built on the main theme tie the score together; character themes and the time-travel theme return in arranged forms [3]. |
| Super Monkey Ball (Sega, 2001) | Credited composers Hidenori Shoji, Sakae Osumi, Haruyoshi Tomita; described as an eclectic mix of instrumental tunes, catchy, "head-bobbing", changing from stage to stage so a repeated attempt does not wear [4][5]. (memory: bright, bouncy jazz-pop and funk with a strong bass line and bright keys and brass) | (memory: steady swung or straight sixteenth bounce, a bass line that walks, short riffs that loop forever) | Little theme reuse; each stage has its own tune. The lesson taken is the loop: a tune that stays pleasant on its fiftieth hearing [5]. |
| Aphex Twin (Richard D. James) | The 1992 album was made on a small kit: Korg MS-20 and Roland SH-101 for bass, acid and leads, Yamaha DX synths for pads and electric piano, a Casio sampler on most tracks, a Roland R-8 drum machine with a bought 808 card, a grainy reverb on every track, bounced to cassette so it picked up noise and mud [6]. | Dark, spacious pads outline the chords; a sub bass from a repitched 808 kick; fast programmed triplet hat rolls; "99 percent sequenced" [6]. (memory: later work uses odd meters, polyrhythm and drum programming that keeps changing) | Not theme-driven; a track is a texture that evolves by adding and removing parts [6]. |
| Vegyn (Joe Thornalley) | Instrumental hip-hop crossed with electronica, IDM and glitch hop; woozy synths, scratchy percussion and field recordings, many of them captured on a phone, heavy sampling, strings added on one track; critics compare parts to video game music [7]. | Tempo and arrangement shift within a track; the artist calls the mood "happy melancholia" [7]. (memory: detuned, slightly flat-sounding keys; lazy, behind-the-beat drums) | A track is a mood and a handful of sounds, not a tune that is carried across the album [7]. |

Sources
1. Game Developer, "An examination of leitmotifs and their use to shape narrative in Undertale, part 1 of 2": https://www.gamedeveloper.com/audio/an-examination-of-leitmotifs-and-their-use-to-shape-narrative-in-undertale-part-1-of-2
2. Wikipedia, "Undertale Soundtrack": https://en.wikipedia.org/wiki/Undertale_Soundtrack
3. Wikipedia, "Music of Chrono Trigger": https://en.wikipedia.org/wiki/Music_of_Chrono_Trigger
4. Wikipedia, "Super Monkey Ball (video game)": https://en.wikipedia.org/wiki/Super_Monkey_Ball_(video_game)
5. GamesRadar, "Game music of the day: Super Monkey Ball": https://www.gamesradar.com/game-music-of-the-day-super-monkey-ball
6. MusicRadar, "How Aphex Twin made Selected Ambient Works 85-92": https://www.musicradar.com/news/how-aphex-twin-made-saw-85-92
7. Wikipedia, "Only Diamonds Cut Diamonds": https://en.wikipedia.org/wiki/Only_Diamonds_Cut_Diamonds (a Rolling Stone profile of Vegyn could not be fetched)

## 2. The direction

The Dry Line sounds like happy melancholia on a dry seabed: small, warm, slightly detuned instruments (soft chiptune pulses, music-box bells, Rhodes-like keys, low analog pads) playing short melodies you could hum, over bass lines that bounce and drums that stay low in the mix. Every place gets its own groove and time signature (waltz in the Junction, seven in Signal Reef, six in Salt Cutting, five at the Terminus) but all of them are built from the same three motifs, so the line feels like one long walk; the boss fights are the machinery itself, one stem per fare slot, so the music comes apart as you punch the machine apart. Never loud for its own sake: the loops must stay pleasant on the fiftieth lap, the mix leaves room for the sound effects (which are the game's readable signals), and the harsh sounds are kept for the Wardens and the Long Clock only.

What each reference gives, and what it does not:

- Undertale: the safe-place theme that returns everywhere in new clothes (our "The Line"); chiptune lead next to real-instrument colours; short loops with a clear hook.
- Chrono Trigger: one strong melody per place, a tune a player remembers; moods that change per region; motifs that tie the whole score.
- Super Monkey Ball: the bounce and swing in the explore tracks; a bass line that walks; the rule that a loop must not wear.
- Aphex Twin: pads that carry the harmony; sub bass; small odd-meter bars (7/8, 5/4, 6/8); rolled hats and ticks; grainy reverb and a touch of cassette noise on the pads.
- Vegyn: detuned keys, lazy and slightly behind-the-beat drums, soft saturation, field-recording texture (steam, chains, a distant bell) under the quiet tracks.

## 3. Track list

Time signatures use the grid of the data: a bar is a whole number of sixteenths. All loops are bar-aligned, loop start at bar 1, loop end at the last bar (a loop is exported as its exact bar count). Lengths are for one pass. "Built" means the code plays a placeholder of it today; the finished version is for Ableton. Names follow section 3 of `assets/audio/README.md` for files. Ableton names: Wavetable, Operator, Simpler and Drum Rack are the safe base set; Analog, Collision, Electric and Tension are noted where used and need Suite or the Packs (check your edition; Operator and Wavetable can stand in). Effects: Reverb, Echo, Chorus-Ensemble, Auto Filter, Saturator, Glue Compressor, Redux, Vinyl Distortion, Erosion, Utility, EQ Eight.

| id | Title and where | BPM | Sig | Key | Bars | Length | Mood, and what makes it | Built |
|---|---|---|---|---|---|---|---|---|
| title | The Line Waits. Title screen | 84 | 4/4 | D dorian | 16 | 45.7 s | A lamp left on. Pad (Wavetable, two detuned saws, low-pass), pulse-wave lead (Operator, square 25 percent, Echo dotted eighth) states The Line from bar 5; plucked triangle arp (Operator); light rim and shaker (Drum Rack, 808 Core kit). | yes |
| hub | The Junction. The turntable, standpipe, gates | 96 | 3/4 | F lydian | 16 | 30.0 s | A music-box waltz of The Line (Operator bell, two sines ratio 3.5), Rhodes-like chords on beats 2 and 3 (Electric, or Operator sine plus triangle, Chorus-Ensemble), warm bass (Operator), The Fare as a high plink every eighth bar. | yes |
| r1 | Hulls and Chains. Wreck Quay main rooms | 108 | 4/4, swung 62 percent | E aeolian | 16 | 35.6 s | Rust and tide. The bounciest track: syncopated bass (Operator sine and saw, Auto Filter), marimba-like lead (Collision Marimba, or Operator square 12 percent, Echo), swung kit (Drum Rack, Saturator). | yes |
| r2 | Lamps in the Dusk. Signal Reef | 132 | 7/8 (2+2+3) | F# dorian | 16 | 25.5 s | Violet dusk, tall rooms. Glassy bell arpeggios (Operator FM bells, Echo, long Reverb), pad (Wavetable), bass pulse on the groups, sparse kit; Aphex-style odd count. | yes |
| r3 | White Canyon. Salt Cutting | 92 | 6/8 | A lydian | 16 | 31.3 s | Wide and still. Big pads (Wavetable, slow attack), sub bass (Operator sine), one bell note per bar (Collision, Reverb 4 s), shimmering pluck eighths, almost no drums. | yes |
| r4 | Stopped Clocks. Ticket Hall | 76 | 4/4 | C aeolian | 16 | 50.5 s | Dark green and brass. Detuned keys (Electric, Vinyl Distortion, a slow pitch wobble from Auto Filter LFO), clock ticks as the hats (Drum Rack, metal tick), slow bell melody, half-time kick and snare. Most Vegyn of the set. | yes |
| final | End of the Line. The Terminus main rooms | 100 | 5/4 | B aeolian | 16 | 48.0 s | Night indigo, steam. Pad, pulsing bass in five quarters, thin pulse-wave lead (square 12.5 percent), a count of clock hands in the kit. | yes |
| quiet | Waiting Room. Branch rooms, trial rooms, plinth rooms | 60 | 4/4 | G lydian | 16 | 64.0 s | Held breath, no drums. Pad and sub (Wavetable, Operator), slow Rhodes arpeggio, a sparse bell, The Line a whisper. Finished version: add field recordings (steam, a far bell, chains) as an audio layer. | yes |
| boss_warden | Fare Slots. Placeholder for all four Wardens, in four keys (below) | 150 | 4/4 | E aeolian | 16 | 25.6 s | A toll-engine waking. Driving bass in eighths (Operator), straight kit, pulse lead (The Toll), one stem per fare slot (pierce: high repeated arp; arc: falling bell; burst: offbeat power-fifth stabs; ground: low slab bass), and layers for rage, lift, lift2, tense (section 5). | yes |
| boss_r1 | The Tollkeeper. Finished version | 150 | 4/4 | E minor | 16 | 25.6 s | The reference fight. The Toll is the lead; dome-and-plates feel: brass-like Wavetable stabs, Drum Rack with heavy kick. | no |
| boss_r2 | The Lamp-Heron. Finished version | 144 | 4/4 | F# minor | 16 | 26.7 s | Tall and stalking. Lamp Sweep is an Auto Filter sweep on the lead; Spark Fall as falling Operator bells; wind noise on the gust. | no |
| boss_r3 | The Switchman Idol. Finished version | 138 | 4/4 | D minor | 16 | 27.8 s | A hopping totem: three stacked riffs (one per head, Operator), ring projectiles as triplet hats, a topple sting on the break. | no |
| boss_r4 | The Gatewhale. Finished version | 132 | 4/4 | A minor | 16 | 29.1 s | A rolling engine. A 16th-note wheel bass (Operator sub, Auto Filter), steam as filtered noise, deep Drum Rack. | no |
| boss_clock | The Count. The Long Clock | 156 | 3/4 | B aeolian | 24 | 27.7 s | A great clock in three. Waltz bass, ticking kit, pulse lead; each borrowed Warden brings its own voice in (section 5). Built exactly as written: finished version keeps the data and replaces the sounds. | yes |
| win | Departure Cancelled. Win screen | 96 | 4/4 | D major | 8 | 20.0 s | Plays once. The Line in the major, bells over it, a long breath out on a D major chord. | yes |
| lose | The Party Has Fallen. Lose screen | 56 | 4/4 | D aeolian | 4 | 17.1 s | Plays once. The Line sinks and stops on C#, unresolved. Finished version: add a tape-stop or low-pass slow-out at the end. | yes |

Warden keys (the placeholder plays `boss_warden` transposed): Tollkeeper +0 (E), Lamp-Heron +2 (F#), Switchman Idol -2 (D), Gatewhale +5 (A). The finished boss tracks are separate files and keep those keys.

Adding a track: copy a `defineTrack` block in `js/content/music.js`, fix its bars, run `node tools/audio/export_midi.mjs`, run `node tools/smoke.mjs audio`.

## 4. Leitmotifs (original)

Notation: note name and length in sixteenths (4 = a quarter note); `|` is a bar line in 4/4. Rhythms keep their shape when the motif is moved into another meter or key; the data in `music.js` has each version.

**The Line (main theme; D dorian).** Meaning: the railway, the walk, home. A long fall with one leap up.
`D4 (6) A4 (2) G4 (2) F4 (2) E4 (4) | F4 (4) E4 (2) D4 (6) A3 (4) | D4 (6) A4 (2) B4 (2) C5 (2) A4 (4) | G4 (4) F4 (2) E4 (2) D4 (8)`
Shape: root, up a fifth, then stepping down three notes; each phrase falls back to the root. The first two bars are the "hint" used in the explore tracks.

**The Toll (Warden motif; E minor).** Meaning: the engines, a bell that does not stop. Repeated notes and a flat fifth (E against Bb).
`E4 (2) E4 (2) B4 (4) Bb4 (4) A4 (4) | G4 (4) E4 (6) E4 (2) G4 (2) E4 (2)`
Over the other chords the first bar is moved to the chord root (A: `A4 A4 E5 Eb5 D5`), and in the second half it goes up an octave.

**The Fare (token motif; any key, shown in G).** Meaning: a ticket punched, a token taken. Five notes up and back, the last one long.
`G5 (2) B5 (2) D6 (2) B5 (2) G6 (6)` and its inversion for a void token: `G5 D5 B4 G4`.

Where they recur

| Motif | Built today | For the finished score |
|---|---|---|
| The Line | title (lead, full, bars 5 to 16); hub (music-box waltz, full); each region (the first two bars on a quiet bell or keys, bars 7 to 8 and 15 to 16, in the region's key and sound); quiet rooms (a whisper in the lead voice); win (full, in D major, resolves to D); lose (a falling fragment, ends on C#). It is absent from boss fights so its return in the win track is the payoff. | In the hub, play one more bar of it for every Warden beaten. |
| The Toll | boss_warden lead (every Warden fight, in that Warden's key); boss_clock, as the borrowed r1 layer (bell, B minor). | Each Warden's finished track gets its own variation of the Toll as its signature; the Long Clock's borrowed voices quote them. |
| The Fare | hub (a high bell every eighth bar); sound effects: `pickupToken` plays it (G5 B5 D6 B5 G6), `tokenVoid` plays the inversion, `slotPunch` ends on its bright bell; each slot stem is a riff on the chord's fifth, so the punch accent can sit on top of any key. | The fare slot layers each quote one bar of it in their cut's register. |
| The Count (the Clock's own, B minor) | boss_clock lead: `B4 (4) F#5 (4) B5 (4)` in 3/4 as a rising fifth and octave, then in eighths in the second half. | One new motif, never heard before the end of the line. |

## 5. Adaptive plan

Layers are named in `music.js` by role. The engine (`G.audio.update`, every 100 ms) reads the game and asks for layers; every change is quantised to the next bar line (the next beat line for an urgent drop), so nothing cuts mid-phrase. Changes use the audio clock, not the game's, so hit-stop does not matter. A layer turned off stops starting new notes at the line; notes already sounding ring out. A punched slot's stem fades out over one bar.

Built and tested (`node tools/smoke.mjs audio`):

| Event | What the music does |
|---|---|
| New room, same track | Nothing: rooms never restart the music. |
| New room, different track | Crossfade 1.6 s (2.5 s after a Warden falls, 0.5 s into a fight, 1.8 s to the hub and quiet rooms). |
| Explore, enemies within about 560 px (and four seconds after) | `perc` layer enters. When they are gone it leaves. |
| Health low (any standing player on one pip or a quarter of health) | In explore: `lead`, `arp` and `motif` drop on the beat, `tense` (a root and the note above it) enters, `perc` stays. In a fight: `tense` enters, nothing else drops. |
| Boss fight starts | Track changes to `boss_warden` (in that Warden's key) or `boss_clock`. Only the stems of charted fare slots that are open (a token of that cut was carried) sound; a sealed or uncharted slot has no stem. |
| A fare slot is punched | Its stem fades out over one bar from the next bar line; `lift` (high pad) enters at the first punch, `lift2` (a sparkling bell arpeggio) at the second. The boss track gets thinner and brighter as the machine falls apart. |
| Boss below half health (rage) | `rage` layer (16th hats, toms) enters at the next bar. |
| Long Clock borrows attacks | One layer per borrowed Warden: `borrow:r1` bell playing the Toll (Tollkeeper alive), `borrow:r2` a falling glass arp (Lamp-Heron), `borrow:r3` ring-like triplet bells (Idol), `borrow:r4` a low roll (Gatewhale). Beat the Wardens first and the layers are absent; go straight there and all four ring through it. |
| Boss falls | Back to the region track, 2.5 s crossfade; the sound effect `bossDefeat` plays over it. |
| Pause or map | Music keeps playing but low-passes (800 Hz for pause, 2.4 kHz for the map) and ducks; effects stay clear for the menu sounds. A hidden tab suspends the audio context, a window blurred for more than 5 s suspends it. |
| Win, lose | The sting plays once over a 0.4 s crossfade, then silence until the next run. |

Planned for the Ableton version (not built): per-attack tell cues for every boss attack family; co-op "synchronised break" stinger; the hub gaining a Toll fragment per Warden beaten; a loop-end tape-stop on the lose track; a filter slow-out when the party is wiped mid-fight.

## 6. Sound effects

All are synthesised in code today (`SFX` in `audio.js`); the finished ones can be recorded or designed in Ableton and dropped in later as files named `sfx_<name>.ogg` (the engine does not load effect files yet; say so before relying on that). Effects are short, never louder than the music peaks, and each has one clear attack so it reads on a busy screen.

| Name | When | Hook | Character |
|---|---|---|---|
| jump | ground jump, wall jump | built | short square chirp up |
| doubleJump | Double Jump | built | two chirps, a sparkle |
| land | landing after a fall | built | dull thud, scaled by fall speed |
| dash | Dash | built | rising air whoosh |
| slash | light slash | built | quick filtered noise swish |
| heavyCut | Heavy Cut | built | slower swish plus a low saw thump |
| hitEnemy | a hit lands on an enemy or a boss body | built | click plus short square thud |
| enemyDefeat | an enemy dies | built | falling square and a noise puff |
| hurt | a player takes a hit | built | falling saw and noise |
| down | a player is downed | built | four falling triangle notes |
| revive | a downed player gets up | built | quick rising four-note arpeggio |
| mend | a pip is mended; standpipe | built | four soft rising bells |
| mendTick | while mending | built | tiny bell every 0.3 s |
| cutPierce, cutArc, cutBurst, cutGround | a token of that cut fires | built | pierce: high zip; arc: round bloop; burst: low boom; ground: grinding slide |
| slotCrack | a punch of a fare slot that does not break it | built | glassy click, two pings |
| sealed | a hit on a sealed slot, or a blocked enemy | built | dull tink |
| slotPunch | a fare slot is punched | built | sharp click, thump, bright fare bell |
| bossStagger | the Warden staggers | built | crash with a falling sweep (0.12 s after the punch) |
| tokenVoid | a token is spent | built | four falling notes (The Fare inverted) |
| pickupScrip | scrip collected | built | two pings; pitch climbs for up to seven pickups in half a second |
| pickupToken | a token or trinket is taken | built | The Fare, bell |
| propUse | trunk, ticket machine, signal post, booth, other props | built | wooden tick and a soft tone |
| door | doors, gates | built | low creak and swoosh |
| bossIntro | the fight starts | built | noise swell and three low tolls |
| bossDefeat | the Warden falls | built | long falling noise, deep thump, falling bells |
| menuMove, menuSelect | pause menu | built | tick; two-note blip |
| pause, unpause | pause menu opens, closes | built | falling and rising sine sweep |

Not built (listed so nobody assumes): wall slide, a distinct cue for each boss attack tell, a crack for the cracked barrier, a plinth or kiosk purchase, the map opening, co-op join, and a low-health heartbeat. Each is one line of `A.sfx('name')` plus an entry in `SFX` when someone wants it. Boss tells are the most important of these for accessibility (the architecture notes ask for an audio cue per tell).

## 7. Delivery specs for the browser

- Loops: one file per track, `assets/audio/<track>.ogg`, Ogg Vorbis, 48 kHz, stereo, quality 5 (about 160 kbps). Stems for the adaptive layers: `assets/audio/<track>__<layer>.ogg`, same length to the sample, all starting at bar 1. Layer ids are the `id` fields in `music.js` (also the MIDI track names). Never MP3 for loops: the encoder adds padding and breaks gapless loops. Check Safari support for Ogg when the build is tested; if a file will not decode the engine keeps playing the synth.
- Length: the loop is exactly the number of bars in the table, from bar 1 to the end of the last bar, with the reverb and echo tails wrapped into the start (in Live, render as loop; with the option off, the tail is lost and the loop clicks). The engine loops the buffer between `loopStart` and `loopEnd`, which it computes from bpm, signature and bars; a file that is a few milliseconds off will drift against the other stems.
- Loudness: each stem sums with the others to a full mix of about -18 LUFS integrated (a short pass of the title or hub should sit around -16 LUFS short-term), stems summed peak at -3 dBFS or lower, true peak at or below -1 dBTP on the full mix. The placeholder measures about -18 to -20 dBFS RMS in a quick offline render. No limiter on the stems; the game has one on its master bus. Mono is fine for bass, sub, drums and any stem with no stereo content (it halves memory).
- Stings (win, lose): play once, no loop; export with the tail (about 3 seconds) included. File name as the track.
- Memory: decoded size is seconds times sample rate times channels times 4 bytes. A 16-bar loop at 100 bpm is about 38 s; twelve stereo stems at 48 kHz would be about 175 MB, which is too much: keep boss tracks to the stems that matter (bed, bass, drums, lead, the four slot stems, rage), merge the rest, use mono where you can, keep any track under about 40 MB decoded. One boss track plus the one fading out are resident at once.
- Files in place: add the track to `G.music.files` in `js/content/music.js` (`id: true` for one full mix file, `id: { stems: [...] }` for stems). The engine then loads the files over http (not from `file://`) at the first gesture and plays them in place of the synth for any track it starts afterwards. A track with only a full mix cannot change layers, but still crossfades, ducks on pause and filters. `node tools/smoke.mjs audio` does not test files; open the game and listen.

## 8. Engine in one page

- `G.audio.unlock()` runs on the first key press, click or touch (the page's "Click to play" overlay counts) and creates the context. Nothing plays before that.
- Buses: music and effects into a master with a limiter (compressor set as one, -3 dB). Music has a pause filter and duck. Reverb (a generated impulse) and echo (dotted eighth, per track) are send effects.
- Volumes: master, music, effects (0 to 1, squared for loudness), M mutes. Saved in `localStorage` under `dryline-audio-v1`. Pause menu, Comfort page: Down from the last row reaches Sound, Left and Right change a volume, Jump switches sound off and on. `G.audio.setVolume('master' | 'music' | 'sfx', 0..1)`, `G.audio.mute(bool)`, `G.audio.toggleMute()`.
- The sequencer looks 140 ms ahead of the audio clock every 25 ms; a track is bars, a signature, a tempo and layers of patterns (see the header of `music.js`); a layer can be switched with `G.audio.setLayer(id, on, { when: 'bar' | 'beat' | 'now', fade })`.
- Hooks: audio.js wraps the game's functions after they load (`Player.update`, `startSlash`, `useItem`, `hurt`, `Enemy.damage`, `Boss.start`, `hitSpot`, `G.game.spend`, `takeItem`, `G.combat.update` for scrip, `G.props.make` for props, `G.menus`). Other files do not call the audio code. If a hooked function is renamed, the sound goes quiet silently; the check `audio` plays the main ones.
- Everything is wrapped in try and catch; with no AudioContext (or one that will not start) the game runs as before.

What I could not verify: nobody has listened to any of this. The checks prove the data is well formed, the timing is on the bar and beat lines, the sounds render without clipping and without silence, and the code survives a missing audio system. They cannot say whether a track is good, whether the mix is balanced, whether the SFX are annoying on the hundredth jump, or how it sounds on laptop speakers. The Ableton behaviour described in `assets/audio/README.md` is from memory of the program and should be checked against your version.


## 2026-11-22 listening/production audit

The code/data review confirms that the requested Last Timetable idea is already represented by the original **The Line** four-bar motif and quoted in title, hub, every region, quiet rooms and the win/lose material; the Long Clock carries the separate Count plus borrowed Warden voices. The table below is a composition/mix audit from the authored data, **not a claim of speaker/headphone listening in this connector environment**.

| Track | Melody | Mix | Loop seam | Action |
|---|---:|---:|---:|---|
| title | 8 | 8 | 9 | keep; full Line statement |
| hub | 8 | 8 | 9 | keep; music-box identity |
| r1 | 8 | 8 | 8 | keep; strongest rhythmic walk |
| r2 | 8 | 8 | 8 | keep; 7/8 grouping is distinct |
| r3 | 7 | 8 | 9 | strengthen B-section lead variation in final arrangement |
| r4 | 7 | 8 | 9 | strengthen B-section melodic answer in final arrangement |
| final | 8 | 8 | 8 | keep 5/4 clock pressure |
| quiet | 8 | 9 | 9 | keep sparse field-texture space |
| boss_warden | 8 | 8 | 8 | adaptive slot stems are the identity |
| boss_clock | 9 | 8 | 8 | full end-game statement through Count + borrowed voices |
| win | 9 | 8 | n/a | payoff: Line resolves major |
| lose | 8 | 8 | n/a | unresolved fragment |

The two weakest melodic rows are r3 and r4; their final Ableton arrangements should add a contrasting B answer without changing the shared motif or loop length.
