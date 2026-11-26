---
name: SotW Assets and Audio
description: Manage visual and audio assets for The Song of the Wanderer — asset IDs, manifest, exploratory generation, public-domain references, licensing, unified art/audio direction, placeholders, and promotion. Use when adding, reviewing, sourcing, or wiring any image or sound.
---

# Assets and audio

Read `docs/ASSETS.md` first. This skill is the working procedure.

## Core rule

Content references `art.*` and `audio.*` IDs. The manifest resolves IDs to files, sources,
licenses, and fallbacks. Never put a file path in content.

## Before adding an asset

1. Name the asset ID and its purpose.
2. Read the relevant dossier and culture profile.
3. Decide whether it is `draft`, `reference`, `placeholder`, or `shipped`.
4. Check the license before downloading or committing anything.
5. Confirm the unified visual or audio direction from `docs/ASSETS.md`.

## Visual direction

- One visual language across all regions, phases, portraits, maps, and events.
- Base style: historical illustration, warm local light, textured brushwork, period
  materials, grounded proportions, no text, no modern elements.
- Region and phase may change palette, architecture, clothing, and motifs. They must not
  change rendering style, realism level, or camera language.
- Reject style drift even if an individual image is strong.

## Audio direction

- One sonic identity: diegetic, period-appropriate music, ambience, and sound effects.
- Region and phase may change instrumentation, repertoire, language, and mood.
- No modern pop covers, trailer music, or anachronistic production unless an ADR
  approves a stylized treatment.
- Music and song belong to people and places.

## Generation workflow

1. Start prompts with the approved style anchors.
2. State period, place, materials, and explicit negatives.
3. Generate into `assets/exploratory/<slug>.<ext>`.
4. Record file, prompt, date, and review status.
5. Review for anachronism, caricature, false certainty, and culturally reductive imagery.
6. Promote only after approval: assign final ID, add to manifest, reference in content,
   run `pnpm assets:check`.

## Public domain and open access

- Good for research, dossiers, codex, placeholders, and style reference.
- Record source, object number, URL, license, and use.
- Public domain and CC0 can be used freely, but provenance is still required.
- CC-BY / CC-BY-SA requires attribution and may require compatible sharing.
- All rights reserved or unclear material is reference only.
- Artifact photos are evidence, not the game's illustration style.

## Audio caution

- Peter Pringle and similar performers are modern copyrighted performances.
- Ancient texts or fragments may be old, but modern performances, arrangements, and
  recordings are protected.
- Use them as reference, not shipped audio, unless licensed.
- Ancient musical fragments are incomplete and uncertain; do not present a modern
  reconstruction as certain.

## Promotion checklist

- [ ] Asset ID assigned.
- [ ] Manifest entry added.
- [ ] License and source recorded.
- [ ] Fallback descriptor present.
- [ ] Unified style or audio direction checked.
- [ ] Historical review recorded.
- [ ] `pnpm assets:check` passes.
- [ ] Scenario or playtest covers the asset where relevant.

## Common mistakes

| Symptom | Fix |
|---|---|
| Mixed rendering styles | Re-generate or commission to the approved anchors |
| Artifact photo used as scene art | Use as reference or codex material only |
| Missing license metadata | Record source and license before promotion |
| Audio mood feels modern | Replace with diegetic, period-appropriate sound |
| Missing asset crashes a screen | Add a fallback descriptor |
| Style changed by region | Keep rendering style unified; vary subject and palette only |
