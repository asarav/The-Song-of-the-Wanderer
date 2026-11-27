# Scaling architecture

How the single-package slice becomes a multi-region, multi-century game without a rewrite.

## 1. Growth model

Planning estimates, used to set budgets — not commitments:

| Dimension | Slice (M3) | Full game |
|---|---|---|
| Regions | 1 | 10 |
| Destinations | 2 | 40–60 |
| Routes | 2 | 120–200 |
| Characters | 10 | 300–500 named |
| Events and storylets | 20 | 800–1,600 |
| Dialogue nodes | 150 | 10,000–20,000 |
| Journal/codex entries | 30 | 1,000+ |
| Player-visible strings | ~8,000 words | 400,000+ words |
| In-world span | 6 months | 300+ years |

The architecture must make these numbers boring. That means indexes, packs, validation,
and tooling — not a bigger `GameState` blob and a longer JSON file.

## 2. Staged repository evolution

Do not build the final structure now. Evolve on triggers.

### Stage A — single package, strict folders (M0–M4)

Current shape. `src/engine`, `src/content`, `src/ui`, `src/store`, `tools`. One Vite app,
one test runner. Engine purity enforced by lint.

### Stage B — engine submodules and content packs (M5–M8)

Still one package, but internal structure hardens:

```
src/engine/
  kernel/       state, commands, events, reduce, ids
  time/         calendar, eras, phases, scheduling
  dsl/          conditions, effects, evaluation, validation
  world/        regions, destinations, routes, propagation, knowledge
  narrative/    scenes, dialogue, storylets, arcs, director
  characters/   lifecycle, itineraries, recurrence, lineages, recognition
  society/      factions, obligations, conflicts
  culture/      languages, scripts, customs, names, interpreters
  economy/      goods, markets, contracts, transport
  journal/      entries, index, codex, map knowledge
  save/         serialise, migrations, integrity
  testing/      scenario runner, invariants, fixtures
src/content/
  packs/core/            calendars, goods taxonomy, languages, name banks
  packs/levant/          Ugarit and the Levant
  packs/cyprus/
  ...
src/studio/              dev-only inspector and graph viewers
```

Each engine submodule exports a narrow surface. No submodule reaches into another's
internals; cross-cutting work goes through kernel types.

### Stage C — pnpm workspace (when a trigger hits)

Split only if at least one is true:

- typecheck or test suite exceeds 60 seconds locally,
- the studio bundle is more than twice the game bundle,
- a CLI or tool needs the engine without React,
- content exceeds 5,000 entities,
- more than one deployable target exists.

Then:

```
packages/engine/        pure TS, zero React
packages/content-core/  schemas, shared packs, validators
apps/game/              React + Vite
apps/studio/            dev inspector
tools/                  CLI wrappers
```

The split is mechanical because folder boundaries already match package boundaries. Do not
split for aesthetics.

## 3. Module map

| Module | Responsibility | Must not |
|---|---|---|
| `kernel` | State shape, commands, events, reducer, IDs | Know about specific content |
| `time` | Calendar, eras, phases, scheduling | Format dates for UI |
| `dsl` | Condition/effect schemas and evaluation | Contain story-specific atoms |
| `world` | Regions, destinations, routes, propagation, facts, knowledge | Own character arcs |
| `narrative` | Scenes, dialogue, storylet selection, arc director | Mutate world facts directly |
| `characters` | Lifecycle, itineraries, recurrence, lineages, recognition | Own markets or routes |
| `society` | Factions, obligations, conflicts, access | Own personal relationships |
| `culture` | Languages, scripts, customs, naming, interpreters | Own dialogue content |
| `economy` | Goods, prices, contracts, transport | Simulate a full economy |
| `journal` | Entries, index, codex, map read models | Read world truth instead of knowledge |
| `save` | Serialise, migrate, validate | Contain gameplay rules |

Dependency direction is one-way:

```
kernel ← time ← world ← narrative
              ↖ characters ↗
kernel ← dsl ← everything
save depends on kernel + migrations only
ui → store → engine (never the reverse)
```

## 4. Content packs

Content is organized into packs with manifests:

```json
{
  "id": "pack.levant",
  "contentVersion": 3,
  "regions": ["region.levant"],
  "requires": ["pack.core"],
  "entities": {
    "destinations": ["ugarit", "ras-shamra-port"],
    "characters": ["amnit", "harbour-master", "..."],
    "events": ["..."],
    "dialogues": ["..."],
    "codex": ["..."]
  }
}
```

Rules:

- `pack.core` holds shared calendars, goods taxonomy, language families, name banks, and
  UI-neutral reference data. Everything may depend on it.
