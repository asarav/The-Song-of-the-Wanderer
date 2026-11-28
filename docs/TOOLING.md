# Tooling and quality utilities

The game is a content project. The difference between a coherent world and an
unmaintainable pile of JSON is the tooling. These are first-class deliverables with
acceptance tests, not side projects.

## 1. Principles

1. **Machine-readable output.** Every check supports `--json` and a stable exit code, so
   CI and agents can consume it.
2. **Same rules everywhere.** The linter, the registry, the studio, and the tests share
   one set of schemas and validators. No second implementation.
3. **Read-only by default.** Tools never edit content. Generators create new files; nothing
   silently rewrites prose.
4. **Fast feedback first.** Tier 1 checks run in seconds; expensive analysis is nightly or
   on demand.
5. **Explain the failure.** Every error names the file, the ID, and the rule broken.

## 2. Tool catalog

| Command | Purpose | Milestone | Status |
|---|---|---|---|
| `pnpm content:lint` | Schema, IDs, provenance, references, script readings, player-facing copy | M0 (shallow) → M1 (full) | Scaffold |
| `pnpm content:build` | Validate all packs, generate indexes and TS types | M1, extended M5 | Planned |
| `pnpm typecheck` / `lint` / `test` | Code health | M0 | **Done** |
| `pnpm simulate -- --scenario <id>` | Run a headless scenario | M1 | Planned |
| `pnpm playtest:build` | Replay checkpoint scenarios into browser-loadable saves (`playtest.html`) | M4 | **Done** |
| `pnpm save:inspect <file>` | Human-readable state dump | M1 | Planned |
| `pnpm save:diff <a> <b>` | Diff two saves by entity | M8 | Planned |
| `pnpm save:migrate <file> --to <v>` | Apply migrations to a save | M1, extended | Planned |
| `pnpm timeline:validate` | Phase gaps, overlaps, orphan follow-ups | M5 | Planned |
| `pnpm timeline:view` | HTML timeline of phases and events | M8 | Planned |
| `pnpm content:graph` | Export dialogue, arc, route, and event graphs | M8 | Planned |
| `pnpm content:coverage` | Unreachable scenes, orphan characters, missing phase content | M8 | Planned |
| `pnpm content:continuity` | Fact contradictions, dates, ages, locations, dead speakers | M6, hardened M8 | Planned |
| `pnpm simulate:long -- --years 200 --seeds 10` | Fast-forward the world, assert invariants | M8 | Planned |
| `pnpm simulate:personas` | Auto-play trader, curious, helper | M8 | Planned |
| `pnpm balance` | Monte Carlo markets, travel durations, language pacing | M8 | Planned |
| `pnpm new:pack` / `new:destination` / `new:character` / `new:arc` / `new:event` | Scaffold from templates | M8 | Planned |
| `pnpm model:check` | Wants reach scenes, contracts, choice ids, callbacks, ties, terminal flags | M4b | **Done** |
| `pnpm prose:lint` | First person in narration, anachronisms, beat length, voice ceilings, probe-only nodes | M4b | **Done** |
| `pnpm price:check` | Every named price matches a money effect, or is allowlisted with a reason | M4b | **Done** |
| `pnpm content:guard` | Mechanics fingerprint; prose edits free, mechanics need `--update --reason` | M4b | **Done** |
| `pnpm invariant:check` | Gate tax, room, lesson, cloth, toll, rope and route unlock by choice id | M4b | **Done** |
| `pnpm task:brief` | Active task, acceptance, tree, recent changes, gates, scenarios | M4b | **Done** |
| `pnpm ask "words"` | Full-text over content, scenarios and docs with file:line | M4b | **Done** |
| `pnpm entity <id>` | Definition, source file, wants, ties, scenes, node ids | M4b | **Done** |
| `pnpm flag <flag>` / `pnpm impact <id>` | Writers and readers; reverse dependencies by area | M4b | **Done** |
| `pnpm content:workbench <id>` | Mechanics, ids, flags, scenarios, prose and guard in one view | M4b | **Done** |
| `pnpm scene:preview <id>` | Visible text and answers with flags, regard and language forced | M4b | **Done** |
| `pnpm manuscript [character]` | Read every scene as a script, no save or browser | M4b | **Done** |
| `pnpm coverage:choices` | Nodes and answers no checked-in scenario touches | M4b | **Done** |
| `pnpm affected` | Changed files → exact checks to run | M4b | **Done** |
| `pnpm docs:sync` / `docs:check` | Generated cast, facts, flags, scenes and prices; verified, not remembered | M4b | **Done** |
| `pnpm new:dialogue <id> <speaker>` | Contract skeleton that fails the model gate until filled | M4b | **Done** |
| `pnpm art:ledger` | Beat plates missing, stale ledger keys, debt total | M4b | **Done** |
| `pnpm task:finish` | check, build, content gates and docs, then the close-out checklist | M4b | **Done** |
| `pnpm locale:extract` / `locale:check` | String catalog and placeholder validation | M8 | Planned |
| `pnpm assets:check` | Missing asset IDs, fallback coverage | M8 | Planned |
| `pnpm audio:build` | Download/cache CC0 beds, generate original cues, normalize, write the audio manifest | M4 exploratory / M18 final | **Done (exploratory)** |
| `pnpm audio:check` | Audio IDs, files, loop flags, licenses, source records | M4 exploratory | **Done** |
| `pnpm perf:budget` | Load, save, memory, pack size | M8 | Planned |
| `pnpm studio` | Development inspector and graph viewer | M8 | Planned |

