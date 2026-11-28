# Architecture

Read this before touching `src/engine`, `src/store`, or the save format. For the world
model see `WORLD_MODEL.md`; for characters and arcs see `NARRATIVE_SYSTEMS.md`; for scale
and packs see `SCALING.md`; for tools see `TOOLING.md`.

## 1. Shape of the program

```
┌───────────────────────────────┐
│ React screens (src/ui)        │  render read models, emit intents
└──────────────┬────────────────┘
               │ dispatch(command)
┌──────────────▼────────────────┐
│ Zustand adapters (src/store)  │  holds GameState, exposes selectors
└──────────────┬────────────────┘
               │ reduce(state, command, content)
┌──────────────▼────────────────┐
│ Pure engine (src/engine)      │  no React, no DOM, no wall clock
└──────────────┬────────────────┘
               │ validated packs
┌──────────────▼────────────────┐
│ Content packs (src/content)   │  JSON + Zod schemas + manifests
└───────────────────────────────┘
```

Rules:

- UI never mutates `GameState`. It dispatches commands.
- The store contains no rules. It is an adapter plus memoised selectors.
- `src/engine` never imports React, Zustand, UI, the store, the DOM, `Math.random`, or the
  wall clock. ESLint enforces this.
- Content is data. If a scene needs behavior the DSL cannot express, the DSL is extended
  deliberately with tests and an ADR — never with a content-side script.

## 2. Command → event pipeline

```ts
type CommandResult = {
  state: GameState
  events: DomainEvent[]
  rejected?: { reason: string }
}

function reduce(state: GameState, command: Command, content: ContentIndex): CommandResult
```

- Synchronous, side-effect free, deterministic.
- Domain events describe what happened and are the only input to journal updates, UI
  notifications, and test assertions.
- Expected failure returns the original state, no events, and a reason. Do not throw.

Command set grows by milestone. Slice commands: `advanceTime`, `rest`, `work`, `travel`,
`buy`, `sell`, `talkTo`, `chooseDialogue`, `resolveEncounter` (see
`src/engine/kernel/commands.ts`).
`save` and `load` are **not** commands: they are the save module, called by the store.

## 3. State model

The slice stores the subset it needs. The full model is partitioned by rate of change and
ownership (ADR-0005). Entity-level shapes — definitions, states, views, and knowledge —
are canonical in `DATA_MODEL.md`; this section is the save partition.

```ts
GameState = {
  meta: { saveVersion; engineVersion; contentVersions; seed }
  calendar: { day: number }                    // day 0 = 1230-01-01 (provisional)
  world: {
    era: EraId
    regionPhases: Record<RegionId, PhaseId>
    destinationDeltas: Record<DestinationId, DestinationDelta>
    routeStates: Record<RouteId, RouteState>
    facts: Fact[]
    scheduled: ScheduledEvent[]
    migrations: MigrationRecord[]
  }
  player: {
    identity: {
      selfName: string
      presentation: Presentation
      background: BackgroundId[]
      localNames: Record<RegionId, string[]>
    }
    location: DestinationId | RouteId
    money: number
    inventory: CargoEntry[]
    capacity: number
    transport: TransportId
    languages: Record<LanguageId, { xp: number; tier: LanguageTier }>
    deeds: DeedRecord[]                         // what the player has done
    reputation: Record<ReputationKey, ReputationBand>
    obligations: ObligationId[]
    flags: Record<string, boolean | number | string>
  }
  knowledge: {
    entries: KnowledgeEntry[]                  // facts learned, sources, beliefs
    knownRoutes: RouteId[]
    knownDestinations: DestinationId[]
    characterIndex: Record<CharacterId, KnownCharacterEntry>
  }
  narrative: {
    arcStates: Record<ArcId, ArcState>
    characterStates: Record<CharacterId, CharacterState>
    relationships: Record<CharacterId, Relationship>
    factions: Record<FactionId, FactionState>
    pending: PendingScene | null
    storyletCooldowns: Record<EventId, Day>
  }
  rng: Record<RngStream, number>
}
```

Invariants:

- Every ID resolves to validated content.
- `calendar.day` only moves forward.
- `pending` is `null` or a fully described scene; no half-open dialogue.
- Derived values (destination display state, prices, presence, `DayContext`) are never
  stored.
- Player-facing read models read `knowledge`, never `world.facts`.
- Entity shapes follow `DATA_MODEL.md`; a new field without a definition/state/view/
  knowledge story is not added to `GameState`.

## 4. Conditions and effects

A closed, serializable vocabulary. Content never contains code.

```jsonc
// condition
{ "all": [
  { "languageAtLeast": { "language": "akkadian", "tier": "basic" } },
  { "any": [
    { "relationship": { "character": "char.ugarit.amnit", "dimension": "trust", "atLeast": 2 } },
    { "flag": "helped.refugees.ugarit" }
  ]}
]}

// effect
{ "all": [
  { "money": -40 },
  { "advanceTime": { "days": 3 } },
  { "relationship": { "character": "char.ugarit.amnit", "delta": 1 } },
  { "journal": { "entry": "journal.slice.first-crossing" } },
  { "schedule": { "event": "evt.slice.letter-from-amnit", "inDays": 60 } }
]}
```

Implementation notes:

