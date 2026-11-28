# Exploratory illustrations

On-demand images generated for the slice, following `docs/ASSETS.md` §3. They are
**exploratory**, not final production art, and they do not belong to the M18 asset
manifest. The files here are the copies of record; the app serves the same images from
`public/art/`, and content references them by `art.*` ID through `src/ui/art.ts`.

- **Generated:** 2026-11-26; the cloth-thread scenes and the harbor quay 2026-11-27;
  the Cyprus smithy regenerated 2026-11-27; the land views and prologue beats
  2026-11-27, after three rejected rounds; the two night views and twelve cargo thumbnails
  2026-11-27; the opening unloading and oil-jar beats 2026-11-27
- **Style:** Late Bronze Age historical illustration, c. 1230 BCE, textured brushwork,
  warm local light, saturated earthy color, period materials, grounded human proportions.
- **Shared prompt constraints:** uncut woven linen and wool only (no sewn sleeves, collars
  or buttons); barefoot or plain leather sandals; cloth head-wraps; clay, stone, wood, bone
  and bronze vessels and tools only; mud-brick and stone architecture with flat roofs;
  painted plaster and polychrome detail where the region and building type support it,
  weathered rather than uniformly fresh; no text; no modern elements.
- **Regional dress and objects:** dress, hair, beards, ornaments, pottery wares and
  furniture must follow the region in `docs/ASSETS.md` §2.11, not a generic Mediterranean
  or classical default. Occupation and class change the clothing within the same place.
- **Files:** 62 (13 places, 10 world views, 2 land views, 9 portraits, 11 scene beats,
  5 prologue beats, 12 cargo thumbnails).
- **Where used:** Place screen hero, activity cards, speaker portraits, People list, a
  scene's beat card and the finished passage it settles into, the main menu's land cards
  and the prologue's beats.
- **Review status:** `reviewed` = checked for anachronism, caricature and tone. None is
  `promoted`; promotion needs the M18 manifest and historical sign-off.

## Places

| File | Art ID | Subject | Status |
| --- | --- | --- | --- |
| `opening-unloading.jpg` | `art.opening.unloading` | The opening beat: porters carrying jars down the gangplank of one round-hulled ship, painted warehouses and green hills behind | reviewed — generated 2026-11-27 for `dlg.slice.opening`; one mast, no modern fittings. A rejected take added a second ship and a glass bottle |
| `opening-oil.jpg` | `art.opening.oil` | The opening beat: two red-banded oil jars and a linen purse on a reed mat, a scribe's hand and reed stylus over a blank clay tablet | reviewed — generated 2026-11-27; the tablet is deliberately blank, and no paper, metal pen or readable letters appear |
| `ugarit-harbour.jpg` | `art.ugarit.harbour` | Moles, a round-hulled trader, painted houses and awnings, porters, warehouses, the city on the hill | reviewed — regenerated 2026-11-27 with painted doors, dyed awnings and a patterned quay; the ship still carries a second mast and rigging, to fix in M18 |
| `ugarit-market.jpg` | `art.ugarit.market` | Mats, clay jars, a bronze balance, dyed wool, a boy with water | reviewed — some patterned textiles are decorative rather than attested; keep in the M18 brief |
| `ugarit-palace-gate.jpg` | `art.ugarit.palace-gate` | Painted reliefs, a studded timber door, a striped awning, patterned paving, officials, a scribe, guards | reviewed — regenerated 2026-11-27 with colour; the relief figures read more like statues than low orthostats |
| `ugarit-temple.jpg` | `art.ugarit.temple` | Altar fire, oil lamps, frame drum, offerings; a singer practicing | reviewed — the drummer reads male; canon allows any singer, but check against Belet if the scene is ever pinned to her |
| `ugarit-workshops.jpg` | `art.ugarit.workshops` | Hand-turned wheel, warp-weighted loom, kiln, drying pots | reviewed — a tiled roof edge at the right; minor |
| `ugarit-mole.jpg` | `art.ugarit.mole` | The mole along the quay: porters, a ship's stern, warehouses, reed awnings, the city above | reviewed — gives the harbor activity card its own picture, so the hero is not shown twice on the Place screen |
| `cyprus-arrival.jpg` | `art.cyprus.arrival` | Shingle beach, plank boats, thatched flat roofs, copper cakes with patina | reviewed — figures are distant and wrapped; one agave-like plant at the frame edge |
| `cyprus-yard.jpg` | `art.cyprus.yard` | Ingots, balance, broker, scribe with a tablet | reviewed — ingots read as flat discs rather than oxhide shapes; one glazed opening at the edge |
| `cyprus-landing.jpg` | `art.cyprus.landing` | Drawn-up boats, coiled rope, clay jars, a bare-backed shipmaster | reviewed |
| `cyprus-smithy.jpg` | `art.cyprus.smithy` | Ada at a charcoal hearth with tongs and hammer, her daughter sorting charcoal, bronze bowls and a tripod | reviewed — regenerated 2026-11-27: the first cut put a man at the anvil, which contradicted Ada the smith; the stemmed cup on the bench is period-possible but keep it out of the M18 brief |
| `cyprus-inn.jpg` | `art.cyprus.inn` | Courtyard, low table, brazier, travelers at dusk | reviewed |
| `ugarit-night.jpg` | `art.ugarit.night` | Ugarit at night: lamps on the quay, a moored trader, painted doors, moonlit sea, the city dark behind | reviewed — small wall-bracket lamps read later than intended, the ship carries more rigging than a single square sail, and the oxhide ingots read as log bundles; keep all three in the M18 brief |
| `cyprus-night.jpg` | `art.cyprus.night` | A Cypriot yard at night: a glowing kiln, clay lamp on a trestle, plastered reed-roofed houses, a frog cistern, the sea beyond | reviewed — one white chimney-like roof vent reads a little modern; the frogs are larger than life. The kiln, clay lamp and yard are the point |

