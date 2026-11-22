---
title: "The Dry Line: sprite sheet prompt pack"
subtitle: "Copy-and-paste prompts that turn the watercolor concept sheets into game-ready sprite sheets"
date: "14 November 2026"
---

# 1. Why the concept sheets cannot be used directly, and what this pack fixes

The concept sheets are beautiful, but each one packs dozens of tiny drawings onto textured paper with labels. To become sprites, every animation has to be:

- **alone in its own image**, with nothing else in it;
- **large** (the concept sheet frames are about 70 pixels wide; I need 300 or more);
- on a **flat background** I can remove, with **no paper, labels, borders or shadows**;
- drawn at **the same size in every frame, with the feet on the same line**;
- **the body only**, with slashes, smoke, beams and impacts drawn separately.

So the method is: one chat per character, attach that character's concept sheet, paste the master brief once, then ask for one small sheet at a time using the request lines in this pack. I cut the frames out automatically, so the grid does not have to be pixel-perfect. What matters is clean gaps between frames and a flat background.

# 2. How to use this pack

1. Start a **new chat for each character** (image models drift when a chat covers many subjects).
2. **Attach the concept sheet** for that character.
3. Paste the **MASTER BRIEF** (section 3). Wait for the model to confirm.
4. Paste the first request line, the **reference sheet** (`_ref`). Regenerate until it matches the concept. This picture becomes the anchor: **attach it again with every later request** in that chat.
5. Paste **one request line at a time**. Check the result against the checklist in section 4. If something is wrong, paste the matching fix phrase from section 5.
6. **Save each image with exactly the file name at the start of its request line**, as a PNG.
7. Put everything in one folder (or a zip) and send it to me. Sub-folders are fine; the file names carry all the information I need.

File names end in `_f` plus the number of frames, for example `wanderer_run_f8.png`. Frames always read left to right, then top to bottom.

**Grid rule (the model is told this in the brief):**

| Frames | Layout | Use |
|---|---|---|
| 1 | single picture | reference sheets, props, backgrounds |
| 4 | 4 across, 1 row | most loops |
| 6 | 3 across, 2 rows | most attacks |
| 8 | 4 across, 2 rows | runs, long attacks |
| any, WIDE subject | 2 across, 2 rows (4 frames per image) | serpents, the toad, anything much wider than tall. Longer animations are split into parts `a`, `b` |

# 3. MASTER BRIEF (paste this first in every chat, with the concept sheet attached)

```
You are producing game sprite sheets for a 2D side-scrolling action game called
The Dry Line. I have attached a concept sheet. It shows the character and the
art style. Use it as the only source for the character's design and colours.

ART STYLE (match the attached sheet exactly)
- Hand-painted watercolor with confident dark ink outlines.
- Muted, natural palette: moss and sage greens, ochre and brass, rust orange,
  slate and dusty blue, soft violet, cream highlights. Lamp glow is warm amber
  or pale green.
- Visible brush texture and gentle colour variation INSIDE the shapes.
- Chunky, readable silhouettes. Slightly stylised proportions, like a
  storybook illustration.

RULES FOR EVERY SPRITE SHEET I ASK FOR
1. Output ONE image containing ONLY the frames I ask for. No title, no labels,
   no numbers, no text, no borders, no panels, no arrows, no palette swatches.
2. Background: fully transparent. If you cannot make it transparent, use one
   solid flat colour, pure magenta #FF00FF, with no texture, no gradient, no
   paper grain and no vignette.
3. No ground, no floor line, no cast shadow, no dust, no smoke, no glow halo
   outside the character unless I ask for an effects sheet.
4. The watercolor paint must stay INSIDE the ink outline. No washes, splashes
   or soft bleed outside the silhouette. Every frame needs a clean, closed,
   dark outline so it can be cut out.
5. Arrange the frames in an even grid, in order, left to right then top to
   bottom. 4 frames = 4 across in one row. 6 frames = 3 across, 2 rows.
   8 frames = 4 across, 2 rows. If I write WIDE, use 2 across and 2 rows.
6. Leave a clear empty gap around every frame. Frames must never touch or
   overlap each other, and nothing from one frame may reach into another.
7. The character is the SAME size in every frame, drawn as large as its grid
   cell allows, centred in its cell, with its feet (or lowest point) on the
   same horizontal line in every frame of a row.
8. Strict side view (profile), facing RIGHT, flat like a 2D platform game.
   No perspective, no three-quarter view, no camera tilt.
9. The design must be IDENTICAL in every frame: same colours, same clothing,
   same proportions, same details. Only the pose changes. Never change the
   colour of a cloak, hat or lamp between frames.
10. BODY ONLY. Do not draw slash arcs, beams, projectiles, impact bursts,
    steam, sparks or shockwaves in character sheets. I will ask for those
    separately as effects sheets.
11. For loops, the last frame must lead smoothly back into the first.
12. Use a wide 3:2 landscape canvas at the highest resolution you can.

I will send requests in this form:
SHEET: file_name | frames and layout | what the frames show
Reply to each request with the image only. If any rule cannot be met, say
which one before drawing.

Confirm you understand, then wait for my first request.
```

# 4. Checklist for each result

