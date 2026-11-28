# Assets and visuals

**Status:** exploratory pipeline available; production art pipeline is M18

This document defines how visual assets are referenced, generated, reviewed, and
promoted. It complements `TOOLING.md` §10 and `DATA_MODEL.md`.

## 1. Current state

- The UI shell is graybox. The slice now shows **exploratory illustrations**: eleven
  places, ten views of the wider world of 1230 BCE for the world gallery, two land views
  for that gallery, nine portraits, eleven scene beats (nine of Sibtu's cloth thread and
  two of the opening) and twelve prologue beats, generated on demand and reviewed for
  period detail. They are not final
  art and they are not in the M18 manifest.
- Content references `art.*` and `audio.*` IDs, never file paths. The slice's art IDs
  resolve through `src/ui/art.ts`; the files live in `public/art/` with copies of record
  and review notes in `assets/exploratory/`.
- Every `ArtAsset` carries its ADR-0010 horizon (`A`, `B` or `C`). All 67 current
  exploratory records are horizon A; `art.test.ts` rejects a missing or invalid horizon
  and keeps the slice A-only.
- Exploratory audio ships in `public/audio/`: ten ambience beds, two original modal cues
  and four one-shot effects. `src/ui/audio.ts` resolves `audio.*` IDs and chooses a bed by
  screen, place and night; `assets/audio/manifest.json` is the licensing ledger. All are
  CC0.
- The asset manifest maps IDs to files and fallback descriptors.
- A missing `art.*` entry is not an error: the screen shows no picture. `art.test.ts`
  keeps the catalog and the authored content in step.
- `pnpm assets:check` validates IDs and fallback coverage once the tool exists (M8).

## 2. Art direction: one unified visual language

All images, exploratory or final, must belong to one visual language. A mixed set of
realistic, cartoonish, 3D-rendered, or anime-styled images is not acceptable, even if
individual images are attractive.

### 2.1 Base style

The default style is a **historically grounded illustration**:

- warm, local Mediterranean / regional light
- textured brushwork or restrained digital painting
- period materials and forms
- readable at small sizes
- no text, no modern UI, no anachronistic tools
- no fantasy glow, cinematic lens effects, or game-art exaggeration

Region, phase, and culture may change palette, architecture, clothing, materials, and
motifs. They must not change the rendering style, camera language, or level of realism.

### 2.2 Style anchors

Every prompt should begin from the same anchors, then add only subject-specific detail:

> Late Bronze Age historical illustration, c. 1230 BCE, textured brushwork, warm local
> light, period materials, painted plaster and polychrome detail where the region and
> building type support them, grounded human proportions, no text, no modern elements,
> no anachronisms.

Do not substitute "photorealistic", "cartoon", "anime", "3D render", "concept art
splash", or "cinematic" unless an ADR changes the art direction.

### 2.3 Consistency checks

- Compare every new image against the approved exemplars before promotion.
- Reject images that change rendering style, even if they are individually strong.
- Phase variants change what is shown, not how it is drawn.
- Character portraits use the same style as location art.
- Maps and route art use the same material and light language as scenes.
- Art bibles in M18 must define the unified style before regional commissioning.

### 2.4 Escalation

Changing the base rendering style requires an ADR and an update to this document, the M18
milestone, and the asset manifest. Do not drift the style informally.

### 2.5 Regional art, and art that moves

A generic "ancient Mediterranean" look is a failure of research, not a style choice. Two
inventories are enough for the slice, and every legible object in an image should belong
to one of them.

**Ugarit and the Levantine coast (c. 1250–1230 BCE)**

- Mud brick on stone socles, flat roofs of mud and reed, reed awnings, outer stairs;
  monumental work in dressed ashlar — the palace gate with its two square towers, the
  two plain battered temple towers on the acropolis, no columns or pediments.
- Cypriot White Slip and Base Ring ware in the storerooms, Mycenaean IIIA2–IIIB imports,
  Canaanite jars, oxhide copper ingots, cedar beams, drilled stone anchors.
- Ivories worked locally with Egyptian motifs: a winged sun-disc, a long Egyptian wig,
  lotus and papyrus, a sphinx with Syrian features; the Baal stela with spear and conical
  crown. Cylinder seals carry Egyptianising imagery.

