# Stakes and provisioning in the slice

**Status:** implemented in the playable slice · 2026-11-27
**Decision:** [ADR-0014](../DECISIONS/ADR-0014-one-reserve-and-grain.md)
**Companion:** [Afflictions and road hazards](afflictions-and-road-hazards.md) (ADR-0015) · [The three roads](difficulty.md) (ADR-0016)

## What the player feels

The route screen now says what a passage asks of the body as well as the purse:

```
Coastal — 5 days · 8 shekels · carries 20 minas · 2 reserve · 1 grain
Open water — 3 days · 14 shekels · carries 20 minas · 3 reserve · 1 grain
```

The player buys grain in Ugarit or Cyprus before leaving. The market already sold grain;
now the crossing consumes it. A crossing can also go wrong: roughly one in five at the opening state. A hazard scene may
rescue the traveller, leave a condition, cost reserve, or force the return. The chance is
derived from the road, the mode, language, known roads, ties, health and world pressure,
not stored; see [Afflictions and road hazards](afflictions-and-road-hazards.md).

A traveller who has spent every shekel on cargo can sell
something, rest, or take a day's work on the quay: three shekels, one day, one reserve.
The wage is deliberately poor — enough to buy a passage and a grain ration, never enough
to make labour a better trade than a good crossing.

On the road, a choice can cost reserve. Bailing in a squall costs one; going over the side
after a shifting load costs three. If the last point goes while the journey is open, the
scene ends and the road returns the traveller to the port they left. Two days pass. One
cargo item is gone. They wake at 2 of 8 with the shrine scene, not a game-over screen.

## Why this is not a survival meter

There is one number, and it is not continuously drained. It changes at authored moments:
boarding, rest, and a handful of physical choices. It does not tick down while walking
around a port, and there is no hunger, thirst, temperature or disease simulation. The
design's §21 exclusion still holds.

## Why failure is a return

The period gives the failure a shape: a roadside shrine, a votive bowl, a lamp kept by
someone else, and time you cannot account for. The run is not deleted. The player loses
the crossing, the cargo and two days — enough to matter, not enough to make the story
unrecoverable. Permanent endings remain reserved for explicit irreversible choices, which
the slice does not yet contain.

## Tuning knobs

- `STAMINA_MAX` in `src/engine/state/schema.ts`
- `exertionOf` default in `src/engine/world/routes.ts`
- per-mode `exertion` and `provisions` in the route content
- `rest` restores `days × 2` in `src/engine/kernel/reduce.ts`
- collapse restores 2 and costs 2 days in `src/engine/narrative/journey.ts`

## What is deliberately absent

- No HP, combat skill, or combat encounter. Wounds exist only as named afflictions with
  authored remedies, not as hit points or body-part damage.
- No separate hunger, thirst, fatigue or disease bars. Thirst and fever are discrete
  conditions with treatment tags; they do not tick down.
- No random death, no forced game over, no “you starved” screen.
- No physical development system yet. Raising the reserve maximum or lowering exertion
  through training is a possible later progression, but needs its own design and save
  field rather than being smuggled into this one.
