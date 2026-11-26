# Development plan

**Status:** living document · **Owner:** whoever holds `docs/STATUS.md` · **Updated:** M0

## 1. What we are building

A long-form narrative travel RPG for PC/Steam. The player is a merchant in the Late
Bronze Age who moves between cultures, trades goods, learns languages, builds
relationships, and witnesses — and gently alters — the lives caught up in the collapse
of the old networks. The protagonist does not age normally; the game never explains why.

The full specification is `The Song of the Wanderer Spec.md`. This plan does not restate
it. It defines **what we build, in what order, and how we know it works**.

## 2. Strategy

Prove the loop on one small journey before building a world.

The vertical slice is **Ugarit → Cyprus, c. 1230 BCE**. It contains one complete pass
through every core system: arrival, market, dialogue, relationship, language, route
preparation, travel encounters, a recurring character, a refugee thread, a mystery beat,
journal, save/load, and visible time passing.

If the slice is not enjoyable, no amount of regional content will save the game. M4 is a
genuine go/no-go gate.

## 3. Milestone board

| ID | Milestone | Outcome | Status |
|---|---|---|---|
| M0 | Bootstrap | Docs, agent skills, toolchain, app shell | **Done** |
| M1 | Engine spine | Deterministic state, time, RNG, DSL, content registry, saves, scenario harness | Next |
| M2 | Slice systems + greybox UI | Market, inventory, routes, travel, encounters, dialogue, journal, language, relationships | Planned |
| M3 | Slice content | Ugarit and Cyprus authored end to end | Planned |
| M4 | Playtest and evaluation | Evidence for the spec's seven questions; go/no-go | Planned |
| M5 | Stage 2 — core experience | Travel/encounter variety, arcs, faction depth, journal/map polish | Planned |
| M6+ | Stage 3–6 | Regional expansion (Egypt, Nubia, Red Sea, Mesopotamia, Iran, South Asia, China), transformation, endgame, polish | Planned |

Each milestone has a file in `docs/milestones/` with task IDs, acceptance criteria, a
demo script, and explicit non-goals. Work is claimed one task at a time.

## 4. Milestone summaries

### M0 — Bootstrap

Toolchain (Vite, React, TypeScript strict, Vitest, ESLint with an engine-purity rule),
folder boundaries, content linter scaffold, CI, this documentation system, four agent
skills, and a greybox app shell. No game systems.

### M1 — Engine spine

The load-bearing layer. `GameState` and its Zod schemas; a day-based calendar; named,
serializable RNG streams; the condition/effect DSL; a content registry with referential
integrity; a command dispatcher returning domain events; versioned save/load with
migrations; a headless scenario runner. All of it testable without a browser.

Exit criterion: a scripted multi-step scenario produces a deterministic final state, and
a save round-trip is byte-identical at the state level.

### M2 — Slice systems + greybox UI

Inventory and capacity, transport, market pricing and transactions, route graph and
travel preparation, journey resolution with eligible encounters, the dialogue runner,
journal and codex plumbing, language XP and tiers, character and faction relationships,
delayed effects, and the Zustand adapter. Screens are greybox but functional.

### M3 — Slice content

Two destinations, a small cast with one recurring traveller, a language example, a
faction example, a refugee micro-arc with a delayed consequence, one recognition/
mystery encounter, and the journal/codex entries that make it legible. Provenance on
every historical element; dossiers for both destinations.

### M4 — Playtest and evaluation

Three recorded playthroughs with different priorities (trader, curious traveller,
helper). Written findings against the spec's seven questions in §22.1. Balance and
clarity pass. Decision: expand (M5), revise, or stop.

### M5+ — Production

Follow spec §22.2 Stages 2–6. Expand region by region: Egypt and the Nile, Nubia and the
Middle Nile, the Red Sea and Punt, Mesopotamia, the Iranian plateau, South Asia, and the
Late Shang world. Each region is gated on a completed dossier set, not on a calendar.

## 5. Architecture in one page

```
React screens (src/ui)
      │  read state, dispatch intents
Zustand store (src/store)
      │  dispatch(command)
Pure engine (src/engine)
      │  reduce(state, command) -> { state, domainEvents }
Content registry (src/content, Zod-validated JSON)
```

- **Commands** are the only way state changes: `travel`, `buy`, `sell`, `choose`,
  `advanceTime`, `resolveEncounter`, `save`, `load`.
- **Domain events** are outputs: `Arrived`, `GoodsPurchased`, `LanguageImproved`,
  `RelationshipChanged`, `JournalEntryAdded`, `EventScheduled`. The UI and journal
  react to them; they never mutate state.
- **Conditions and effects** are serializable JSON with a closed vocabulary. If a scene
  needs something the DSL cannot express, the DSL is extended deliberately, with tests
  and an ADR — not with a content-side script.
- **Determinism**: no wall clock, no `Math.random`, no DOM. RNG streams are named and
  their state is saved.

Full detail: `ARCHITECTURE.md`.

## 6. Content pipeline

1. **Design note** — what this place/person/event is for, in `docs/design/`.
2. **Dossier** — the ten sections from spec §25, evidence-tagged, in
   `docs/design/dossiers/`.
3. **Data** — JSON entities, IDs namespaced, provenance required.
4. **Lint** — schema, references, provenance, unreachable dialogue.
5. **Scenario test** — at least one scripted path through the new content.
6. **Review** — historical accuracy gate for anything not tagged `fictional`.

Rules: `CONTENT.md` and `HISTORY.md`.

## 7. Scope gates

Every proposed feature must pass spec §21 and answer all of these:

1. Which design pillar does it serve?
2. What decision does the player make with it?
3. Which slice scene or milestone task needs it now?
4. What do we cut to pay for it?

If any answer is missing, the feature is deferred. Explicitly out of scope: strategy,
city management, economic simulation, open-world movement, mandatory combat, survival
meters, crafting trees, generic god-favour meters, live generated story content.

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scope expands faster than content | High | Slice gate, §21 gate, one region at a time |
| Engine over-engineering | Medium | Closed DSL, no ECS, one-day rule per mechanic |
| Historical drift or false certainty | Medium | Dossier-first, provenance lint, `HISTORY.md` review gate |
| Context loss between agents | High | `STATUS.md` discipline, milestone-scoped tasks, task-ID commits, ADRs |
| Save breakage during churn | Medium | Versioned saves and migrations from M1 |
| Art/audio blocks development | Medium | Asset IDs with labelled placeholders; no build depends on art |
| Writing volume overwhelms systems | High | Prose budgets per destination; authoring templates; reusable scene patterns |
| Tone drifts to grimdark or generic fantasy | Medium | Tone notes in `docs/design/03-acts.md`; review every destination intro |

## 9. Release path

- **Now:** browser build via Vite. Fast iteration, easy automated testing.
- **Slice proven:** wrap in Tauri for a desktop build (small binary, Steam-friendly).
  This is a packaging change, not an engine change.
- **Escape hatch:** if the game later needs heavy 2D animation or a scene editor, Godot
  is the fallback. The data model and content are engine-agnostic by design, so a port
  is costly but not a rewrite of the world.

## 10. Document map

- `STATUS.md` — where we are right now.
- `ARCHITECTURE.md` — how the code is shaped.
- `CONTENT.md` — how to author content.
- `HISTORY.md` — how to research and tag history.
- `design/` — distilled world truth.
- `milestones/` — what to do next and how to know it is done.
- `DECISIONS/` — why we chose what we chose.
