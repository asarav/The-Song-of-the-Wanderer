# M4 — Playtest and evaluation

**Status:** In progress — T04 done; T01/T02/T03/T05 blocked on human playtesters
**Depends on:** M3
**Goal:** evidence, not opinion. Decide whether to expand, revise, or stop.

**Blocked:** the remaining tasks need recorded human sessions. No code work is left in
them until those sessions exist; do not tick them from simulation alone.

## Non-goals

- New destinations or systems.
- Art production beyond one test illustration that validates the unified style.
- Store page, marketing, or release build.

## Tasks

### M4-T01 — Recorded playthroughs

- [ ] Three sessions with different priorities: trader, curious traveler, helper.
- [ ] Each session recorded (video or detailed notes) with duration and friction points.
- [ ] At least one session by someone who has not read the design docs.
- [ ] Notes stored in `docs/playtests/` (create on first use).

### M4-T02 — Evaluate the seven questions

For each question from spec §22.1, write a paragraph of evidence and a verdict
(strong / promising / weak / failed):

1. Travel loop enjoyment.
2. Trading as a reason to travel.
3. Character memorability and desire to return.
4. Language progression as reward, not obstruction.
5. Faction relationships as understandable opportunity.
6. Vivid, distinctive ancient world.
7. Mystery as curiosity, not confusion.

### M4-T03 — Balance and clarity pass

- [ ] Prices, journey durations, and language thresholds adjusted from observed play.
- [ ] Any moment where a player asked "what do I do now?" gets a UI or journal fix.
- [ ] Remove mechanics nobody engaged with; record the cut.
- [ ] Re-run scenario suite and add scenarios for fixed bugs.

### M4-T04 — Accessibility and comfort baseline

- [x] Text size control, color-independent indicators, a skip link and focus outlines.
      The keyboard path is spot-checked; a full keyboard-only run is not recorded.
- [x] Dialogue log available.
- [x] Reduced motion respected.
- [x] Autosave frequency verified against narrative consistency.

### M4-T05 — Decision and plan update

- [ ] `docs/playtests/findings.md` written with evidence and recommendations.
- [ ] `STATUS.md` and `PLAN.md` updated with the decision: expand, revise, or stop.
- [ ] If expanding, confirm M5 scope; the first regional priority and dossier schedule
      are authored at the start of M9.
- [ ] If revising, define a short M4b with the top three blockers.

## Demo script

Play the slice end to end in front of the user, then present findings and the
recommendation.

## Definition of done

Findings exist, the decision is recorded, and the next milestone is either authored or
the project stops with a clear rationale.
