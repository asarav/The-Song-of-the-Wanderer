# Status

**Updated:** 2026-11-28 · **Phase:** M4b — slice revision (M4 closed, ADR-0017)
**Health:** `pnpm check` green (55 files / 1105 tests, all content gates) · `pnpm build` green (existing chunk warning)
**Active task:** M4b-T02 — the fresh-reader session (external evidence)

This file is the shared memory between sessions. Rewrite it at the end of a work
session; do not append. History belongs in `WORKLOG.md`.

## Where the project is

- **M4 is closed.** Gate A passed on the design owner's pass plus three agent sessions;
  the original three-persona protocol was not met and that is recorded in ADR-0017.
- **Decision: revise**, not expand. `docs/playtests/findings.md` has the seven verdicts:
  world **strong**; travel loop, trade, language **promising**; characters, factions and
  mystery **weak**.
- **M4b is the active milestone.** T00 (model, enforcement, automation), T01 (cast) and
  T03 (standing) are done. T02 is done except the one session by a reader who has not
  seen the design docs; that session is the external evidence ADR-0017 carried forward.
- **M5–M8 stay blocked** until that session is recorded in `docs/playtests/human/` and the
  M4b definition of done is met.

## What is playable

- Two destinations (Ugarit and Cyprus), one crossing, and the hand-authored **Sibtu's
  cloth** thread with paid and kept endings, plus Ada's tin through the blade.
- The loop: arrive, visit places, speak to people, buy and sell, learn a route, arrange
  passage, resolve crossing scenes, rest and work.
- Systems: one silver purse, cargo weight, reserve, grain, afflictions, road hazards,
  language tiers, relationship/faction regard with readable bands, promises and debts,
  journal, codex, maps, day reports, autosave/manual save, text size and reduced motion.
- The Ugarit arrival intro names Tiro at the mole, so the first crossing is discoverable
  from the screen rather than from the design docs.

## The machine

The model is now data, and the data is mandatory:

- **Character v2** — object wants with a scene, voice profile with sample lines and a
  sentence ceiling, ties, knowledge, appearances.
- **Scene contract** — goal, obstacle, turn, stakes, optional callback; 274 answers carry
  stable ids and intents.
- **Interaction memory** — first meeting day, last scene, topics already discussed.
- **Promises** — one record with creditor, kind, due day and status; Sibtu's five shekels
  open and settle, Amnit's debt and Shipti's brother are recorded.
- **Regard bands** — derived from the five dimensions, never stored; `RegardChanged`
  becomes a standing notice in the same channel as the language notice.
- **Mechanics guard** — prose edits are free; changing choice order/ids, effects,
  conditions, entries or contracts needs `pnpm content:guard --update --reason`.
- **Proof the gates check** — 18 broken-fixture tests in `tools/gates.test.ts` assert the
  expected error from every gate: missing voice/want, missing contract, unresolved
  callback, asymmetric kin, probe-only scene, duplicate choice id, unread flag, bad POV,
  anachronism, overlong beat, uncosted price, unlocked mechanics edit, broken invariant
  and stale docs. Fixtures are in-memory only; none enter a pack, manuscript or table.

Commands in `docs/TOOLING.md`: `task:brief`, `ask`, `entity`, `flag`, `impact`,
`content:workbench`, `scene:preview`, `manuscript`, `coverage:choices`, `affected`,
`docs:sync`, `new:dialogue`, `art:ledger`, `task:finish`.

## Open work

- **M4b-T02 external reader.** Record the session in `docs/playtests/human/`; then update
  `findings.md`, mark M4b done, and open M5.
- **Prose is clean.** `prose:lint` reports 0 errors and 0 warnings; the ceilings are
  unchanged and the audit records what changed.
- **Art debt.** `pnpm art:ledger` reports 0 missing, 0 stale, 253 legacy borrowings
  (cap 257). Debt must keep shrinking; a new beat cannot borrow.
- **Audio stays M18.** The exploratory beds are unchanged.
- **No new branches were invented.** The character/scene migration changed data and
  tooling, not the slice's story.
