# 2026-11-22 combat feel audit and regional cast table

This pass converts the existing design audit into the day brief's explicit production checklist. Automated state-contract checks are authoritative for timings; the browser connector cannot perform five human fights per enemy, so subjective feel remains flagged for QA rather than invented.

| Enemy | Readable wind-up | Counter | Unfair-hit guard |
|---|---|---|---|
| Strider | claw raise, 0.38 s | jump/step behind, punish recovery | harmless outside committed lunge |
| Boiler | pressure swell before lob/vent | close bait or reposition, punish spent state | harmless recovery; lob leaves visible Wet |
| Scrapper | shield charge tell | flank/down-slash, punish recovery | front shield only; recovery opens it |
| Rivet | rear-back tell | sidestep/switch height, punish post-swoop | hover/wind/recovery harmless |
| Lamp Wisp | visible charge/death-pop | interrupt or retreat | damage tied to authored pulse/burst |
| Brine Toad | crouch | bait landing, punish recovery | terrain-safe hop and warned landing |
| Gearling | pump/wind | clear lane, wall crash punish | target locks through commit |
| Hanging Lamp | shake | leave trigger lane | ceiling tell precedes drop |
| Sapper | 0.70 s plant tell | interrupt/cut mine/leave mark | planted charge is cuttable |
| Harvester | 0.85 s repair tell | prioritize/interruption | support pulse, not contact pressure |
| Mirage | phase then 0.50 s reappearance tell | wait, dodge committed dash, punish recovery | fade itself is not damage |

## Region casts

| Region | Cast jobs |
|---|---|
| Wreck Quay | Strider rusher; Boiler ranged/space denial; Scrapper armour/lane holder; Sapper zoning |
| Signal Reef | Strider ground spacing; Harvester support; Rivet aerial interceptor; Lamp Wisp proximity; Hanging Lamp ambush |
| Salt Cutting | Strider rusher; Boiler ranged; Brine Toad area denial; Mirage ambush; Hanging Lamp ceiling hazard |
| Ticket Hall | Strider rusher; Scrapper armour; Gearling heavy lane rush; Sapper zoning; Harvester support; Lamp Wisp aerial pressure |
| Terminus | Gearling heavy; Boiler ranged; Strider spacing; Sapper zoning; Mirage ambush; Rivet aerial |

## Materials

The production roster now declares a readable material vocabulary used by the new `enemy_materials` check: stone/brittle Strider, wet Boiler/Toad, metal mechanical enemies, flammable Lamp Wisp, salt/brittle Hanging Lamp, and cloth Mirage. This is metadata for deterministic interaction/presentation work and does not silently change damage rules.

## Human-play handoff

QA should still perform the brief's five-fights-per-type subjective pass at 1x and append only genuine human observations here. Do not convert automated timing coverage into a claim of human feel testing.
