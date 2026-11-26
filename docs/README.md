# Documentation index

Read in this order. Everything here is written for an agent or developer who has just
opened the repository.

| File | Purpose | Read when |
|---|---|---|
| `AGENTS.md` (root) | Non-negotiables, session protocol, definition of done | Always, first |
| `STATUS.md` | Live state: phase, active task, next tasks, blockers | Always, second |
| `PLAN.md` | Roadmap, milestone board, scope gates, risks | Starting or re-planning |
| `ARCHITECTURE.md` | Engine layers, command/event flow, state shape, saves, RNG | Touching `src/engine` or `src/store` |
| `CONTENT.md` | Authoring rules, ID scheme, provenance, dialogue format | Authoring anything in `src/content` |
| `HISTORY.md` | Confidence taxonomy, sourcing, dossier workflow, review gates | Any historical claim, name, date, or place |
| `WORKLOG.md` | Append-only record of completed sessions | Reconstructing why something changed |
| `DECISIONS/` | ADRs for decisions that should not be relitigated | Before proposing a structural change |
| `design/` | Distilled design truth: timeline, regions, protagonist, acts | Writing scenes or characters |
| `milestones/` | Task lists, acceptance criteria, demo scripts | Every working session |
| `templates/` | Blank destination dossier, character brief, event, route | Creating new content |

## Authority order

1. `The Song of the Wanderer Spec.md` — design intent, immutable without discussion.
2. `DECISIONS/ADR-*.md` — how we chose to satisfy the spec.
3. `design/*` — the current, agent-readable distillation.
4. `PLAN.md` / `milestones/*` — what we are doing next.
5. `STATUS.md` — what is true right now.

If two of these conflict, the higher entry wins and the lower one must be corrected in
the same commit.

## The 30-second orientation

We are building a data-driven narrative RPG in React + TypeScript. The engine is pure
and deterministic; content is JSON; the first deliverable is a playable Ugarit → Cyprus
slice. M0 (scaffold and docs) is complete. M1 is the engine spine.
