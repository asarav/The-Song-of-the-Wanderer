# M2 — Slice systems and graybox UI

**Status:** Done (slice scope) · **Depends on:** M1
**Goal:** every system the Ugarit → Cyprus slice needs, wired through the engine and
playable in a graybox interface.

## Non-goals

- Final art, final copy, or audio.
- Systems no slice scene uses (naval combat, crafting trees, property, marriage).
- More than two destinations and one route pair.

## Tasks

### M2-T01 — Inventory, capacity, transport

- [x] Cargo entries with quantity and weight; protected slots for quest/mystery items.
- [x] A stored capacity limit (default 20); purchases and each travel mode reject cargo
      that would overflow, with reasons. Recalculating capacity from transport is deferred
      to M5.
- [x] Perishable/fragile flags reserved for M3 content but supported in schema.
- [x] Tests: add/remove, capacity edge, protected slot unaffected by selling.

### M2-T02 — Market

- [x] Authored base prices, stock, and local price modifiers.
- [x] Event-driven destination-state price multipliers applied through the DSL, not
      hard-coded. Season and faction-specific market modifiers are deferred to M5/M7.
- [x] Buy/sell commands with haggling modifiers from language and perks.
- [x] Price display shows both buying and selling prices, and notes that low language limits your judgment of the bargain without changing the quoted numbers.
- [x] Tests: transaction math, rejection on insufficient funds/capacity, price modifier
      stacking, deterministic market RNG.

### M2-T03 — Routes and travel preparation

- [x] Route entity: segments, waypoints, modes, duration, cost, capacity, requirements,
      risk, encounter pools. Mobile groups are owned by M5-T07 and are not part of the
      slice.
- [x] Travel preparation screen data: known routes, requirements met/missing, why.
- [x] Route display state is derived; no waypoint or route state is saved.
- [x] `travel` command validates knowledge, authored requirements (flag, guide, language),
      mode, fare and capacity. Season gating is deferred to M5.
- [x] Tests: each requirement class blocks and unblocks correctly.

### M2-T04 — Journey and encounter resolution

- [x] Encounter slot generation from authored waypoints, route encounter pools, date,
      and state using the `encounters` stream.
- [x] Eligibility filtering, priority, weights; `major` events bypass randomness.
- [x] Journey phases: departure → events → quiet vignette → arrival; waypoints are
      playable stops, not loading screens.
- [x] Interrupted journeys (save mid-route) resume exactly.
- [x] Tests: eligibility matrix, major-event guarantee, resume-from-save.

### M2-T05 — Dialogue runner

- [x] Dialogue graphs with conditions, choices, effects, language variants.
- [x] One optional way forward for every language gate.
- [x] Relationship deltas and flags applied only on choice resolution.
- [x] Tests: graph traversal, gated choice visibility, no dangling nodes (lint).

### M2-T06 — Journal, character index, codex

- [x] Journal entries authored plus generated from consequences.
- [x] Character index shows only learned information, with last-seen location and status.
- [x] Codex entries are readable in a two-pane screen and reachable from the navigation.
      Contextual links from journal, map and dialogue are deferred.
- [x] Tests: no unlearned information leaks into the index.

### M2-T07 — Language progression

- [x] XP accrues from authored exposure, conversation, study, and discoveries.
- [x] Five tiers (Unfamiliar → Deep familiarity); thresholds configurable per language.
- [x] Tier affects dialogue options, price transparency, and encounter solutions.
- [x] No repetitive grinding loop; exposure events are finite and varied.
- [x] Tests: tier transitions, idempotent XP application.

### M2-T08 — Relationships, factions, delayed effects

- [x] Character relationship values with narrative bands (not raw numbers in UI).
- [x] Faction dimensions: trust, favor, obligation, standing, suspicion.
- [x] Scheduled effects fire on time advance; stable ordering by due day then ID.
- [x] Local reputation distinct from faction standing.
- [x] Tests: scheduled effect ordering, relationship clamping, and named relationship and
      faction dimensions.

### M2-T09 — Store, screens, save/load UI

- [x] Zustand adapter: state, dispatch, selectors; no rules in components.
- [x] Graybox screens: map, destination, market, travel prep, journey, dialogue,
      journal, character index, inventory, codex, save/load, settings.
- [x] Autosave plus one manual slot via the save module.
- [x] Keyboard navigation and readable focus states.
- [x] Tests: reducer/store integration, save/load through the UI adapter.

## Demo script

Start a new game, buy and sell in Ugarit, learn a phrase, accept a small contract,
prepare a crossing, resolve two encounters, arrive in Cyprus, open the journal, save,
reload, and see the same state.

## Definition of done

All tasks checked, `pnpm check` green, a full loop is clickable on fixture content,
`STATUS.md` advanced to M3.
