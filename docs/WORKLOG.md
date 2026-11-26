# Worklog

Append one entry per completed work session. Newest last. Keep each entry under ten
lines. Do not rewrite history; correct it with a new entry.

Format:

```
## YYYY-MM-DD — Mx-Tyy — short title
- What changed (files or areas).
- Verification: pnpm check / specific tests.
- Notes or follow-ups.
```

---

## 2026-11-25 — M0 — Bootstrap

- Created the documentation system: `AGENTS.md`, `docs/README.md`, `PLAN.md`,
  `STATUS.md`, `WORKLOG.md`, `ARCHITECTURE.md`, `CONTENT.md`, `HISTORY.md`,
  three ADRs, four design docs, four templates, and milestone files M0–M4.
- Added four project skills under `.opencode/skills/`: `sotw-context`,
  `sotw-milestone`, `sotw-content`, `sotw-history`.
- Scaffolded Vite + React 19 + TypeScript 5.9 + Zustand + Zod + Vitest, strict
  `tsconfig`, ESLint flat config with an engine-purity rule, Prettier, content
  linter scaffold, and GitHub Actions CI.
- Verification: `pnpm check` green (typecheck, lint, 2 tests, content lint).
- Notes: TypeScript pinned to 5.9 because typescript-eslint does not yet support TS 7.
  esbuild postinstall approved via `pnpm.onlyBuiltDependencies`.

## 2026-11-25 — Planning — Expand to full production plan (M5–M19)

- Rewrote `PLAN.md` with five waves and M0–M19, six quality gates, and a scale-risk table.
- Added `WORLD_MODEL.md` (eras, phases, event taxonomy, propagation, truth vs knowledge,
  rumour latency, delta saves) and `NARRATIVE_SYSTEMS.md` (characters, itineraries, arcs,
  lineages, recognition, storylets, continuity).
- Added `SCALING.md` (module map, content packs, state partitioning, performance budgets,
  testing tiers, workspace-split triggers) and `TOOLING.md` (tool catalogue, studio,
  coverage, continuity, long-run simulation, generators).
- Added ADR-0004 (truth vs knowledge) and ADR-0005 (packs, derived state, delta saves).
- Added milestone files M5–M8 and `M9-M19-production-waves.md`.
- Added skills `sotw-world`, `sotw-character`, `sotw-qa`; updated `AGENTS.md`,
  `docs/README.md`, and architecture docs.
- Added authoring templates for region timelines and character arcs, and extended the
  content skill's schema reference with events, propagation, facts, and knowledge.
- Verification: `pnpm check` green; documentation links reviewed manually.
