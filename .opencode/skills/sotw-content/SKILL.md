---
name: SotW Content Authoring
description: Author or edit JSON content for The Song of the Wanderer — destinations, characters, events, dialogues, goods, routes, journal, and codex. Use whenever adding, renaming, or validating anything under src/content.
---

# Content authoring

Read `docs/CONTENT.md` first. It is the full ruleset; this skill is the working loop.

## Before writing

1. Confirm the destination or entity is in scope for the active milestone. If not, stop.
2. Confirm a dossier exists in `docs/design/dossiers/`. If not, create it from
   `docs/templates/destination-dossier.md` and get it reviewed before authoring scenes.
3. Copy the right template from `docs/templates/`.
4. Check the authoritative schema. From M1 onward it lives in
   `src/engine/state/schema.ts` and `src/engine/content/schema.ts`; until then use
   `references/schema-cheatsheet.md`.
5. Check `docs/design/02-protagonist.md` for tone and mystery limits.

## Writing rules

- **IDs:** `dest.ugarit`, `char.ugarit.amnit`, `evt.slice.recognition`,
  `dlg.ugarit.amnit.first-meeting`, `route.ugarit-cyprus`, `good.copper`,
  `journal.slice.first-crossing`, `codex.ugarit`. File name must match the final segment.
- **Provenance:** every historical entity gets `confidence` + `sources` + `notes`. Use
  `fictional` for invented people and scenes, even in real places.
- **No logic in content.** Conditions and effects only. If the DSL cannot express it,
  stop and propose a schema extension with tests.
- **No fake citations.** Invented dialogue is authored drama, never "the tablets say".
- **Language gates are optional.** Every conversation has a way through without the
  language.
- **Mystery:** never confirm divinity; always leave a mundane reading.
- **Names:** researched, culturally specific. Do not invent exotic-sounding names
  without a note and a source.
- **Prose:** concrete, sensory, limited to what the protagonist knows. No modern idiom,
  no faux-archaic thee/thou, no lecturing narrator.
- **Budget:** ~1,200 words of scene text per slice destination, 12 named characters max.

## Dialogue graphs

- `start` exists; every `next` resolves to a node or `null`.
- Every graph is reachable from an event or destination activity.
- Choices express temperament, not alignment.
- 1–4 sentences of speech, then a decision. Long lore goes into stories characters tell.
- Relationship and flag changes happen on choice resolution, not on node display.

## Loop

```
pnpm content:lint
pnpm test
pnpm check
```

Fix lint errors by correcting data, never by weakening the schema. If the schema is
genuinely wrong, change it with a test and note it in the milestone file.

## Common mistakes

| Symptom | Fix |
|---|---|
| ID/file mismatch | Rename file to the ID's last segment, or vice versa |
| Dangling `next` | Add the node or set `null` |
| Unreachable dialogue | Wire it from an event or destination activity |
| Missing provenance | Add confidence, sources, notes |
| Event never eligible | Check date range, location, conditions, priority |
| Language-only path | Add a gesture/interpreters/context fallback |
| Scene with no consequence | Add a flag, relationship change, or journal entry |
| Prose explaining the mystery | Cut it; let a character speculate instead |

## Output discipline

- One entity per file, JSON only, no comments or trailing commas.
- Keep text fields as plain strings with `{{named}}` placeholders for interpolation.
- Do not edit another author's prose for style in the same commit as a mechanical change.
