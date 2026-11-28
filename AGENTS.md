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
   and routes are authored JSON validated by Zod. Behavior comes from the closed
   condition/effect DSL. Never put bespoke logic inside a content file.
3. **The engine is pure and deterministic.** `src/engine/**` must not import React,
   Zustand, the DOM, `Date.now()`, or `Math.random()`. It exposes
   `reduce(state, command) → { state, events }`. All randomness comes from seeded,
   serializable streams. Every save must replay identically.
4. **Truth is not knowledge.** Player-facing views (journal, map, index, codex, dialogue)
   read `knowledge`, never world truth. Rumors may be wrong. Characters may believe
   false things. (ADR-0004.)
5. **Store deltas, derive the rest.** Untouched regions derive from the timeline. Never
   persist a derived value. Content lives in packs. (ADR-0005.)
6. **The slice comes before the world.** Build only what the active milestone needs.
   Spec §21 is a hard gate: a new mechanic must name the pillar it serves, or it is cut.
7. **Historical claims carry provenance.** Anything historically significant is tagged
   `documented | strongly-supported | plausible | fictional | unresolved` with sources.
   The linter enforces this from M1 onward.
8. **Docs and code ship together.** A task is done only when its milestone checkboxes,
   `docs/STATUS.md`, and `docs/WORKLOG.md` are updated and `pnpm check` passes.
9. **Never invent canon silently.** Names, dates, place details, and character facts
   belong in `docs/design/` before they appear in content.
10. **Model entities explicitly.** Every thing the game knows has a definition, optional
    runtime state, a derived view, and a knowledge projection where the player can learn
    it. Shared data is referenced, not copied. The canonical entity shapes are in
    `docs/DATA_MODEL.md`; do not invent an ad hoc shape in a feature branch.
11. **Skills and agents are cross-harness.** Canonical skills live in `.agents/skills/`
    and canonical agents in `.agents/agents/`. Any skill or agent added for one harness
    must be mirrored to the other harness directories with `pnpm skills:sync`, and
    `pnpm skills:check` must pass. Do not create a harness-only skill or agent.

---

## Session protocol

**Start**

1. Read `docs/STATUS.md` (≤150 lines: phase, active task, next tasks, blockers).
2. Open the active milestone file, e.g. `docs/milestones/M5-world-timeline.md`.
3. Read only the docs that task touches:
   - engine / state / saves → `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md` §1–4, §14
   - time/events/rumors → `docs/WORLD_MODEL.md`, `docs/DATA_MODEL.md` §7, §13
   - characters/arcs → `docs/NARRATIVE_SYSTEMS.md`, `docs/DATA_MODEL.md` §8–9
   - culture/factions/economy → `docs/DATA_MODEL.md` §5, §6, §10–12
   - systems/packs/saves → `docs/SCALING.md`
   - tools/QA → `docs/TOOLING.md`
   - content → `docs/CONTENT.md`; history → `docs/HISTORY.md`
   - assets/visuals → `docs/ASSETS.md`
4. Claim exactly one task by writing it into `STATUS.md` under _Active task_.

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

A new agent needs one instruction: _"Read `AGENTS.md` and continue from
`docs/STATUS.md`."_ Everything else is on disk. Never rely on conversation memory.

---

## Layout

```
docs/                 plan, status, architecture, data model, assets, world/narrative/tooling rules
.agents/              canonical cross-harness skills and agents
.claude/, .cline/, ... mirrored harness skill/agent directories (synced)
docs/design/          distilled design decisions (read these instead of the spec)
docs/milestones/      one file per milestone with task IDs and acceptance criteria
docs/templates/       dossier, region timeline, character, arc, event, route templates
src/engine/           pure deterministic simulation (no UI)
src/content/          authored JSON packs
src/ui/               React screens (greybox until M4)
src/store/            Zustand adapters that dispatch commands into the engine
src/studio/           dev inspector (from M8)
tools/                linters, simulators, generators, save tools
```

---

## Commands

```
pnpm dev           # run the app
pnpm check         # typecheck + lint + tests + every content gate (bounded parallel)
pnpm test          # vitest
pnpm content:lint  # validate authored content
pnpm model:check   # wants, scene contracts, choice ids, callbacks, ties, terminal flags
pnpm prose:lint    # POV, anachronism, beat length, voice ceilings, probe-only nodes
pnpm price:check   # every named price matches a money effect, or is allowlisted
pnpm content:guard # mechanics fingerprint; use --update --reason when mechanics change
pnpm factory -- new ambient ambient.levant.day.market  # dry run; add --write
pnpm factory -- variants ambient-example --count 4 --seed harbor
pnpm factory -- audit       # variation coverage and missing families
pnpm factory:check          # recipes, determinism, duplicate ids, shipped TODO
pnpm ambient:check          # day/night/travel coverage and selection
pnpm playtest:review -- --persona helper  # deterministic pre-pass for a playtest
```

`pnpm check -- --sequential` runs the same gates one at a time when diagnosing a failure.

Session start: `pnpm task:brief`. Look something up with `pnpm ask`, `pnpm entity`,
`pnpm flag` or `pnpm impact` instead of re-reading the tree. Rewrite one graph with
`pnpm content:workbench <id>` and read it with `pnpm manuscript`.

From M1: `pnpm simulate`, `pnpm save:inspect`, `pnpm save:migrate`.
From M8: `pnpm studio`, `pnpm content:coverage`, `pnpm content:continuity`,
`pnpm simulate:long`, `pnpm simulate:personas`, `pnpm new:*`.
Full catalog: `docs/TOOLING.md`.

---

## Definition of done

- [ ] Acceptance criteria in the milestone file are met.
- [ ] `pnpm check` is green; new checks are part of the gate.
- [ ] New engine behavior has a unit or scenario test.
- [ ] New historical content has provenance and, where needed, a dossier entry.
- [ ] New data has a definition, state/view/knowledge plan, and coverage entry.
- [ ] Player-facing views read knowledge, not truth.
- [ ] New content is in a pack with a manifest and references validated.
- [ ] `STATUS.md` and `WORKLOG.md` are updated.
- [ ] No new dependency without a one-line justification in `STATUS.md` or an ADR.

---

## Context hygiene

- Prefer `grep` over reading: `grep -n "### 9.5" "The Song of the Wanderer Spec.md"`.
- The spec's section numbers are stable. Cite them in code comments and docs.
- Keep `STATUS.md` short. It is a cache, not a history. History goes in `WORKLOG.md`.
- Do not restate the plan in conversation; link to `docs/PLAN.md` and milestone files.
- When a task needs more than ~1,500 lines of reading, split the task.
- At M8+, use the studio to inspect state and graphs instead of tracing code by hand.

## Escalation

Stop and ask the user when a change would: alter the protagonist's mystery rules,
commit to a historical claim that lacks a source, add a new gameplay pillar, change the
save format without a migration, or invalidate a region's authored chronology.