- Only the frames, nothing else in the picture.
- Flat or transparent background; no paper texture.
- The right number of frames, with gaps between them.
- Same size, same colours, same details in every frame.
- Feet on one line; facing right; pure side view.
- No effects, shadows or smoke attached to the body.
- Outline is closed; no paint leaking outside it.

# 5. Fix phrases (paste the one that applies)

```
Redo the same sheet. The background must be one flat colour with no paper
texture, and there must be no labels or text anywhere.
```
```
Redo the same sheet. The colours changed between frames. Keep every colour
identical to the attached reference in all frames.
```
```
Redo the same sheet. The frames are different sizes. Draw the character at
exactly the same scale in every frame, feet on the same line.
```
```
Redo the same sheet. Remove all effects, smoke, dust, glow and shadows.
Draw the body only.
```
```
Redo the same sheet. The frames overlap. Leave a wide empty gap around
every frame.
```
```
Redo the same sheet in strict side view facing right, flat like a 2D
platform game sprite, not three-quarter view.
```
```
Redo the same sheet with fewer, larger frames. Split it into two images
if needed and tell me which frames are in each.
```

# 6. The player: the Wanderer

Attach: the main "The Dry Line" sheet (frog hat, blue wide-brimmed hat, yellow scarf, blue-grey cloak, lute on the back). Chat id: `wanderer`.

Tell the model once, after the brief: "The character is the Wanderer, the player, top left of the sheet. Small build, about three heads tall. The frog sits on the hat in every frame."

```
SHEET: wanderer_ref_f1 | 1 picture | The Wanderer standing, neutral pose, side view facing right, large, full body.
SHEET: wanderer_idle_f4 | 4 frames, 4 across | Standing idle loop: slow breathing, scarf and cloak hem sway slightly.
SHEET: wanderer_run_f8 | 8 frames, 4 across 2 rows | Run cycle loop: two full strides, body leaning forward, cloak streaming behind.
SHEET: wanderer_jump_f4 | 4 frames, 4 across | Jump: crouch to spring, rising stretched tall, peak with cloak flared, falling with cloak lifted.
SHEET: wanderer_land_f4 | 4 frames, 4 across | Landing: feet touch, deep squash, rising, back to standing.
SHEET: wanderer_dash_f4 | 4 frames, 4 across | Ground dash: lunge start, body stretched low and long, same held, skid to stop.
SHEET: wanderer_wallslide_f4 | 4 frames, 4 across | Sliding down a wall that is on the LEFT side of the frame: back against the wall, one hand on it, looking right. Do not draw the wall.
SHEET: wanderer_doublejump_f4 | 4 frames, 4 across | Mid-air tuck and spin: tuck, half turn, full tuck, opening out.
SHEET: wanderer_slash_side_f6 | 6 frames, 3 across 2 rows | Quick forward sword slash with a short blade: wind back, swing start, full extension, follow through, recover, ready. No slash arc.
SHEET: wanderer_slash_up_f4 | 4 frames, 4 across | Upward slash: blade low, sweeping up, overhead, recover. No arc.
SHEET: wanderer_slash_down_f4 | 4 frames, 4 across | In the air, blade pointing straight down beneath the feet: tuck, thrust down, hold, recover. No arc.
SHEET: wanderer_heavy_f6 | 6 frames, 3 across 2 rows | Charged heavy cut: crouch with blade drawn far back (2 frames), big lunging swing (2), follow through (1), recover (1). No arc.
SHEET: wanderer_pierce_f6 | 6 frames, 3 across 2 rows | Throws a small token straight forward like a dart: reach to belt, draw back, arm forward, release, follow through, recover. No projectile.
SHEET: wanderer_arc_f6 | 6 frames, 3 across 2 rows | Lobs a small token underarm in a high arc: reach, swing arm down and back, swing up, release high, follow through, recover. No projectile.
SHEET: wanderer_burst_f6 | 6 frames, 3 across 2 rows | Strikes a note on the lute so a pulse bursts around the body: swing lute to front, raise hand, strike, hold with cloak blown outward, settle, lute back. No ring effect.
SHEET: wanderer_ground_f4 | 4 frames, 4 across | Crouches and slides a token along the floor: crouch, hand low and back, push forward along the ground, rise. No projectile.
SHEET: wanderer_mend_f4 | 4 frames, 4 across | Kneeling still, hand on chest, head bowed, gentle loop.
SHEET: wanderer_hurt_f4 | 4 frames, 4 across | Hit from the front: flinch, knocked back off balance, stagger, recover.
SHEET: wanderer_ko_f4 | 4 frames, 4 across | Collapse: knees buckle, falling forward, on the ground, lying still with the frog still on the hat.
SHEET: wanderer_revive_f4 | 4 frames, 4 across | Getting up from lying down: push up, kneel, rise, standing.
SHEET: wanderer_interact_f4 | 4 frames, 4 across | Reaches forward and up to take something from a shelf, then lowers the arm.
```

Co-op players 2 to 4: repeat `wanderer_idle_f4` and `wanderer_run_f8` only if you want different characters. Otherwise I recolour the cloak in the game.

# 7. Small enemies (from the main sheet)

One chat per enemy. Attach the main sheet and say which enemy. Ids: `strider`, `gearling`, `boiler`, `rivet`, `scrapper`, `sapper`, `harvester`, `mirage`.

