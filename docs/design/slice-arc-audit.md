# Slice arc and tutorial audit — 2026-11-27

Scope: the two authored destinations, Ugarit and the Cypriot harbour, and the one sea
crossing between them. The question was whether the slice contains a complete character
arc or a complete mechanics tutorial, and which loose ends belong here rather than in a
later milestone.

## Verdict

- **No formal character arc existed.** There is no `ArcDef` content, no arc compiler and
  no arc director; `ArcState` is defined in the save schema but nothing advances it. Those
  are M6-T04 and M6-T05 by design (`docs/milestones/M6-characters-arcs.md`), so the engine
  system was not implemented early.
- **The slice now contains one complete hand-authored arc: Sibtu's cloth.** It has a
  premise, a decision, a delayed consequence, a paid resolution and a kept-back failure
  resolution. It runs entirely in Ugarit and needs no M6 system. It is a dialogue-and-
  journal thread, not an `ArcDef`; M6 can port it when the arc runtime exists.
- **No complete mechanics tutorial existed.** The prologue establishes the world, not the
  interface. The first visit now carries **one contextual First step at a time**: choose a
  place, trade, arrange passage, and learn what the current place offers. The hints follow
  the early screens and disappear once the traveler has made a crossing; there is no single
  wall of instructions.
- **The palace errand now connects to Cyprus.** Before this pass the palace audience was
  unreachable and the seal it granted had no delivery scene. The errand, the seal and
  Kinyras's recognition are now a complete institutional thread across the two places.
- **Amnit and Belet are not slice arcs.** Amnit is a recurring colleague whose full arc is
  the worked example for M6 (`docs/NARRATIVE_SYSTEMS.md` §13); Belet's second want is a
  rung on the protagonist's mystery ladder
  (`docs/design/02-protagonist.md` §6), not a question this slice answers.

## What counts as complete here

A thread is complete in this slice when it has all of the following without a future
milestone:

1. an opening situation the player can find;
2. at least one choice that changes state;
3. a consequence that can be observed later;
4. a success ending and a failure ending, or an explicit statement that it is a mystery
   by design;
5. content and documentation that agree on where it ends.

## Thread-by-thread evidence

| Thread                                      | Where it runs                                  | What the slice contains                                                                                                                                                                                                                   | Complete here?                                                      | If not, where it belongs                                                                                            |
| ------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Sibtu's cloth**                           | Ugarit: workshops, market, workshops           | Ask → wait a day → take the bundle → sell it → pay five or keep the money. Paid: trust +1, a settled journal, 117 silver. Kept: trust −2, a failure journal, 122 silver.                                                                  | **Yes.** This is the slice's testable character arc.                | M6-T04 defines the arc shape and M6-T05 can run it with the same beats.                                             |
| **Palace errand and seal**                  | Ugarit gate → scheduled audience → Cyprus yard | Hannu's trust opens the errand; the audience grants the seal and palace favour; Kinyras recognises the seal, records the delivery and adds favour.                                                                                        | **Yes.** Institutional thread, not a character arc.                 | Faction consequences beyond favour belong to M6-T03/T05.                                                            |
| **Amnit**                                   | Ugarit harbour; later, Cyprus                  | A colleague with wants, fears and a recurring memory; she gives a warning about the crossing and can meet the traveler again.                                                                                                             | **No.** Recurring cameo, not an arc.                                | M6-T04 (definitions), M6-T05 (director), M6-T10 (port the recurring merchant); shape in `NARRATIVE_SYSTEMS.md` §13. |
| **Belet and the hymn**                      | Ugarit temple                                  | A singer offers a resemblance and a rumour. She never identifies the protagonist or resolves the hymn.                                                                                                                                    | **Deliberately no.** The mystery must stay unresolved.              | M6-T07 for recognition rules; the mystery ladder in `02-protagonist.md` §6 governs how much may ever be confirmed.  |
| **Hannu, Tiro, Yada, Kinyras, Ada, Shipti** | Their own places                               | Functional relationships, prices, work, warnings and local knowledge. Several remember a return visit.                                                                                                                                    | **No.** Supporting roles, not arcs.                                 | M6-T01–T05 if any is promoted; no promotion is required by this slice.                                              |
| **Faction standing**                        | Palace and merchants                           | Palace favour from the errand and seal; merchants' trust from helping Sibtu.                                                                                                                                                              | **No.** Single-axis standing, no faction storyline.                 | M6-T03 (relationships and obligations) and M6-T05 (reactions); faction politics is later than this slice.           |
| **Mechanics tutorial**                      | Ugarit destination, market, harbor, roads     | One contextual **First step** hint at a time on the early screens; contextual gain/loss tips; tooltips for purse, carrying and cargo; explicit unavailable reasons; session log on Journal. | **Yes for the slice.** It teaches every mechanic the slice exposes without one wall of text. | Human playtests (M4-T01–T03) decide whether it is enough without a dedicated tutorial screen.                       |
| **Journey encounters**                      | The sea crossing                               | Authored waypoints plus seeded encounters; a repeated encounter in one crossing is now suppressed.                                                                                                                                        | **Yes for one route.**                                              | More routes and storylet variety belong to M6-T08.                                                                  |
| **Trade confirmation**                      | Any market                                     | Buy and sell now report what changed; gain/loss still compares against cost basis.                                                                                                                                                        | **Yes.**                                                            | —                                                                                                                   |
| **Conversation log**                        | Journal                                        | Session transcript, now folded behind a disclosure so it does not bury the journal.                                                                                                                                                       | **Yes as a reference.** It is intentionally not saved.              | A permanent transcript would be a save-schema decision, not a slice fix.                                            |

