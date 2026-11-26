---
name: SotW Design Decisions and World Truth
description: Maintain The Song of the Wanderer's distilled design truth — protagonist rules, acts, regions, timelines, dossiers, and ADRs. Use when changing design docs, mystery rules, region scope, or a decision a future agent could reverse.
---

# Design decisions and world truth

Read `docs/design/02-protagonist.md`, `docs/design/03-acts.md`, and `docs/design/01-regions.md`
before changing the world. This skill is the working procedure.

## Core rules

- The spec is the constitution. If code, docs, and spec disagree, the spec wins.
- Distilled design docs are the agent-readable truth. Do not make agents read the full
  spec for a routine task.
- Names, dates, place details, and character facts belong in `docs/design/` before they
  appear in content.
- Never invent canon silently.
- Never confirm or deny the protagonist's divinity.
- A decision that a future agent could reasonably reverse gets an ADR.

## What belongs where

| Kind of truth | Home |
|---|---|
| Protagonist, mystery, voice, longevity | `docs/design/02-protagonist.md` |
| Act structure, pacing, endings | `docs/design/03-acts.md` |
| Region scope, corridors, rollout order | `docs/design/01-regions.md` |
| Shared historical anchors | `docs/design/00-timeline.md` |
| Destination research | `docs/design/dossiers/<destination>.md` |
| Character research | `docs/design/characters/<character>.md` |
| Reversible structural decisions | `docs/DECISIONS/ADR-*.md` |
| Current plan and task order | `docs/PLAN.md`, `docs/milestones/` |

## ADR rules

Write an ADR when a change would:

- alter the protagonist's mystery rules
- add a gameplay pillar
- change the save format
- invalidate a region's authored chronology
- reverse or constrain a previous architectural choice
- create a rule future agents might reasonably question

An ADR states context, decision, consequences, alternatives, and revisit conditions.

## Dossier rules

- No destination content before its dossier exists.
- Ten sections, evidence-tagged.
- Separate attested, borrowed, reconstructed, invented, and unresolved claims.
- Record sources and confidence categories.
- A thin dossier is better than confident invention.

## Protagonist rules

- Never confirm divinity.
- Never deny it either.
- Recognition must have a mechanism.
- The player chooses their interpretation.
- Longevity is a burden as much as a gift.
- Every supernatural event retains a mundane reading.

## Region rules

- Each region milestone delivers its full chronology, not a snapshot.
- Regional timelines differ. Do not synchronise events for drama.
- No single cause for multi-causal processes.
- Culture is plural and historical, not a modern national identity.
- Punt's location stays unresolved.

## Common mistakes

| Symptom | Fix |
|---|---|
| Agent reads the whole spec | Point them to the distilled design doc |
| Canon appears in content first | Move it to `docs/design/` and cite it |
| A reversible choice is buried in a commit | Write an ADR |
| Dossier is skipped | Stop and write it before content |
| Mystery is resolved | Remove the confirmation and leave ambiguity |
| Region feels interchangeable | Add culture, language, and sensory specifics |

## Checklist

- [ ] Design truth updated before content.
- [ ] ADR written for reversible decisions.
- [ ] Dossier exists for destination content.
- [ ] Protagonist rules respected.
- [ ] `docs/STATUS.md` and `docs/WORKLOG.md` updated.
- [ ] `pnpm check` passes.
