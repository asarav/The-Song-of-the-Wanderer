# Content authoring

Rules for anything under `src/content/`. Follow this and the linter stays quiet.

## 1. IDs

IDs are stable, lowercase, dot-namespaced, and never reused for a different entity.
Renaming an ID requires a save migration if it appears in existing saves.

| Type | Prefix | Example |
|---|---|---|
| Region | `region.` | `region.levant` |
| Destination | `dest.` | `dest.ugarit` |
| Route | `route.` | `route.ugarit-cyprus` |
| Good | `good.` | `good.copper` |
| Character | `char.` | `char.ugarit.amnit` |
| Event / encounter | `evt.` | `evt.slice.recognition` |
| Dialogue graph | `dlg.` | `dlg.ugarit.amnit.first-meeting` |
| Journal entry | `journal.` | `journal.slice.first-crossing` |
| Codex entry | `codex.` | `codex.ugarit` |
| Faction | `faction.` | `faction.ugarit.palace` |
| Language | `lang.` | `lang.akkadian` |
| Arc | `arc.` | `arc.slice.refugee-family` |
| Family | `family.` | `family.ugarit.amnit` |
| Phase | `phase.` | `phase.levant.height` |
| Rumor | `rumor.` | `rumor.levant.grain` |
| Language | `lang.` | `lang.akkadian` |
| Faction | `faction.` | `faction.ugarit.palace` |
| Culture | `culture.` | `culture.levant.coastal` |
| Flag | dotted path | `helped.refugees.ugarit` |

Character IDs include their home destination: `char.cyprus.kinyras`. A character who
moves keeps their original ID — the ID records origin, not current location.

The file name must match the final segment: `destinations/ugarit.json` → `dest.ugarit`.

## 2. Files and folders

From M5, content is organised in packs (`src/content/packs/<name>/`), each with a
manifest. The slice may start with a single pack. Shared data lives in `pack.core`.

```
src/content/packs/<pack>/
  manifest.json
  regions/*.json
  destinations/*.json
  sites/*.json
  routes/*.json
  waypoints/*.json
  groups/*.json
  goods/*.json
  currencies/*.json
  characters/*.json
  families/*.json
  arcs/*.json
  events/*.json
  storylets/*.json
  dialogues/*.json
  journal/*.json
  codex/*.json
  languages/*.json
  factions/*.json
  cultures/*.json
  religions/*.json
  works/*.json
  climates/*.json
  ecologies/*.json
  phases/*.json
  observances/*.json
  rumors/*.json
  objects/*.json
```

One entity per file. Arrays are tolerated for bootstrap data but avoid them for anything
referenced elsewhere. JSON only — no comments, no trailing commas. Prose lives in
`text` fields, not in sidecar files.

Every entity follows the four representations in `DATA_MODEL.md`: an authored definition,
optional saved state, a derived view, and a knowledge projection where the player can learn
it. A destination references shared climate, culture, language, religion, architecture,
economy, and currency profiles; it does not copy them. A route is a corridor with
waypoints, not a bare edge.

Pack manifests declare `id`, `contentVersion`, `requires`, and the entity lists. The pack
dependency graph is acyclic. Cross-pack references are validated at build time. Details:
`SCALING.md` §4.

## 3. Provenance block

Every entity that makes a historical claim carries:

```json
"provenance": {
  "confidence": "documented | strongly-supported | plausible | fictional | unresolved",
  "sources": ["Knapp & Manning 2016", "RS 20.238 (Ugaritic letter)"],
  "notes": "One sentence on what is attested and what is invented."
}
```

Definitions and review expectations: `HISTORY.md`. The linter rejects unknown
confidence values from M1 onward and warns when a `destinations`, `routes`, `goods`, or
`events` entity omits provenance entirely.

## 4. Text and tone

- Write in the protagonist's limited knowledge. The narrator does not lecture.
- No modern idiom, no anachronistic metaphor, no "okay", "fine", "unit", "economy".
- Avoid faux-archaic thees and thous. Plain, concrete, sensory prose.
- Name things specifically: a type of bread, a harbour smell, a tax, a kinship term.
- Distinguish what a character believes from what is true. Characters can be wrong.
- Do not explain the protagonist's nature. Ever. Ambiguity is a design requirement.

**Prose budget per destination (slice):** ~1,200 words of scene text, ~400 words of
codex, and no more than 12 named characters. Expansion regions follow the budget in
`milestones/M9-M19-production-waves.md`.