Replace `ID` with the enemy's id. Use these four lines for every enemy:

```
SHEET: ID_ref_f1 | 1 picture | The enemy standing or hovering, neutral, side view facing right, large.
SHEET: ID_move_f4 | 4 frames, 4 across | Movement loop (walk, scuttle, roll or hover, whichever suits it).
SHEET: ID_attack_f6 | 6 frames, 3 across 2 rows | Its attack: 3 frames of clear wind-up that hold a readable warning pose, 1 strike frame, 2 recovery frames. Body only.
SHEET: ID_defeat_f4 | 4 frames, 4 across | Hit flinch, breaking apart, collapsing, wreck on the ground.
```

What each one's attack is:

| Id | Enemy | Movement | Attack to draw |
|---|---|---|---|
| strider | Strider (scout) | spider-leg scuttle | rears up, then stabs forward with front legs |
| gearling | Gearling (melee) | waddling walk | winds an arm back, then punches |
| boiler | Boiler (ranged) | slow shuffle | swells, tips its cannon forward, fires (no projectile) |
| rivet | Rivet (flying) | hovering wing beat | pulls back in the air, then darts forward |
| scrapper | Scrapper (bruiser) | heavy stomp | raises both fists, slams down |
| sapper | Sapper (explosive) | rolling | fuse lights, swells and glows brighter each frame (the explosion is an effect) |
| harvester | Harvester (support) | four-leg walk | plants its legs, lamps brighten, pulses |
| mirage | Mirage (phasing) | drifting float | fades to half transparent, reappears with arm thrust out |

# 8. The five Wardens from the main sheet

Ids: `warden_smoke`, `warden_iron`, `warden_silence`, `warden_current`, `warden_sand`. One chat each. Attach the main sheet and name the Warden. These have no attack list on the sheet, so use the standard boss set in section 9 plus two attacks of your choosing described in one line each.

# 9. Standard boss set (use for every boss, replacing `ID`)

```
SHEET: ID_ref_f1 | 1 picture | The boss in a neutral standing pose, strict side view facing right, as large as possible, full body, every detail from the concept sheet.
SHEET: ID_idle_f4 | 4 frames, 4 across | Idle breathing loop. Lamps, vents or cloth move slightly. Body only.
SHEET: ID_move_f6 | 6 frames, 3 across 2 rows | Movement loop toward the right. Body only.
SHEET: ID_turn_f4 | 4 frames, 4 across | Turning around: facing right, quarter turn, facing away, facing left.
SHEET: ID_hurt_f4 | 4 frames, 4 across | Light hit flinch (2 frames), heavy hit recoil (2 frames). No sparks.
SHEET: ID_stagger_f4 | 4 frames, 4 across | Stunned and vulnerable loop: slumped, swaying, weak point clearly visible.
SHEET: ID_enraged_f4 | 4 frames, 4 across | The idle loop again in its enraged state: same design, hotter glow, cracked or damaged armour, more aggressive posture. No flames or smoke outside the outline.
SHEET: ID_defeat_f6 | 6 frames, 3 across 2 rows | Defeat: staggering, systems failing, falling, collapsed wreck. No smoke.
SHEET: ID_fx_f6 | 6 separate items, 3 across 2 rows | The boss's projectiles and effects from the concept sheet, each one alone in its own cell, drawn in pale cream-white and soft gold only so they can be tinted. No character.
SHEET: ID_arena_f1 | 1 picture | The boss's arena as a wide side-scrolling background with NO characters, no text, clear flat floor line across the lower third, darker and less detailed than the characters so they stand out.
```

For WIDE bosses, add the word WIDE to the layout part of each line and split 6-frame and 8-frame sheets into parts `a` and `b` of 4 frames each (for example `depthcoil_move_a_f4`, `depthcoil_move_b_f4`).

# 10. Boss concepts: what to tell the model, and each boss's own attack sheets

For each boss: new chat, attach its concept sheet, paste the master brief, paste the note below, run the standard set from section 9 with its id, then run its attack lines. Every attack line means "body only; 3 or more frames of wind-up, the strike, then recovery".

## The Tunnel Warden (`tunnel_warden`)
Note: "Hulking hooded mining machine with a caged lantern on its back, a respirator face, a tattered teal tarp cloak and a huge hydraulic pile hammer. The lantern, cloak and hammer appear in every frame."
```
SHEET: tunnel_warden_groundslam_f6 | 6 frames, 3 across 2 rows | Ground Slam: hammer raised overhead and held, slammed straight down, pulled free.
SHEET: tunnel_warden_tremorpound_f8 | 8 frames, 4 across 2 rows | Tremor Pound: three short repeated hammer strikes on the ground, then recovery.
SHEET: tunnel_warden_seismicwave_f6 | 6 frames, 3 across 2 rows | Seismic Wave: long wind-up dragging the hammer back, then a low horizontal strike into the ground.
SHEET: tunnel_warden_sweep_f6 | 6 frames, 3 across 2 rows | Sweep Breaker: wide horizontal hammer swing at waist height.
SHEET: tunnel_warden_charge_f8 | 8 frames, 4 across 2 rows | Vault Charge: crouch and lock on, short running charge, shoulder slam, skid.
SHEET: tunnel_warden_toss_f6 | 6 frames, 3 across 2 rows | Debris Toss: digs one hand into the ground, lifts overhead, throws. Do not draw the boulder.
SHEET: tunnel_warden_fortify_f4 | 4 frames, 4 across | Fortify: plants its feet, hunches, braces behind its arm.
SHEET: tunnel_warden_props_f4 | 4 items, 4 across | Arena objects, each alone: a breakable stone pillar, a pile of fallen rubble, a cracked ground patch seen from the side, a bell lure on a post.
```

