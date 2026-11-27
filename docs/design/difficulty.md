# The three roads

**Status:** implemented · 2026-11-27
**Decision:** [ADR-0016](../DECISIONS/ADR-0016-three-roads.md)
**Related:** [Afflictions and road hazards](afflictions-and-road-hazards.md) · [Stakes and provisioning](stakes-and-provisioning.md)

## What the player chooses

After the prologue, before the seed and **Step ashore**, the new-journey screen asks for
a road:

| Mode | You land with | The road |
|---|---|---|
| **Gentle** | 60 shekels, 8 of 8 reserve | 8 points kinder |
| **Wanderer** | 40 shekels, 8 of 8 reserve | the measured odds |
| **Perilous** | 24 shekels, 6 of 8 reserve | 10 points harder |

The choice is fixed for that run. It is shown on Status as **Road** and is included in the
route risk factors before a crossing. The same seed, the same choices and the same mode
still tell the same story.

## What each mode changes

The mode is not a second rules engine. It changes:

1. the opening purse;
2. the opening reserve;
3. one signed shift on every authored route hazard.

Everything else is shared. A gentle player still meets the same patrol, the same fever,
the same wreck and the same spring. Knowledge and language still lower the chance; a
wound, a thin reserve or a port at war still raises it. The mode moves the starting line,
not the shape of the road.

### The opening figures

The Ugarit–Cyprus crossing has a base 14% hazard, moderate risk (+4) and basic Akkadian
(+2). With a full reserve and no ties it reads:

| Mode | Coastal | Open water |
|---|---:|---:|
| Gentle | 12% | 17% |
| Wanderer | **20%** | **25%** |
| Perilous | 30% | 35% |

The middle column is the design brief's “about 20% when starting out.” The other two are
deliberate departures from it, not accidental drift.

The factors show the mode by name:

```
Road risk 12% · low
moderate crossing +4 · A gentler road −8 · Akkadian: basic +2
```

### Why not change the outcomes too?

A mode could also weight rescues differently or make a wreck more likely. That would make
the three modes different games rather than the same game at three pressures. It would
also multiply every future content and balance check. If a later mode needs a different
outcome table, the right shape is an authored outcome modifier in the mode config, applied
once in `assessHazard`, not a forked scene list.

## The world still gets harder

The mode shift is constant; the world factors are not. In every mode:

- a new language, no known roads and no ties raise the chance;
- knowing more destinations, fluency and trusted people lower it;
- open water, high-risk routes and a route marked risky raise it;
- grave conditions and low reserve raise it;
- destination war, famine, disease and unrest add their spikes.

The Bronze Age collapse and new regions therefore do not need a difficulty switch of their
own. When the world sets `war`, `famine` or `disease`, the existing derivation moves; the
chosen road determines how much room the player has to absorb it.

## Starting resources, not a different story

Gentle is generous with silver, not with plot. Perilous is thin, not punitive with forced
failure. The two jars of oil, the opening scene, the people and the authored journals are
identical. A player can change mode on a later run without learning a different game.

## Persistence and migration

`meta.difficulty` is one of three enum values. Save v5 writes it. A v4 save opens on
**Wanderer**, because that is the balance it was actually played at; assigning Gentle or
Perilous retroactively would rewrite the run's history. The mode cannot be changed from
inside a run in this slice.

## What is deliberately absent

- No hidden fourth mode or adaptive difficulty.
- No difficulty-specific content, rewards or endings.
- No mid-run switch.
- No separate “combat difficulty”; there is no combat.
- No claim that Perilous is historically accurate and Gentle is not. All three are game
  abstractions; the historical claims live in content provenance, not in a mode label.

## Verification

- State tests pin the three modes, their ordering, the default and the persisted field.
- Hazard tests pin 12 / 20 / 30 on the same route and show the mode as a normal factor.
- Save tests cover the v4→v5 migration and the v5 round trip.
- The kernel and store tests start a Perilous run at 24 shekels and 6 reserve, and a
  Gentle run at 60 and 8.
- The new-journey screen exposes all three choices with their starting figures.