**Cyprus (c. 1250–1230 BCE)**

- Cyclopean walls of rough limestone blocks with square gate towers; ashlar public
  buildings; paved courts with upright betyls and paired stone horns of consecration.
- White Slip II hemispherical bowls with wishbone handles and a painted band of linked
  lozenges; Base Ring II thin-walled juglets with white-painted lattice bands; locally
  made Mycenaean-style pots; imported Canaanite jars; oxhide ingots; bronze stands.
- Cypriot ivory adapts Aegean motifs (a lion or griffin attacking a bull) alongside
  Levantine and Egyptian elements.

**The rule that makes it worldbuilding rather than decoration:** objects travel, and the
copy is never identical. A Cypriot bowl in Ugarit may be imported, imitated with a
different band, or used for something else; an Egyptian motif on a Ugaritic ivory recurs
on a Cypriot object with local figures. Where a scene can carry a legible object, name
its origin and its decoration. No single "ancient" style, and no later repertoire:
no Greek black- or red-figure, no Roman amphora forms, no Islamic geometry.

An authored opportunity, not yet built: a trade thread in which the player buys a Cypriot
vessel in one harbor and meets its relative in the other, or sees one ivory motif in two
hands. It needs no new mechanic — three authored objects, two scenes and the existing
knowledge model — but it is content work for a later pass, not art alone.

### 2.6 Three visual horizons

Cyprus and Ugarit are not static across the Late Bronze Age. Every image is dated to one
horizon (ADR-0010); the slice uses **A** only.

| Horizon | Cyprus | Ugarit and the coast | In the game |
|---|---|---|---|
| **A — c. 1250–1230** | Late Cypriot IIC: White Slip II, Base Ring II, Mycenaean IIIA2–IIIB imports, ashlar public buildings | Last palace phase; Egyptianising ivories, Baal stela, Cypriot and Mycenaean imports | The slice. All current images |
| **B — c. 1200** | Late Cypriot IIIA begins: locally made Mycenaean IIIC:1, new ashlar complexes, Aegean-style figurines, arriving settlers | Under pressure; destroyed c. 1185 | Phase variants only, new files |
| **C — c. 1175** | Towns rebuilt on new plans; Aegean-style wares established; iron appearing | Gone | Phase variants only, new files |

Do not put a B or C object in an A scene: no Mycenaean IIIC, no Philistine bichrome, no
iron. Do not repaint an A image to become B — the difference is the evidence. A later
horizon is a new file and a new `art.*` ID, referenced by content for that phase.

### 2.7 Ecology, season and colour

**One desert is the default failure of this subject.** The eastern Mediterranean and
Near East held reed marsh, oak and pine woodland, olive terraces, irrigated barley,
grassland and steppe, as well as true desert. Every region must show its own ecology,
and the set together must read as several worlds, not one sun-bleached one. The regional
brief is in `docs/design/05-the-world-in-1230.md`.

- **Egypt** is a green ribbon: fields, palms, orchards and canals in dark flood mud,
  with the ochre plateau above. The Delta is marshier still — papyrus, lagoons, birds.
  Giza sits at the edge of that green, not in an empty sand sea.
- **Cyprus** is wooded: pine and oak on the Troodos, olive and carob, red earth, intense
  blue water. It is not a bare rock.
- **The Levant** is a fertile coast under wooded hills: vineyards, orchards, grain, cedar
  on the mountains, steppe only inland.
- **Anatolia** is a mosaic of oak and pine woodland, grassland, streams and cultivated
  valleys; the plateau is open, not desert.
- **Mesopotamia** is irrigated green — canals, barley, date palms, marsh and reeds — with
  dry steppe beyond the water.
- **Elam** is a hot irrigated lowland under the oak-covered Zagros.
- **The Indus and Yellow River plains** are riverine and seasonal: green growth, wetland,
  scrub and dry ground together, not sand.

**Season.** Default to early summer: golden grain, green orchards, silvery olive, deep
water. Mediterranean winter is green and wet, spring is flowers and fresh grass, late
summer is dust and stubble. A dry August is not a desert; do not let one season's palette
decide the region's identity.

