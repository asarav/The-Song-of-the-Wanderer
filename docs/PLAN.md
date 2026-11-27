# Development plan

**Status:** living document · **Owner:** whoever holds `docs/STATUS.md` · **Updated:** M0
**Horizon:** vertical slice → full multi-region, multi-century game

## 1. What we are building

A long-form narrative travel RPG for PC/Steam. The player is a merchant in the Late
Bronze Age who moves between cultures, trades goods, learns languages, builds
relationships, and witnesses — and gently alters — the lives caught up in the collapse
of the old networks. The protagonist does not age normally; the game never explains why.

The specification is `The Song of the Wanderer Spec.md`. This plan defines **what we
build, in what order, how the systems scale, and how we know each stage works**.

## 2. Strategy

Four movements, each with a hard gate:

1. **Prove the loop** on one small journey (M0–M4). Ugarit → Cyprus.
2. **Build for scale** before adding regions (M5–M8): world time, event propagation,
   character arcs, lineages, knowledge, and the authoring/QA tooling that keeps a large
   world coherent.
3. **Fill the world** region by region, each with its full chronology authored from the
   start (M9–M14).
4. **Break it, rebuild it, end it** (M15–M17), then production (M18–M19).

The slice is not a miniature of the final architecture. It is a vertical cut through it.
M5–M8 generalise the slice's systems without rewriting its content: every new engine
feature must first be proven by re-expressing existing slice content through it.

## 3. Milestone board

### Wave 0 — Prove the loop (M0–M4)

| ID | Milestone | Outcome | Status |
|---|---|---|---|
| M0 | Bootstrap | Docs, skills, toolchain, shell | **Done** |
| M1 | Engine spine | Deterministic state, time, RNG, DSL, registry, saves, scenarios | **Done** |
| M2 | Slice systems + graybox UI | Market, travel, dialogue, journal, language, relationships | **Done** |
| M3 | Slice content | Ugarit and Cyprus authored end to end | **Done** |
| M4 | Playtest and evaluation | Evidence for the seven slice questions; go/no-go | **In progress — human sessions blocked** |

### Wave 1 — Build for scale (M5–M8)

| ID | Milestone | Outcome | Status |
|---|---|---|---|
| M5 | World model and timeline | Eras, regional phases, world/regional/local events, propagation, truth vs knowledge | Blocked by Gate A |
| M6 | Characters, arcs, lineages | Lives that continue off-screen; recurring cast; generations | Blocked by Gate A |
| M7 | Society, culture, economy | Factions, obligations, languages, customs, trade networks at scale | Blocked by Gate A |
| M8 | Authoring and QA utilities | Content studio, coverage, continuity, long-run simulation, prose/locale tools | Blocked by Gate A |

### Wave 2 — Fill the world (M9–M14)

| ID | Milestone | Outcome | Status |
|---|---|---|---|
| M9 | Act I — Eastern Mediterranean | Aegean, Anatolia, inland Levant, deeper Cyprus; the connected world | Planned |
| M10 | Egypt and the Nile | Multiple Egyptian destinations; court, temple, army, frontier | Planned |
| M11 | Nubia, Red Sea, Punt | Southern expansion; river and maritime networks; Punt's uncertainty | Planned |
| M12 | Mesopotamia and Iran | Urban commerce, temple economies, caravan corridors | Planned |
| M13 | South Asia | Post-urban Indus worlds; regional polities; early Vedic traditions | Planned |
| M14 | China | Late Shang Anyang and the transition toward Zhou | Planned |

Each region milestone delivers its **whole chronology** — phases, events, cast arcs,
route changes, phase-specific destination content — not just its opening state.

### Wave 3 — Transformation and endings (M15–M17)

| ID | Milestone | Outcome | Status |
|---|---|---|---|
| M15 | The Breaking (Acts II–III) | Authored collapse waves, route loss, migrations, character fates, record preservation | Planned |
| M16 | New Roads and Long Memory (Acts IV–V) | Rebuilt networks, generations, descendants, revisits across decades | Planned |
| M17 | Endgame and post-ending | Combined endings, regional variations, continued travel | Planned |

### Wave 4 — Production (M18–M19)

| ID | Milestone | Outcome | Status |
|---|---|---|---|
| M18 | Presentation, accessibility, localisation | Art/audio pipeline, UI polish, access options, translation readiness | Planned |
| M19 | Release engineering | Tauri build, Steam integration, save compatibility, QA, store materials | Planned |

