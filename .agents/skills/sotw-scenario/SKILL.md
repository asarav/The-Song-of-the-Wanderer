---
name: SotW Scenarios and Regression Tests
description: Author and run headless scenario tests for The Song of the Wanderer — JSON scenarios, assertions, seeds, deterministic replay, and coverage of major paths. Use when adding engine behaviour, content, or fixing a bug.
---

# Scenarios and regression tests

Read `docs/TOOLING.md` §6.1 and `docs/ARCHITECTURE.md` §11 before writing scenarios.
This skill is the working procedure.

## Core rules

- A scenario is JSON, not code.
- Every major path needs a scenario.
- Every bug fix adds or updates a scenario.
- Scenarios use a fixed seed and deterministic command order.
- A scenario must assert both state and events where relevant.
- A failing scenario prints a trace; use it instead of guessing.

## Scenario shape

```json
{
  "id": "scenario.slice.crossing",
  "seed": "slice-001",
  "start": { "date": "1230-04-01", "location": "dest.ugarit", "money": 120 },
  "commands": [
    { "type": "buy", "good": "good.grain", "quantity": 4 },
    { "type": "travel", "route": "route.ugarit-cyprus", "mode": "coastal" },
    { "type": "resolveEncounter", "choice": "help" }
  ],
  "assert": [
    { "path": "player.location", "equals": "dest.cyprus" },
    { "path": "characters.char.ugarit.amnit.status", "equals": "alive" }
  ]
}
```

## Writing rules

- Start from a known state, not from a saved playthrough.
- Use a stable seed. Do not change the seed to make a failure disappear.
- Assert the smallest useful facts first, then add detail.
- Cover the happy path, the failure path, and the absent-player path for arcs.
- For content, cover eligibility, resolution, and aftermath.
- For migrations, use fixture saves, not live scenarios.

## Coverage expectations

- One scenario per major arc resolution.
- One scenario per major arc failure.
- One scenario per critical travel route.
- One scenario per market or contract edge case that was fixed.
- One scenario per mystery beat that must remain unresolved.

## Determinism

- The same seed and commands must produce the same state and events.
- If a scenario depends on randomness, assert distributions or use a seed that makes
  the path stable.
- Do not assert prose. Assert IDs, states, flags, and event kinds.

## Failure handling

1. Read the trace and find the first unexpected state.
2. Check command eligibility and conditions.
3. Check event selection and priority.
4. Check save/resume if the failure happens mid-journey.
5. Add a regression scenario before fixing the code.

## Common mistakes

| Symptom | Fix |
|---|---|
| Scenario passes only on one machine | Remove time, locale, or filesystem dependence |
| Seed changed to hide a failure | Restore the seed and fix the cause |
| Scenario too broad | Split it into smaller assertions |
| No scenario for a fixed bug | Add one before closing the task |
| Scenario asserts prose | Assert IDs, states, flags, and events instead |
| Scenario depends on a save file | Use a fixture save or a start state |

## Checklist

- [ ] Scenario has a stable ID and seed.
- [ ] Commands are minimal and ordered.
- [ ] Assertions cover state and events.
- [ ] Failure path is covered where relevant.
- [ ] Scenario runs in CI.
- [ ] `pnpm check` passes.