**Colour.** Emerald and olive green, wildflower red and violet, damp earth, deep blue and
green water, reeds, dark pine, warm limestone, ochre, dusty rose, slate and blue-grey
mountains. Reject an image whose palette is only brown, yellow and beige, even if the
monument is correct: the rendering style must hold, the ecology must not flatten.

### 2.8 Paint, plaster and colour

**Do not paint the Bronze Age as bare beige stone.** Finished buildings were plastered and
often painted; pigment, glazed surfaces, carved and painted relief, timber fittings and
dyed textiles were part of how a building looked. An image of a palace or temple with
nothing but exposed masonry is as wrong as a classical portico. The regional identity and
the evidence behind it are in `docs/design/05-the-world-in-1230.md` §4.

| Region | Architectural colour identity |
| --- | --- |
| Egypt | White limestone with painted reliefs and hieroglyphs; vivid blue, green, red, yellow, black and gold; painted columns and dark blue star ceilings |
| Ugarit and the Levant | Pale lime plaster over mud brick, warm stone, timber; painted interiors and doorways, patterned bands, dyed awnings and hangings |
| Cyprus | Warm stone and plastered mud brick, red and mauve painted accents, dressed stone lower walls under painted upper walls; ordinary houses simpler |
| Mycenaean Greece | White plaster with strong flat reds, blues, yellows and black; figurative frescoes in palaces, painted floors and ceilings |
| Hittite Anatolia | Earthy stone, timber and plaster with restrained painted bands and details; polychrome fragments are known, extensive murals are not |
| Mesopotamia | Mud brick plastered and painted, coloured architectural elements and carved detail; **no later Ishtar Gate glazed-brick aesthetic** in 1230 BCE |
| Elam | Brick and plaster with glazed and painted detail where evidenced, as on the ziggurat terraces |

**Pigments.** Red and yellow ochre, iron oxide, orpiment; Egyptian blue (manufactured) and
azurite; malachite and copper greens; charcoal and soot black; lime, gypsum and chalk
white. Purple is a rare Aegean accent, not a building colour.

**Wealth and wear.** A palace, temple or elite house may carry figurative scenes, painted
columns, decorated borders and fine furnishings; an ordinary house has plastered walls,
perhaps a painted band or doorframe, wooden doors, mats, textiles and storage jars — not
bare mud brick, and not a mural on every wall. Nothing is freshly painted everywhere:
whitewash, soot, fading, peeling plaster, repairs and sun-bleached pigment should vary
from wall to wall. Partial schemes are period-real: plain plaster below, a painted band,
a scene or pattern above. Include painted timber doors, carved panels, metal fittings,
patterned floors, decorative columns, roof beams and reed mats, curtains and rugs, and
painted chests and stools where the setting allows.

### 2.9 Night views

A night picture is the **same place**, not a different town: keep the roofline, paint,
materials and regional palette, then change the light. Show open flames in clay oil lamps
or a hearth, not glass lanterns, wall sconces or street lighting; moonlight is cool and
low-contrast, flame light warm and pooled, and the eye should still read the architecture
outside the pools. The sea and sky stay dark. A place that is busy by day may be empty or
held by a watchman at night; do not repopulate it with a night market the day view does
not support. Night art is a variant of the place's day art and inherits its history,
weathering and regional colour identity from §2.7–2.8.

### 2.10 Cargo plates

Every good carries an `art` thumbnail. The plates are square, single-object, lit from one
side on a dark warm ground, and share a camera height so a market or cargo list reads as a
set rather than twelve unrelated pictures. Show the material as handled: a tied sheaf, a
stopped jar, a patinated ingot, a folded cloth with its own weave and wear. No hands, no
scales of convenience, no coins with faces, no modern tools or glass. The thumbnail must
still be legible at 44 px, so favor one clear silhouette over a group of small objects.

### 2.11 People, dress and household goods by region

**Region comes before prompt.** A person, garment, pot or stool is not "ancient
Mediterranean" in general; it belongs to a place, a date and a social position. Before
writing a prompt, name the region, the occupation and the setting, and take dress, hair,
ornament, pottery and furniture from that region's dossier. Where the evidence is thin,
choose the plainest attested form and record the uncertainty; never fill the gap with
classical, medieval or modern Mediterranean defaults.

