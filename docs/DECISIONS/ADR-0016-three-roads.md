# ADR-0016 — Three roads, one rule system

**Status:** accepted · 2026-11-27
**Related:** `docs/design/difficulty.md`, `src/engine/state/difficulty.ts`, `src/engine/world/hazard.ts`, `src/engine/save/migrations.ts`, `src/store/gameStore.ts`

## Context

The survival layer had one balance. A new traveller always landed with forty shekels,
eight reserve and the same road odds. A player who wanted a gentler introduction had no
choice, and a player who wanted the collapse and the unfamiliar coast to bite sooner had
no way to ask for it. The request was for **three difficulty modes** covering both the
opening position and ongoing difficulty scaling.

The risk was adding a second rule path: one balance for “easy” and another for “hard”,
with the hazard, afflictions and economy each growing their own switches. That would make
every future tuning change a three-way decision.

## Decision

- **Three run-wide modes:** `gentle`, `wanderer`, `perilous`, displayed as **Gentle**,
  **Wanderer** and **Perilous**. The player chooses once, after the prologue, on the same
  screen as the seed. The choice is fixed for that run.
- **Wanderer is the default and the existing balance.** The current slice is not silently
  rebalanced; every earlier save opens there.
- **A mode changes three starting/parametric values only:**

  | Mode | Starting silver | Starting reserve | Road-risk shift |
  |---|---:|---:|---:|
  | Gentle | 60 | 8 | −8 |
  | Wanderer | 40 | 8 | 0 |
  | Perilous | 24 | 6 | +10 |

  The opening Ugarit–Cyprus coastal crossing therefore reads **12% / 20% / 30%**; open
  water reads **17% / 25% / 35%**.
- **The mode is persisted in `meta.difficulty`.** It is not a derived view and it is not
  duplicated in the player state. The Status screen reads it through `deriveSelf` and the
  roads screen includes the shift among the hazard factors.
- **No separate difficulty rule path.** Language, known roads, local ties, afflictions,
  reserve, route state and world pressure still add the same factors. The mode contributes
  one signed factor to the same derived chance.
- **No mode-specific content.** A scene, rescue, treatment or affliction behaves the same
  in all three modes. A future mode that changes content would need a new decision.
- **Save format v5.** The v4→v5 migration writes `meta.difficulty = 'wanderer'`; an older
  run cannot be retroactively assigned a choice it never made.
- **Change is not offered mid-run.** The mode is part of the run's identity, so a save
  remains replayable. A future “change difficulty” command would need to define what
  happens to an in-flight hazard or collapse.

## Consequences

- Tuning a mode is a one-line config edit plus the opening resource values; no new state
  field and no branching content.
- A gentle run is not a different story. The same hazards, rescues and conditions appear,
  but the player has more silver and reserve and meets them less often.
- A perilous run gives the Bronze Age collapse, an unfamiliar language and a thin purse
  more room to matter later without needing a second collapse system.
- The 20% baseline is now explicit: it is the Wanderer figure at the opening state, not a
  universal promise. The design note records the three figures.
- If a future mode modifies outcome weights, recovery rates or content eligibility, those
  are new factors in the same config or a new decision; they must not fork the hazard
  pipeline.
