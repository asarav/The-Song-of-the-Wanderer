# AGENTS.md

This repository builds **The Song of the Wanderer**, a narrative historical travel RPG
set in the Late Bronze Age. It is a text-and-illustration game: no 3D, no open-world
combat, no live AI-generated story content.

Read this file, then `docs/STATUS.md`, then the active milestone in `docs/milestones/`.
Do not read the whole specification. It is 2,000 lines; grep the section you need.

---

## Non-negotiables

1. **The spec is the constitution.** `The Song of the Wanderer Spec.md` defines intent.
   If code, docs, and spec disagree, the spec wins. Resolve the conflict and record an
   ADR in `docs/DECISIONS/`.
2. **Content is data; logic is code.** Destinations, characters, events, dialogue, goods,
   and routes are authored JSON validated by Zod. Behaviour comes from the closed
   condition/effect DSL. Never put bespoke logic inside a content file.
3. **The engine is pure and deterministic.** `src/engine/**` must not import React,
   Zustand, the DOM, `Date.now()`, or `Math.random()`. It exposes
   `reduce(state, command) → { state, events }`. All randomness comes from seeded,
   serializable streams. Every save must replay identically.
4. **The slice comes before the world.** Build only what the Ugarit → Cyprus slice
   needs. Spec §21 is a hard gate: a new mechanic must name the pillar it serves, or it
   is cut.
5. **Historical claims carry provenance.** Anything historically significant is tagged
   `documented | strongly-supported | plausible | fictional | unresolved` with sources.
   The content linter enforces this from M1 onward.
6. **Docs and code ship together.** A task is done only when its milestone checkboxes,
   `docs/STATUS.md`, and `docs/WORKLOG.md` are updated and `pnpm check` passes.
7. **Never invent canon silently.** Names, dates, place details, and character facts
   belong in `docs/design/` before they appear in content.

---

## Session protocol

**Start**

1. Read `docs/STATUS.md` (≤150 lines: phase, active task, next tasks, blockers).
2. Open the active milestone file, e.g. `docs/milestones/M1-engine-spine.md`.
3. Read only the architecture/content/history docs that task touches.
4. Claim exactly one task by writing it into `STATUS.md` under *Active task*.

**Work**

- One task per session unless the task is trivial and adjacent.
- Keep engine changes test-first. Keep content changes lint-clean.
- Commit per task: `M2-T04: resolve travel encounters through the event pipeline`.

**Finish**

1. Run `pnpm check`.
2. Tick the acceptance criteria in the milestone file.
3. Rewrite `STATUS.md` (not append): completed, active, next 3, blockers, health.
4. Append one entry to `docs/WORKLOG.md`.
5. If a decision was made that a future agent could reasonably reverse, write an ADR.

**Handoff**

A new agent needs one instruction: *"Read `AGENTS.md` and continue from
`docs/STATUS.md`."* Everything else is on disk. Never rely on conversation memory.

---

## Layout

```
docs/            plan, live status, architecture, content and history rules
docs/design/     distilled design decisions (read these instead of the spec)
docs/milestones/ one file per milestone with task IDs and acceptance criteria
docs/templates/  dossier, character, event, route templates
src/engine/      pure deterministic simulation (no UI)
src/content/     authored JSON content
src/ui/          React screens (greybox until M4)
src/store/       Zustand adapters that dispatch commands into the engine
tools/           content linter, simulation harness, save inspector
```

---

## Commands

```
pnpm dev           # run the app
pnpm check         # typecheck + lint + tests + content lint  (the gate)
pnpm test          # vitest
pnpm content:lint  # validate authored content
```

---

## Definition of done

- [ ] Acceptance criteria in the milestone file are met.
- [ ] `pnpm check` is green.
- [ ] New engine behaviour has a unit or scenario test.
- [ ] New historical content has provenance and, where needed, a dossier entry.
- [ ] `STATUS.md` and `WORKLOG.md` are updated.
- [ ] No new dependency without a one-line justification in `STATUS.md` or an ADR.

---

## Context hygiene

- Prefer `grep` over reading: `grep -n "### 9.5" "The Song of the Wanderer Spec.md"`.
- The spec's section numbers are stable. Cite them in code comments and docs.
- Keep `STATUS.md` short. It is a cache, not a history. History goes in `WORKLOG.md`.
- Do not restate the plan in conversation; link to `docs/PLAN.md` and milestone files.
- When a task needs more than ~1,500 lines of reading, split the task.

## Escalation

Stop and ask the user when a change would: alter the protagonist's mystery rules,
commit to a historical claim that lacks a source, add a new gameplay pillar, or
invalidate existing saves without a migration.