### Knowledge, not truth

If the player should learn something, author the path: who tells them, when, in what
words, and how it might be distorted. A fact existing in world state is not the same as
the protagonist knowing it. Journal, map, character index, and codex read knowledge only
(ADR-0004).

### World content

Phases, world/regional/local events, propagation, rumours, destination states, and route
states follow `WORLD_MODEL.md`; characters, itineraries, arcs, lineages, recognition, and
storylets follow `NARRATIVE_SYSTEMS.md`. Do not invent a second way to change the world
inside a destination file.

## 5. Events

An event is authored content selected by eligibility, not a script. Shape (spec §20.2):

```jsonc
{
  "id": "evt.slice.recognition",
  "kind": "world | regional | local | character | storylet",
  "title": "The woman who knows your face",
  "description": "A merchant recognises a name she should not know.",
  "dateRange": { "from": "1230-03", "to": "1230-12" },   // optional; omit for any time
  "scope": {
    "regions": ["region.levant"],
    "destinations": ["dest.ugarit"]
  },
  "conditions": { "all": [] },
  "priority": 100,
  "major": true,                    // bypasses random selection
  "scene": "dlg.slice.recognition",
  "cast": ["char.ugarit.amnit"],
  "effects": [],
  "journal": "journal.slice.recognition",
  "followUps": [{ "event": "evt.slice.recognition-aftermath", "inDays": 30 }],
  "art": "art.slice.recognition",
  "provenance": {
    "confidence": "fictional",
    "sources": [],
    "notes": "Invented scene in a real place."
  }
}
```

Rules:

- `major: true` events never depend on luck and must not be skippable by random rolls.
- Minor events are selected from eligible pools by priority then seeded weight.
- Every consequence is a DSL effect. No prose in `effects`.
- Every event that changes the world writes a journal entry or explicitly sets
  `"journal": null` with a reason in `provenance.notes`.
- Follow-ups must be schedulable: no absolute dates inside effects, use `inDays`.
- Religious or divine events record observances and claims, never metaphysical facts.
- The full envelope and propagation vocabulary are in `WORLD_MODEL.md` §3–4.

## 6. Dialogue graphs

```jsonc
{
  "id": "dlg.ugarit.amnit.first-meeting",
  "speaker": "char.ugarit.amnit",
  "start": "greet",
  "nodes": {
    "greet": {
      "text": "You have the look of someone who has slept on a boat.",
      "textByLanguage": { "lang.ugaritic": { "basic": "..." } },
      "choices": [
        {
          "text": "Only the last three nights.",
          "conditions": { "languageAtLeast": { "language": "lang.ugaritic", "tier": "basic" } },
          "next": "laughs",
          "effects": { "relationship": { "character": "char.ugarit.amnit", "delta": 1 } }
        },
        { "text": "(Say nothing.)", "next": "end" }
      ]
    }
  }
}
```

Rules:

- Every `next` resolves, or is `null` to end the conversation. No dangling nodes.
- Every graph is reachable from at least one event or destination activity.
- Choices express temperament, not alignment. Avoid `[Good]`, `[Evil]`, `[Neutral]`.
- A choice that requires language is optional; there is always a way to continue.
- Do not write dialogue that confirms the protagonist's divinity.
- Keep nodes short: 1–4 sentences of speech, then a decision. Long monologues belong in
  stories told by characters, not in UI boxes.

## 7. Historical figures and gods

- Historical figure: tag the entity `fictional` for invented dialogue, record the
  attested facts in `provenance.notes`, and never attribute secret motives to them.
- Deity: use the `Mythological figure` checklist in `HISTORY.md`. A deity's domains,
  epithets, and stories are culture-specific. Do not map equivalents across cultures.
- A divine encounter must have at least one mundane explanation available to the player.

## 8. Workflow

1. Create or update the dossier in `docs/design/dossiers/` (template provided).
2. Add entities to `src/content/`.
3. Run `pnpm content:lint` until clean.
4. Add or extend a scenario in `src/engine/scenarios/` that reaches the new content.
5. Run `pnpm check`.
6. Update the destination's section in `docs/design/01-regions.md` if scope changed.

## 9. Localisation readiness

- All player-visible strings come from content, never hard-coded in components.
- Use `{{name}}` placeholders rather than concatenation; keep them named, not positional.
- Do not bake plural rules into prose. Write around them or use explicit variants.
- Keep UI labels in `src/ui/strings.ts` (M2) so they can be extracted.