- `evaluate(condition, state, content) → boolean`
- `apply(effects[], state, content) → { state, events }`
- Every atom and effect has a Zod schema and a unit test.
- Unknown keys fail validation. No `eval`, no script escape hatch.
- Effects apply in array order, depth-first, deterministically.
- Clamping emits a domain event rather than throwing.
- Propagation from world events is a separate, closed vocabulary (`WORLD_MODEL.md` §4).

## 5. Determinism and time

- No `Date.now()`, `new Date()`, `Math.random()`, or locale-dependent formatting inside the
  engine.
- Day-count calendar. Formatting to "Month, Year BCE" happens at the UI boundary.
- RNG streams: `market`, `encounters`, `travel`, `hazard`, `flavour`, `narrative`,
  `tests`. Each is a small integer state stored in `state.rng`.
- Separate streams mean adding a market item cannot change which encounter you meet, and
  adding road hazards cannot shift an existing encounter or market roll.
- Scheduled events resolve by due day, then stable ID order.
- Every command is replayable from a save plus a command log.

## 6. Saves

```ts
type SaveFile = {
  saveVersion: number
  engineVersion: string
  contentVersions: Record<PackId, number>
  savedAt: string              // informational only
  state: GameState
}
```

- `serialize` / `deserialize` are pure.
- Migrations are ordered, pure, and tested against a golden corpus.
- Corrupt saves produce a typed error and a readable message.
- Derived values are not stored; tests assert this.
- Autosave and slots are UI concerns; the save module owns format and integrity.

## 7. Content registry and packs

- Packs live under `src/content/packs/<name>/` with a manifest.
- `pack.core` holds shared calendars, goods taxonomy, languages, name banks.
- The registry validates schemas, IDs, references, provenance, and the acyclic pack graph.
- It builds indexes by ID, location, region, phase, and tag for O(1) selection.
- The game loads packs lazily per region; tests and the studio load everything.
- The content linter and runtime use the same schemas and validators.

Details: `SCALING.md` §4.

## 8. Read models

The UI never reads world truth directly. It reads derived, player-facing views:

| Read model | Built from | Must not reveal |
|---|---|---|
| Journal | knowledge entries + journal content | facts the protagonist never learned |
| Character index | knowledge + character defs | current status if unknown |
| Map (local/regional/world) | known destinations/routes + current region + rumor state | unknown places, closed routes, and region names under fog |
| Codex | phase-appropriate authored entries | deliberate ambiguity resolutions |
| Market | derived destination state + player knowledge | hidden modifiers without an in-world reason |
| Day context | calendar + phases + active events | events the protagonist has not learned of |
| Ambient passage | seed + day + location + route/destination cultures + conditions | world truth the traveller has not learned; never saved or RNG-mutating |
| Day report | afflictions before/after a calendar move + definitions | conditions the player does not have |
| Route view | route def + route state + knowledge | unknown closures, waypoints, or dangers |

A "no truth leak" test suite is mandatory from M5.

## 9. Travel and encounter resolution

1. Player selects route and mode in travel preparation.
2. `travel` validates requirements (knowledge, pass, language, guide, season, capacity).
3. Time advances by base duration modified by mode and events.
4. Encounter slots and waypoint stops are generated deterministically from route, date,
   and state.
5. Eligible authored events are selected by priority and seeded weight; `major` events
   bypass randomness.
6. A scene is presented; choices apply conditions/effects; unresolved scenes pause travel.
7. On arrival, destination state is derived from phase + delta + local events.

## 10. Module map

Engine submodules and dependency direction are defined in `SCALING.md` §3. Summary:

```
kernel ← time ← world ← narrative
              ↖ characters ↗
kernel ← dsl ← everything
save  ← kernel (+ migrations)
ui → store → engine (never reverse)
```

Each submodule is **sealed**: it exposes only its `index.ts`, and every other module —
as well as `src/store` and `src/ui` — imports it through that surface (`../state`,
`@engine/state`). ESLint enforces this from the module list in `eslint.config.js`;
importing `../state/schema` is a lint error. A module may still import its own files.
Cross-cutting work goes through kernel types. Pure state utilities (`cloneState`,
`deepFreeze`) live in `state`, so `dsl` never has to import the kernel.

## 11. Testing strategy

| Layer | Test type |
|---|---|
| DSL atoms/effects | Table-driven unit tests |
| Calendar/RNG | Fixed-value unit tests |
| Save/load | Round-trip, migration corpus, fuzz |
| Content | Schema, references, provenance, continuity, coverage |
| Scenes | Scenario scripts, one per major path |
| World | Long-run invariants over 200 years × seeds |
| Balance | Persona runs and Monte Carlo diagnostics |
| UI | Smoke renders and accessibility checks |

The scenario runner and long-run simulator are the main regression tools. Details:
`TOOLING.md`.

## 12. Performance and packaging

- Budgets in `SCALING.md` §7. Breaching one is a bug, not a polish task.
- State snapshots under 8 MB for the full game; save/load under 100 ms.
- Pack load under 300 ms; initial game bundle under 2 MB gzipped with lazy packs.
- Packaging: browser now, Tauri after Gate A. Persistence goes through the save module so
  storage adapters can change.
- Godot remains an escape hatch; content and state are engine-agnostic.
