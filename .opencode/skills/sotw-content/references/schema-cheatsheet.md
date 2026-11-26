# Content schema cheat sheet

Working reference until M1 generates the authoritative Zod schemas. If this file and the
code disagree, the code wins; update this file.

## Entity folders and prefixes

| Folder | Prefix | Key fields |
|---|---|---|
| `regions/` | `region.` | `id`, `name`, `description`, `destinations[]`, `provenance` |
| `destinations/` | `dest.` | `id`, `region`, `name`, `intro`, `activities[]`, `characters[]`, `goods[]`, `routes[]`, `phases[]`, `provenance` |
| `routes/` | `route.` | `id`, `from`, `to`, `modes[]`, `encounterPools[]`, `requirements`, `provenance` |
| `goods/` | `good.` | `id`, `name`, `category`, `weight`, `baseValue`, `tags[]`, `provenance` |
| `characters/` | `char.` | `id`, `home`, `name`, `role`, `languages[]`, `brief` (dossier ref), `schedule[]`, `provenance` |
| `events/` | `evt.` | see event shape below |
| `dialogues/` | `dlg.` | `id`, `speaker`, `start`, `nodes`, `provenance` |
| `codex/` | `codex.` | `id`, `title`, `body`, `sources[]`, `provenance` |

## Provenance

```json
"provenance": {
  "confidence": "documented | strongly-supported | plausible | fictional | unresolved",
  "sources": ["Author Year", "RS 20.238"],
  "notes": "What is attested; what is invented."
}
```

## Event shape

```jsonc
{
  "id": "evt.slice.example",
  "kind": "travel | destination | scheduled | dialogue-beat",
  "title": "Short title",
  "dateRange": { "from": "1230-03", "to": "1230-12" },
  "regions": ["region.levant"],
  "locations": ["dest.ugarit"],
  "major": false,
  "priority": 10,
  "weight": 1,
  "conditions": { "all": [] },
  "cast": ["char.ugarit.amnit"],
  "scene": "dlg.ugarit.amnit.example",
  "consequences": { "all": [] },
  "followUps": [{ "event": "evt.slice.example-after", "inDays": 30 }],
  "journal": "journal.slice.example",
  "provenance": {}
}
```

## Condition atoms

```jsonc
{ "flag": "helped.refugees.ugarit" }
{ "languageAtLeast": { "language": "lang.akkadian", "tier": "basic" } }
{ "relationship": { "character": "char.ugarit.amnit", "min": 2 } }
{ "factionStanding": { "faction": "faction.ugarit.palace", "min": 1 } }
{ "dateAfter": "1230-06" }
{ "dateBefore": "1231-01" }
{ "routeOpen": "route.ugarit-cyprus" }
{ "itemAtLeast": { "good": "good.copper", "quantity": 3 } }
{ "moneyAtLeast": 50 }
{ "characterAlive": "char.ugarit.amnit" }
{ "characterAt": { "character": "char.ugarit.amnit", "location": "dest.cyprus" } }
{ "hasJournalEntry": "journal.slice.example" }
{ "chance": 0.25 }
```

Compose with `{ "all": [...] }`, `{ "any": [...] }`, `{ "not": { ... } }`.

Tiers: `unfamiliar`, `basic`, `conversational`, `fluent`, `deep`.

## Effect atoms

```jsonc
{ "money": -40 }
{ "items": { "add": [{ "good": "good.copper", "quantity": 2 }], "remove": [] } }
{ "advanceTime": { "days": 3 } }
{ "relationship": { "character": "char.ugarit.amnit", "delta": 1 } }
{ "faction": { "faction": "faction.ugarit.palace", "trust": 1 } }
{ "flag": { "key": "helped.refugees.ugarit", "value": true } }
{ "schedule": { "event": "evt.slice.letter", "inDays": 60 } }
{ "journal": { "entry": "journal.slice.crossing" } }
{ "languageXp": { "language": "lang.akkadian", "amount": 10 } }
{ "moveCharacter": { "character": "char.ugarit.amnit", "to": "dest.cyprus" } }
{ "characterStatus": { "character": "char.ugarit.amnit", "status": "missing" } }
{ "unlockRoute": "route.ugarit-cyprus" }
{ "closeRoute": "route.ugarit-cyprus" }
{ "destinationState": { "destination": "dest.ugarit", "state": "tense" } }
{ "arc": { "arc": "arc.slice.refugee-family", "advance": 1 } }
{ "migration": { "group": "migration.slice.ugarit-household", "to": "dest.cyprus" } }
```

## Dialogue shape

```jsonc
{
  "id": "dlg.ugarit.amnit.first-meeting",
  "speaker": "char.ugarit.amnit",
  "start": "greet",
  "nodes": {
    "greet": {
      "text": "You have the look of someone who slept on a boat.",
      "textByLanguage": {
        "lang.akkadian": { "basic": "You look tired." }
      },
      "choices": [
        {
          "text": "Only the last three nights.",
          "conditions": { "all": [] },
          "next": "laughs",
          "effects": { "relationship": { "character": "char.ugarit.amnit", "delta": 1 } }
        },
        { "text": "(Say nothing.)", "next": null }
      ]
    }
  }
}
```

## Naming and text

- IDs lowercase, dot-separated, ASCII only.
- Flags use dotted paths and are namespaced by system or storyline.
- All player-visible strings live in content or `src/ui/strings.ts`, never inline in
  components.
- Use `{{named}}` placeholders for interpolation.
