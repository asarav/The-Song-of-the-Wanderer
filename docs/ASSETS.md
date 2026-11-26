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

## 2. On-demand exploratory generation

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

## 3. What this is not

- It is not a committed build dependency. No build or test depends on an exploratory
  image.
- It is not a substitute for the M18 art pipeline, commissioning briefs, or historical
  review.
- It does not generate final game art automatically. The agent generates on demand; the
  project still owns review, manifest wiring, and fallback coverage.

## 4. Production pipeline (M18)

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
