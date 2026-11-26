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
| Flag | dotted path | `helped.refugees.ugarit` |

Character IDs include their home destination: `char.cyprus.kinyras`. A character who
moves keeps their original ID — the ID records origin, not current location.

The file name must match the final segment: `destinations/ugarit.json` → `dest.ugarit`.

## 2. Files and folders

```
src/content/
  regions/*.json
  destinations/*.json
  routes/*.json
  goods/*.json
  characters/*.json
  events/*.json
  dialogues/*.json
  codex/*.json
```

One entity per file. Arrays are tolerated for bootstrap data but avoid them for anything
referenced elsewhere. JSON only — no comments, no trailing commas. Prose lives in
`text` fields, not in sidecar files.

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
codex, and no more than 12 named characters. Expansion regions may adjust the budget in
their milestone file, but never by accident.

## 5. Events

An event is authored content selected by eligibility, not a script. Required fields
(spec §20.2):

```jsonc
{
  "id": "evt.slice.recognition",
  "kind": "travel | destination | scheduled | dialogue-beat",
  "title": "The woman who knows your face",
  "dateRange": { "from": "1230-03", "to": "1230-12" },   // optional; omit for any time
  "regions": ["region.levant"],
  "locations": ["dest.ugarit"],
  "confidence": "fictional",
  "provenance": { "...": "..." },
  "major": true,                    // bypasses random selection
  "priority": 100,
  "weight": 0,                      // ignored when major
  "conditions": { "all": [] },
  "cast": ["char.ugarit.amnit"],
  "scene": "dlg.slice.recognition",
  "consequences": { "all": [] },
  "followUps": [{ "event": "evt.slice.recognition-aftermath", "inDays": 30 }],
  "journal": "journal.slice.recognition",
  "art": "art.slice.recognition"
}
```

Rules:

- `major: true` events never depend on luck and must not be skippable by random rolls.
- Minor events are selected from eligible pools by priority then seeded weight.
- Every consequence is a DSL effect. No prose in `consequences`.
- Every event that changes the world writes a journal entry or explicitly sets
  `"journal": null` with a reason in `notes`.
- Follow-ups must be schedulable: no absolute dates inside effects, use `inDays`.

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