## Cargo thumbnails

One square plate per good, used in the market table and the cargo list. They share a dark
umber ground and a single-object composition so a row of them reads as a set.

| File | Art ID | Subject | Status |
| --- | --- | --- | --- |
| `good-grain.jpg` | `art.good.grain` | Barley and emmer sheaf, linen sack, wooden scoop | reviewed |
| `good-olive-oil.jpg` | `art.good.olive-oil` | Two painted clay oil jars and a funnel | reviewed |
| `good-wine.jpg` | `art.good.wine` | Wine amphora in a stand, clay cup, dried grapes | reviewed — the jug's slip is glossier than most Late Cypriot ware; keep in the M18 brief |
| `good-copper.jpg` | `art.good.copper` | Oxhide ingot with green patina on linen | reviewed — regenerated once; the first take read as a green bowl |
| `good-tin.jpg` | `art.good.tin` | Three dull tin bars and a clay weight | reviewed — the bars are a plausible abstraction, not a documented ingot shape |
| `good-cedar.jpg` | `art.good.cedar` | Rope-tied cedar planks and logs | reviewed — regenerated once to remove an anachronistic iron tool |
| `good-pottery.jpg` | `art.good.pottery` | Stacked clay bowls and a burnished jug | reviewed |
| `good-textile.jpg` | `art.good.textile` | Folded red and blue wool cloth, loom weight | reviewed — the banding is bolder than the textile evidence supports; keep it simple |
| `good-incense.jpg` | `art.good.incense` | Resin bowl with smoke, linen pouch | reviewed |
| `good-silver.jpg` | `art.good.silver` | Cut silver pieces and a coiled ring on linen | reviewed — regenerated once to remove an ornate later-style balance |
| `good-palace-seal.jpg` | `art.good.palace-seal` | Clay tablet, cylinder seal, cord | reviewed — the tablet marks are decorative, not a real text |
| `good-sibtu-cloth.jpg` | `art.good.sibtu-cloth` | Red cloth with blue and undyed border, spindle whorl | reviewed — the whorl reads as a turned wooden knob |

## Portraits

