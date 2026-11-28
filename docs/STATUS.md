# Status

**Updated:** 2026-11-28 · **Phase:** M5 — world model and timeline (M4b closed)
**Health:** `pnpm check` green (all gates, including `factory:check` and `ambient:check`) · `pnpm build` green (existing chunk warning) · `playtest:review --strict` clean for trader, curious and helper (0 open findings)
**Active task:** M5-T01 — eras, phases, regional state and day context

This file is the shared memory between sessions. Rewrite it at the end of a work
session; do not append. History belongs in `WORKLOG.md`.

## Where the project is

- **M4 is closed.** Gate A passed on the design owner's pass plus three agent sessions;
  the original three-persona protocol was not met and that is recorded in ADR-0017.
- **M4b is closed.** T00 (model, enforcement, automation), T01 (cast), T02 (the opening
  and the fresh reader), T03 (standing), T04 (content factory) and T05 (living time) are
  done. The fresh-reader record is `docs/playtests/human/2026-11-28-fresh-reader.md`: an
  owner attestation, not a transcript, with no invented quotes.
- **M5 is the active milestone.** T01 is the current task. M6–M8 stay blocked by M5 in
  practice, not by M4b any longer.

## What is playable

- Two destinations (Ugarit and Cyprus), one crossing, and the hand-authored **Sibtu's
  cloth** thread with paid and kept endings, plus Ada's tin through the blade.
- The loop: arrive, visit places, speak to people, buy and sell, learn a route, arrange
  passage, resolve crossing scenes, rest and work.
- **Living time:** day and travel have authored observations; night varies by culture and
  day instead of one static paragraph per port. Four daytime storylets give Ugarit and
  Cyprus scenes in daylight. Ambient copy adds no Continue and changes no state.
- Systems: one silver purse, cargo weight, reserve, grain, afflictions, road hazards,
  language tiers, relationship/faction regard with readable bands, promises and debts,
  journal, codex, maps, day reports, autosave/manual save, text size and reduced motion.

## The machine

- **Character v2** — object wants with a scene, voice profile with sample lines and a
  sentence ceiling, ties, knowledge, appearances.
- **Scene contract** — goal, obstacle, turn, stakes, optional callback; stable choice ids
  and intents.
- **Interaction memory, promises and regard bands** — first meeting day, last scene,
  topics; one directional promise record; bands derived, never stored.
- **Content factory** — `pnpm factory -- new|variants|audit|check`. Authored fragments,
  deterministic variants, dry-run by default, `TODO:` scaffolds that fail the gate.
- **Ambient time layer** — `AmbientObservation` content, `deriveAmbient`, `fireDay` before
  `fireNight`, deterministic selection with previous-day tag avoidance.
- **Gates** — `pnpm check` now includes `factory:check` and `ambient:check` beside
  `content:lint`, `model:check`, `prose:lint`, `price:check`, `content:guard`,
  `invariant:check`, `docs:check` and the rest. The broken-fixture tests in
  `tools/gates.test.ts` still prove the gates check.
- **Mechanics guard** — prose edits are free; changing choice order/ids, effects,
  conditions, entries or contracts needs `pnpm content:guard --update --reason`.

Commands in `docs/TOOLING.md`: `task:brief`, `ask`, `entity`, `flag`, `impact`,
`content:workbench`, `scene:preview`, `manuscript`, `coverage:choices`, `affected`,
`docs:sync`, `new:dialogue`, `factory`, `art:ledger`, `task:finish`.

## Open work

- **M5-T01** — era/phase/calendar schemas and a pure day-context derivation that the slice
  re-expresses through. No new regions.
- **Prose is clean.** `prose:lint` reports 0 errors and 0 warnings; ambient copy is
  included.
- **Art debt.** `pnpm art:ledger` reports 0 missing, 0 stale, 78 legacy borrowings in 10
  city dialogue files. Ten dialogues are complete: `dlg.cyprus.arrival`,
  `dlg.ugarit.faction-request`, `dlg.ugarit.letter`, `dlg.ugarit.sibtu.ask`,
  `dlg.ugarit.refugee-ask`, `dlg.cyprus.copper-offer`, `dlg.ugarit.belet.temple`,
  `dlg.cyprus.shipti.inn`, `dlg.ugarit.hannu.gate` and `dlg.ugarit.yada.lesson`. Travel,
  journal, codex, place, night and ambient are at 0. Four plates in the inn dialogue are
  reference-guided generations, made with an approved Cypriot plate as the image
  reference and cropped to the object; every drifting take was discarded before wiring.
  Mappings, crops, reuses and rejected takes are in `assets/exploratory/README.md`.
- **Audio stays M18.** The exploratory beds are unchanged.
- **No save change.** Save format remains v7; ambient is derived and daytime pools are
  content.
