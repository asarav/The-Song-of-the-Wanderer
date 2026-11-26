---
name: SotW Context
description: Bootstrap, resume, or hand off a work session on The Song of the Wanderer. Use at the start of any session in this repository, when the user says "continue", "pick up where we left off", or "hand this off", and before ending a session.
---

# Session context protocol

This project spans years of content and many short agent sessions. Conversation memory is
not authoritative. Disk is.

## Start of session

1. Read `AGENTS.md` (non-negotiables and definition of done).
2. Read `docs/STATUS.md`. It is short by design.
3. Open the milestone named in STATUS under *Active task* or *Next three tasks*
   (`docs/milestones/M*.md`).
4. Read only the docs that task touches:
   - engine / store / saves → `docs/ARCHITECTURE.md`
   - timeline, phases, events, rumours → `docs/WORLD_MODEL.md`
   - characters, arcs, lineages, storylets → `docs/NARRATIVE_SYSTEMS.md`
   - modules, packs, performance, repo evolution → `docs/SCALING.md`
   - tools and QA → `docs/TOOLING.md`
   - content authoring → `docs/CONTENT.md` + `docs/templates/`
   - anything historical → `docs/HISTORY.md` + the destination dossier
   - narrative / character / tone → `docs/design/02-protagonist.md`,
     `docs/design/03-acts.md`
5. Confirm the working tree and checks:
   ```
   git status --short
   pnpm check
   ```
   If checks fail before you change anything, report it and fix or record it in STATUS
   before claiming new work.

## Claiming work

- Write the task ID and title into `docs/STATUS.md` under **Active task**.
- Claim exactly one task. If the task cannot be finished in one session, split it in the
  milestone file and claim the smaller half.
- If the task is blocked by a missing decision, stop and ask. Do not guess canon.

## Reading budget

- Never read the full specification. Use `grep -n "### 9.5" "The Song of the Wanderer Spec.md"`
  and read the surrounding section.
- If a task seems to need more than ~1,500 lines of reading, it is too large. Split it.
- Prefer `docs/design/*` over the spec for day-to-day authoring; they are the distilled
  version and should be corrected if wrong.

## End of session

1. `pnpm check` must be green. If not, leave the tree in a working state or explicitly
   record the failure and the exact command in STATUS.
2. Rewrite `docs/STATUS.md` (do not append): phase, health, active task (`none` if
   finished), next three tasks, blockers, open questions.
3. Append one entry to `docs/WORKLOG.md` using the format at the top of that file.
4. Tick completed acceptance criteria in the milestone file.
5. Commit with `Mx-Tyy: imperative summary`.
6. If a structural decision was made, add an ADR in `docs/DECISIONS/`.

## Handoff line

Tell the user: "Handoff is written. A new session can start with: read `AGENTS.md` and
continue from `docs/STATUS.md`."

Do not summarize the whole project in chat; point at the files.
