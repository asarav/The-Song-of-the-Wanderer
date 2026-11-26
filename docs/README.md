# Documentation index

Read in this order. Everything here is written for an agent or developer who has just
opened the repository.

| File | Purpose | Read when |
|---|---|---|
| `AGENTS.md` (root) | Non-negotiables, session protocol, definition of done | Always, first |
| `STATUS.md` | Live state: phase, active task, next tasks, blockers | Always, second |
| `PLAN.md` | Roadmap M0–M19, waves, gates, risks | Starting or re-planning |
| `ARCHITECTURE.md` | Layers, command/event flow, state model, saves, modules | Touching `src/engine` or `src/store` |
| `DATA_MODEL.md` | Canonical entity shapes: player, places, routes, time, characters, arcs, factions, culture, knowledge | Designing or extending any entity, save field, or content type |
| `ASSETS.md` | Asset IDs, manifest, exploratory generation workflow, visual review and promotion | Adding or reviewing any visual asset |
| `WORLD_MODEL.md` | Eras, phases, world/local events, propagation, truth vs knowledge | Timeline, events, rumours, destination states |
| `NARRATIVE_SYSTEMS.md` | Characters, arcs, lineages, recurrence, storylets, journal | Any character, arc, or scene |
| `SCALING.md` | Modules, content packs, save partitioning, performance, testing tiers | Adding a system, pack, or dependency |
| `TOOLING.md` | Linters, studio, coverage, continuity, simulation, generators | Building or using a tool |
| `CONTENT.md` | Authoring rules, ID scheme, provenance, event/dialogue formats | Authoring anything in `src/content` |
| `HISTORY.md` | Confidence taxonomy, sourcing, dossier workflow, review gates | Any historical claim |
| `WORKLOG.md` | Append-only record of completed sessions | Reconstructing why something changed |
| `DECISIONS/` | ADRs for decisions that should not be relitigated | Before a structural change |
| `design/` | Distilled world truth: timeline, regions, protagonist, acts | Writing scenes or characters |
| `milestones/` | Task lists, acceptance criteria, demo scripts | Every working session |
| `templates/` | Destination dossier, region timeline, character, arc, event, route | Creating new content |

## Authority order

1. `The Song of the Wanderer Spec.md` — design intent.
2. `DECISIONS/ADR-*.md` — how we chose to satisfy the spec.
3. `design/*` — the current, agent-readable distillation.
4. `PLAN.md` / `milestones/*` — what we are doing next.
5. `STATUS.md` — what is true right now.

If two conflict, the higher entry wins and the lower one is corrected in the same commit.

## Task-based reading

| Task | Read |
|---|---|
| Engine kernel, DSL, saves | `ARCHITECTURE.md` §2–6, `DATA_MODEL.md` §1–4, §14, ADR-0003, ADR-0005 |
| Timeline, phases, events, rumours | `WORLD_MODEL.md`, `DATA_MODEL.md` §7, §13, ADR-0004, `design/00-timeline.md` |
| Character, arc, lineage, storylet | `NARRATIVE_SYSTEMS.md`, `DATA_MODEL.md` §8–9, `templates/character.md`, `templates/arc.md` |
| New region or destination | `design/01-regions.md`, `HISTORY.md`, `DATA_MODEL.md` §5–6, `templates/destination-dossier.md`, `templates/region-timeline.md` |
| Faction, culture, language, economy | `DATA_MODEL.md` §5–6, §10–12, `SCALING.md` §3 |
| Tooling or QA | `TOOLING.md` |
| Ending or act structure | `design/03-acts.md`, `design/02-protagonist.md` |

## The 30-second orientation

We are building a data-driven narrative RPG in React + TypeScript. The engine is pure and
deterministic; content is JSON packs; player-facing text reads knowledge, never world
truth. The first deliverable is a playable Ugarit → Cyprus slice (M0–M4). Then M5–M8 build
the scale layer: world timeline and propagation, character arcs and lineages, society and
economy, and the tooling that keeps thousands of entities coherent. M9–M14 fill the world
region by region; M15–M19 break it, rebuild it, end it, and ship it.