## The Gearborne Queen (`gearborne_queen`)
Note: "Tall regal automaton in a green and gold gown with a gear crown, green glass tanks on her back and a large gear at her waist."
```
SHEET: gearborne_queen_sweep_f6 | 6 frames, 3 across 2 rows | Clockwork Sweep: wide arm sweep at close range.
SHEET: gearborne_queen_slam_f6 | 6 frames, 3 across 2 rows | Gear Slam: both arms raised, driven down into the floor.
SHEET: gearborne_queen_steam_f6 | 6 frames, 3 across 2 rows | Steam Burst: leans forward, tanks flare, arms thrown wide. No steam.
SHEET: gearborne_queen_beam_f6 | 6 frames, 3 across 2 rows | Pressure Beam: braces, one arm levelled forward and held. No beam.
SHEET: gearborne_queen_volley_f6 | 6 frames, 3 across 2 rows | Gear Volley: throws overarm three times. No gears.
SHEET: gearborne_queen_summon_f4 | 4 frames, 4 across | Summon: arm raised, gesture downward, hold.
SHEET: gearborne_queen_shield_f4 | 4 frames, 4 across | Aegis: arms crossed and braced; then arms flung apart as the shield breaks. No shield dome.
SHEET: gearborne_queen_minions_f6 | 6 items, 3 across 2 rows | Minions, each alone, two poses each: clockwork spider, steam turret, rolling gear wheel.
SHEET: gearborne_queen_hazards_f4 | 4 items, 4 across | Arena hazards, each alone: steam vent grate, rotating floor gear, pressure piston, falling weight on a chain.
```

## The Subterranean Engineer, Matron Vael (`matron_vael`)
Note: "A masked engineer with white hair and goggles, a long olive coat, a green lantern, riding a set of four mechanical spider legs. The legs, lantern and coat appear in every frame."
```
SHEET: matron_vael_dash_f4 | 4 frames, 4 across | Dash: legs gather, body low and stretched, skid.
SHEET: matron_vael_gearsweep_f6 | 6 frames, 3 across 2 rows | Gear Sweep: a front leg sweeps wide and low.
SHEET: matron_vael_steamburst_f6 | 6 frames, 3 across 2 rows | Steam Burst: plants all legs, lantern raised, braces.
SHEET: matron_vael_turrets_f6 | 6 frames, 3 across 2 rows | Deploy Turrets: reaches behind, sets something down, steps back.
SHEET: matron_vael_pull_f6 | 6 frames, 3 across 2 rows | Gravitic Pull: lantern held out at arm's length, leaning back against the pull.
SHEET: matron_vael_cannon_f6 | 6 frames, 3 across 2 rows | Overpressure Cannon: swings a shoulder cannon forward, braces, fires, recoil.
SHEET: matron_vael_drill_f6 | 6 frames, 3 across 2 rows | Ceiling Drill: one leg stabs upward and holds, then pulls down.
SHEET: matron_vael_turret_f4 | 4 frames, 4 across | Her small round turret alone: idle, aiming, firing recoil, broken.
```

## The Depthcoil (`depthcoil`) WIDE
Note: "A colossal blind serpent of rusted armour plates and gears with glowing green mushrooms growing on it and an amber core light in its mouth. Show the raised head and the first coils only; the body can leave the frame at the left edge."
```
SHEET: depthcoil_lunge_a_f4 | 4 frames, WIDE 2 across 2 rows | Lunge Bite part 1: head draws back, jaw opens, coils tense, held.
SHEET: depthcoil_lunge_b_f4 | 4 frames, WIDE 2 across 2 rows | Lunge Bite part 2: head shoots forward low, jaws snap, pulls back, recover.
SHEET: depthcoil_burrow_a_f4 | 4 frames, WIDE 2 across 2 rows | Burrow Charge part 1: head dips, dives into the ground, only the back arches show, gone.
SHEET: depthcoil_burrow_b_f4 | 4 frames, WIDE 2 across 2 rows | Burrow Charge part 2: ground bulge, head bursts up, full rise, settles.
SHEET: depthcoil_spore_f4 | 4 frames, WIDE 2 across 2 rows | Spore Cloud: mushrooms swell, head rears, shakes, settles. No cloud.
SHEET: depthcoil_roar_f4 | 4 frames, WIDE 2 across 2 rows | Resonance Roar: head rises, jaw wide, held, closes. No rings.
SHEET: depthcoil_sweep_f4 | 4 frames, WIDE 2 across 2 rows | Gear Sweep: the tail end alone, sweeping low across the ground.
SHEET: depthcoil_coil_f4 | 4 frames, WIDE 2 across 2 rows | Defensive coil: winds into a tight armoured ball, core hidden, then opens.
```

