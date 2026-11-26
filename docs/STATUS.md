# Status

**Updated:** 2026-11-25 · **Phase:** M0 complete → M1 ready
**Health:** `pnpm check` green · **Active task:** none

This file is the shared memory between sessions. Rewrite it at the end of every work
session; do not append. History belongs in `WORKLOG.md`.

## Current state

- M0 bootstrap is complete: Vite + React + TypeScript strict, Vitest, ESLint with an
  engine-purity rule, content linter scaffold, CI, docs tree, four project skills, and a
  greybox app shell.
- There are no game systems yet. `src/engine` contains only version constants.
- `src/content` is empty apart from a README. Nothing historical has been authored.

## Active task

None. M1-T01 is ready to claim.

## Next three tasks

1. **M1-T01** — Define `GameState` and its Zod schemas in `src/engine/state/`.
2. **M1-T02** — Implement the day-based calendar and time advancement.
3. **M1-T03** — Implement named, serializable RNG streams.

See `docs/milestones/M1-engine-spine.md` for acceptance criteria.

## Recent completions

- **M0-T01..T05** — scaffold, docs, skills, check pipeline, timeline skeleton.
  See `WORKLOG.md`, 2026-11-25.

## Blockers

None.

## Open questions

1. **Historical review** — who signs off on `documented` and `strongly-supported`
   claims? Until decided, content tagged above `plausible` needs a citation and a note
   in `STATUS.md`.
2. **Working title of the protagonist** — the player names themselves; we still need the
   default/placeholder used in tooling and tests.
3. **Art direction test** — after M4, commission or generate one destination
   illustration to validate the visual premise.

## Decisions made this session

- React + TypeScript + Vite + Zustand + Vitest; no game engine, no Tauri yet
  (ADR-0001).
- Content as data with a closed condition/effect DSL (ADR-0002).
- Deterministic engine with seeded streams and versioned saves (ADR-0003).
- Playable greybox slice rather than a headless-systems-first approach (see `PLAN.md` §3).