**People.** Check four things on every figure:

- **Garment construction** — wrapped, pinned or simply draped cloth before tailored
  clothing. Late Bronze Age clothes are cut from rectangular cloth, often uncut and
  fringed; sleeves, collars, buttons and sewn plackets are exceptions that need evidence.
- **Hair and head** — regional hair, beard and head-wrap conventions. Do not give every
  man the same short beard or every woman the same loose hair; age, occupation and status
  change both.
- **Ornaments** — faience and stone beads, earrings, armlets, finger rings, bronze pins and
  cylinder seals on cords. No Iron Age fibulae, no coin jewellery, no later filigree.
- **Work and class** — a porter, scribe, smith, priest and broker do not dress alike. Bare
  torsos, aprons, soot and worn cloth belong to work; palace and temple figures may carry
  finer cloth, colour and ornament, but not modern tailoring.

**Objects.** Pottery and furniture carry region as strongly as clothing:

- **Pottery** — use the local ware families and surface treatment. Levantine and Cypriot
  pottery is hand-built or slow-wheeled, slipped and burnished, often painted in simple
  bands; it is not Greek black- or red-figure, not blue-and-white china, and not a generic
  terracotta flowerpot. Imported wares may appear, but only when the scene says so.
- **Furniture** — low stools, benches, reed mats, wooden chests, beds and simple tables.
  No high-backed chairs, upholstered seats, Renaissance sideboards or colonial furniture.
- **Containers and tools** — clay, stone, wood, bone and bronze. No glass bottles, steel
  tools, plastic, machine-spun cloth or modern cooperage.

**Slice guardrails.**

| Region | Dress and person | Pottery and furniture | Avoid |
| --- | --- | --- | --- |
| Ugarit / Levantine coast | Wrapped linen and wool, simple kilts and sheath garments, fringed shawls; bare torsos for heavy work; cloth head-wraps; dark hair, regional beards | Levantine jars, bowls and juglets with red slip or simple painted bands; low stools, benches, mats, chests | Roman toga, Greek chiton, medieval tunic, tailored waistcoats, horned helmets |
| Cyprus | Wrapped wool and linen with patterned borders; hide aprons and soot for smiths; head-wraps; mixed beards and clean-shaven faces | Base-ring and White Slip wares, Red Polished and plain wares; low stools, mats, benches; Mycenaean imports only when named | Classical Greek dress, Venetian/medieval island costume, blue-and-white china |
| Egypt | Linen kilts and sheath dresses, broad collars, kohl, shaved heads or wigs | Egyptian silt wares; low chairs and stools, chests, mats | Greek chiton, Roman toga, modern Egyptian tourist dress |
| Hatti / Anatolia | Long wrapped robes and cloaks, curved shoes; conical headwear for royal or divine figures | Hittite monochrome wares; low furniture, chests | Classical columns, Greek dress, later Ottoman clothing |
| Mycenae / Aegean | Wrapped and patterned wool and linen, flounced skirts, kilts; boar's-tusk armour only in martial scenes | Mycenaean stirrup jars and kylikes; low furniture | Classical togas, hoplite armour, black-figure pottery |
| Mesopotamia | Fringed wrapped wool, long robes, conical caps, elaborate elite beards | Plain and painted wares; low furniture, chests | Later Persian/Islamic dress, glazed tiles on pottery |
| Elam / Iranian plateau | Wrapped woollens, regional headwear and beards | Plain wares; glazed brick is architecture, not tableware | Achaemenid or later Persian dress |
| Shang / Yellow River | Silk and hemp robes, different silhouette and hair binding | Bronze vessels and local wares; low furniture | Mediterranean dress, later Chinese imperial costume |
| Indus | Cotton and wrapped cloth, beads and bangles | Local painted wares; low furniture, drains and brick | Vedic or later Indian dress, temple architecture |

These are guardrails, not costumes to copy blindly: a harbor laborer and a palace official
in the same city should not share a wardrobe, and a place's art should show that difference.

### 2.12 A plate for every beat