## The Gearmire Queen (`gearmire_queen`)
Note: "A regal automaton with a spiked gear crown and a gold tear line on her face, a green core in her chest, carried on six long thin golden spider legs."
```
SHEET: gearmire_queen_leap_f4 | 4 frames, 4 across | Reposition leap: crouch, airborne stretched, landing, settle.
SHEET: gearmire_queen_lance_f6 | 6 frames, 3 across 2 rows | Lance Sweep: a front leg extends like a lance and sweeps wide.
SHEET: gearmire_queen_quake_f6 | 6 frames, 3 across 2 rows | Gear Quake: rises high on her legs, drops and stamps.
SHEET: gearmire_queen_beam_f6 | 6 frames, 3 across 2 rows | Rail Beam: core brightens over three frames, body braced, held. No beam.
SHEET: gearmire_queen_needles_f4 | 4 frames, 4 across | Needle Barrage: arms thrust forward repeatedly. No needles.
SHEET: gearmire_queen_blades_f4 | 4 frames, 4 across | Orbiting Blades: arms raised and spread, held. No blades.
SHEET: gearmire_queen_guard_f6 | 6 frames, 3 across 2 rows | Aegis (2 frames, arms raised), Parry and counter (2), Core Seal curled closed (2).
SHEET: gearmire_queen_minions_f6 | 6 items, 3 across 2 rows | Minions, each alone, two poses each: worker drone, assembler crawler, turret node.
```

## The Caustic Medusa (`caustic_medusa`)
Note: "A brass and glass dome like a diving bell, filled with green fluid, with portholes and pipes, trailing long translucent green tentacles. It floats; there are no feet. Keep the tentacles inside the cell."
```
SHEET: caustic_medusa_rise_f4 | 4 frames, 4 across | Rise: tentacles gather beneath, push down, stream below.
SHEET: caustic_medusa_descend_f4 | 4 frames, 4 across | Descend: dome tips, tentacles spread upward like a parachute.
SHEET: caustic_medusa_swipe_f6 | 6 frames, 3 across 2 rows | Tentacle Swipe: two tentacles draw back, whip forward, return.
SHEET: caustic_medusa_discharge_f4 | 4 frames, 4 across | Electric Discharge: tentacles go rigid and spread, dome flares. No lightning.
SHEET: caustic_medusa_spray_f4 | 4 frames, 4 across | Caustic Spray: dome tilts forward, vents open, held. No spray.
SHEET: caustic_medusa_radial_f4 | 4 frames, 4 across | Radial Shot: tentacles curl in tight, then snap straight out in all directions. No droplets.
SHEET: caustic_medusa_shield_f4 | 4 frames, 4 across | Shield: tentacles wrap around the dome and hold. No shield bubble.
```

## The Rivet Queen (`rivet_queen`) WIDE
Note: "A huge steam-driven hive insect with translucent wings, six legs, chimney stacks on its back and a glowing amber abdomen like a furnace." (The current game design avoids insects; this one may be used as an optional boss.)
```
SHEET: rivet_queen_fly_f4 | 4 frames, WIDE 2 across 2 rows | Aerial reposition: lift off, wings blurred hover, tilt forward, landing.
SHEET: rivet_queen_breath_f4 | 4 frames, WIDE 2 across 2 rows | Steam Breath: rears, head forward, held, recover. No steam.
SHEET: rivet_queen_drill_f4 | 4 frames, WIDE 2 across 2 rows | Drill Charge: lowers head, legs gather, charges low, skid.
SHEET: rivet_queen_mortar_f4 | 4 frames, WIDE 2 across 2 rows | Hive Mortar: abdomen curls up over the back, fires, recoils, settles. No projectile.
SHEET: rivet_queen_slash_f4 | 4 frames, WIDE 2 across 2 rows | Gear Slash: front leg raised, swung down and across, recover.
SHEET: rivet_queen_brace_f4 | 4 frames, WIDE 2 across 2 rows | Shell Brace: wings fold flat, legs tuck, armour closes; then opens.
SHEET: rivet_queen_minions_f6 | 6 items, 3 across 2 rows | Minions, each alone, two poses each: worker, sapper with a glowing sac, carrier with an egg.
```

## The Clockwork Monarch (`clockwork_monarch`)
Note: "A crowned armoured sovereign in a green cloak with a white fur collar, a clock face in the chest, a tall lantern sceptre, and a spoked golden halo ring behind the head. The halo and sceptre appear in every frame."
```
SHEET: clockwork_monarch_run_f8 | 8 frames, 4 across 2 rows | Run loop, cloak streaming.
SHEET: clockwork_monarch_jump_f4 | 4 frames, 4 across | Jump: crouch, rise, peak, fall.
SHEET: clockwork_monarch_thrust_f6 | 6 frames, 3 across 2 rows | Sceptre Thrust: draw back, lunge with the sceptre straight forward, return.
SHEET: clockwork_monarch_arc_f6 | 6 frames, 3 across 2 rows | Clock Arc: wide overhead sceptre swing from back to front.
SHEET: clockwork_monarch_volley_f6 | 6 frames, 3 across 2 rows | Gear Volley: free hand flicks forward three times. No gears.
SHEET: clockwork_monarch_timelock_f6 | 6 frames, 3 across 2 rows | Time Lock: sceptre planted, free hand raised, chest clock glowing brighter each frame. No clock ring.
SHEET: clockwork_monarch_eruption_f6 | 6 frames, 3 across 2 rows | Steam Eruption: kneels, drives the sceptre into the floor, holds.
SHEET: clockwork_monarch_collapse_f8 | 8 frames, 4 across 2 rows | Chrono Collapse: rises onto toes, arms spread, halo tilts forward, long hold, release.
SHEET: clockwork_monarch_guard_f6 | 6 frames, 3 across 2 rows | Guard behind the cloak (2 frames), Parry with the sceptre (2), Retreat hop backward (2).
```

