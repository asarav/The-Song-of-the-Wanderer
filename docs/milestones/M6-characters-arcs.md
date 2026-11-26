# M6 — Characters, arcs, and lineages

**Status:** Planned · **Depends on:** M5 · **Architecture:** `NARRATIVE_SYSTEMS.md`
**Goal:** named people persist, change, move, die, and are remembered across generations,
with authored arcs that advance whether or not the player is present.

## Non-goals

- Faction politics and cultural depth (M7).
- Procedural character generation.
- Full schedules for every background NPC.
- New regions.

## Tasks

### M6-T01 — Character definitions and runtime

- [ ] `CharacterDef`, `CharacterState`, tier, roles, household, voice, appearance.
- [ ] Status lifecycle: alive, missing, dead, displaced, unknown.
- [ ] Validation: home exists, languages exist, tier budget.
- [ ] Migration from slice character flags.

### M6-T02 — Itineraries and presence

- [ ] `ItineraryEntry` with reasons, date ranges, routes, conditions.
- [ ] `whereIs(character, day)` and `whoIsAt(destination, day)` pure queries.
- [ ] Travelling state with route and arrival date.
- [ ] Displacement via migration records, not teleport.
- [ ] Tests: resident, visitor, travelling, overlapping entries (rejected).

### M6-T03 — Relationships and obligations

- [ ] Five personal dimensions: trust, affection, obligation, fear, respect.
- [ ] Narrative bands for UI; raw values hidden.
- [ ] Explicit promises and debts with due dates and consequences.
- [ ] Authored decay only; no automatic drift.
- [ ] Tests: band transitions, obligation expiry, betrayal events.

### M6-T04 — Arc definitions

- [ ] `ArcDef`, `BeatDef`, branches, resolution states, failure states, successors.
- [ ] Validation: every arc has a reachable resolution and a failure state.
- [ ] Validation: beat `next` targets resolve; no beat after resolution.
- [ ] Scenario coverage requirement: one path per arc per milestone.

### M6-T05 — Arc director

- [ ] Evaluates on time advance, arrival, and major events.
- [ ] Filters by owner status/location, conditions, windows, cooldowns.
- [ ] One beat per character per day; never interrupts an active scene.
- [ ] Off-screen resolution with knowledge delivery.
- [ ] Stranded-arc detection.
- [ ] Tests: ordering, cooldown, off-screen resolution, interruption queue.

### M6-T06 — Lineages and generations

- [ ] `FamilyDef`, generations, inheritance rules.
- [ ] Descendant activation at authored time jumps.
- [ ] Inheritance: name, trade, debt, object, story, relationship reframing.
- [ ] No procedural trees; authored members only.
- [ ] Tests: 100-year advance produces the authored descendants; inheritance applied once.

### M6-T07 — Recognition and names

- [ ] `RecognitionRule` with basis, minimum elapsed time, outcome, effects.
- [ ] Local name tracking per character and region.
- [ ] Mundane basis required by validation; no `claims-divine` without ambiguity note.
- [ ] Tests: no recognition without basis; descendant recognition through story/object.

### M6-T08 — Storylets

- [ ] `StoryletDef` pools, tags, weights, cooldowns, once-only.
- [ ] Director avoids tone repetition and recent repeats.
- [ ] Storylets cannot alter phase, control, or major status.
- [ ] Pools for arrival, market, harbour/road, temple, evening per destination.
- [ ] Tests: cooldown, weighting, pool exhaustion, tag diversity.

### M6-T09 — Character memory

- [ ] Coarse `CharacterMemory`: knows, believes, aboutPlayer.
- [ ] Dialogue conditions can read memory.
- [ ] Rumor repetition uses belief, not truth.
- [ ] Tests: belief divergence, memory update on shared events.

### M6-T10 — Recurrence auditor and slice port

- [ ] Auditor: no teleport, no dead speaker, no simultaneous locations, age/date checks.
- [ ] Soft reports: overused characters, orphaned introductions, missing resolutions.
- [ ] Port the slice's recurring merchant into an authored arc with a delayed beat.
- [ ] 100-year synthetic run with three families and two generations.
- [ ] Update docs and worklog.

## Demo script

Meet the recurring merchant in Ugarit. Leave for Cyprus. Advance time; she moves for an
authored reason and appears in Cyprus with a changed situation. Run the 100-year test and
inspect a descendant who remembers the player through a family story.

## Exit criteria

- No character can appear without a feasible itinerary.
- Every major arc has a resolution and a failure state reachable in tests.
- The slice's recurring character is a real arc, not a scripted cameo.
- 100-year run passes continuity and determinism.
