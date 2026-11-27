# ADR-0015 — Discrete afflictions and derived road hazards

**Status:** accepted · 2026-11-27
**Related:** `docs/design/afflictions-and-road-hazards.md`, `src/engine/state/schema.ts`, `src/engine/world/hazard.ts`, `src/engine/narrative/journey.ts`, `src/engine/dsl/effects.ts`, `src/engine/content/schema.ts`

## Context

The reserve (ADR-0014) gave the road a body, but no lasting consequence. A bad crossing
cost time, cargo and two points of reserve; it could not leave the traveller thirsty,
feverish, wounded, poisoned or cursed, and a town could not cure anything. The design
brief asks for light survival without the meter dashboard §21 excludes, for remedies that
belong to places and people, and for a road that can be survived by luck and the kindness
of strangers rather than only by preparation.

The brief also asks for a **starting failure risk near 20%**, falling as the player learns
the world and rising in unfamiliar lands, during the Bronze Age collapse, and around war,
famine and disease. A route's shape should matter, not only its price. Some of this is
slice work; some is deliberately later.

## Decision

- **Afflictions are entities, not meters.** The player persists a small list of
  `{id, sinceDay, source?}`. Definitions in the core pack carry kind, severity, prose and
  **treatment tags**. The engine has no hunger, thirst, fatigue or disease bar.
- **Content applies treatment tags, never direct removal.** The DSL has `affliction` to
  add and `treatment` to cure by tag. A town day supplies `town`, Rest supplies `rest` and
  `town`, and authored healer scenes supply `healer`. A quest, antidote, spring or shrine
  can add a cure without changing the save shape.
- **Hazard is one derived chance, rolled once per passage.** A route may author a
  `hazard` base chance and weighted scene outcomes. `assessHazard` derives the displayed
  chance from route risk, mode modifier, destination language, known destinations, local
  ties, active afflictions, low reserve, route state and destination pressures. None of
  those factors is stored as a second value.
- **The roll has its own RNG stream.** `hazard` is the fourth named stream, so adding the
  mechanic cannot shift the market, encounters, travel or narrative sequences. A triggered
  hazard adds at most one authored event to the journey slot list; it never times out or
  rewrites the arrival.
- **The outcome table is the variety knob.** Rescues by caravan, patrol or healer, a
  thirst or fever scene, a wreck and a spring are all ordinary events in the route's table.
  New ideas are content, not engine branches.
- **Save format v4.** The migration adds `player.afflictions: []` and seeds `rng.hazard`.
  A v3 run opens clean; it does not acquire a condition retroactively.
- **No permadeath.** A hazard can force the existing collapse/return, but the run is not
  deleted. The 20% figure is the chance a crossing is tested by a hazard scene at the
  opening state, not a 20% chance of erasing the save. Permanent endings remain explicit,
  authored, and out of scope for the slice.

## Consequences

- Status can now show **Conditions** without becoming a stat sheet: a short list of named
  conditions, their day, and the authored remedy.
- The **daily condition report** is derived by comparing the afflictions before and after
  a calendar move; the definitions' `onset`, `daily` and `recovery` prose is the narrative
  surface. It adds no persisted meter and no timer. A lingering condition is "no better,
  no worse"; "worse" means a new condition arrived.
- The road has a legible risk number before departure and a scene that can rescue, delay,
  wound or return the traveller. The player can trade a fast, risky mode against a slower,
  safer one.
- Tuning is data: route `hazard.baseChance`, outcome weights, mode `hazardModifier`, and
  the factor deltas in `src/engine/world/hazard.ts`. No tuning change needs a save field.
- The hazard model is the place to attach the collapse, war, famine and disease later:
  destination state and route state already feed the same derivation. Adding a world phase
  or a regional pressure should add a factor, not a second risk system.
- Permanent conditions need an authored cure path (shrine, quest, antidote) before they
  can be inflicted. The engine supports the state now; content should not add a curse with
  no remedy.
- A new RNG stream changes the golden stream fixture and the v4 save fixture, but not the
  replay of a v4 save. A renamed or reordered stream would; do not do that without a new
  migration.