A **beat** is one blank-line-separated paragraph of paced prose, wherever it is read: a
dialogue node, a place introduction, a night passage, a journal entry or a codex entry. The
prologue's beats are its own array. Every beat must name its own plate, in order, through
the passage's `beatArt` array; a scene may still carry a node `art` as the finished-passage
image, but it is not a substitute for the beats.

- `beatArt` is all-or-nothing: its length equals the beat count of the passage (and of any
  language variant), and one passage may not repeat an ID.
- A new beat with no plate fails `src/ui/beatArt.test.ts`. The legacy ledger
  `src/ui/beatArtBacklog.ts` names beats that predate the rule; it may shrink only, never
  grow, and an illustrated beat must leave it. There are 243 legacy beats at the time of
  writing; the opening's ten and both starting places' four each are illustrated.
- A plate must show the beat, not the passage in general: the object being weighed, the
  jar being set down, the tablet being wetted. If two consecutive beats would need the
  same composition, that is a reason to vary the framing, not to reuse the file.
- The style, region, dress, object and horizon rules above apply to every beat plate.

## 3. On-demand exploratory generation

Exploratory images can be generated on demand during design work. They are **not canon**
until they pass historical review and are wired through the manifest.

### Workflow

1. **Identify the need.** Name the asset, its purpose, and where it might be used:
   `art.ugarit.harbour`, `art.route.ugarit-cyprus`, `art.char.ugarit.amnit`.
2. **Read the dossier.** Use `docs/design/dossiers/<destination>.md` and the relevant
   culture profile before writing the prompt.
3. **Write a constrained prompt.** Include period, region, materials, lighting, surface
   finish and colour (plain plaster, painted band, mural, glazed detail — and its wear),
   and explicit negatives. For any figure, also name the garment construction, hair and
   headwear, ornaments, occupation and social position. For any object, name the local
   pottery ware or furniture type. Use §2.11 and the regional dossier; do not ask for text
   in the image.
4. **Generate into `assets/exploratory/`.** Use a slug that matches the likely asset ID:
   `assets/exploratory/ugarit-harbour.png`.
5. **Record the result.** Add a line to `assets/exploratory/README.md` with the file,
   prompt, date, and review status.
6. **Review.** Check for anachronisms, caricature, modern styling, false certainty, and
   culturally reductive imagery. Specifically audit dress, hair, ornament, pottery and
   furniture against §2.11: a figure dressed for the wrong region is a rejection, not a
   detail to note.
7. **Promote only if approved.** Assign the final `art.*` ID, add it to the manifest,
   reference it from content, and run `pnpm assets:check`.

### Prompt rules

- Start every prompt with the approved style anchors in §2.2.
- State the period and place: "Late Bronze Age, c. 1230 BCE, Levantine coast."
- Use materials and forms attested or plausible for that place: stone, mud brick, linen,
  wool, copper, bronze, clay, wood.
- Dress the people for their region, not for a generic ancient world. State the garment
  construction, hair and beard, headwear and ornaments in the prompt; keep work clothing
  and formal clothing distinct.
- Use the region's pottery families and furniture forms. Do not substitute classical
  Greek, Roman, medieval or modern pieces because they are easier to draw.
- Describe people as individuals, not types. Avoid exoticising or caricature.
- Prefer warm, local light and concrete sensory detail.
- Explicitly exclude: text, modern clothing, modern architecture, anachronistic tools,
  fantasy elements, and "cinematic" effects that imply a film set.
- Preserve deliberate uncertainty. Do not generate a definitive image for an unresolved
  question such as Punt's location or the protagonist's nature.
- Religious imagery should show practice and material culture, not a metaphysical claim.
- Do not change the rendering style by region, phase, or subject.

### Naming

```
assets/exploratory/<subject-slug>.<ext>
```

Examples:

- `ugarit-harbour.png`
- `cyprus-copper-settlement.png`
- `mediterranean-route.png`
- `ugarit-merchant-portrait.png`

### Review status

Each exploratory file is one of:

- `draft` — generated, not reviewed
- `reviewed` — checked for anachronism and tone
- `promoted` — wired into the manifest and content
- `rejected` — kept for reference, not used

## 4. What this is not

- It is not a committed build dependency. No build or test depends on an exploratory
  image.
