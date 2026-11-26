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

## 6. Production pipeline (M18)

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
