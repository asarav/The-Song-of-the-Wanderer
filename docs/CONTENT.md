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

From M5, content is organized in packs (`src/content/packs/<name>/`), each with a
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
  afflictions/*.json
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

In the slice, a destination's `currency` is **descriptive only**: it says what people here
weigh when they value a thing. Every price, fare and the traveler's purse are weighed
silver in the traveler's own ledger, on both shores, and no screen prints the field. A
place that described itself as valuing something else would promise a second balance the
rules do not have (ADR-0009).

Pack manifests declare `id`, `contentVersion`, `requires`, and the entity lists. The pack
dependency graph is acyclic. Cross-pack references are validated at build time. Details:
`SCALING.md` §4.

### Prices quoted in prose

A scene that names a price must be able to pay exactly that price. A market entry may
carry `fixedPrice`, which bypasses `priceModifier`, local-state multipliers (a festival)
and haggling for both buying and selling. Use it for story goods whose price is written
into dialogue and journal text, such as Sibtu's cloth at five shekels. Ordinary trade
goods keep `basePrice` and may move with the harbor and the day.

Buying and selling are two sides of the same stall, not one price used twice. A normal
entry costs its base price less the traveler's haggling discount to buy, and pays 60% of
that base price plus the haggling premium to sell; the market screen shows both columns.
A `fixedPrice` entry is the exception: the prose price is what you pay and what you are
paid, so a story good never gains or loses silver by being bought and sold back.

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
- Use American spelling in all prose: *color, harbor, traveler, center, gray, defense,
  recognize, organize*. Content ids, enum values, field names and file names keep whatever
  spelling they were authored with — the stored `favour` dimension and the `harbour`
  place kind are examples — because renaming them changes saves or breaks lookups. Never
  rename an identifier to match a spelling pass.
- No modern idiom, no anachronistic metaphor, no "okay", "fine", "unit", "economy".
- Avoid faux-archaic thees and thous. Plain, concrete, sensory prose.
- Name things specifically: a type of bread, a harbor smell, a tax, a kinship term.
- Distinguish what a character believes from what is true. Characters can be wrong.
- Ages and crowds follow `docs/design/04-demography.md`: a young population, few elders
  but not none, and a different profile for a harbor, a mine, a garrison and a farming
  village. An age is a brief for voice and casting, never a field, and no age figure
  (life expectancy, shares, head counts) is printed in game text without a source.
- Do not explain the protagonist's nature. Ever. Ambiguity is a design requirement.
- Every word is addressed to the player. Never name the build, the slice, a placeholder,
  a prototype or a dossier in game text; those belong in docs. `pnpm content:lint` warns
  when player-facing prose says "the slice", "this game", "the player" or similar, and
  `src/ui/title.test.ts` holds the main menu and the prologue to the same rule.

**Prose budget per destination (slice):** ~1,200 words of scene text, ~400 words of
codex, and no more than 12 named characters. Expansion regions follow the budget in
`milestones/M9-M19-production-waves.md`.

### Pacing and emphasis

Every scene node, destination introduction, journal entry, and codex entry is read in
**beats**. A blank line separates beats; the interface shows one at a time, beside the
picture that belongs to the moment, behind a Continue control whose progress is a row of
dots rather than a count. A choice appears only once the last beat has been read, and then
the whole passage appears at once with a wider picture where the interface has one. Keep a
beat to one idea and one or two sentences — the point of the mechanic is that a reader is
never handed a wall of text.

`**Double asterisks**` set a key word or phrase in bold. Use them for the proper nouns a
reader must keep and the mechanisms they must remember (the harbor tax, the market, the
day). Two or three in a beat is plenty; a bolded sentence is a shout, not an emphasis.
Neither convention reaches the engine: both are presentation only, neither is stored in a
save, and the prose still reads if the markers are stripped.

### Words in their own script

When a word belongs to a language whose writing can be shown, write it in that script and
put its reading in parentheses: `𐀁𐀔𐀀 (e-ma-a₂, read Ermahas)`, `𒀭𒎏𒋚 (Ninshubur)`,
`𐎜𐎂𐎗𐎚 (ugrt)`. The parentheses are not decoration — most players cannot read the signs,
and no character in the scene explains them. Use a script form only where a cited source
attests it; a name invented for the game stays in transliteration. Put the sign-level
source in the entry's provenance, and keep a reconstruction such as *Ermahas* inside the
codex, never in dialogue. `pnpm content:lint` warns about a script word with no reading in
parentheses, and the prose font falls back to a historic-script family so the signs render
rather than turning into boxes.

The interface follows the same rule where it prints a name: the traveler appears as
`𐀁𐀔𐀀 (e-ma-a₂)` in the new-run masthead and on Status, and the Ugarit heading carries
`𐎜𐎂𐎗𐎚 (ugrt)`. Invented names stay transliterated; there is no sourced spelling to
show for them.

The same pacing applies to journal entries, codex entries, and the conversation log, so
author all of them in beats too. A passage paces the first time it is read in a session
and shows whole afterwards; a scene and its line in the log are the same passage, so the
transcript never re-paces what was just read.

Scene text still has to show rather than tell. A beat that carries a custom through what
someone is doing — a clerk weighing a jar, a scribe wetting a stylus — is worth three
that describe it.

### Knowledge, not truth

If the player should learn something, author the path: who tells them, when, in what
words, and how it might be distorted. A fact existing in world state is not the same as
the protagonist knowing it. Journal, map, character index, and codex read knowledge only
(ADR-0004).

### Condition prose

An affliction's `onset`, `daily` and `recovery` fields are the player-facing text of the
daily condition report. Write `daily` so it can be read on any day the condition persists:
it is a state, not a one-time event. `onset` and `recovery` are for the day it arrives or
lifts. Keep all three consistent with `description` and `remedyNote`. The fields are
optional; the report falls back to generic condition text when one is absent.

### World content

Phases, world/regional/local events, propagation, rumors, destination states, and route
states follow `WORLD_MODEL.md`; characters, itineraries, arcs, lineages, recognition, and
storylets follow `NARRATIVE_SYSTEMS.md`. Do not invent a second way to change the world
inside a destination file.

### Maps

The sketches are presentation over knowledge, so map fields are authored only where a
view needs a position:

- `destinations[].mapPosition` places a place on the regional and world sketches.
- `destinations[].places[].mapPosition` places a local mark on the quarter sketch.
- `regions[].mapPosition` and `mapRadius` size a region on the world sketch.
- `regions[].mapFeatures` draws schematic ridges (`mountains`), `river` lines and `border`
  lines on the regional and world sketches. They are unnamed and schematic: a border is
  the edge of what the sketch knows, never a political boundary.

Fog is not authored. A region is fogged because no destination in it is known, and it
takes its name only when one is. Do not add a field for "discovered" or draw a place the
protagonist has not heard of; the view must be able to show the map from knowledge alone.
Positions are schematic and need not agree with real geography — they must agree with each
other well enough for the lines to read.

## 5. Events

An event is authored content selected by eligibility, not a script. Shape (spec §20.2):

```jsonc
{
  "id": "evt.slice.recognition",
  "kind": "world | regional | local | character | storylet",
  "title": "The woman who knows your face",
  "description": "A merchant recognizes a name she should not know.",
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

### Night events

A destination may author a `night` band: its own picture and passage, and a weighted
pool of encounters.

```jsonc
"night": {
  "art": "art.ugarit.night",
  "text": "The gate is shut and the moles are lit with oil lamps...",
  "events": [{ "event": "evt.ugarit.night-watch", "weight": 1 }]
}
```

- Night falls when **exactly one day** is spent at the place (`Spend the day`, or a
  one-day rest). Longer skips are montage and stage no scene.
- At most one event is drawn per night, by authored weight from the seeded `encounters`
  stream. Only eligible, non-major events are drawn; `major` events must be scheduled.
  Conditions and `cooldownDays` apply as they do elsewhere.
- A night event may open a scene. That scene owns the evening until it is answered; the
  interface shows the night picture behind it.
- A night with no eligible event still shows the place after dark, then returns to day.
  The night is presentation, not saved state: loading a save always opens in daylight.
- Night scenes must respect the same prose, provenance and journal rules as any other
  event.

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
          "text": "Buy the lesson.",
          "conditions": { "moneyAtLeast": 5 },
          "unavailableNote": "A lesson costs five shekels. You have less than that.",
          "next": "laughs",
          "effects": { "relationship": { "character": "char.ugarit.amnit", "delta": 1 } }
        },
        { "text": "(Say nothing.)", "next": "end" }
      ]
    }
  }
}
```

A graph can also open somewhere else once the player has done something. `entries` are
checked in order, first match wins, before `start`:

```jsonc
{
  "start": "greet",
  "entries": [
    { "when": { "flag": "yada.paid-lesson" }, "node": "practised" },
    { "when": { "flag": "yada.free-lesson" }, "node": "return" }
  ]
}
```

Rules:

- Every `next` resolves, or is `null` to end the conversation. No dangling nodes.
- Every entry node and `start` resolves; a node reachable from no opening is a warning.
- A recurring character should use `entries` once they can remember the player. Repeating
  the same opening after a scene has changed something reads as a bug, not as reserve.
- Every graph is reachable from at least one event, destination place, or place action.
- A choice that can be locked should carry `unavailableNote`, written in the character's
  situation, not in system language.
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

## 10. Codex entries

The codex is the reader's own reference shelf: everything on it is available at any time,
and it reads player knowledge only. Entries are short and paced in beats like every other
passage.

```jsonc
{
  "id": "codex.shekel",
  "title": "Silver, weighed",
  "category": "measure",
  "text": "...",
  "provenance": { "confidence": "documented", "sources": [], "notes": "" }
}
```

`category` is required and closed — `place`, `people`, `language`, `road`, `measure` — and
decides which shelf of the index the entry sits on. The reader meets the shelves in this
order: Places, Peoples and names, Languages, Roads and the sea, Money and measure. A shelf
with nothing on it is not shown. Adding a shelf means editing the closed list in the entry
schema and the reading order in `src/ui/codex.ts`; an entry on a shelf the reader does not
know is shown under "Other" rather than disappearing from the index.

Entries on the `measure` shelf explain the units the interface prints — shekels, minas,
the days of the year — and may gloss them in modern measures for the reader's sake. That
is the one place a modern comparison belongs. ADR-0008 sets its limits, and it never
extends to prices: a price in play is authored, and a modern equivalent would be a claim
the game does not make.

### Goods and their pictures

Every good has an `art` ID: a square thumbnail used in the market and cargo lists. The
linter and the art test both require it, and `src/ui/art.test.ts` requires every good to
have a picture of its own rather than sharing one. A good without a plate is a content
error, not a screen that quietly falls back to text.

### Beats and their pictures

A blank-line-separated paragraph of paced prose is a beat, whether it belongs to dialogue,
a place introduction, a night passage, a journal entry or a codex entry. Each passage
carries a `beatArt` array with one `art.*` ID per beat, in reading order. The array is
all-or-nothing, may not repeat a picture inside the passage, and must cover every language
variant at the same beat count. A new beat without a plate fails the gate; the legacy
ledger in `src/ui/beatArtBacklog.ts` may shrink but never grow. See `docs/ASSETS.md` §2.12.