- It is not a substitute for the M18 art pipeline, commissioning briefs, or historical
  review.
- It does not generate final game art automatically. The agent generates on demand; the
  project still owns review, manifest wiring, and fallback coverage.

## 5. Public domain and open-access references

Public-domain and open-access museum images are valuable for development agility, but they
are not automatically shippable game art.

### 6.1 Good uses

- research and dossier support
- codex or object illustrations where a photograph is appropriate
- UI placeholders during graybox development
- style, material, and proportion references for artists
- map or diagram references for internal review

### 6.2 Sources to check first

- The Metropolitan Museum of Art Open Access collection
- Walters Art Museum open-access images
- LACMA public-domain images
- Wikimedia Commons, with attention to each file's stated license
- museum APIs and catalogs that explicitly permit reuse

### 6.3 License rules

- **Public domain:** no permission or fee is required, but record the source, object
  number, and URL in the asset manifest or dossier.
- **CC0:** treat like public domain, but still record provenance.
- **CC-BY / CC-BY-SA:** attribution is required. CC-BY-SA also requires compatible
  sharing of adaptations. Do not use these in shipped game art without a license review.
- **All rights reserved or unclear:** reference only. Do not commit or ship.

### 6.4 Do not confuse reference with style

A photograph of an ancient bronze figure is useful evidence. It is not the game's
illustration style. Public-domain artifact images should not be dropped into scenes as if
they were unified game art unless an ADR explicitly approves that treatment.

### 6.5 Manifest fields for references

Reference assets should carry:

```jsonc
{
  "id": "ref.met.32.18.1",
  "kind": "reference",
  "source": "The Metropolitan Museum of Art",
  "url": "https://www.metmuseum.org/...",
  "license": "public-domain",
  "objectNumber": "32.18.1",
  "period": "Late Bronze Age",
  "culture": "Canaanite",
  "use": "dossier-reference | placeholder | codex | style-reference",
  "reviewStatus": "draft | reviewed | approved-reference"
}
```

### 6.6 Agility rule

Use public-domain references to move faster in design and review. Do not let them bypass
the unified art direction, provenance, or license checks.

## 6. Audio assets and references

Audio is handled like visual assets: content references `audio.*` IDs, and the manifest
resolves them to files, sources, and fallbacks.

### 6.1 Unified audio direction

All shipped audio should belong to one sonic identity:

- diegetic music, ambience, and sound effects rooted in the period and place
- period-appropriate instruments, performance contexts, and vocal styles
- no modern pop covers, trailer music, or anachronistic production unless an ADR
  explicitly approves a stylized treatment
- region and phase may change instrumentation, repertoire, language, and mood, but not
  the underlying audio language

### 6.2 Public domain and open-access audio

Public-domain and open-access recordings can help with development agility, but they are
not automatically shippable game audio.

Useful sources to check:

- museum and archive audio collections
- ethnomusicology archives
- Wikimedia Commons audio
- Internet Archive and library collections
- early sound recordings whose copyright has expired in the relevant jurisdiction
- [BigSoundBank](https://bigsoundbank.com/) CC0 field recordings (used by the current
  ambience beds)

### 6.3 Important caution: Peter Pringle and similar performers

Peter Pringle's performances of ancient texts and reconstructions are modern copyrighted
works. They are excellent references and inspiration, but they should be treated as
**reference-only** unless a license or permission is obtained.

The same distinction applies to other modern performers, ensembles, and reconstructions:

- the ancient text, melody, or source may be old or public domain
- the modern performance, arrangement, recording, and interpretation are usually
  protected by copyright and related rights

For development, these recordings can inform pronunciation, phrasing, instrumentation,
and mood. They cannot be dropped into the game as shipped audio without rights review.

### 6.4 Ancient music sources

Ancient musical fragments and notation are valuable source material, but they are not
complete songs:

- Hurrian Hymn No. 6 from Ugarit is an ancient source with modern interpretations.
- Cuneiform musical fragments require scholarly reconstruction and remain uncertain.
- Instrument replicas and performance practice are modern scholarly choices.

Use these as authored inspiration and, where appropriate, as codex or research material.
Do not present a modern reconstruction as the certain sound of the past.

### 6.5 License rules