## The Furnace Lord (`furnace_lord`)
Note: "A massive riveted iron golem with a round green-glowing furnace grille in its chest, chimney stacks on its shoulders, huge block fists and a small orange banner at the waist."
```
SHEET: furnace_lord_sweep_f6 | 6 frames, 3 across 2 rows | Hammer Sweep: one fist drawn far back, swung across low, follow through.
SHEET: furnace_lord_fling_f6 | 6 frames, 3 across 2 rows | Molten Slag Fling: scoops from its own furnace, winds up, overarm throw. No slag.
SHEET: furnace_lord_eruption_f4 | 4 frames, 4 across | Steam Eruption: hunches, stacks swell, braces, releases. No steam.
SHEET: furnace_lord_chain_f6 | 6 frames, 3 across 2 rows | Chain Grab: arm cocked, thrown forward, held outstretched, hauling back. Do not draw the chain.
SHEET: furnace_lord_overload_f6 | 6 frames, 3 across 2 rows | Furnace Overload: stands square, furnace grille brighter in each frame, arms lifting, release.
SHEET: furnace_lord_pound_f6 | 6 frames, 3 across 2 rows | Ground Pound: both fists raised high, held, slammed down, fists in the floor, rise.
SHEET: furnace_lord_phases_f4 | 4 frames, 4 across | The same neutral pose in four damage states: intact; armour plates broken off; furnace core exposed; overheated and glowing orange.
```

## The Mycelial Heart (`mycelial_heart`)
Note: "A great brass-banded sphere glowing green inside, crowned with pale purple mushrooms, walking on four jointed piston legs."
```
SHEET: mycelial_heart_burst_f4 | 4 frames, 4 across | Spore Burst: sphere compresses, mushrooms swell, release, settle. No spores.
SHEET: mycelial_heart_mortar_f4 | 4 frames, 4 across | Spore Mortar: tilts back, one mushroom cap opens like a barrel, fires, rights itself. No projectile.
SHEET: mycelial_heart_lash_f6 | 6 frames, 3 across 2 rows | Root Lash: a root arm uncoils, draws back, whips forward along the ground, retracts.
SHEET: mycelial_heart_bloom_f4 | 4 frames, 4 across | Ground Bloom: lowers itself, legs dig in, pulses, rises.
SHEET: mycelial_heart_pulse_f6 | 6 frames, 3 across 2 rows | Overcharge Pulse: inner glow brighter each frame, bands straining, release, dim.
SHEET: mycelial_heart_harden_f4 | 4 frames, 4 across | Harden: plates slide shut over the glowing core, held, reopen.
SHEET: mycelial_heart_growths_f4 | 4 items, 4 across | Each alone: spore pod, root spire rising from the ground, small mushroom cluster, large mushroom cluster.
```

## The Hollow Coil (`hollow_coil`) WIDE
Note: "A clockwork serpent in gold and dark steel plates with green coolant tubes along its body. It is built in pieces so the game can assemble it at any length."
```
SHEET: hollow_coil_parts_f4 | 4 items, WIDE 2 across 2 rows | Each alone, side view: the head with jaws closed; one straight body segment; one curved body segment; the tail tip.
SHEET: hollow_coil_segment_states_f4 | 4 frames, 4 across | One body segment in four states: intact, cracked, armour broken with the green core exposed, destroyed.
SHEET: hollow_coil_head_bite_f4 | 4 frames, WIDE 2 across 2 rows | The head and neck only: draw back, jaws open, strike forward, snap shut.
SHEET: hollow_coil_head_vapor_f4 | 4 frames, WIDE 2 across 2 rows | The head and neck only: rears, jaws wide, held, closes. No vapour.
SHEET: hollow_coil_tail_sweep_f4 | 4 frames, WIDE 2 across 2 rows | The tail only: lifts, curls back, sweeps low, settles.
SHEET: hollow_coil_dive_f4 | 4 frames, WIDE 2 across 2 rows | The head only: diving into the ground, half buried, bursting out, clear.
```

