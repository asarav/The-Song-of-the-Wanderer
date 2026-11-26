# M2 — Slice systems and greybox UI

**Status:** Planned · **Depends on:** M1
**Goal:** every system the Ugarit → Cyprus slice needs, wired through the engine and
playable in a greybox interface.

## Non-goals

- Final art, final copy, or audio.
- Systems no slice scene uses (naval combat, crafting trees, property, marriage).
- More than two destinations and one route pair.

## Tasks

### M2-T01 — Inventory, capacity, transport

- [ ] Cargo entries with quantity and weight; protected slots for quest/mystery items.
- [ ] Capacity derived from transport; overflow commands rejected with reasons.
- [ ] Perishable/fragile flags reserved for M3 content but supported in schema.
- [ ] Tests: add/remove, capacity edge, protected slot unaffected by selling.

### M2-T02 — Market

- [ ] Authored base prices plus local availability and demand modifiers.
- [ ] Event/season/faction modifiers applied through the DSL, not hard-coded.
- [ ] Buy/sell commands with haggling modifiers from language and perks.
- [ ] Price display shows a range/estimate when language is low.
- [ ] Tests: transaction math, rejection on insufficient funds/capacity, price modifier
      stacking, deterministic market RNG.

### M2-T03 — Routes and travel preparation

- [ ] Route entity: segments, waypoints, modes, duration, cost, capacity, requirements,
      risk, encounter pools, mobile groups.
- [ ] Travel preparation screen data: known routes, requirements met/missing, why.
- [ ] Route display state is derived; no waypoint or route state is saved.
- [ ] `travel` command validates knowledge, pass, guide, language, season, capacity.
- [ ] Tests: each requirement class blocks and unblocks correctly.

### M2-T04 — Journey and encounter resolution

- [ ] Encounter slot generation from route segments, waypoints, date, and state using
      the `encounters` stream.
- [ ] Eligibility filtering, priority, weights; `major` events bypass randomness.
- [ ] Journey phases: departure → events → quiet vignette → arrival; waypoints are
      playable stops, not loading screens.
- [ ] Interrupted journeys (save mid-route) resume exactly.
- [ ] Tests: eligibility matrix, major-event guarantee, resume-from-save.

### M2-T05 — Dialogue runner

- [ ] Dialogue graphs with conditions, choices, effects, language variants.
- [ ] One optional way forward for every language gate.
- [ ] Relationship deltas and flags applied only on choice resolution.
- [ ] Tests: graph traversal, gated choice visibility, no dangling nodes (lint).

### M2-T06 — Journal, character index, codex

- [ ] Journal entries authored plus generated from consequences.
- [ ] Character index shows only learned information, with last-seen location and status.
- [ ] Codex entries open from journal/map/dialogue without lecturing.
- [ ] Tests: no unlearned information leaks into the index.

### M2-T07 — Language progression

- [ ] XP accrues from authored exposure, conversation, study, and discoveries.
- [ ] Five tiers (Unfamiliar → Deep familiarity); thresholds configurable per language.
- [ ] Tier affects dialogue options, price transparency, and encounter solutions.
- [ ] No repetitive grinding loop; exposure events are finite and varied.
- [ ] Tests: tier transitions, idempotent XP application.

### M2-T08 — Relationships, factions, delayed effects

- [ ] Character relationship values with narrative bands (not raw numbers in UI).
- [ ] Faction dimensions: trust, favour, obligation, standing, suspicion.
- [ ] Scheduled effects fire on time advance; stable ordering by due day then ID.
- [ ] Local reputation distinct from faction standing.
- [ ] Tests: scheduled effect ordering, relationship clamping, contradictory loyalties.

### M2-T09 — Store, screens, save/load UI

- [ ] Zustand adapter: state, dispatch, selectors; no rules in components.
- [ ] Greybox screens: map, destination, market, travel prep, journey, dialogue,
      journal, character index, inventory, codex, save/load, settings.
- [ ] Autosave slot plus manual slots via the save module.
- [ ] Keyboard navigation and readable focus states.
- [ ] Tests: reducer/store integration, save/load through the UI adapter.

## Demo script

Start a new game, buy and sell in Ugarit, learn a phrase, accept a small contract,
prepare a crossing, resolve two encounters, arrive in Cyprus, open the journal, save,
reload, and see the same state.

## Definition of done

All tasks checked, `pnpm check` green, a full loop is clickable on fixture content,
`STATUS.md` advanced to M3.