## Intentional openings, not holes

These read as unfinished only if the slice is mistaken for the whole story. Each is
authored as a hook and has a recorded choice; none is waiting on a missing scene inside
the slice.

- **Hannu's letter** (`dlg.ugarit.letter`) follows the palace errand and the seal. The
  traveler can go to the gate or burn it; the choice records `palace.letter.answered` or
  `palace.letter.burned` and moves palace suspicion. The letter's question is for the next
  act, not for this destination.
- **Shipti's letter** (`dlg.cyprus.return-letter`) follows the copper deal. Taking or
  leaving it records a flag and the journal entry; it is the slice's closing reason to
  continue. `M3-slice-content` names this ending beat and `docs/design/03-acts.md` repeats
  that the slice ends on a letter, rumour, name or obligation rather than a resolution.
- **Belet's hymn** is the third deliberate opening. She gives a resemblance and a rumour;
  the mystery ladder forbids this slice from answering what they mean.

## Loose ends found and fixed here

| Defect                                                                                       | Effect before                                                                                       | Fix                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palace errand required palace standing ≥ 1, but no pre-errand action raised palace standing. | Hannu's errand could never be opened, so the seal and its Cyprus scene were unreachable.            | The gate now opens on Hannu's trust ≥ 1, which the gate conversation itself can earn. The unavailable note says what is missing.                                                        |
| The palace seal had no delivery scene.                                                       | A player could carry a story object with no use and no closure.                                     | Kinyras's meeting, return and after-deal nodes offer **Show him the seal**; the new `seal` node sets `palace.seal-shown`, adds palace favour and writes `journal.slice.seal-delivered`. |
| Sibtu's failure branch ended in the same `kept` scene with no record.                        | Refusing the five shekels changed trust and money but left no journal entry and no return greeting. | Added `after-cloth-kept`, split the paid and kept entry conditions, and added `journal.slice.sibtu-cloth-kept`. Both outcomes now close the thread explicitly.                          |
| Cypriot arrival started inside Shipti's inn before the island was described.                  | The destination introduction then repeated “the island comes up” after the player had already met the innkeeper. | The landfall paragraph now opens the doorway scene; the destination introduction is a present-tense harbor description. The doorway node carries three beat plates. |
| The thirty-six-shekel counter-offer recorded money but no deal.                                | The journal skipped the copper agreement, the deed was absent, merchants gained no trust and the letter had no recorded cause. | The hard branch now records `journal.slice.copper-deal`, `deed.copper-agreed`, merchant trust, the yard-price knowledge and the letter schedule. `scenario.slice.cyprus-counter` covers it. |
| Sibtu's news could fire without the five shekels being repaid.                                 | The event was gated on taking the bundle; it could claim a settled household on the kept-back branch, and the paid branch showed nothing. | The event now requires `journal.slice.sibtu-cloth-settled` and writes `journal.slice.sibtu-news`. |
| The inn room cost three shekels and changed nothing.                                           | The copy promised a night, but no day passed and no reserve returned.                                       | The room now advances one day, restores two reserve and adds one Shipti trust; the copy says one night. |
| `journal.slice.first-crossing` was authored but never awarded.                               | The first crossing produced no journal entry.                                                       | The Cypriot arrival event now awards it.                                                                                                                                                |
| A journey could schedule the same encounter twice.                                           | The same scene could appear twice in one crossing.                                                  | Slot generation dedupes by event ID and keeps the first occurrence; a regression test covers it.                                                                                        |
| Buying and selling returned no confirmation.                                                 | The purse changed silently unless the player watched the rail.                                      | The store emits a trade confirmation with the good, quantity and silver change.                                                                                                         |
| The conversation log sat open below every journal entry.                                     | The journal's own record was buried under the session transcript.                                   | The transcript is now a folded disclosure.                                                                                                                                              |

