---
name: SotW Save Format and Migrations
description: Work on save/load, serialisation, migrations, golden saves, fuzzing, and save integrity for The Song of the Wanderer. Use when changing GameState, persistence, versioning, or debugging a save.
---

# Save format and migrations

Read `docs/ARCHITECTURE.md` §3, §6 and `docs/SCALING.md` §5–6 before touching saves. This
skill is the working procedure.

## Core rules

- The engine is pure. Serialisation and migration are pure functions.
- One global save version with an ordered migration chain.
- Persist deltas and learned knowledge, never derived values.
- A corrupt save produces a typed error and a readable message, not a crash.
- Content pack versions are recorded for diagnosis, not for load gating.

## Save envelope

```ts
type SaveFile = {
  saveVersion: number
  engineVersion: string
  contentVersions: Record<PackId, number>
  savedAt: string              // informational only
  state: GameState
}
```

## State partition

```ts
GameState = {
  meta, calendar, world, player, knowledge, narrative, rng
}
```

Only authored deltas and learned knowledge are persisted. Untouched regions derive from
the timeline. Destination display state, prices, presence, and `DayContext` are never
stored.

## Before changing a persisted field

1. Decide whether it is definition, state, view, or knowledge.
2. If it is a view, do not add it to `GameState`.
3. If it is state, update the schema, the initial state, and the migration chain.
4. If it changes an existing field, write a migration and a fixture.
5. Add a round-trip test.

## Migrations

- Migrations are pure functions from old state to new state.
- They are ordered by save version.
- Each migration has a fixture representing the old version.
- A migration must be reversible in intent even if the code is one-way.
- Never edit a save by hand to avoid a migration.
- If a content patch changes an untouched region, that is intended; facts and event
  history protect authored events that already happened.

## Golden saves

- Create a golden save at the end of every milestone.
- Store fixtures under `src/engine/save/__fixtures__/`.
- CI loads every golden save through the full migration chain on every merge.
- A golden save is a regression artefact, not a save slot.

## Fuzzing

- Random command sequences should save and load every N commands.
- Assert deep equality after load.
- Record the seed and command log on failure.
- Fuzz failures are treated as engine bugs, not test flakiness.

## Save tools

- `pnpm save:inspect` — readable dump by slice, with unknown fields highlighted.
- `pnpm save:diff` — entity-level differences, including derived-vs-stored warnings.
- `pnpm save:migrate` — apply the chain to a fixture; supports dry run.

## Debugging a save

1. Inspect the save with `save:inspect`.
2. Check `saveVersion`, `engineVersion`, and content versions.
3. Compare derived values against stored values.
4. Check for unknown fields or schema drift.
5. Reproduce with the migration fixture, not a hand-edited save.
6. If corruption is suspected, produce a typed error and recovery message.

## Common mistakes

| Symptom | Fix |
|---|---|
| Save grows every patch | A derived value is being stored |
| Migration fails only in production | Fixture does not match the real old shape |
| Unknown field ignored | Validation is too loose |
| Save size too large | Store deltas, not full region state |
| Replay differs after load | RNG stream or scheduled event was not persisted |
| Content patch changes an in-progress story | Protect authored events with facts and event history, not cached display state |

## Checklist

- [ ] Schema updated and validated.
- [ ] Initial state updated.
- [ ] Migration written and tested.
- [ ] Golden fixture added or updated.
- [ ] Round-trip test passes.
- [ ] Fuzz scenario covers the changed path.
- [ ] `pnpm check` passes.