Every gate's predicate has a deliberately broken fixture in `tools/gates.test.ts`, run by
`pnpm test`. Fixtures live only in that file: they cannot enter a pack, the manuscript or
a generated table, and a gate that stops checking fails the suite by expected message.

## 3. Content studio

A dev-only web app (or a guarded route in the game) for inspection and debugging. Read-only
at first; editing stays in files so diffs and reviews stay honest.

### 3.1 Entity browser

- Search by ID, type, region, phase, tag.
- Show references in and out (who mentions this character/event/route).
- Jump to source file and line.
- Show provenance and review status.

### 3.2 Graph viewers

- **Dialogue graph** — nodes, choices, conditions, language variants, dead ends.
- **Arc graph** — beats, branches, resolutions, failure states, successor links.
- **Route graph** — the travel map with modes, requirements, and phase availability.
- **Timeline** — eras, regional phases, world events, and their propagation arrows.
- **Faction graph** — obligations, conflicts, control.

### 3.3 State inspector

- Load a save or start at any date.
- View world truth and player knowledge side by side.
- Inspect a destination's derived state, market modifiers, available activities, cast.
- Inspect a character's itinerary, status, arc stage, relationships, beliefs.
- Explain why an event is eligible or not: which condition atom failed.
- Jump the calendar and re-evaluate.

### 3.4 Scene preview

- Run a scene without playing the whole game.
- Force language tiers, relationship bands, flags, and phase.
- See which choices appear and why.

### 3.5 Coverage and continuity dashboards

- Heat map of content per destination per phase.
- Orphaned characters, unreachable events, arcs without resolutions.
- Continuity violations with links to the offending entities.
- String coverage and locale gaps.

## 4. Validation pipeline

Layered, cheapest first:

| Layer | Checks | Runs |
|---|---|---|
| 1. Syntax | JSON parses; no duplicate keys | Every change |
| 2. Schema | Zod validation; unknown keys rejected | Every change |
| 3. Identity | ID format, uniqueness, filename match | Every change |
| 4. References | Every ID resolves; no cross-pack cycles | Every change |
| 5. Provenance | Confidence vocabulary; sources present for historical claims | Every change |
| 6. Temporal | Dates within phases; no impossible ages; follow-ups resolve | Merge |
| 7. Continuity | Facts, locations, statuses, objects, arcs | Merge |
| 8. Coverage | Reachability, orphans, phase completeness | Merge/nightly |
| 9. Playability | Scenario suite; persona runs | Merge/nightly |
| 10. Presentation | Prose lint, locale, assets, perf | Nightly/wave |

A commit that fails layer 1–5 cannot merge. Layer 6–9 failures block a wave gate, not
necessarily every commit, but are reported continuously.

## 5. Coverage report

For each pack and region:

- destinations with no content in one or more phases,
- destinations missing climate, culture, language, religion, architecture, economy, or
  currency profiles,
- routes without segments or waypoints; waypoints without encounters or knowledge,
- events never eligible in any tested state,
- scenes unreachable from any event, activity, or route,
- dialogue nodes with no inbound path,
- characters never placed by any itinerary,
- characters missing position, allegiance, wants, fears, or reaction rules,
- characters appearing once with no narrative function,
- factions missing interests, territory, obligations, or phase states,
- major arcs with no reachable resolution,
- storylet pools with fewer than N entries,
- observances without a calendar; works without variants or knowledge paths,
- islands in the route graph,
- languages with no learning path,
- goods with no market,
- journal/codex entries never granted,
- historical entities without provenance,
- shared profiles copied into a local entity instead of referenced.

Coverage is not "100% or fail". It is a map of where the world is thin.

## 6. Simulation

### 6.1 Scenario runner

A scenario is a JSON file:

```json
{
  "id": "scenario.slice.crossing",
  "seed": "slice-001",
  "start": { "date": "1230-04-01", "location": "dest.ugarit", "money": 120 },
  "commands": [
    { "type": "buy", "item": "good.grain", "quantity": 4 },
    { "type": "travel", "route": "route.ugarit-cyprus", "mode": "mode.open" },
    { "type": "resolveEncounter", "choice": 0 }
  ],
  "assert": [
    { "path": "player.location", "equals": "dest.cyprus" },
    { "path": "narrative.relationships.char.ugarit.amnit.trust", "equals": 2 }
  ]
}
```

Paths are read against the state with dotted segments. A key may itself contain dots
(`narrative.relationships` is keyed by character id), so the resolver matches the longest
key at each step instead of splitting blindly. Choices are addressed by **stable id** (`chooseChoice {choiceId, dialogue, node}`).
Numeric `chooseDialogue` remains for compatibility, but a scenario that names an answer
must not start testing a different one when prose reorders the list. A missing id is
rejected with the pending node and the available ids.

