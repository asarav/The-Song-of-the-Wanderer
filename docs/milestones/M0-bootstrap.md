# M0 — Bootstrap

**Status:** Done · **Completed:** 2026-11-25
**Goal:** a repository a new agent can understand and run in ten minutes, with the
toolchain and documentation system the rest of the project depends on.

## Non-goals

- Any game system, state shape, or content.
- Art, audio, or visual design beyond a readable greybox shell.
- Packaging or Steam integration.

## Tasks

### M0-T01 — Toolchain and boundaries

- [x] Vite + React 19 + TypeScript strict (`noUncheckedIndexedAccess`, no unused).
- [x] Vitest configured; `src/**/*.test.ts` included.
- [x] ESLint flat config: JS + TS recommended, engine-purity rules
      (no React/Zustand/UI/store imports, no DOM, no `Math.random`, no `Date.now`).
- [x] Prettier and EditorConfig.
- [x] Path aliases: `@engine`, `@content`, `@ui`, `@store`.
- [x] `src/engine`, `src/content`, `src/ui`, `src/store`, `tools` folders exist.

### M0-T02 — Documentation system

- [x] `AGENTS.md`, `docs/README.md`, `PLAN.md`, `STATUS.md`, `WORKLOG.md`.
- [x] `ARCHITECTURE.md`, `CONTENT.md`, `HISTORY.md`.
- [x] ADR-0001 (stack), ADR-0002 (content as data), ADR-0003 (determinism/saves).
- [x] `design/`: timeline, regions, protagonist, acts.
- [x] `templates/`: destination dossier, region timeline, character, arc, event, route.

### M0-T03 — Agent skills

- [x] `sotw-context` — session bootstrap and teardown.
- [x] `sotw-milestone` — task lifecycle, DoD, scope gate.
- [x] `sotw-content` — authoring rules and lint loop, with a schema cheat sheet.
- [x] `sotw-history` — dossier workflow and provenance review.

### M0-T04 — Check pipeline

- [x] `pnpm check` = typecheck → lint → test → content:lint.
- [x] Content linter scaffold: JSON parse, required `id`, unique IDs, folder/prefix
      match, filename/ID match, confidence vocabulary when provenance is present.
- [x] GitHub Actions workflow running `pnpm check`.

### M0-T05 — Greybox shell and timeline skeleton

- [x] App shell with title/roadmap toggle and warm greybox styling.
- [x] Timeline skeleton with regional anchors and confidence notes.

## Verification

```
pnpm check
```

Expected: typecheck clean, lint clean, 2 tests passing, content lint reports 0 errors.

## Notes and deviations

- TypeScript pinned to **5.9.3** because `typescript-eslint@8.74` does not support
  TypeScript 7. Revisit when the peer range widens.
- `esbuild` postinstall approved via `pnpm.onlyBuiltDependencies`.
- The content linter is intentionally shallow until M1-T05; it proves the pipeline
  without pre-empting the schema work.

## Handoff

M1-T01 is next. Read `docs/ARCHITECTURE.md` sections 2–5 before starting.
