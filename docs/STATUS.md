# Status

**Updated:** 2026-11-27 · **Phase:** M4 — playtest and evaluation (Gate A pending)
**Health:** `pnpm check` green (54 files / 1035 tests) · `pnpm build` green (existing chunk warning) · 13 playtest checkpoints
**Active task:** M4-T01 — recorded human playtest sessions (needs people)

This file is the shared memory between sessions. Rewrite it at the end of a work
session; do not append. History belongs in `WORKLOG.md`.

## Current slice

- Two destinations (Ugarit and Cyprus), one crossing, and a complete hand-authored
  **Sibtu's cloth** thread with paid and kept endings.
- The loop is playable end to end: arrive, visit places, speak to people, buy and sell,
  learn a route, arrange passage, resolve crossing scenes, rest and work.
- Systems present: one silver purse, cargo weight, reserve, grain provisions, afflictions,
  road hazards, language tiers, relationship/faction regard, journal, codex, maps,
  day reports, autosave/manual save, text size and reduced-motion support.
- The first voyage has one contextual **First step** hint at a time instead of a single
  onboarding wall. It follows the destination, market, harbor, roads, other places and
  cargo, and disappears after the first crossing.
- The slice is exploratory art and audio, not the M18 asset pipeline.

## M4 task state

- **M4-T01 — open.** Three recorded human sessions (trader, curious traveller, helper),
  at least one with a reader who has not seen the design docs, are still required.
- **M4-T02 — open.** The seven §22.1 verdicts need those sessions; no `findings.md` exists.
- **M4-T03 — open.** Balance and clarity changes need observed human play.
- **M4-T04 — done with caveats.** Text size, color-independent indicators, skip link,
  focus outlines, dialogue log, reduced-motion handling and autosave are in place. A full
  keyboard-only run and an OS-level reduced-motion session are not recorded.
- **M4-T05 — open.** Gate A's expand/revise/stop decision is not made.
- **M5–M8 remain blocked by Gate A** (`docs/PLAN.md` §7). Do not start M5 until the
  human evidence and decision exist.

## Completed in the 2026-11-27 slice pass

- Fixed Cyprus arrival order, the counter-offer record and letter, the inn-room night,
  the market's zero-cost wording, the sea-toll warning, the empty Roads action, and the
  audio fade clamp.
- Gated Sibtu's delayed news on the **paid** cloth resolution and made it visible in the
  journal. `scenario.slice.sibtu-news` and the `sibtu-news` checkpoint cover the path;
  the journal entry was confirmed in the browser.
- Replaced the old five-lesson panel with contextual hints and removed the unused panel
  callout and styles.
- Added the playtest checkpoint harness and 13 generated checkpoints. Loading a checkpoint
  replaces the browser save and clears the autosave; see `docs/playtests/README.md`.

## Verification

- `pnpm check` green: 54 files / 1035 tests; content lint 132 entities, 0 errors,
  0 warnings; audio check 16 assets, 0 errors, 0 warnings; cross-harness skills check
  passed.
- `pnpm build` green, with the existing chunk-size warning.
- `pnpm playtest:build` writes 13 checkpoints.
- Browser pass covered the arrival order, room night, counter-offer journal/deed, closing
  letter, Sibtu's news entry, and the destination/market/harbor First step hints. The
  hint was absent after crossing to Cyprus.

## Next three tasks

1. **M4-T01** — record the trader, curious-traveller and helper sessions, including one
   first-time reader; store notes in `docs/playtests/human/`.
2. **M4-T02/T03** — write the seven verdicts and make balance/clarity changes from the
   observed sessions; add scenarios for any bugs fixed.
3. **M4-T05** — write `docs/playtests/findings.md`, record the expand/revise/stop
   decision, and update `PLAN.md` if M5 scope changes.

Agent sessions (`docs/playtests/agent/`) are supplementary evidence only; they cannot
tick M4-T01, M4-T02 or M4-T05.

## Known gaps and debt

- No formal `ArcDef`, director or off-screen advancement yet. Amnit's multi-act arc and
  the slice port wait for M6-T04/T05/T10; Belet's recognition thread waits for M6-T07.
  See `docs/design/slice-arc-audit.md`.
- Onboarding still needs human validation. A reload at the first destination suppresses
  the destination hint until the arrival is read again, because `readPassages` is
  session-only; the hint also repeats until the first crossing.
- Dialogue memory is authored per graph: recurring characters have conditional openings
  and return nodes, but new graphs must add them deliberately.
- The conversation log is session-only and clears on reload; it is not a permanent
  transcript by design.
- The slice has one route and two destinations by design. M4 decides whether that is
  enough to judge the loop.
- Deferred, not fixed: the ten-beat illustrated prologue, the intentional zero-silver
  sea-toll trap (now signposted), Ada's repeating night-kiln conversation after its
  cooldown, and language/faction legibility in a single run.
- Beat-art debt: 255 legacy beats without dedicated art. M4's non-goal is new art
  production beyond the test illustration.

## Blockers

1. **M4 human playtests need people.** Everything else needed for Gate A is ready;
   agent sessions can find bugs and shape hypotheses, but the milestone's human
   requirement is not met by them.

## Open questions

1. **Historical review** — who signs off on `documented` and `strongly-supported`
   claims? Until decided, those tags carry a citation in the entity's `provenance`.
2. **Art direction** — review the exploratory set against the `ASSETS.md` anchors and
   decide whether to keep generating exploratory work or commission the direction.
3. **Content budget** — confirm the per-region budget after M4.
4. **Workspace split** — decide at Gate B (M8) whether `SCALING.md` §2 triggers are met.

## Decisions

ADRs 0001–0016 are in `docs/DECISIONS/`. Notably: deterministic engine and seeded
streams, content as data, truth versus knowledge, delta saves, one silver purse, cargo
cost basis, places owning presence/actions, one reserve with grain, afflictions/road
hazards, three roads, exploratory audio in the slice, and the three protagonist names.
