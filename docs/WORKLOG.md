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

## 2026-11-25 — Data model — Canonical entity shapes

- Added `DATA_MODEL.md`: four representations (definition, state, view, knowledge) and
  entity shapes for player identity/deeds, regions, destinations, routes/waypoints, mobile
  groups, day context, characters, arcs, factions, culture, language, religion, cultural
  works, economy, objects, facts, and knowledge.
- Added the entity-model non-negotiable to `AGENTS.md` and linked the new doc from the
  documentation index and plan.
- Specified `DayContext`, climate phases, observances, and astronomical/religious events
  in `WORLD_MODEL.md`; expanded the event envelope to match the spec.
- Added character position, fame, allegiance, worldview, and authored reaction rules to
  `NARRATIVE_SYSTEMS.md`; added explicit `ArcState`.
- Aligned `ARCHITECTURE.md` and `SCALING.md` with player identity/deeds, route/waypoint
  views, and the data-model boundaries.
- Expanded M5, M6, M7, and M8 tasks, coverage checks, and content folders for the new
  entity types.
- Updated templates, skills, `src/content/README.md`, and M0–M4 milestones to use the
  expanded entity model.
- Updated the content schema cheat sheet and event shape to the canonical model.
- Added `ASSETS.md` defining asset IDs, manifest rules, exploratory generation workflow,
  prompt rules, and promotion criteria.
- Added a unified art-direction requirement: one visual language across all assets, with
  style anchors, consistency checks, and escalation rules.
- Documented public-domain and open-access reference sources, license rules, and a
  reference-asset manifest shape for development agility.
- Added audio asset rules: unified audio direction, open-access audio sources, Peter
  Pringle and modern reconstruction caution, ancient music source uncertainty, and
  audio manifest fields.
- Added ambient audio and environment rules: diegetic layers, seasonal/phase conditions,
  fallback silence, and consistency requirements.
- Added agent skills for assets/audio, save format, UI/read models, scenarios, and design
  decisions to cover the main development workflows.
- Moved canonical skills to `.agents/skills/` and mirrored them to Claude Code, Cline,
  Cursor, GitHub Copilot, Kilo, Freebuff/OpenCode-compatible, and Codex directories.
- Added `tools/sync-skills.mjs`, `pnpm skills:sync`, and `pnpm skills:check` so skills
  and agents can be kept available across harnesses.
- Attempted four exploratory image generations; all failed with invalid credentials, so no
  exploratory images are committed.
- Verification: `pnpm check` green; documentation links checked.