## Deferred work and its owner

| Deferred item                                                    | Why it is not in this slice                                                                                               | Documented owner                                                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ArcDef`, `BeatDef`, branches, resolution and failure validation | The slice has no arc compiler; inventing one here would duplicate M6 and change the save schema early.                    | M6-T04, `docs/milestones/M6-characters-arcs.md`; shape in `docs/DATA_MODEL.md` §8–9 and `NARRATIVE_SYSTEMS.md` §4. |
| Arc director, off-screen beats, stranded-arc detection           | Needs the arc runtime and the larger cast.                                                                                | M6-T05.                                                                                                            |
| Amnit's multi-act arc and the recurrence port                    | Her arc spans decades and later regions; the slice only has her opening working relationship.                             | M6-T10; `NARRATIVE_SYSTEMS.md` §13.                                                                                |
| Belet's hymn and the protagonist's recognition                   | Resolving it would break the mystery discipline; the slice may only offer a resemblance and a rumour.                     | M6-T07 and `docs/design/02-protagonist.md` §6.                                                                     |
| Faction policies, obligations and inter-faction consequences     | The slice exposes standing and favour, not faction storylines.                                                            | M6-T03/T05.                                                                                                        |
| A dedicated tutorial screen or scripted onboarding               | One contextual First step hint at a time covers every slice mechanic; a separate screen is a human-playtest decision. | M4-T01–T03.                                                                                                        |
| The illustrated prologue runs ten beats before the first choice   | The pacing question needs human evidence, not another content edit in this pass.                                           | M4-T01–T03.                                                                                                        |
| Ada's night-kiln conversation can repeat after its cooldown        | The long scene returns in full; a short repeat needs the recurrence work rather than a one-off fork.                        | M6-T05, then the night-kiln content.                                                                               |
| More routes, storylets and encounter variety                     | One crossing is the slice's deliberate boundary.                                                                          | M6-T08 and the route work after Gate A.                                                                            |

## Regression coverage added

The authored scenarios run through `pnpm simulate` and the authored-scenario test. The
slice-specific ones include:

- `scenario.slice.sibtu-paid` — the full thread through the five-shekel resolution;
- `scenario.slice.sibtu-kept` — the same thread through the refusal ending;
- `scenario.slice.palace-errand` — gate trust → audience → seal and palace favour;
- `scenario.slice.palace-seal` — the seal shown to Kinyras, with the delivery journal.
- `scenario.slice.cyprus-counter` — the thirty-six-shekel counter-offer, with its journal,
  deed, faction trust and closing letter.
- `scenario.slice.sibtu-news` — the paid cloth path, the crossing, eight days of waiting,
  and the delayed `journal.slice.sibtu-news` entry.

The existing `scenario.slice.refugee-tomorrow`, `scenario.slice.crossing` and
`scenario.slice.cyprus-return` continue to cover the scheduled request, the crossing and
the return trade.
