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