## The Boiler Toad (`boiler_toad`) WIDE
Note: "Redraw this boss in the same watercolor-and-ink style as my other sheets, with the same muted palette. A giant moss-green toad wearing a brass boiler dome on its back with a chimney stack, a glowing furnace grille on its side, a pale throat sac, and a red cord with a brass bell. Its four weak points must stay clearly visible in every frame: the eye, the boiler stack, the furnace grille (heat core) and the throat sac."
```
SHEET: boiler_toad_tongue_f4 | 4 frames, WIDE 2 across 2 rows | Tongue Lunge: mouth clamps shut and cheeks bulge, mouth opens, head thrust forward, mouth closes. Do not draw the tongue.
SHEET: boiler_toad_steam_f4 | 4 frames, WIDE 2 across 2 rows | Steam Burst: throat sac inflates large, held, mouth opens low and wide, deflates. No steam.
SHEET: boiler_toad_hop_a_f4 | 4 frames, WIDE 2 across 2 rows | Pressure Hop part 1: deep crouch, held, launch, airborne with legs trailing.
SHEET: boiler_toad_hop_b_f4 | 4 frames, WIDE 2 across 2 rows | Pressure Hop part 2: peak, falling with belly down, heavy landing squash, recover.
SHEET: boiler_toad_spray_f4 | 4 frames, WIDE 2 across 2 rows | Boil Spray: head tilts up, mouth open upward, held, closes. No water.
SHEET: boiler_toad_phases_f4 | 4 frames, WIDE 2 across 2 rows | The same sitting pose in four states: calm; furnace grille glowing hotter; armour cracked and stack bent; overheated with the dome glowing orange.
SHEET: boiler_toad_tongue_part_f4 | 4 items, 4 across | The tongue alone as pieces: tip curled, tip open like a hand, a straight middle length, a base piece.
```

# 11. World, props and interface

Use one chat for each group. Attach the main sheet.

## Tiles
After the brief, add: "These are tiles for a side-view platform game. Each tile is a perfect square that repeats seamlessly. Draw them in a grid with a gap between tiles. Ink outline only where a tile has an outside edge."
```
SHEET: tiles_REGION_a_f6 | 6 tiles, 3 across 2 rows | Solid wall fill (repeats in all directions); floor top surface (repeats left and right); wall left face; wall right face; ceiling underside; a second variation of the floor top.
SHEET: tiles_REGION_b_f6 | 6 tiles, 3 across 2 rows | Outer corner top-left; outer corner top-right; inner corner top-left; inner corner top-right; thin wooden or metal platform middle piece; the platform's end cap.
SHEET: tiles_REGION_c_f6 | 6 items, 3 across 2 rows | Row of sharp spikes one tile wide; and five decorations for this region, each alone.
```
Run those three lines once per region, replacing `REGION` and adding the region description:

| REGION | Description to add |
|---|---|
| junction | calm underground rail junction: mossy stone, brass rail, lamp posts |
| quay | wrecked ship hulls and docks: rust-brown timber, chains, portholes |
| reef | dead coral towers and signal lamps: violet-grey stone, cables, hanging lamps |
| cutting | white salt canyon: pale blue-white crystal, rail sleepers, brine drips |
| hall | buried station hall: dark green ironwork, brass, ticket booths, stopped clocks |
| terminus | end of the line: indigo steel, steam pipes, buffers, gauges |

## Backgrounds
After the brief, add: "These are scrolling backgrounds. No characters, no text. The left and right edges must match so the picture can repeat. Keep them darker, softer and less detailed than the characters."
```
SHEET: bg_REGION_far_f1 | 1 picture | The far distance for this region: the largest shapes only, very soft, low contrast.
SHEET: bg_REGION_mid_f1 | 1 picture | The middle distance: medium shapes on a flat background colour, the lower third empty.
SHEET: bg_REGION_near_f1 | 1 picture | Foreground silhouettes only, very dark, along the top and sides, the centre left empty.
```

## Props
```
SHEET: props_a_f6 | 6 items, 3 across 2 rows | Each alone, side view: stone plinth; travel trunk closed; the same trunk open; brass ticket machine; newspaper-stand kiosk with three empty shelves; wooden notice sign on a post.
SHEET: props_b_f6 | 6 items, 3 across 2 rows | Each alone: railway signal post unlit; the same lit; water standpipe; arched side doorway; tall arched gate; iron portcullis bars.
SHEET: props_c_f6 | 6 items, 3 across 2 rows | Each alone: timetable board with five blank rows; hanging lamp on a chain; breakable crate; barrel; small glowing chit of scrip; treasure sparkle.
```

## Effects (pale cream-white and soft gold only, so the game can tint them)
```
SHEET: fx_slash_f4 | 4 frames, 4 across | A curved sword slash arc growing and fading. No character.
SHEET: fx_heavy_slash_f4 | 4 frames, 4 across | A larger, thicker slash arc growing and fading.
SHEET: fx_pierce_f4 | 4 items, 4 across | A thin straight streak; a dart-like bolt; a needle; an impact star.
SHEET: fx_arc_f4 | 4 frames, 4 across | A small round lobbed shot tumbling, then a burst where it lands.
SHEET: fx_burst_f4 | 4 frames, 4 across | A ring pulse expanding outward from the centre and fading.
SHEET: fx_ground_f4 | 4 frames, 4 across | A low wave travelling along the floor, then cracking the ground.
SHEET: fx_steam_f4 | 4 frames, 4 across | A puff of steam appearing, billowing, thinning, gone.
SHEET: fx_dust_f4 | 4 frames, 4 across | A small dust puff from a footstep or landing.
SHEET: fx_impact_f4 | 4 frames, 4 across | A hit spark: flash, star, fragments, gone.
SHEET: fx_shatter_f6 | 6 frames, 3 across 2 rows | A plate cracking and bursting into shards that fly outward.
```