| File | Art ID | Subject | Status |
| --- | --- | --- | --- |
| `ugarit-amnit.jpg` | `art.ugarit.amnit` | Merchant, woven linen wrap, clay seal on a cord, tablet | reviewed |
| `ugarit-hannu.jpg` | `art.ugarit.hannu` | Harbor official, gray beard, clay seal | reviewed |
| `ugarit-yada.jpg` | `art.ugarit.yada` | Scribe, blank tablet, reed stylus, ink-stained hands | reviewed |
| `ugarit-tiro.jpg` | `art.ugarit.tiro` | Shipmaster, rope, furled sail | reviewed |
| `ugarit-belet.jpg` | `art.ugarit.belet` | Temple singer, veil, faience beads, frame drum, clay lamp | reviewed |
| `ugarit-sibtu.jpg` | `art.ugarit.sibtu` | Displaced weaver, headscarf, mantle, loom behind | reviewed — she holds a small jar rather than loom weights |
| `cyprus-kinyras.jpg` | `art.cyprus.kinyras` | Copper broker, bare-chested under a woven fringed shawl, ingot | reviewed |
| `cyprus-ada.jpg` | `art.cyprus.ada` | Smith, hide apron, soot, hammered bowl, stone forge | reviewed — the bowl reads steel-grey; bronze would be warmer |
| `cyprus-shipti.jpg` | `art.cyprus.shipti` | Innkeeper, faded wrap, wine jar | reviewed |

## Scenes: the cloth thread

One picture per beat of Sibtu's consignment, so no two beats of the thread share an
image. The art is authored per dialogue node (`art` on the node) and resolves through the
same catalog.

| File | Art ID | Subject | Status |
| --- | --- | --- | --- |
| `ugarit-cloth-table.jpg` | `art.ugarit.cloth-table` | The tied bundle on the table, the errand asked | reviewed |
| `ugarit-cloth-tied.jpg` | `art.ugarit.cloth-tied` | The cord pulled tight, head down | reviewed |
| `ugarit-cloth-amends.jpg` | `art.ugarit.cloth-amends` | Pushing the bundle across the table | reviewed |
| `ugarit-cloth-refused.jpg` | `art.ugarit.cloth-refused` | Cutting the cord, folding it back into the chest, two children watching | reviewed |
| `ugarit-cloth-missing.jpg` | `art.ugarit.cloth-missing` | The bare table and the coil of cord, her hands still | reviewed — a first take put her body inside the loom frame; regenerated with her standing beside it |
| `ugarit-cloth-settle.jpg` | `art.ugarit.cloth-settle` | The shuttle set down, one hand out, palm up | reviewed |
| `ugarit-cloth-settled.jpg` | `art.ugarit.cloth-settled` | Five cut pieces of silver counted into a small box | reviewed — a framed panel on the far wall reads modern at full size, not at card size |
| `ugarit-cloth-kept.jpg` | `art.ugarit.cloth-kept` | Back at the shuttle, the children still in the doorway | reviewed |
| `ugarit-cloth-after.jpg` | `art.ugarit.cloth-after` | The shut chest, the loom going, light on one side | reviewed — the chest carries dark metal corner plates; the rope lashing is right, the plates are not |

The loom has a row of pierced clay loom weights in every take, but its frame varies
between an upright warp-weighted loom and a bench loom. The weights are right; the frame
should settle on one form in the M18 brief.

## Lands and the prologue

The menu shows the two shores as pictures; the prologue reads the opening in five beats,
each with its own. All of these are horizon **A**, c. 1250–1230 BCE (`docs/ASSETS.md` §2.6,
ADR-0010): White Slip II, Base Ring II, Mycenaean IIIB imports and Canaanite jars, with
no later wares. Both sets needed several rounds. The first takes were classical and
medieval Mediterranean — pediments, colonnades, tiled roofs, a studded gate with a painted
sign, a clipboard and a brass laboratory balance, copper "ingots" rendered as jugs. The
kept takes use plain battered stone, flat mud roofs and square lintels only.

