---
name: SotW Milestone Work
description: Execute a single task from a milestone on The Song of the Wanderer with tests, documentation updates, and a clean commit. Use when implementing a task, fixing a milestone acceptance criterion, or moving the project to its next milestone.
---

# Milestone task lifecycle

## 1. Restate the task

From the milestone file, copy the task ID, its checkboxes, and its acceptance criteria
into your working notes. If any checkbox is ambiguous, ask before coding.

Check the dependencies:

- Does it touch `src/engine`? Read `docs/ARCHITECTURE.md` §2–7 and ADR-0003.
- Does it add content? Read `docs/CONTENT.md` and use `docs/templates/`.
- Does it make a historical claim? Read `docs/HISTORY.md`; a dossier may be required
  first.

## 2. Apply the scope gate

Every new mechanic must answer:

1. Which design pillar (spec §1) does it serve?
2. What decision does the player make with it?
3. Which slice scene or milestone task needs it now?
4. What is cut to pay for it?

If you cannot answer all four, do not build it. Record the deferral in the milestone
file's non-goals or in `STATUS.md`.

## 3. Implement in the smallest vertical slice

- Engine: pure functions, no DOM, no wall clock, no `Math.random`. Test first where
  practical.
- Content: JSON only, DSL only, no logic. Run `pnpm content:lint` often.
- UI: dispatch commands; never mutate state; keep rules out of components.
- Player-facing views read knowledge, never world truth (ADR-0004).
- Untouched regions derive from the timeline; never persist a derived value (ADR-0005).
- Do not add a dependency without a one-line justification in `STATUS.md` or an ADR.
- Do not refactor unrelated code in the same commit.
- If the task spans tiers (world event, character arc, UI), use `sotw-world`,
  `sotw-character`, or `sotw-qa` for the specific workflow.

## 4. Verify

```
pnpm check
```

Expected additionally, depending on the task:

- New engine behaviour has a unit or scenario test.
- New content has a scenario that reaches it.
- Save-affecting changes include a migration and a round-trip test.
- UI changes are reachable with the keyboard and readable at default text size.
- From M8: `pnpm content:coverage` and `pnpm content:continuity` are clean, and any
  world/character/economy change gets a short `pnpm simulate:long` run.

## 5. Update documentation in the same commit

- Tick the milestone checkboxes.
- Rewrite `docs/STATUS.md`.
- Append to `docs/WORKLOG.md`.
- If you changed a rule, update `ARCHITECTURE.md`, `CONTENT.md`, or `HISTORY.md`.
- If you changed world truth, update `docs/design/`.

## 6. Commit

```
M2-T04: resolve travel encounters through the event pipeline
```

One task per commit. Mention migrations and content IDs in the body if relevant.

## Stop conditions

Stop and ask when a change would:

- confirm or deny the protagonist's divinity,
- assert a historical claim without a source,
- add a new gameplay pillar outside the spec,
- invalidate existing saves without a migration,
- let a player-facing view read world truth instead of knowledge,
- require more than one session to land safely.

## Anti-patterns

- Building a system "because the spec mentions it" before the slice needs it.
- Adding a special-case flag to avoid extending the DSL properly.
- Burying rules in React components or Zustand actions.
- Writing prose directly into TypeScript instead of content.
- Leaving `STATUS.md` unchanged because "the next agent can read the diff".
