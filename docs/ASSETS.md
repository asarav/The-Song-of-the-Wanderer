# Assets and visuals

**Status:** exploratory pipeline available; production art pipeline is M18

This document defines how visual assets are referenced, generated, reviewed, and
promoted. It complements `TOOLING.md` §10 and `DATA_MODEL.md`.

## 1. Current state

- The UI is greybox. No final art is committed.
- Content references `art.*` and `audio.*` IDs, never file paths.
- The asset manifest maps IDs to files and fallback descriptors.
- Missing assets render a labelled placeholder in dev and a neutral fallback in
  production.
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
> light, period materials, grounded human proportions, no text, no modern elements, no
> anachronisms.

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

## 3. On-demand exploratory generation

Exploratory images can be generated on demand during design work. They are **not canon**
until they pass historical review and are wired through the manifest.

### Workflow

1. **Identify the need.** Name the asset, its purpose, and where it might be used:
   `art.ugarit.harbour`, `art.route.ugarit-cyprus`, `art.char.ugarit.amnit`.
2. **Read the dossier.** Use `docs/design/dossiers/<destination>.md` and the relevant
   culture profile before writing the prompt.
3. **Write a constrained prompt.** Include period, region, materials, lighting, and
   explicit negatives. Do not ask for text in the image.
4. **Generate into `assets/exploratory/`.** Use a slug that matches the likely asset ID:
   `assets/exploratory/ugarit-harbour.png`.
5. **Record the result.** Add a line to `assets/exploratory/README.md` with the file,
   prompt, date, and review status.
6. **Review.** Check for anachronisms, caricature, modern styling, false certainty, and
   culturally reductive imagery.
7. **Promote only if approved.** Assign the final `art.*` ID, add it to the manifest,
   reference it from content, and run `pnpm assets:check`.

### Prompt rules

- Start every prompt with the approved style anchors in §2.2.
- State the period and place: "Late Bronze Age, c. 1230 BCE, Levantine coast."
- Use materials and forms attested or plausible for that place: stone, mud brick, linen,
  wool, copper, bronze, clay, wood.
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
- UI placeholders during greybox development
- style, material, and proportion references for artists
- map or diagram references for internal review

### 6.2 Sources to check first

- The Metropolitan Museum of Art Open Access collection
- Walters Art Museum open-access images
- LACMA public-domain images
- Wikimedia Commons, with attention to each file's stated license
- museum APIs and catalogues that explicitly permit reuse

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

There is no audio generation tool in the repository. Audio is sourced, commissioned,
referenced, or created externally. On-demand generation is not currently available; if it
is added later, it must follow the same manifest, license, and unified-direction rules.

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

Exploratory generation is a bridge to that pipeline, not a replacement for it.
