---
name: SotW Quality and Tooling
description: Run, interpret, and extend the validation and QA tooling for The Song of the Wanderer — content lint, coverage, continuity, long-run simulation, personas, balance, prose/locale checks, and the content studio. Use before a commit, at a merge or wave gate, or when a check fails.
---

# Quality and tooling

The tool catalogue and rules live in `docs/TOOLING.md`. This skill is the operating
procedure.

## Every task

```
pnpm check
```

That runs typecheck, lint, unit tests, and content lint. A task is not done until it is
green.

## Before merging or ending a session

```
pnpm content:coverage
pnpm content:continuity
pnpm simulate -- --scenario <the scenario you touched>
```

From M8, also run the fast long-run if you changed world, character, or economy rules:

```
pnpm simulate:long -- --years 20 --seeds 3
```

If you added or changed an entity type, also check:
- destinations have climate, culture, language, religion, architecture, economy, and
  currency profiles;
- routes have segments and waypoints; waypoints have encounters or knowledge;
- characters have position, allegiance, wants, fears, and reaction rules;
- factions have interests, territory, obligations, and phase states;
- observances have calendars; works have variants and knowledge paths.

## Wave gate

Run the full tier:

```
pnpm content:build
pnpm content:coverage -- --json > coverage.json
pnpm content:continuity -- --json > continuity.json
pnpm simulate:long -- --years 200 --seeds 10
pnpm simulate:personas
pnpm balance
pnpm prose:lint
pnpm locale:check
pnpm assets:check
pnpm perf:budget
```

Record results in the milestone file and `STATUS.md`. A wave gate without numbers is an
opinion.

## Interpreting failures

| Report | First question | Then |
|---|---|---|
| Schema error | Which entity and field? | Fix the data, not the schema |
| Reference error | Who points at what? | Add the target or remove the reference |
| Provenance error | What claim is being made? | Add a source or downgrade confidence |
| Timeline error | Which phase is missing or overlapping? | Fix the phase table |
| Continuity error | Is the fact wrong, or the scene? | Fix the earlier of the two |
| Coverage warning | Is this intentionally unreachable? | Baseline it with an owner, or wire it |
| Long-run invariant | Which day and entity? | Reproduce with the seed; add a regression test |
| Persona stall | Where did progress stop? | Check access requirements and UI explanation |
| Prose lint | Is the rule wrong or the line? | Fix the line; change the rule only by ADR |
| Perf budget | Which operation regressed? | Profile before optimising; record the number |

Do not silence a failure by deleting the check. If a rule is wrong, change it in the shared
validator, add a test, and note it in `WORKLOG.md`.

## Studio workflow

From M8:

1. `pnpm studio`
2. Jump to the failing day.
3. Inspect world truth and player knowledge side by side.
4. Open the offending destination or character.
5. Use "why is this eligible?" to find the failing atom.
6. Fix content, re-run the scenario, then the tier that caught it.

Use the studio instead of adding temporary `console.log` calls to the engine.

## Adding a check

- Put the rule in the shared validator, not in a one-off script.
- Support `--json` and a non-zero exit code.
- Add a deliberately broken fixture test.
- Document the command in `docs/TOOLING.md`.
- If the rule encodes a design decision, link the spec section or ADR.

## Red flags

- A check disabled “temporarily” with no owner.
- A baseline file that grows every milestone.
- Coverage claimed from reading code rather than running the tool.
- A long-run failure “fixed” by changing a seed.
- A save edited to avoid a migration.
- A local entity copied a shared profile instead of referencing it.
- A prose rule changed to allow an anachronism because a line was good.
- An asset promoted without review for style drift or caricature.

## Reporting

Every gate report states:

- command run and commit,
- seeds/durations,
- pass/fail counts,
- top five issues with IDs,
- what changed since the last run.

Keep it short. Link artefacts; do not paste logs.