| File | Art ID | Subject | Status |
| --- | --- | --- | --- |
| `land-levant.jpg` | `art.land.levant` | A Levantine port under pine-wooded hills: flat mud roofs and reed awnings, vineyards and olive terraces, green barley and a garden, a round-hulled ship at a stone mole, ingots and jars on the quay | reviewed, horizon A — regenerated 2026-11-27 for green Mediterranean ecology; the gate tower still carries light battlements, and the ship's rig reads partly fore-and-aft |
| `land-cyprus.jpg` | `art.land.cyprus` | A Late Cypriot courtyard above a blue bay: rough stone walls and a flat-topped tower, an upright betyl, copper slabs, White Slip and Base Ring wares, olive and vines, pine-wooded hills | reviewed, horizon A — regenerated 2026-11-27 for green island ecology; the bowls on the bench read more like vessels than the three diagnostic wares |
| `prologue-gate.jpg` | `art.prologue.gate` | A timber gate in an ashlar wall, a blank tablet and reed on a bench, bread and an oil jar | reviewed — no figures; the beat's law and writing is carried by objects |
| `prologue-bronze.jpg` | `art.prologue.bronze` | A storeroom: oxhide-shaped copper and tin slabs, a beam balance with clay pans, jars and cedar | reviewed — the tablet on the shelf reads a little like a whetstone |
| `prologue-arrival.jpg` | `art.prologue.arrival` | A square-sailed boat at a quay, a man with a reed and tablet, two sealed jars | reviewed — the sail's foot still suggests a fore-and-aft rig |
| `prologue-temple.jpg` | `art.prologue.temple` | One carved stela of a bearded god with spear and conical crown beside a plain one, pilgrims with a lamb climbing the ramp | reviewed, horizon A — no ivory: the Egyptianising plaque kept coming back as a stone icon panel, so the motif is left to the wares image and a future object study |
| `prologue-purse.jpg` | `art.prologue.purse` | Two bowls of one shape: Cypriot white slip with lozenges, and a local copy with a red band and a fish; balance, silver, jars, tablet, ingot | reviewed, horizon A — the clearest statement of borrowing in the set: same form, different decoration |

## The wider world

Ten places the menu names and the prologue visits, c. 1230 BCE: the ecological brief is
`docs/design/05-the-world-in-1230.md` and `docs/ASSETS.md` §2.7. The first set was
regenerated because it read as one beige desert: Karnak had pines in the court, Giza had
marsh at the monument's feet, Hattusa had a classical keystone, and Dur-Kurigalzu had a
street lamp. The kept takes give each region its own green, water and season. These are
not roads the journey takes; they are the world it is measured against.

| File | Art ID | Subject | Status |
| --- | --- | --- | --- |
| `world-karnak.jpg` | `art.world.karnak` | Two tapering pylons and a gateway, obelisks, painted columns, priests; green Nile fields, a canal and palms beyond the wall | reviewed — the hypostyle is implied by four columns rather than shown as a hall |
| `world-giza.jpg` | `art.world.giza` | Pyramids and Sphinx on the ochre plateau, green flood plain of barley, canals, palms and a village below | reviewed — the field plots read a little modern; the plateau-to-valley contrast is the point |
| `world-hattusa.jpg` | `art.world.hattusa` | Cyclopean gate with lion reliefs, Hittite guards and an ox cart; oak and pine woodland, pasture, a stream, the citadel above | reviewed — the citadel reads slightly castle-like; the lions are roundels rather than true reliefs |
| `world-chogha-zanbil.jpg` | `art.world.chogha-zanbil` | Five-terraced ziggurat with glazed banding, walled enclosure, priests and servants; irrigated barley, palms, a canal and the Zagros beyond | reviewed — glazed banding is heavier than the evidence and the summit shrine is simplified |
| `world-mycenae.jpg` | `art.world.mycenae` | The citadel on its rocky hill above the Argive plain: cyclopean walls and Lion Gate small in the middle distance, palace and terraced town on the summit, barley, olives and distant mountains | regenerated 2026-11-28 — the citadel now has scale and the gate is a detail, not the whole subject; the walls still read a little regular |
| `world-abu-simbel.jpg` | `art.world.abu-simbel` | Rock-cut temple with colossi and winged disk; narrow green Nile bank with palms, reeds, barley, a village, a boat and cattle | reviewed — only three colossi read clearly, and the winged disk carries a face; fix in the M18 brief |
| `world-dur-kurigalzu.jpg` | `art.world.dur-kurigalzu` | The ziggurat dominating its temple and palace precinct, irrigated barley, canals, date palms, a reed boat and tiny workers; dry steppe beyond | regenerated 2026-11-28 — the ziggurat is the subject and the figures are subordinate; the temple porches read a little classical |
| `world-enkomi.jpg` | `art.world.enkomi` | Copper town behind a beach: kiln smoke, charcoal, oxhide ingots on a beam balance with clay pans, Cypriot pots; pine and oak hills, olives, vines, blue sea | reviewed — the house has a stovepipe chimney and a glazed window, and the ship's rig is too tall; fix in M18 |
| `world-anyang.jpg` | `art.world.anyang` | A royal precinct of broad rammed-earth platforms and thatched halls, bronze foundry smoke, chariots and workshops, small figures at the walls; millet, reed marsh and river beyond | regenerated 2026-11-28 — it reads as a court complex rather than a village hall; one chimney reads industrial and the chariots are carts |
| `world-mohenjo-daro.jpg` | `art.world.mohenjo-daro` | Abandoned brick streets, drains and great bath; green riverine grass, the Indus with reeds and a boat, goats and herders | reviewed — the walls read a little too intact for a ruin |

