# World Art & UI day — 2026-11-22

## Readability contract
Interactive silhouettes use the gameplay outline and brightest local values; backdrops stay in compressed dark ranges. Hazards receive a warm warning rim. The automated contrast check below guards the palette-level outline/backdrop ratio at >=3:1 for hub, r1-r4 and final. Per-pixel screenshot sampling remains a browser/visual-QA task.

## Terrain distinctions
- **Mud:** matte brown, broad low-contrast ripples, no specular line.
- **Tar:** near-black, narrow pale specular highlight plus slow bubble circles.
- **Salt:** pale angular facets/scratches against slate mass.
- **Plain floor:** region material texture, no crystal facets.
- **One-way:** thin isolated plank/coral/salt/iron ledge with a bright walkable cap and visible underside gap.
- **Solid:** full mass below the bright cap.

## Region silhouettes
Wreck Quay = hull ribs/cranes/chains; Signal Reef = coral towers/signal masts/lamps; Salt Cutting = cutting walls/salt pans/crystals; Ticket Hall = arches/clocks/booths; Terminus = gearworks/pipes/clock structures; Junction = warm lamplight and station stone.

The current world renderer already implements these families and caches chunks/background layers. This branch adds explicit missing-export prompts rather than fabricating painted files.
