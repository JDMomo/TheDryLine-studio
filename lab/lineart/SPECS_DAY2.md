# Full character-spec pass
Day-2 coverage now includes every enemy named in the asset list plus all five Wardens. Specs are data-only primitives with material tags and no imported pictures. Existing painted sheets were studied for silhouette/proportion only.

Enemies: Wanderer, Strider, Boiler, Rivet, Gearling, Scrapper, Lamp Wisp, Brine Toad, Hanging Lamp, Sapper, Harvester, Mirage.

Wardens: Tollkeeper, Lamp-Heron, Switchman Idol, Gatewhale, Long Clock.

Material grammars are encoded in engine_v2.js: cloth = curved/bunched; metal = longer controlled parallel marks; stone/salt = shorter broken marks; glass/glow = sparse light-bearing strokes; wood = long grain-like marks. Hit and defeat hooks operate on the same generated strokes rather than importing effects.

Open visual work: the Wardens need authored part articulation and attack-specific pose keys; the current specs establish silhouette families and material coverage, not final animation acting.