# M5 — World model and timeline

**Status:** Planned · **Depends on:** M1–M4 · **Architecture:** `WORLD_MODEL.md`,
ADR-0004, ADR-0005
**Goal:** the world can change across centuries through authored phases and events, with
consequences propagating to places, people, prices, routes, and knowledge.

## Non-goals

- Character arcs and lineages (M6).
- Faction politics, culture, and economy depth (M7).
- Studio and long-run analysis UI (M8).
- New regions. M5 re-expresses the slice through the new model.

## Tasks

### M5-T01 — Eras, phases, regional state, and day context

- [ ] `EraDef`, `RegionPhaseDef`, `PhaseTransition` schemas.
- [ ] `CalendarDef`, `SeasonDef`, `ClimatePhaseDef`, `ObservanceDef`,
      `AstronomicalEventDef` schemas.
- [ ] Phase table per region with date ranges and optional preconditions.
- [ ] `deriveRegionPhase(world, region, day)` pure and deterministic.
- [ ] `deriveDayContext(world, region, day, knowledge)` returns date, season, phase,
      climate, weather flavour, observances, astronomical events, active events, and
      modifiers. It is derived, never saved.
- [ ] Destination existence and activity availability derived from phase.
- [ ] Validator: phase gaps, overlaps, transitions outside range, observances outside a
      calendar, astronomical events with no visible region.
- [ ] Religious and divine events record claims and interpretations, not metaphysical
      facts.

**Acceptance:** Ugarit and Cyprus are represented as one region phase each, and the slice
plays identically through derivation. Jumping to a festival day or a reported eclipse
changes the day context without changing world truth.

### M5-T02 — Facts ledger

- [ ] `Fact` schema: subject, predicate, value, validity window, source event.
- [ ] Queries: current value, value at date, history for subject/predicate.
- [ ] Contradiction primitives: mutually exclusive predicates, unique location, unique
      object holder.
- [ ] Facts are not exposed to the UI; only knowledge is.
- [ ] Tests: validity windows, revisions, contradiction detection.

### M5-T03 — Knowledge and rumour state

- [ ] `KnowledgeEntry` (learnedAt, source, reliability, belief, detail).
- [ ] Player knowledge read models: map knowledge, character index, journal eligibility.
- [ ] Character memory read model (coarse).
- [ ] `learnFact`, `correctBelief`, `distrustSource` operations.
- [ ] Tests: false belief persists until corrected; index never leaks unknown facts.

### M5-T04 — Event envelope and registry

- [ ] `EventDef` envelope per `WORLD_MODEL.md` §3.
- [ ] Kinds: world, regional, local, character, storylet.
- [ ] Eligibility: date range, scope, conditions, once, cooldown.
- [ ] Priority ordering and deterministic tie-break by ID.
- [ ] Content lint: unused events, events with empty effects, follow-up targets.

### M5-T05 — Propagation engine

- [ ] Closed `Propagation` vocabulary from `WORLD_MODEL.md` §4.
- [ ] Ordered, breadth-first application; clamping emits `PropagationClamped`.
- [ ] `afterDays` scheduling; no upward propagation.
- [ ] Propagation trace record for debugging and tests.
- [ ] Table-driven tests for every propagation kind.

### M5-T06 — Scheduling, follow-ups, and news latency

- [ ] Scheduler keyed by due day, stable ID order.
- [ ] Date-driven, condition-driven, and event-chained events.
- [ ] Rumour delivery: base delay + authored hops; reliability decay.
- [ ] No event fires twice unless explicitly repeatable.
- [ ] Tests: ordering, lateness, cancellation, save mid-schedule.

### M5-T07 — Destinations, routes, and waypoints

- [ ] Phase-specific destination content: intro, activities, cast, market, routes,
      sites, and event pools.
- [ ] Destination profiles reference climate, culture, language, religion, architecture,
      economy, and currency; no inline copies.
- [ ] Local deltas: destroyed, occupied, festival, quarantine, siege.
- [ ] Route states open/risky/closed/seasonal with authored reasons.
- [ ] Route segments and waypoints: pass, ford, anchorage, shrine, wonder, battlefield,
      camp, calm place.
- [ ] Encounter pools by context and tag; calm/reflection storylets are first-class.
- [ ] UI-facing explanation for every unavailable activity, route, or waypoint.
- [ ] Tests: derivation composition, delta removal, route closure, waypoint state.

### M5-T08 — Rumour system

- [ ] `RumorDef` with variants, distortion, reachable destinations.
- [ ] Delivery through player knowledge; presented as reported speech.
- [ ] Multiple competing rumours about the same event.
- [ ] Tests: latency, distortion, duplicate suppression, correction.

### M5-T09 — Save v2 and derivation guarantees

- [ ] Split state into `world`, `player`, `knowledge`, `narrative`, `rng`, `meta`.
- [ ] Persist only deltas and learned facts; derive untouched regions.
- [ ] Migration from v1 slice saves.
- [ ] Round-trip, derivation equality, and "no derived value stored" tests.
- [ ] Save size budget asserted for the slice.

### M5-T10 — Re-express the slice and prove scale

- [ ] Port Ugarit/Cyprus to phase and event data with zero visible change.
- [ ] Author one synthetic world event that propagates to a local event and a rumour.
- [ ] Build a 50-year synthetic timeline with 3 regions and 10 events.
- [ ] Long-run test asserts invariants and determinism.
- [ ] Update `STATUS`, `WORKLOG`, `ARCHITECTURE`, and content docs.

## Demo script

Start the slice; it behaves exactly as in M3. Then jump the calendar to 1207 BCE in the
test harness and watch a synthetic grain crisis raise prices, schedule a rumour, and make
a harbour event eligible — all from data. Save, reload, and repeat identically.

## Exit criteria

- Slice content runs on the general model with no special cases.
- 50-year synthetic run passes invariants across 5 seeds.
- Save v2 round-trips and derives correctly.
- `timeline:validate` catches a deliberately broken phase table.
