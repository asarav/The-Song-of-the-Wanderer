# M1 — Engine spine

**Status:** Done — T01–T08 closed and verified against the gate · **Depends on:** M0
**Goal:** a deterministic, testable simulation core with no UI. After M1, the slice's
rules can be exercised entirely from scripted scenarios.

## Non-goals

- Any React screens or styling.
- Authored content beyond test fixtures.
- Final balance numbers, final prose, or art/audio hooks.

## Architecture references

`docs/ARCHITECTURE.md` §2–7. ADR-0002 and ADR-0003.

## Tasks

### M1-T01 — GameState and schemas

- [x] `src/engine/state/schema.ts` defines `GameState` with Zod, derived TS types.
- [x] Use the partitioned shape in `ARCHITECTURE.md` §3 and `DATA_MODEL.md` §4, §14; the
      slice implements the subset it needs (`meta`, `calendar`, `player`, `knowledge`,
      `narrative`, `rng`). Player state includes identity, location, resources,
      languages, deeds, reputation, obligations, and flags.
- [x] Every persisted field is JSON-serializable (no `Map`, `Set`, `Date`, class).
- [x] `createInitialState(input: NewGameInput)` returns a valid state.
- [x] `validateState` rejects unknown top-level keys and reports a readable path.
- [x] Unit tests: minimal valid state, invalid state, initial state invariants.

**Acceptance:** `createInitialState` output round-trips through `JSON.stringify`/
`JSON.parse` and re-validates. Do not add world phases, facts, or propagation yet; M5
extends the schema with a save migration.

### M1-T02 — Calendar

- [x] Day-counter calendar with a pure formatter (`1230-03-14`-style internal, display
      string for UI).
- [x] `advanceDays(state, n)` is the only way time moves.
- [x] Month lengths and year boundaries fixed by a single table; no `Date`.
- [x] Tests: boundary transitions, leap-free consistency, display formatting.

**Acceptance:** advancing 365 days from day 0 lands on the same month/day next year.

### M1-T03 — Seeded RNG streams

- [x] Named streams (`market`, `encounters`, `travel`, `hazard`, `flavour`, `narrative`, `tests`).
- [x] Stream state is a plain number stored in `state.rng`.
- [x] `nextFloat`, `nextInt`, `pick`, `weightedPick` helpers; all pure relative to state.
- [x] Tests: fixed seed → fixed sequence; independent streams do not interfere.

**Acceptance:** snapshot values for a fixed seed are asserted in tests.

### M1-T04 — Condition and effect DSL

- [x] Zod schemas for conditions (`all`, `any`, `not`, atoms) and effects.
- [x] Atoms: `flag`, `languageAtLeast`, `relationship`, `factionStanding`, `dateAfter`,
      `dateBefore`, `routeOpen`, `itemAtLeast`, `moneyAtLeast`, `characterAlive`,
      `characterAt`, `hasJournalEntry`, `chance`. `relationship` and `factionStanding`
      take an optional `dimension`, so a check can name trust, respect or suspicion.
- [x] Effects: `money`, `items`, `advanceTime`, `relationship`, `faction`, `flag`,
      `schedule`, `journal`, `languageXp`, `moveCharacter`, `characterStatus`,
      `unlockRoute`, `closeRoute`, `destinationState`, `migration`, `arc`, `deed`,
      `knowledge`. The relationship and faction effects take the same optional `dimension`.
- [x] Deterministic recursive evaluation with cycle/size limits.
- [x] Clamping emits `EffectClamped` domain events instead of throwing.
- [x] Table-driven condition cases, applied/clamped/deterministic effect cases, and a
      shape-valid sample for every registered atom and effect.

**Acceptance:** unknown keys fail validation; evaluation is order-stable.

### M1-T05 — Content registry and real content lint

- [x] Entity schemas for regions, destinations, routes, goods, characters, events,
      dialogues, codex entries.
- [x] Registry indexes by ID and by location; validates referential integrity
      (route endpoints, cast, dialogue `next`, scheduled events, journal refs).
- [x] `pnpm content:lint` uses the same schemas; CI stays the gate.
- [x] Fixture content pack in `src/engine/testing/content.ts` for tests only.
- [x] Tests: valid pack loads; each class of dangling reference fails with a clear path.

**Acceptance:** an intentional dangling `next` in a dialogue fails both the test and the
CLI with the same message.

### M1-T06 — Commands and domain events

- [x] `reduce(state, command, content)` with `advanceTime`, `travel`, `buy`, `sell`,
      `talkTo`, `resolveEncounter`, `chooseDialogue`, `rest`.
- [x] Commands are one `Record<Name, { schema, run }>` registry: `reduce` reads it and has
      no `switch` over command names.
- [x] Rejections return the original state plus a reason; never throw for expected
      failure.
- [x] Domain event union with stable shapes and a monotonically increasing sequence.
- [x] Tests: each command's success and refusal path in one table, a deterministic run
      per command, and a deep-frozen state every command leaves untouched.

**Acceptance:** no command mutates its input state (deep-freeze test).

### M1-T07 — Save, load, migrations

- [x] `serialize` / `deserialize` with `saveVersion`, `engineVersion`, `savedAt`, behind a
      sealed module (`index.ts` only) with a public-surface contract test.
- [x] Start at save version 1; M5 introduces the partitioned v2 state with a migration.
- [x] Migration chain as one `Record<version, { from, to, migrate }>` registry, with the
      example v0→v1 migration reading the checked-in `__fixtures__/v0-pre-release.json`.
- [x] Corrupt saves produce a typed error, not a crash: a refusal table covers a bad
      shape, unknown and newer versions, a truncated blob and a foreign payload.
- [x] Tests: round-trip equality on the checked-in `__fixtures__/round-trip-v1.json` save
      (calendar day and event counter included), the v0 migration fixture, determinism,
      and a mid-crossing save/reload scenario on the shared fixtures.

**Acceptance:** `load(save(s))` deep-equals `s` for two different states.

### M1-T08 — Scenario runner

- [x] Scenario JSON: initial state overrides, command list, assertions on state and
      events (`target: "events"` and per-step assertions on `accepted`/`reason`/
      `eventTypes`).
- [x] Entry kinds and assertion kinds are registries (`SCENARIO_ACTIONS`,
      `ASSERTION_MATCHERS`); a save step round-trips through the save module inside a run.
- [x] Runner executable from Vitest; a failure is a typed result naming the scenario, the
      seed and the step, and `formatTrace` prints the whole run (one line per step).
- [x] An opening the state schema refuses (bad `date`, bad override) comes back as one
      typed `start` failure, and a handler that throws becomes a step failure — never an
      exception out of `runScenario`.
- [x] One end-to-end fixture scenario (`src/engine/scenarios/slice-day-save.json`)
      covering time, a market trade, a save step and travel start.
- [x] `tools/simulate.ts` runs a scenario by name, with `--json` for the step record.

**Acceptance:** the fixture scenario passes; changing a seed or expected value makes it
fail with a readable diff.

No golden trace fixture is required here: this task asks for a trace *on failure* and a
deterministic replay, so `scenario.test.ts` asserts the replay (identical steps, state and
trace) instead of storing one. `--json` writes the step record on demand.

## Demo script

```
pnpm test
pnpm content:lint
pnpm check
```

Narrate: a scripted journey advances the calendar, buys and sells goods, begins travel,
and survives a save round-trip — all without a browser.

## Definition of done

All tasks checked, `pnpm check` green, `STATUS.md` advanced past M1 (it currently
records M4-T01, the playtest gate), `WORKLOG.md` updated.
