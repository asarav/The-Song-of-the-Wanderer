# M4 — Playtest and evaluation

**Status:** Closed 2026-11-27 on design-owner evidence (ADR-0017) — decision: **revise**
**Depends on:** M3
**Goal:** evidence, not opinion. Decide whether to expand, revise, or stop.

**Evidence note:** the milestone originally required three recorded persona sessions. It
received one design-owner pass recorded as notes plus three agent sessions. ADR-0017
accepts that evidence and records the shortfall; the unmet items remain visible below.

## Non-goals

- New destinations or systems.
- Art production beyond one test illustration that validates the unified style.
- Store page, marketing, or release build.

## Tasks

### M4-T01 — Recorded playthroughs

- [x] One session recorded as detailed notes: the design-owner quick pass, 2026-11-27.
- [x] That session records duration, screens visited and friction points.
- [ ] Three sessions with different priorities: trader, curious traveler, helper.
      **Not run.** Waived for Gate A by ADR-0017.
- [ ] At least one session by someone who has not read the design docs.
      **Not run.** Carried into M4b as an acceptance condition.
- [x] Notes stored in `docs/playtests/`.

### M4-T02 — Evaluate the seven questions

- [x] Seven verdicts written in `docs/playtests/findings.md`, each with a paragraph of
      evidence. Confidence is marked where the evidence is one designer plus agents.

### M4-T03 — Balance and clarity pass

- [x] Every “what do I do now?” moment in the notes received a UI, copy or journal fix:
      grain and reserve, rest, quantity, language gains, destination states, journal order,
      map scales, the crossing choice, and the shelf.
- [ ] Prices, journey durations and language thresholds adjusted from observed play.
      No observed imbalance was reported; nothing was retuned. Left open rather than
      changed without evidence.
- [ ] Remove mechanics nobody engaged with. No mechanic was reported unused; no cut made.
- [x] Scenario suite re-run green; engine changes carry unit tests. No new scenario was
      needed for the UI and content fixes in this pass.

### M4-T04 — Accessibility and comfort baseline

- [x] Text size control, color-independent indicators, a skip link and focus outlines.
      The keyboard path is spot-checked; a full keyboard-only run is not recorded.
- [x] Dialogue log available.
- [x] Reduced motion respected.
- [x] Autosave frequency verified against narrative consistency.

### M4-T05 — Decision and plan update

- [x] `docs/playtests/findings.md` written with evidence and recommendations.
- [x] `STATUS.md` and `PLAN.md` updated with the decision: **revise**.
- [x] A short M4b is defined with the top three blockers:
      `docs/milestones/M4b-slice-revision.md`.
- [x] The missing fresh-reader session is an M4b acceptance condition, not a dropped
      requirement.

## Demo script

Play the slice end to end in front of the user, then present findings and the
recommendation. Done across the design-owner pass and the fixes that followed it.

## Definition of done

Findings exist, the decision is recorded, and the next milestone (M4b) is authored.
Met.
