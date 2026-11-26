---
name: SotW World and Timeline
description: Author or debug the world timeline for The Song of the Wanderer — eras, regional phases, world/regional/local events, propagation, rumours, destination states, and route changes. Use when history needs to change, when an event must affect places or people, or when a save shows the wrong phase or price.
---

# World and timeline authoring

Read `docs/WORLD_MODEL.md` before writing. This skill is the working procedure.

## The chain to design

Every historical change is authored as a chain:

```
world event → regional condition → local pressure → character decision
            → delayed consequence → later reappearance
```

If a proposed event has no local consequence, it is exposition, not an event. Either give
it one or cut it.

## Authoring order

1. **Phase table** for the region: phase id, date range, description, what changed,
   which destinations exist. No gaps, no overlaps.
2. **World-event hooks**: which world events enter this region, when, and with what
   propagation.
3. **Regional processes**: slow pressures (drought, war, migration) that create local
   eligibility.
4. **Local events**: per destination and phase, tied to a concrete place and person.
5. **Route plan**: which routes open, close, become risky, and why.
6. **Knowledge plan**: what can be learned, from whom, with what delay and distortion.
7. **Character impact table**: which recurring characters are affected, how, and when.

## Rules

- History is authored. Never derive a phase, war, or migration from variables.
- Propagation flows downward only. A local event cannot change the regional phase unless
  an authored event says so.
- Major events are scheduled or condition-driven, never random.
- Every closure or unavailability needs an authored reason the UI can show.
- Facts are objective; rumours are knowledge. Never write a rumour as narration.
- Distant events arrive as reports with delay and distortion. Do not cut to a burning
  city the player cannot see.
- Regional timelines differ. Do not synchronise events for drama.
- No single cause for a multi-causal process.
- Use `afterDays` for consequences. Instant consequences rob travel of meaning.

## Event checklist

- [ ] Kind is correct: world, regional, local, character, or storylet.
- [ ] Scope names real regions/destinations/routes.
- [ ] Date range falls inside the relevant phase.
- [ ] Major events are never weighted-random.
- [ ] Effects and propagation use the closed vocabulary.
- [ ] Follow-ups resolve; no orphan schedules.
- [ ] Journal entry or explicit `journal: null` with a reason.
- [ ] Provenance and confidence.
- [ ] At least one scenario reaches it.

## Debugging a stale world

If a phase, price, or route looks wrong:

1. Run `pnpm timeline:validate`.
2. In the studio, inspect the region phase at the current date.
3. Check the fact ledger for the destination/route, including validity windows.
4. Check scheduled events that were due but cancelled or clamped.
5. Check the propagation trace for the event that should have applied.
6. Confirm the derived state rather than a cached value. Never patch a save to hide it.

## Common mistakes

| Symptom | Likely cause |
|---|---|
| Event never fires | Wrong kind, scope, date, or condition; phase excluded it |
| Event fires twice | Missing `once`, or two events share an effect |
| Price stuck | Modifier applied to a copy; derived state cached |
| Route open during war | Route state not propagated by the war event |
| Player knows too much | UI reading facts instead of knowledge |
| Rumour arrives instantly | Missing latency/hops, or knowledge granted at source |
| Region stuck in a phase | No exit transition, or transition condition never true |

## Validation

```
pnpm timeline:validate
pnpm content:lint
pnpm test
```

From M8, also run the continuity and coverage reports. A world change without a scenario is
not done.