## Scale and interior pass — 2026-11-28

The wide plates now put the settlement, fields and water around the monument, and the
interiors give the palace, archive, inn and megaron a room rather than a backdrop. The
same horizon-A rule applies: painted plaster where the building supports it, no classical
orders, no later furniture.

| File | Art ID | Subject | Status |
| --- | --- | --- | --- |
| `ugarit-high.jpg` | `art.ugarit.high` | Ugarit from the acropolis: flat roofs and streets, palace and temple precincts, harbor mole and ships, vineyards, hills and sea | reviewed — the ships' rig is later than the period; the city scale is the point |
| `ugarit-palace-hall.jpg` | `art.ugarit.palace-hall` | Palace hall: ashlar walls, faded painted bands with Egyptianising figures, timber beams, stone column bases, low dais and a few officials | reviewed — the frieze is more Egyptian than the surviving Ugaritic evidence; keep as exploratory |
| `ugarit-archive.jpg` | `art.ugarit.archive` | Archive: baskets and shelves of tablets, a scribe writing by an oil lamp, sealed jars, painted wall band | reviewed — the rolled papers on the floor are a later convention; tablets are the point |
| `cyprus-inn-interior.jpg` | `art.cyprus.inn-interior` | Inn common room at dusk: red and mauve wall bands, timber beams, plank table, wine bowls, storage jar, brazier and travelers | reviewed — the wall lamp reads a little modern; the room and its wear are right |
| `mycenae-megaron.jpg` | `art.mycenae.megaron` | Megaron: round hearth, four painted columns, low throne, flat red/blue/yellow wall bands, king and attendants small in the room | reviewed — the column capitals are more classical than Mycenaean; the hearth and plan are right |

Two generated candidates were rejected rather than wired: a temple cella whose divine
figure read as a Buddha, and a household shrine whose gods did the same. The existing
`art.ugarit.temple` courtyard plate carries those beats; a corrected interior remains M18
work.

## Colour pass — 2026-11-27

A further pass answered the opposite failure: bare stone and mud brick. `docs/ASSETS.md`
§2.8 and `docs/design/05-the-world-in-1230.md` §4 now require painted plaster, pigment and
polychrome detail appropriate to the region and the building's wealth, with weathering.
Regenerated: `land-levant`, `land-cyprus`, `world-karnak`, `world-hattusa`,
`world-mycenae`, `world-chogha-zanbil`, `world-enkomi`, `world-anyang`,
`ugarit-harbour` and `ugarit-palace-gate`. The set now reads as decorated: painted
reliefs and gilded obelisk tips in Egypt, frescoed plaster at Mycenae, red and mauve
doorframes on Cyprus, glazed and painted bands in Elam, lacquered posts at Anyang, painted
doors and awnings at Ugarit, with patched and smoke-darkened walls between fresh whitewash.

Kept with recorded defects, for the M18 brief rather than another generation:

- `world-karnak` — obelisks carry painted scenes over their whole shafts; obelisks were
  painted and their pyramidia gilded, but not with full narrative panels.
- `world-chogha-zanbil` — glazed brick covers more of the terraces than the evidence
  supports; keep the banding and the glazed knobs, reduce the cladding.
- `world-mycenae` — the lions read as three-dimensional gold sculptures rather than
  relief, and the fresco figures borrow modern dress and posture.
- `world-enkomi` — the house has mullioned windows and the ship a second mast; the wooden
  beam balance is now correct.
- `world-hattusa` — the gate and flat-roofed citadel are right in form, but the doors and
  windows have modern joinery.
- `world-anyang` — the roof eaves curve upward, a later Chinese form; keep them straight.
- `ugarit-harbour` — the ship's second mast and rigging; the quay, paint and awnings are
  the point of the take.
- `ugarit-palace-gate` — painted relief figures stand proud like statues; orthostats are
  low slabs.