The runner prints a trace on failure and supports snapshot assertions on state and events.
`pnpm simulate -- slice-crossing` runs `src/engine/scenarios/slice-crossing.json` against
the authored content.

### 6.2 Long-run simulation

Fast-forwards the authored timeline with no player:

- advances day by day (or in safe jumps),
- fires scheduled and condition-driven events,
- propagates to regions, markets, routes, factions, characters,
- generates descendants at time jumps,
- checks invariants every N days.

Invariants:

- no character in two places,
- no dead character acting,
- no event before its date or outside its phase,
- no route in use while closed,
- no migration without origin and destination,
- no fact contradicted without an authored revision,
- prices within authored bands,
- every phase reachable and exited,
- no unbounded event loops,
- save/load equality at random checkpoints.

### 6.3 Persona auto-play

Three simple policies exercise content:

- **Trader** — maximizes profit, minimizes risk, ignores mystery.
- **Curious** — explores, talks, learns languages, follows rumors.
- **Helper** — accepts costs to help characters and refugees.

Reports: destinations visited, scenes seen, arcs advanced, languages reached, money curve,
time spent, content seen vs authored. Used for pacing and coverage, not as a substitute
for human play.

### 6.4 Balance

Monte Carlo over seeds:

- market price distributions and arbitrage outliers,
- route duration and risk distributions,
- language tier timing under normal play,
- contract profitability,
- travel frequency and time-to-next-destination.

## 7. Authoring generators

`pnpm new:*` creates files from templates with valid IDs, provenance stubs, and TODO
markers that the linter recognizes:

- `new:pack` — manifest, folders, README.
- `new:destination` — entity, dossier stub, scenario stub, route placeholders.
- `new:character` — brief, entity, itinerary stub.
- `new:arc` — arc definition with three beats and a failure state.
- `new:event` — event envelope, scene stub, scenario stub.
- `new:region` — phase table stub, pack manifest, route joint placeholders.

Generators never invent canon. Every generated prose field is `TODO:` and fails a
"no placeholders in shipped content" check.

## 8. Prose and locale tools

### 8.1 Prose lint

- anachronism list (modern technology, bureaucracy, psychology, economics),
- banned register (thee/thou, "okay", "unit", "sir" outside appropriate contexts),
- repeated sentence openings and filler,
- readability and sentence length outliers,
- "as you know" exposition markers,
- mystery violations ("you are a god", definitive claims),
- modern national identities applied to ancient peoples.

### 8.2 Locale

- extract every string with a stable key,
- detect hard-coded JSX strings,
- validate placeholders match across locales,
- detect text expansion overflow in key screens,
- keep a glossary of names and forms of address that must not be translated literally.

## 9. Save tools

- **inspect** — readable dump by slice, with unknown fields highlighted.
- **diff** — entity-level differences, including derived-vs-stored warnings.
- **migrate** — apply the chain to a fixture; supports dry run.
- **fuzz** — random command sequences, save/load every N commands, assert equality.
- **corpus** — golden saves from every milestone, loaded in CI.

## 10. Asset manifest

Content references `art.*` and `audio.*` IDs. The manifest maps IDs to files and fallback
descriptors. Missing assets render a labeled placeholder in dev and a neutral fallback in
production. `assets:check` fails if a shipped scene references an unknown asset without a
fallback.

The exploratory audio manifest is `assets/audio/manifest.json`, with `audio:check` as its
offline gate. `audio:build` is the authoring path and needs ffmpeg and network access; a
playthrough needs neither.

## 11. CI tiers

| Tier | When | Contents | Budget |
|---|---|---|---|
| 1 | Every commit | typecheck, lint, unit, changed-pack schema, fast scenarios | < 60 s |
| 2 | Merge to main | full validation, continuity, coverage, save corpus, 3 seeded replays | < 10 min |
| 3 | Nightly | long-run 200y × 10, personas, balance, prose, locale, perf | < 60 min |
| 4 | Wave gate | human playtests, historical review, accessibility, full save matrix | manual |

## 12. Tool acceptance criteria

A tool is done when:

- it has a single documented command,
- it supports `--json`,
- it has a non-zero exit code on failure and zero on success,
- its rules are shared with the runtime where applicable,
- it has tests, including a deliberately broken fixture,
- it never mutates content unless it is an explicit generator,
- it is documented in this file and in `AGENTS.md` if used every session.

## 13. Build order

| Milestone | Tools |
|---|---|
| M1 | content:build, simulate, save:inspect, save:migrate, full content:lint |
| M5 | timeline:validate, propagation trace, phase inspection in tests |
| M6 | content:continuity v1, recurrence auditor, arc validation |
| M7 | faction/culture/economy validators, balance v1 |
| M8 | studio, coverage, long-run, personas, graph exports, generators, prose/locale/assets/perf |

Tools not listed for a milestone are not built early. If a check is needed sooner, add it
to an existing tool.