## Interface
```
SHEET: ui_a_f6 | 6 items, 3 across 2 rows | Each alone: health pip full; health pip empty; ornate gauge frame, long and thin; round compass-like emblem; square item slot frame; the same slot frame highlighted.
SHEET: ui_b_f4 | 4 items, 4 across | Four flat token blanks seen from the front: a triangle, a crescent, an eight-point star, a wide flat slab. Thick ink outline, plain pale fill, a small round punch hole in each.
SHEET: ui_c_f4 | 4 items, 4 across | Four ability icons in round frames: a dash streak; a hand gripping a wall; a double upward arrow; a heavy blade swing.
SHEET: ui_title_f1 | 1 picture | The words "The Dry Line" in the brush lettering from my sheet, dark green, alone on the background. (This is the one sheet where text is wanted.)
```

## Portraits (for dialogue, optional)
```
SHEET: portrait_ID_f4 | 4 pictures, 4 across | Head-and-shoulders portrait, three-quarter view allowed here, four expressions: calm, speaking, surprised, grim.
```
Ids: `wanderer`, `guide`, `engineer`, `warden`.

# 12. What I do when you send the files

1. Remove the background and cut each sheet into frames automatically.
2. Line the frames up on a common foot line and scale each character to its size in the game (the Wanderer is about 60 game pixels tall; bosses are two to five times that).
3. Build the strips the game loads, named by the same ids.
4. Wire them into the game in place of the code-drawn art and send you a build to look at.

Send a first batch of just the Wanderer's `ref`, `idle`, `run`, `jump` and `slash_side`. I will put those in the game so we can confirm the method works before you make the rest.

# 13. Things to know

- The four token cuts keep fixed colours in the game (pierce blue, arc yellow, burst orange-red, ground pink) so players can read them. That is why effects are requested in white and gold: the game colours them.
- If these sheets are made with an image generator, stores such as Steam and itch.io require that to be disclosed on the game's page.
- Expect to regenerate. Roughly one sheet in three will need a fix phrase. Consistency is the hard part; the reference sheet attached to every request is what holds it together.


# 2026-11-22 missing production exports — ready-to-use prompts

These prompts are for the studio lead's approved image workflow. Do not substitute outside image services.

## Tollkeeper states
```
SHEET: tollkeeper_states | 3 frames, 3 across | 432x84 WebP final strip, three equal 144x84 cells. Canonical Tollkeeper watercolor/ink design, strict right-facing side view. Frame 1 Normal: dome-backed toll engine on four short legs, overlapping slate shell plates, pale wooden face plate, warm furnace underbelly. Frame 2 Stagger: same exact scale/design slumped low, face plate drooped, vulnerable. Frame 3 Enraged: same pose family with hotter rust furnace accent and more aggressive damaged posture. Transparent background, body only, no glow outside outline, no text, no ground/shadow.
```

## Wreck Quay painted plate
```
BACKGROUND: wreck_quay.jpg | 1920x1080 | Wide watercolor environment plate, no characters, no text. Dried seabed railway quay with beached hull ribs, cranes, chains and timber, deep sea-green/rust-brown family. Three depth layers implied by value; gameplay floor area stays dark and quiet, distant silhouettes lower contrast, lamps small cream accents. No amber player-cloak or teal scarf colors.
```

## Ticket Hall painted plate
```
BACKGROUND: ticket_hall.jpg | 1920x1080 | Wide watercolor environment plate, no characters, no text. Buried railway ticket hall with dark green iron arches, stopped clocks, shuttered booths, brass trim and receding concourse silhouettes. Gameplay floor dark/quiet, background low contrast, lamp-white and brass accents restrained. No token cut colors, player amber or player teal.
```

## Crate/barrel prop sheet
```
SHEET: crate_barrel | 2 props, 2 across | 512x256 transparent PNG/WebP. Left: squat railway freight crate, worn timber, iron straps, rust fasteners. Right: compact barrel/drum for the dry-seabed railway, dark wood/iron with brass/rust detail. Watercolor with closed dark ink outline, no labels, no shadow, no ground, large clean gap.
```

## Signal Reef production plate
```
BACKGROUND: signal_reef.jpg | 1920x1080 | Wide watercolor environment plate, no characters/text. Dead coral towers, tall signal masts, hanging lamps and cable silhouettes in violet-grey dusk. Strong vertical rhythm for the shaft region, but the playable foreground remains darker and simpler than characters. Lamp-white accents sparse; no reserved player/token colors.
```

## Salt Cutting production plate
```
BACKGROUND: salt_cutting.jpg | 1920x1080 | Wide watercolor environment plate, no characters/text. White salt canyon cut by railway, stepped cutting walls, salt pans, brine traces, crystal shelves and distant trestles. Pale blue-white slate family with dark value-separated gameplay foreground; no saturated cut/player colors.
```

## Ticket Hall alternate deep plate
```
BACKGROUND: ticket_hall_deep.jpg | 1920x1080 | Alternate deeper Ticket Hall plate for parallax/crop testing: repeating station arches, clocks and booth silhouettes receding into dark green/brass haze, paper texture and watercolor wash, no characters/text, low contrast behind the action.
```