- `land-levant` — a wall lamp and painted shutters read modern; remove both.

## Rejected and superseded

Earlier generations were discarded after review for modern clothing (caps, T-shirts,
shorts), modern objects (glass, metal kettles, steel anvils), tiled roofs and chimneys, and
visible lettering. They were not kept: they added nothing the reviewed set does not show.

A second review pass in the running app (2026-11-26) replaced eight place images and two
portraits that read as modern at display size: the market, palace gate, temple, workshops,
Cyprus arrival, landing, smithy, inn, and the Amnit and Kinyras portraits.
Rejected along the way: a copper-yard variant with a brimmed straw hat and gold-bar-like
ingots, a landing variant whose boy wore a T-shirt, and two workshop variants with modern tank tops and a child in a T-shirt. The kept workshop image has one tiled roof edge.

A third review pass (2026-11-26) replaced the Ugarit harbor image: the earlier kept
take had clear pitched ceramic roof tiles, and a replacement attempt introduced a
lateen-style sail. The final image has a square sail on a horizontal yard, flat
mud-brick roofs and reed awnings. The superseded harbor takes were discarded.

## Notes for the M18 brief

- The generator's default is classical or medieval Mediterranean. A prompt that says
  "temple", "portico", "palace" or "gate" returns pediments, columns, arches, tiles and
  lettering; several takes also came back with a painted sign, a clipboard, a brass
  balance and modern shorts or T-shirts on the children. Start every prompt with the
  exclusions, name flat roofs and square lintels explicitly, prefer backs, distance or
  objects over a crowd, and review every take at full size.
- Ingot shape: the model consistently produces flat discs or leathery sheets; the oxhide
  form needs a reference-led brief, not a prompt.
- Textile construction: "wrapped, uncut cloth" mostly holds, but necklines drift toward
  sewn plackets and buttons. Keep the negative phrasing in every prompt.
- Light: the Cypriot set reads hotter and whiter than the Levantine set, which is the
  intended regional difference, not a style drift.
- Regional dress and objects: the generator drifts toward a generic classical or medieval
  Mediterranean unless each prompt names the region's clothing, hair, ornaments, pottery
  and furniture. The existing set has not yet had a dedicated dress-and-object audit against
  `docs/ASSETS.md` §2.11; do that before M18 promotion, region by region, and regenerate
  any figure whose clothes or any vessel/furniture whose form belongs to another culture.

## Image audit — 2026-11-27

All **62** files in `public/art/` and `assets/exploratory/` were reviewed in labelled
contact sheets, with a full-size check for every candidate, and checked against
`docs/ASSETS.md` §2.1–2.12. The checks that mattered most were the single rendering
language, horizon A, regional ecology and architecture, painted plaster, night light,
cargo-plate composition, and the §2.11 dress-and-object rules. This section supersedes the
older per-file caveats above where they disagree. No image is promoted; all are still
exploratory. The catalog now stores the ADR-0010 horizon on every record (`horizon: 'A'`
for all 62); `art.test.ts` rejects a missing or invalid horizon and keeps the slice A-only.

### Replaced, regenerated or cropped

