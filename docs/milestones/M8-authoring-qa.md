# M8 — Authoring and QA utilities

**Status:** Planned · **Depends on:** M5–M7 · **Architecture:** `TOOLING.md`
**Goal:** the project can grow to thousands of entities without losing continuity, and an
agent can inspect any state or date without reading the whole world.

This milestone is the Gate B deliverable. Do not start regional expansion without it.

## Non-goals

- Content beyond the slice and the synthetic region.
- A full content editor (studio is read-only).
- Art/audio tooling beyond the asset manifest.

## Tasks

### M8-T01 — Content build, packs, and types

- [ ] `content:build` validates all packs and generates indexes.
- [ ] TypeScript types generated from schemas; no hand-maintained duplicates.
- [ ] Pack manifests, dependency graph, cycle detection.
- [ ] Lazy loading in the game; full load in tests and studio.
- [ ] Build budget under 10 seconds.

### M8-T02 — Studio shell and entity browser

- [ ] Dev-only studio route or app.
- [ ] Search, filter by type/region/phase/tag, including waypoints, groups, religions,
      works, climates, ecologies, currencies, and objects.
- [ ] Reference graph in/out; provenance display; source file links.
- [ ] Show the four representations: definition, saved state, derived view, knowledge.
- [ ] No editing; no writes to content.

### M8-T03 — Graph viewers

- [ ] Dialogue graph with conditions and dead ends highlighted.
- [ ] Arc graph with beats, branches, resolutions, successor links.
- [ ] Route graph with segments, waypoints, phase availability, and requirements.
- [ ] Timeline view with phases, observances, astronomical events, and propagation arrows.
- [ ] Faction/obligation graph with internal currents.
- [ ] Culture/language/religion reference graph.
- [ ] Export to SVG/JSON for review.

### M8-T04 — State inspector and condition debugger

- [ ] Load save or start at any date; jump calendar.
- [ ] World truth vs player knowledge side by side.
- [ ] `DayContext`: season, climate, weather flavour, observances, astronomy, arrivals.
- [ ] Destination derived state, profiles, market modifiers, activities, cast.
- [ ] Character itinerary, position, fame, allegiance, status, arc stage, relationships,
      beliefs.
- [ ] "Why is this event eligible?" atom-level explanation.
- [ ] Scene preview with forced language/relationship/phase.

### M8-T05 — Coverage report

- [ ] Phase completeness per destination.
- [ ] Destinations missing climate, culture, language, religion, architecture, economy,
      or currency profiles.
- [ ] Routes without segments or waypoints; waypoints without encounters or knowledge.
- [ ] Characters without position, allegiance, wants, fears, or reaction rules.
- [ ] Factions without interests, territory, obligations, or phase states.
- [ ] Cultural works without variants or knowledge paths; observances without a calendar.
- [ ] Unreachable events/scenes/nodes.
- [ ] Orphaned and overused characters.
- [ ] Arcs without reachable resolutions.
- [ ] Route graph islands; languages without learning paths; goods without markets.
- [ ] JSON and human output; CI exit code configurable by severity.

### M8-T06 — Continuity checker v2

- [ ] Fact contradictions, dead speakers, simultaneous locations.
- [ ] Age/date and descendant birth windows.
- [ ] Route use while closed; language above tier; object uniqueness.
- [ ] Duplicated shared profiles; derived values stored in a save.
- [ ] Arc resolution and successor integrity.
- [ ] Integrated into merge CI with a baseline file for known exceptions.

### M8-T07 — Long-run simulation

- [ ] Fast-forward 200 years in under 30 seconds.
- [ ] 10 seeds in CI nightly; 3 seeds on merge.
- [ ] Invariants from `TOOLING.md` §6.2.
- [ ] Checkpoint save/load equality.
- [ ] Failure output names the entity and day.

### M8-T08 — Personas and balance

- [ ] Trader, curious, helper policies.
- [ ] Reports: destinations, scenes, arcs, languages, money, time, exposure.
- [ ] Balance report for prices, routes, language pacing, contracts.
- [ ] Thresholds documented; slice tuned.

### M8-T09 — Generators

- [ ] `new:pack`, `new:region`, `new:destination`, `new:character`, `new:arc`,
      `new:event`.
- [ ] Valid IDs, provenance stubs, dossier stubs, scenario stubs.
- [ ] `TODO:` markers fail the shipped-content check.

### M8-T10 — Prose, locale, assets, performance

- [ ] Prose lint with project-specific anachronism and mystery rules.
- [ ] `locale:extract` and `locale:check`.
- [ ] Hard-coded string detection.
- [ ] Asset manifest and fallback check.
- [ ] Performance budgets measured and enforced.

### M8-T11 — CI tiers and golden saves

- [ ] Tier 1/2/3 jobs implemented.
- [ ] Golden save corpus from every milestone.
- [ ] Migration matrix loaded on every merge.
- [ ] Nightly report posted as an artefact.

### M8-T12 — Gate B review

- [ ] Studio demo: jump to 1185 BCE and inspect Ugarit's phase.
- [ ] Coverage and continuity clean (or baselined with owners).
- [ ] 200-year run passes.
- [ ] Synthetic region added with content only.
- [ ] Update `PLAN`, `STATUS`, `WORKLOG`, `SCALING`; record workspace-split decision.

## Demo script

Open the studio. Search a character, inspect references, view their arc graph, jump to a
later date, explain why an event is ineligible, then run the long simulation and coverage
report. Show one deliberately broken entity failing with a precise message.

## Exit criteria (Gate B)

- Every scale system is inspectable without reading code.
- 200 years × 10 seeds passes invariants.
- The slice is fully general.
- A new region can be scaffolded and validated in under an hour.
