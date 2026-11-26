# M1 — Engine spine

**Status:** Ready · **Depends on:** M0
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

- [ ] `src/engine/state/schema.ts` defines `GameState` with Zod, derived TS types.
- [ ] Every persisted field is JSON-serializable (no `Map`, `Set`, `Date`, class).
- [ ] `createInitialState(input: NewGameInput)` returns a valid state.
- [ ] `validateState` rejects unknown top-level keys and reports a readable path.
- [ ] Unit tests: minimal valid state, invalid state, initial state invariants.

**Acceptance:** `createInitialState` output round-trips through `JSON.stringify`/
`JSON.parse` and re-validates.

### M1-T02 — Calendar

- [ ] Day-counter calendar with a pure formatter (`1230-03-14`-style internal, display
      string for UI).
- [ ] `advanceDays(state, n)` is the only way time moves.
- [ ] Month lengths and year boundaries fixed by a single table; no `Date`.
- [ ] Tests: boundary transitions, leap-free consistency, display formatting.

**Acceptance:** advancing 365 days from day 0 lands on the same month/day next year.

### M1-T03 — Seeded RNG streams

- [ ] Named streams (`market`, `encounters`, `travel`, `flavour`, `tests`).
- [ ] Stream state is a plain number stored in `state.rng`.
- [ ] `nextFloat`, `nextInt`, `pick`, `weightedPick` helpers; all pure relative to state.
- [ ] Tests: fixed seed → fixed sequence; independent streams do not interfere.

**Acceptance:** snapshot values for a fixed seed are asserted in tests.

### M1-T04 — Condition and effect DSL

- [ ] Zod schemas for conditions (`all`, `any`, `not`, atoms) and effects.
- [ ] Atoms: `flag`, `languageAtLeast`, `relationship`, `factionStanding`, `dateAfter`,
      `dateBefore`, `routeOpen`, `itemAtLeast`, `moneyAtLeast`, `characterAlive`,
      `characterAt`, `hasJournalEntry`, `chance`.
- [ ] Effects: `money`, `items`, `advanceTime`, `relationship`, `faction`, `flag`,
      `schedule`, `journal`, `languageXp`, `moveCharacter`, `characterStatus`,
      `unlockRoute`, `closeRoute`, `destinationState`, `migration`, `arc`.
- [ ] Deterministic recursive evaluation with cycle/size limits.
- [ ] Clamping emits `EffectClamped` domain events instead of throwing.
- [ ] Table-driven tests for every atom and effect, including malformed input.

**Acceptance:** unknown keys fail validation; evaluation is order-stable.

### M1-T05 — Content registry and real content lint

- [ ] Entity schemas for regions, destinations, routes, goods, characters, events,
      dialogues, codex entries.
- [ ] Registry indexes by ID and by location; validates referential integrity
      (route endpoints, cast, dialogue `next`, scheduled events, journal refs).
- [ ] `pnpm content:lint` uses the same schemas; CI stays the gate.
- [ ] Fixture content pack in `src/content/__fixtures__/` for tests only.
- [ ] Tests: valid pack loads; each class of dangling reference fails with a clear path.

**Acceptance:** an intentional dangling `next` in a dialogue fails both the test and the
CLI with the same message.

### M1-T06 — Commands and domain events

- [ ] `reduce(state, command, content)` with `advanceTime`, `travel`, `buy`, `sell`,
      `talkTo`, `resolveEncounter`, `rest`.
- [ ] Rejections return the original state plus a reason; never throw for expected
      failure.
- [ ] Domain event union with stable shapes and a monotonically increasing sequence.
- [ ] Tests: each command's success and rejection path.

**Acceptance:** no command mutates its input state (deep-freeze test).

### M1-T07 — Save, load, migrations

- [ ] `serialize` / `deserialize` with `saveVersion`, `engineVersion`, `savedAt`.
- [ ] Migration chain with an example migration from a fixture v0 save.
- [ ] Corrupt saves produce a typed error, not a crash.
- [ ] Tests: round-trip equality, migration fixture, corrupt input.

**Acceptance:** `load(save(s))` deep-equals `s` for two different states.

### M1-T08 — Scenario runner

- [ ] Scenario JSON: initial state overrides, command list, assertions on state and
      events.
- [ ] Runner executable from Vitest; prints a trace on failure.
- [ ] One end-to-end fixture scenario covering time, a market trade, travel start, and
      save/load.
- [ ] `tools/simulate.ts` runs a scenario by name.

**Acceptance:** the fixture scenario passes; changing a seed or expected value makes it
fail with a readable diff.

## Demo script

```
pnpm test
pnpm content:lint
pnpm check
```

Narrate: a scripted journey advances the calendar, buys and sells goods, begins travel,
and survives a save round-trip — all without a browser.

## Definition of done

All tasks checked, `pnpm check` green, `STATUS.md` advanced to M2, `WORKLOG.md` updated.