Detailed files exist for M0–M8. M9–M19 are specified in
`docs/milestones/M9-M19-production-waves.md` and split into individual files at the
start of each wave, so late content is planned with the knowledge gained earlier.

## 4. What changes after the slice

The slice can hold its world in its head. The full game cannot. These are the specific
problems Wave 1 solves, and they are the reason M5–M8 exist.

| Problem | Where solved |
|---|---|
| The world must change over 300+ years without one giant script | `WORLD_MODEL.md` §2–4, M5 |
| Distant events must reach the player as rumors, not cutscenes | `WORLD_MODEL.md` §5, M5 |
| The player must be able to believe false things | `WORLD_MODEL.md` §5, ADR-0004 |
| Characters must age, move, die, and have descendants | `NARRATIVE_SYSTEMS.md` §2–4, M6 |
| A character arc must advance across decades and regions | `NARRATIVE_SYSTEMS.md` §3, M6 |
| Local events must feel caused by larger ones | `WORLD_MODEL.md` §6, M5 |
| Every region needs its own institutions, language, and customs | `SCALING.md` §3, M7 |
| Trade must react to politics without an economic simulation | `SCALING.md` §4, M7 |
| Thousands of entities must stay consistent | `TOOLING.md` §2–5, M8 |
| Saves must survive years of content patches | `SCALING.md` §6, ADR-0005 |
| Agents must author at volume without losing the thread | `TOOLING.md`, skills, status protocol |

## 5. Architecture in one page

```
React screens (src/ui)
      │ intents
Zustand adapters (src/store)
      │ dispatch(command)
Pure engine (src/engine)
      ├─ kernel      state, commands, events, reduce
      ├─ time        calendar, eras, phases, scheduling
      ├─ dsl         conditions, effects, validation
      ├─ world       regions, destinations, routes, propagation, knowledge
      ├─ narrative   storylets, scenes, dialogue, arcs, director
      ├─ characters  lifecycle, schedules, recurrence, lineages, recognition
      ├─ society     factions, obligations, conflicts, reputation
      ├─ culture     languages, scripts, customs, names, interpreters
      ├─ economy     goods, markets, contracts, transport
      ├─ journal     entries, index, codex, map knowledge
      └─ save        serialisation, migrations, integrity
Content packs (src/content/packs/<region>)
Shipped tooling (tools/) and dev studio (src/studio)
```

Four load-bearing distinctions:

1. **Truth vs knowledge.** The world has objective state; the player has partial,
   possibly wrong knowledge. The journal, map, character index, and dialogue all read
   knowledge, never truth. (ADR-0004.)
2. **Timeline vs events.** Eras and phases bound what is possible; events change state;
   storylets fill the quiet moments. None of them are scripts. (M5.)
3. **Authored vs derived.** Content is authored; consequences are derived by propagation
   and effects. Nothing is generated live. (ADR-0002.)
4. **Definition, state, view, knowledge.** Every entity has an authored definition, minimal
   saved state, pure derived views, and a knowledge projection. Shared data is referenced,
   not copied; derived values are never saved. (`DATA_MODEL.md`, ADR-0005.)

Full detail: `ARCHITECTURE.md`, `WORLD_MODEL.md`, `NARRATIVE_SYSTEMS.md`,
`SCALING.md`, `TOOLING.md`.

## 6. Content pipeline at scale

1. **Wave brief** — which regions and acts this wave covers, and why now.
2. **Region dossier set** — ten sections per destination, evidence-tagged (spec §25).
3. **Timeline** — era/phase table for the region, with world-event hooks.
4. **Cast and arcs** — major, recurring, local, ambient; each major character has an arc
   with at least one possible resolution.
5. **Destination content** — activities, markets, dialogue, local events per phase.
6. **Route content** — modes, requirements, encounter pools, seasonal/phase changes.
7. **Storylets** — ambient pools that make travel and waiting feel inhabited.
8. **Knowledge pass** — what can the player learn here, from whom, in what form, and how
   does it distort?
9. **Validation** — schema, references, provenance, continuity, reachability, long-run
   simulation.
10. **Playtest** — persona runs plus human sessions; findings feed the next wave.

Rules: `CONTENT.md`, `HISTORY.md`, `WORLD_MODEL.md`, `NARRATIVE_SYSTEMS.md`.

