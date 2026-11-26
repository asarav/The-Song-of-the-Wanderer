# Architecture

Read this before touching `src/engine`, `src/store`, or the save format.

## 1. Shape of the program

```
┌───────────────────────────────┐
│ React screens (src/ui)        │  render state, emit intents
└──────────────┬────────────────┘
               │ dispatch(command)
┌──────────────▼────────────────┐
│ Zustand store (src/store)     │  holds GameState, exposes selectors
└──────────────┬────────────────┘
               │ reduce(state, command)
┌──────────────▼────────────────┐
│ Pure engine (src/engine)      │  no React, no DOM, no wall clock
└──────────────┬────────────────┘
               │ validated content
┌──────────────▼────────────────┐
│ Content registry (src/content)│  JSON + Zod schemas
└───────────────────────────────┘
```

Rules:

- UI never mutates `GameState`. It dispatches commands.
- The store never contains rules. It is an adapter plus selectors.
- The engine never imports from `src/ui`, `src/store`, `react`, `zustand`, or the DOM.
  ESLint enforces this for `src/engine/**`.
- Content modules are data. They are imported through the registry, which validates
  them at load time (and in tests).

## 2. Command → event pipeline

```ts
type CommandResult = {
  state: GameState
  events: DomainEvent[]
  rejected?: { reason: string }
}

function reduce(state: GameState, command: Command, content: ContentIndex): CommandResult
```

- `reduce` is synchronous and side-effect free. Given the same state, command, and
  content, it returns the same result.
- Domain events describe what happened. They are the only input to journal writing,
  UI notifications, and analytics-style test assertions.
- A rejected command returns the original state, no events, and a reason. Never throw
  for expected failure (no money, route closed, wrong location).

Initial command set (M1–M2):

| Command | Purpose |
|---|---|
| `advanceTime` | Move the calendar, run scheduled effects and triggers |
| `travel` | Begin a journey on a route with a chosen mode |
| `resolveEncounter` | Choose an option in the active travel/dialogue scene |
| `buy` / `sell` | Market transactions |
| `talkTo` | Open a dialogue graph for a character at the current location |
| `rest` | Spend time and money to recover and advance the calendar |
| `save` / `load` | Serialize/deserialize; handled by the store, not the reducer |

## 3. State sketch

The authoritative shape lives in `src/engine/state/schema.ts` from M1-T01. This is the
design intent, not the final field list.

```ts
GameState = {
  version: number
  seed: string
  calendar: { day: number }                 // day 0 = 1230-01-01 (provisional)
  location: DestinationId
  travel: null | { route: RouteId; mode: TravelModeId; daysRemaining: number; ... }
  player: { name: string; presentation: Presentation; background: BackgroundId[] }
  money: number
  inventory: { good: GoodId; quantity: number }[]
  capacity: number
  transport: TransportId
  languages: Record<LanguageId, { xp: number; tier: LanguageTier }>
  knowledge: { destinations: DestinationId[]; routes: RouteId[]; rumors: RumourId[] }
  characters: Record<CharacterId, CharacterState>
  factions: Record<FactionId, FactionState>
  arcs: Record<ArcId, ArcState>
  migrations: MigrationRecord[]
  scheduled: ScheduledEvent[]                // { eventId, dueDay, context }
  completed: EventId[]
  pending: PendingScene | null               // dialogue or encounter in progress
  journal: JournalEntry[]
  flags: Record<string, boolean | number | string>
  rng: Record<RngStream, number>             // serialized stream state
}
```

Invariants:

- Every ID in state refers to a validated content entity.
- `calendar.day` only moves forward.
- `pending` is either `null` or a fully-described scene; no half-open dialogue.
- Unknown flags are allowed (content evolves) but are namespaced.

## 4. Conditions and effects

A closed, serializable vocabulary. Content never contains code.

```jsonc
// condition
{ "all": [
  { "languageAtLeast": { "language": "akkadian", "tier": "basic" } },
  { "any": [
    { "relationshipAtLeast": { "character": "char.ugarit.amnit", "value": 2 } },
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
- Unknown keys fail validation. There is no `eval`, no script escape hatch.
- Order of effects is deterministic: array order, depth-first.
- Effects that cannot apply (e.g. remove more goods than carried) clamp and emit a
  `EffectClamped` domain event rather than throwing.

## 5. Determinism and time

- No `Date.now()`, `new Date()`, `Math.random()`, or locale-dependent formatting inside
  the engine.
- The calendar is day-count based. Formatting to "Month, Year BCE" happens at the UI
  boundary using a pure formatter.
- RNG streams: `market`, `encounters`, `travel`, `flavour`, `tests`. Each stream is a
  small integer state (xorshift/splitmix-style) stored in `state.rng`. Adding an
  encounter to the pool must not perturb market rolls — hence separate streams.
- Scheduled events are keyed by due day and resolved in stable ID order.

## 6. Save format

```ts
type SaveFile = {
  saveVersion: number
  savedAt: string            // informational only, never read by the engine
  engineVersion: string
  state: GameState
}
```

- Pure serialization: `serialize(state) → string`, `deserialize(json) → GameState`.
- Migrations: `migrations: Array<{ from: number; migrate(state: any): any }>` applied
  in order until `saveVersion` matches.
- Tests: round-trip equality, migration chain from every historical fixture, and
  rejection of corrupt saves with a readable error.
- Save slots and autosave policy are a UI concern (M2).

## 7. Content registry

- Loads JSON modules from `src/content/**` at build time (Vite `import.meta.glob` or
  explicit index files — decide in M1-T05 with a benchmark, not by preference).
- Validates each entity with Zod, then checks references: every character's home
  destination exists; every route endpoint exists; every dialogue node's `next`
  resolves; every scheduled event exists.
- Builds indexes by ID and by location for O(1) lookup during travel resolution.
- Errors are fatal in development and tests; the content linter mirrors them in CI.

## 8. Travel and encounter resolution

Conceptual flow (M2-T03/T04):

1. Player selects a route and mode in travel preparation.
2. `travel` validates requirements (knowledge, pass, language, guide, season, capacity).
3. Time advances by the route's base duration, modified by mode and events.
4. Encounter slots are generated deterministically from the route, date, and state.
5. For each slot, the engine selects from eligible authored encounters by priority and
   weight; travel events with `major: true` bypass randomness.
6. A scene is presented; choices apply conditions/effects; unresolved scenes pause
   travel.
7. On arrival, destination state is recomputed from the timeline and player history.

## 9. Testing strategy

| Layer | Test type |
|---|---|
| DSL atoms and effects | Table-driven unit tests |
| Calendar and RNG | Unit tests with fixed expected values |
| Save/load | Round-trip and migration fixtures |
| Content | Schema + referential integrity lint (CI) |
| Scenes | Scenario scripts in `src/engine/scenarios/*.json` run headlessly |
| Balance | Monte Carlo market runs over N seeds (diagnostic, not a gate) |
| UI | Smoke render tests from M2; no snapshot sprawl |

The scenario runner is the main regression tool. A scenario is a list of commands plus
expected assertions on state and emitted events. Every slice scene gets at least one.

## 10. Performance and packaging

- Target: state snapshots under 1 MB, save/load under 50 ms, content load under 200 ms
  for the slice.
- No virtualisation or worker threads until measured need.
- Packaging: browser build now; Tauri wrapper when the slice is proven (ADR-0001).
- All persistence goes through the save module, so moving from `localStorage` to Tauri
  filesystem storage is a single adapter swap.