- Packs may depend on other packs, but the dependency graph is acyclic and validated.
- Cross-pack references are validated at build time; runtime lookup uses a merged index.
- Packs are loaded lazily per region in production. The studio loads everything.
- A pack has its own coverage report and can be disabled for tests.
- Content versions are independent of save versions. Saves record the pack versions they
  were created with for diagnostics; migrations handle structural change.

## 5. State partitioning and derivation

`GameState` is not one flat blob of world truth. It is split by rate of change and by
ownership. Entity shapes are canonical in `DATA_MODEL.md`; this is the save partition:

```ts
GameState = {
  meta: { saveVersion, engineVersion, contentVersions, seed }
  calendar: { day }
  world: WorldState            // phases, climate, deltas, facts, routes, waypoints, migrations
  player: PlayerState          // identity, location, resources, deeds, reputation, languages
  knowledge: KnowledgeState    // facts learned, rumors, map, index entries
  narrative: NarrativeState    // arcs, characters, factions, pending scene, cooldowns
  rng: RngState
}
```

Derivation rules:

- Untouched regions are derived from the timeline; only deltas are stored.
- `DayContext` = calendar + phases + climate + observances + active events + knowledge.
- Destination display state = region phase + destination delta + local events.
- Route display state = route definition + route state + waypoint state + knowledge.
- Character display state = def + runtime status + itinerary + fame + knowledge.
- Market prices = authored band + modifiers + deterministic jitter.
- Never persist a derived value. If a save contains one, a migration or a test removes it.

This keeps saves small and makes content patches apply to untouched regions safely.

## 6. Save format and migrations

See ADR-0005. Summary:

- One envelope, versioned. `saveVersion` is global; migrations are ordered.
- Migrations are pure functions from old state to new state, tested against fixtures.
- A golden save corpus is created at the end of every milestone and kept in
  `src/engine/save/__fixtures__/`.
- CI loads every golden save through the full migration chain on every commit.
- Content pack versions are recorded for diagnosis, not for load gating.
- Corruption produces a typed error and a readable recovery message; never a blank screen.

## 7. Performance budgets

| Budget | Target | Measured in |
|---|---|---|
| Cold load, one region | < 2 s | M2, M8 |
| Pack load | < 300 ms | M8 |
| Save/load | < 100 ms | M2, M8 |
| Save size, full game | < 8 MB | M16 |
| UI interaction response | < 100 ms | M2 onward |
| Memory, full game | < 500 MB | M18 |
| Headless 200-year run | < 30 s | M8 |
| Content validation | < 10 s | M8 |

Breaching a budget is a milestone bug, not a polish task.

## 8. Testing at scale

### Tier 1 — every commit

- typecheck, lint, unit tests
- schema validation for changed packs
- fast scenario suite (the slice plus one scenario per recent feature)

### Tier 2 — every merge to main

- full content validation and referential integrity
- full scenario suite
- continuity and coverage reports
- save round-trip and migration corpus
- deterministic replay of three seeded runs

### Tier 3 — nightly

- long-run simulation: 200 years × 10 seeds with invariants
- persona auto-play: trader, curious traveler, helper
- reachability analysis and orphan report
- prose lint and locale extraction
- performance budgets

### Tier 4 — per wave

- human playtests across two regions
- historical review of new `documented` content
- save-compatibility matrix from every public build
- accessibility audit

## 9. Dependency and bundle policy

- The engine has zero runtime dependencies except Zod for schemas. No date library, no
  utility belt, no state library.
- React, Zustand, and Zod are the only core app dependencies. Add others only with a
  one-line justification and an ADR if they are hard to remove.
- Dev-only libraries do not enter the game bundle.
- Bundle target for the slice: < 500 kB gzipped. Full game: lazy-load packs; initial
  bundle under 2 MB.
- No CSS framework until the visual language is settled; graybox CSS is intentional.

## 10. Localisation and accessibility readiness

- All player-visible text lives in content or `src/ui/strings.ts`; no inline JSX strings.
- Named `{{placeholders}}`, no positional interpolation.
- No concatenated sentences for grammar; write variants.
- Text expansion budget: +40% for German, +30% for French/Spanish, −20% for Chinese/Japanese.
- UI must survive 200% text size from M18; test at 150% from M2.
- Color is never the only indicator; use text and shape.
- Dialogue log and subtitles are structural, not bolt-ons.
- Locale extraction and placeholder checks run in CI from M8.

## 11. Scaling triggers and review points

Revisit this document at the end of each wave:

- End of M4: confirm Stage A is still adequate; estimate content volume from slice ratios.
- End of M8: decide whether Stage C split is triggered; record in an ADR.
- End of each region milestone: pack size, load times, coverage, save size.
- End of M16: full-world performance and save budget review.

If a budget is breached, fix the architecture before adding content. Adding regions to a
slow or incoherent core is how narrative games die.