## 7. Gates

### Gate A — slice (end of M4)

The seven questions in spec §22.1 have evidence. If the loop is not enjoyable, revise
before Wave 1. Do not start regional expansion.

### Gate B — scale (end of M8)

- A 200-year headless run passes invariants across ten seeds.
- The slice is fully re-expressed through phases, arcs, and the knowledge model.
- The studio can jump to any date and inspect any region's state.
- A new synthetic region can be added with content only, no engine changes.

### Gate C — region (end of each M9–M14)

- Dossiers complete; provenance clean.
- Every destination has content for every phase it exists in.
- Every major character has an arc with at least one resolution.
- Continuity and coverage reports clean.
- A persona playthrough reaches the region and returns.

### Gate D — transformation (end of M15–M16)

- The collapse is experienced differently in at least three regions.
- No single cause is presented as definitive.
- Every recurring character has a fate path, including disappearance and death.
- Migration chains are traceable from origin to a later appearance.
- A 100-year time jump is legible: journal, character index, and map all explain it.

### Gate E — ending (end of M17)

- At least six ending families reachable by different play patterns.
- No ending confirms or denies the protagonist's divinity.
- Post-ending travel reflects the ending.

### Gate F — release (end of M19)

- Saves migrate across every milestone in the public build.
- Accessibility baseline met.
- Localisation extraction clean; no hard-coded player text.
- Performance budgets met on target hardware.

## 8. Scope discipline

Every feature must pass spec §21 and answer:

1. Which pillar does it serve?
2. What decision does the player make?
3. Which milestone task needs it now?
4. What is cut to pay for it?

Explicitly out of scope at every stage: grand strategy, city or population management,
full economic simulation, physics travel, walkable cities, action combat, survival
meters, crafting trees, procedural civilizations, a universal pantheon, mandatory combat,
class systems, grinding, live generated story.

The scale layer is not an exception. World events are authored, propagation is authored,
and characters are authored. We simulate *consequences*, not history.

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scale systems become a simulator | High | Authored events only; propagation vocabulary closed; Gate B demo |
| Content volume outruns quality | High | Dossiers, prose budgets, coverage reports, one region per milestone |
| Continuity breaks across centuries | High | Facts ledger, continuity linter, long-run simulation, golden saves |
| Saves break with every content patch | High | Versioned saves, migrations, golden save corpus (ADR-0005) |
| Agent context loss at scale | High | STATUS, milestone files, skills, ADRs, small tasks |
| Region content feels interchangeable | Medium | Culture profiles per destination, not per civilization; sensory bibles |
| Collapse becomes one cutscene | Medium | Regional phases, local consequences, rumor latency, no single cause |
| Endings feel like a menu | Medium | State-composed endings, regional variation, thematic families |
| Tooling consumes the project | Medium | Tools are milestone deliverables with acceptance tests, not side quests |
| Art/audio blocks progress | Medium | Asset IDs and placeholders; no build depends on assets |
| Localisation retrofit | Medium | String extraction from M2; no hard-coded text; placeholder checks |

## 10. Release path

- **Now:** browser build via Vite.
- **After Gate A:** Tauri desktop wrapper; packaging only.
- **After Gate F:** Steam build, save-compatibility pass, store materials.
- **Escape hatch:** Godot remains possible because content and state are engine-agnostic;
  a port is expensive but not a rewrite of the world.

## 11. Document map

| Doc | Question it answers |
|---|---|
| `STATUS.md` | Where are we right now? |
| `ARCHITECTURE.md` | How is the code shaped? |
| `DATA_MODEL.md` | What is the shape of every entity and where does its data live? |
| `ASSETS.md` | How are visual assets referenced, generated, reviewed, and promoted? |
| `WORLD_MODEL.md` | How does time, history, and propagation work? |
| `NARRATIVE_SYSTEMS.md` | How do characters, arcs, lineages, and storylets work? |
| `SCALING.md` | How do modules, content packs, saves, and performance scale? |
| `TOOLING.md` | What utilities exist and when are they built? |
| `CONTENT.md` | How do I author content? |
| `HISTORY.md` | How do I research and tag history? |
| `design/` | What is true about this world and this protagonist? |
| `milestones/` | What do I do next, and how do I know it is done? |
| `DECISIONS/` | Why did we choose this? |