| File | Defect found | Action |
| --- | --- | --- |
| `world-anyang.jpg` | Curved eaves, bracket sets, lattice windows and later Chinese hall forms | Regenerated: straight thatched hall, plain red-brown posts, rammed-earth platform, bronze ding vessels, bronze workers. No chariot or oracle-bone diviner remains in frame; the gable bargeboard is still slightly ornamental (M18) |
| `world-abu-simbel.jpg` | Only three colossi clear; the winged disk carried a face | Regenerated: four seated colossi, plain disk with cobras and wings, no face |
| `ugarit-palace-gate.jpg` | Relief figures read as freestanding statues; crenellated tower tops | Regenerated: flat-topped square towers and low orthostat slabs. The reliefs still read high and gold-toned, and several guard robes are tailored (M18) |
| `world-mycenae.jpg` | Modern dress, handbag, horned helmet and modern-posture fresco figures | Cropped to the gate alone and removed the foreground figures. The gate masonry and lion relief remain simplified (M18) |
| `world-enkomi.jpg` | Stovepipe, mullioned windows and an over-tall multi-mast ship | Regenerated as a town scene: plain unglazed openings, no chimney and no ship; two long-robed brokers were cropped out |
| `land-levant.jpg` | Light battlements, wall lamps, painted shutters, a lateen rig and an agave | Regenerated: square flat-topped gate, flat roofs, no lamps/shutters/ship; agave cropped. The canal landing replaces the mole (M18) |
| `ugarit-harbour.jpg` | Second mast, wall lamp and ingots that read as benches | Regenerated as a quay scene: no ship, no second mast, no bench-like ingots, no wall lamp |
| `ugarit-night.jpg` | Wall sconces, excess rigging and log-like ingots | Regenerated as a night quay without the ship; clay lamps and moonlight. One wall lantern/torch and the geometric floor remain (M18) |
| `cyprus-night.jpg` | White chimney/stovepipe and oversized frogs | Regenerated: plaster chimney and stovepipe gone, frogs gone, cloth head-wrap on the watchman; the clay kiln vent remains |
| `ugarit-workshops.jpg` | Tiled roof, metal screws, smoking and sewn sleeveless shirts | Regenerated: warp-weighted loom with clay weights, wrapped workers, plain reed/mud roof, no metal hardware or smoking |
| `cyprus-ada.jpg` | Steel-grey bowl and a modern scoop-neck top | Regenerated: warm bronze bowl, wrapped shawl over bare arms and a hide apron. Soot is heavier than before (M18) |
| `good-wine.jpg` | Flowerpot cup, wooden stand and a large glossy pitcher | New plate: one small Base Ring II juglet with a white-painted lattice band. The slip still reads brighter than typical Cypriot ware (M18) |
| `good-sibtu-cloth.jpg` | Spindle whorl read as a turned wooden knob | New plate: pierced matte clay whorl beside the folded cloth |
| `cyprus-arrival.jpg` | Agave at the frame edge | Cropped the agave. The flat copper cakes and lateen sail remain (M18) |
| `ugarit-cloth-settled.jpg` | Modern framed wall panel | Cropped the panel at the left edge. The sewn tunic and some loom hardware remain (M18) |

### Open for the M18 brief

These are real, recorded defects; they were not hidden by the replacements above.

- **Architecture and landscape:** `world-karnak` paints narrative scenes over whole
  obelisk shafts; `world-chogha-zanbil` over-glazes the terraces; `world-giza` field plots
  read modern; `world-hattusa` door/window joinery and castle-like citadel; `world-dur-kurigalzu`
  joinery; `world-mohenjo-daro` walls too intact for a ruin.
- **People and dress:** `ugarit-palace-gate` guards wear tailored short-sleeve robes;
  `world-anyang` standing figures read later Chinese court dress; `cyprus-yard` keeps the
  existing flat discs and glazed opening because the replacement with correct oxhide ingots
  put the brokers in tailored robes; `cyprus-arrival` distant figures and flat cakes;
  `ugarit-cloth-settled` and `ugarit-cloth-after` retain sewn tunics/loom hardware, and the
  chest in `-after` still carries dark corner plates (a local wood patch was rejected as a
  visible panel); `cyprus-ada` soot is heavy; `ugarit-night` keeps one wall lantern/torch.
- **Objects and wares:** `cyprus-smithy` stemmed cup (period-possible, keep out of M18
  brief); `good-wine` slip brightness; `good-textile` banding bolder than the evidence;
  `good-palace-seal` tablet marks decorative, not readable text; `prologue-bronze` tablet
  reads a little like a whetstone; `prologue-arrival` sail foot still suggests a
  fore-and-aft rig; `land-cyprus` bowls are less diagnostic than the three named wares;
  `ugarit-market` patterned textiles decorative rather than attested; `ugarit-temple`
  drummer reads male, which the canon allows but should be checked if pinned to Belet.
- **Gate detail:** `world-mycenae` is a recognizable Lion Gate but uses regular ashlar and
  a high rectangular relief rather than Cyclopean masonry and a shallow triangular
  relieving slab. The modern-dressed figures are gone.

### Method note

The generator still defaults to classical/medieval ships, glazed windows, stovepipes and
tailored clothing. A request to redraw a whole harbour or gate can fix one defect while
introducing a worse one; the replacement set therefore uses only takes whose remaining
errors are documented, and crops or removes figures where a local repaint left visible
patches. The next M18 pass should use reference-led object and garment briefs, not another
unconstrained scene prompt.