- **Public domain:** no permission or fee is required, but record source, performer,
  recording date, and URL.
- **CC0:** treat like public domain, but still record provenance.
- **Original synthesis:** music or effects generated for this project do not carry a
  third-party performance right. Record the generator, date and any source material, and
  dedicate the result to CC0 in the manifest.
- **CC-BY / CC-BY-SA:** attribution is required. CC-BY-SA also requires compatible
  sharing of adaptations. Do not use these in shipped game audio without license review.
- **All rights reserved or unclear:** reference only. Do not commit or ship.

### 6.6 Audio manifest fields

Reference or shipped audio should carry:

```jsonc
{
  "id": "audio.ugarit.hurrian-hymn-reference",
  "kind": "reference | ambience | music | voice | sfx",
  "source": "Performer, archive, or collection",
  "url": "https://...",
  "license": "public-domain | cc0 | cc-by | cc-by-sa | all-rights-reserved | unknown",
  "performer": "Name or ensemble",
  "recordingDate": "YYYY or range",
  "use": "reference | placeholder | codex | shipped",
  "reviewStatus": "draft | reviewed | approved-reference | licensed"
}
```

### 6.7 Current limitation

The slice now has exploratory audio, but not a final soundtrack. `pnpm audio:build`
synthesises the original cues and effects and mixes the CC0 field beds; it needs ffmpeg
and network access. The built MP3s and manifest are committed, so play does not. Final
recordings, regional profiles, and commissioned performances remain M18 work. Any new
generated or sourced audio must still follow the same manifest, license, and
unified-direction rules.

### 6.8 Ambient audio and environments

Ambient audio should make places feel inhabited without becoming a modern sound-design
showcase.

- **Location profiles:** each destination, route, waypoint, and camp can reference an
  ambient audio profile.
- **Layers:** base environment (wind, water, insects, birds, market murmur, harbor
  creaks), activity layer, event layer, and occasional diegetic music.
- **Conditions:** ambience changes with season, weather, phase, time of day, local delta
  (festival, quarantine, siege, destruction), and knowledge where appropriate.
- **Diegetic first:** music and song belong to people and places. Do not use a
  non-diegetic score as a default mood layer.
- **No modern clichés:** avoid cinematic drones, trailer impacts, fantasy choirs, and
  anachronistic instruments unless an ADR explicitly approves a stylized treatment.
- **Public-domain and open-access field recordings** may be useful, but they still need
  license review, source recording, and manifest entries.
- **Fallback:** silence or a neutral, minimal ambience is acceptable; missing audio must
  not block play.
- **Consistency:** all ambient audio should share the same recording quality, loudness,
  and spatial treatment so that locations feel like one game.
- **Slice mapping:** `gameAudioFor` keeps the title on open water and its theme, a journey
  on open water, a night scene after dark, and a place scene in its own room. The market
  and the roads have their own beds. There is no non-diegetic score over ordinary play.

### 6.9 Ambient manifest fields

```jsonc
{
  "id": "audio.ambient.ugarit.harbour",
  "kind": "ambience",
  "environment": "harbour | market | temple | road | camp | sea | river | desert",
  "layers": ["wind", "water", "harbour-creaks", "market-murmur"],
  "conditions": { "phase": "phase.levant.height", "delta": null },
  "source": "Archive or recording",
  "license": "public-domain | cc0 | cc-by | cc-by-sa | all-rights-reserved | unknown",
  "use": "reference | placeholder | shipped",
  "reviewStatus": "draft | reviewed | approved-reference | licensed"
}
```

## 7. Production pipeline (M18)

The eventual pipeline is defined in `milestones/M9-M19-production-waves.md`:

- art bible per region
- commissioning briefs
- location illustrations with phase variants
- character portraits with age, status, and travel variants
- map and route art
- event illustrations
- UI motifs from period materials
- asset IDs and placeholders
- review for caricature and historical plausibility
- audio direction, source/commission review, loudness and loop checks, and regional
  ambience profiles

Exploratory generation is a bridge to that pipeline, not a replacement for it. The
current audio is exploratory too: the field beds are modern recordings, and the original
music is atmosphere rather than a reconstruction of a surviving melody.
