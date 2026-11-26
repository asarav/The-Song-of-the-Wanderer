# Status

**Updated:** 2026-11-25 · **Phase:** M0 complete → M1 ready
**Health:** `pnpm check` green · **Active task:** none

This file is the shared memory between sessions. Rewrite it at the end of every work
session; do not append. History belongs in `WORKLOG.md`.

## Current state

- M0 bootstrap is complete: Vite + React + TypeScript strict, Vitest, ESLint with an
  engine-purity rule, content linter scaffold, CI, docs tree, project skills, greybox
  shell.
- The development plan now covers **M0–M19**: slice (M0–M4), scale foundations (M5–M8),
  regional expansion (M9–M14), transformation and endings (M15–M17), production
  (M18–M19).
- Scale architecture is specified in `WORLD_MODEL.md`, `NARRATIVE_SYSTEMS.md`,
  `SCALING.md`, and `TOOLING.md`, with ADR-0004 (truth vs knowledge) and ADR-0005
  (packs, derived state, delta saves).
- There are no game systems yet. `src/engine` contains only version constants.
- `src/content` is empty apart from a README. Nothing historical has been authored.

## Active task

None. M1-T01 is ready to claim.

## Next three tasks

1. **M1-T01** — Define `GameState` and its Zod schemas in `src/engine/state/`.
2. **M1-T02** — Implement the day-based calendar and time advancement.
3. **M1-T03** — Implement named, serializable RNG streams.

See `docs/milestones/M1-engine-spine.md`.

## Recent completions

- **M0-T01..T05** — scaffold, docs, skills, check pipeline, timeline skeleton.
- **Planning expansion** — M5–M19 specified; world model, narrative systems, scaling,
  and tooling documented; new skills added (`sotw-world`, `sotw-character`, `sotw-qa`).

## Blockers

None.

## Open questions

1. **Historical review** — who signs off on `documented` and `strongly-supported` claims?
   Until decided, those tags need a citation and a note in `STATUS.md`.
2. **Protagonist placeholder name** — the player names themselves; tooling and tests need
   a default.
3. **Art direction test** — after M4, one destination illustration to validate the visual
   premise.
4. **Workspace split** — decide at Gate B (M8) whether triggers in `SCALING.md` §2 are
   met. Do not split earlier.
5. **Content budget calibration** — confirm the per-region budget in
   `M9-M19-production-waves.md` after M4 playtests.

## Decisions made

- React + TypeScript + Vite + Zustand + Vitest; no engine, no Tauri yet (ADR-0001).
- Content as data with a closed condition/effect DSL (ADR-0002).
- Deterministic engine, seeded streams, versioned saves (ADR-0003).
- World truth and player knowledge are separate stores (ADR-0004).
- Content packs, derived world state, delta saves (ADR-0005).
- Playable greybox slice before scale work (`PLAN.md` §2).
