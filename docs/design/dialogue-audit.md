# Dialogue audit — recurring scenes

Every recurring conversation now carries a scene contract and stable answer ids. This is
the human audit of what each scene is *for*; `pnpm model:check` proves the structural
half, `pnpm prose:lint` the mechanical half. A scene that cannot answer the three
questions below is not ready. At the close of this pass both checks report **0 errors and 0
warnings**; no sentence ceiling was widened to get there.

| Scene | Goal | Turn | Answer that is not a probe | Callback |
|---|---|---|---|---|
| `dlg.ugarit.arrival` | Get through the gate | Hannu gives directions instead of a fine | Pay the tax; show the seal | opening journal |
| `dlg.ugarit.amnit.meeting` | Sell grain without being cheated | Amnit offers the good end of the mat | Accept the price; ask about copper | opening journal |
| `dlg.cyprus.amnit` | Collect a debt in person | She asks the traveller to witness | Remember the debt; let her work | Amnit met journal |
| `dlg.ugarit.hannu.gate` | Pass without an incident | He admits the house is empty | Take the errand; refuse it | gate arrival |
| `dlg.ugarit.night-watch` | Walk the mole unbothered | He talks about his son | Share the watch; go in | `arrived.ugarit` |
| `dlg.ugarit.yada.lesson` | Get a lesson without an insult | He lets “good” escape | Pay; copy the signs | opening journal |
| `dlg.ugarit.tiro.passage` | Book passage at the fare | He offers work instead of charity | Work the crossing; pay | opening journal |
| `dlg.ugarit.belet.temple` | Hear the hymn and the name | She admits her sister sang it | Give oil; stay for the hymn | opening journal |
| `dlg.ugarit.mystery` | Learn why the name follows her | She names the trader and the funeral | Refuse certainty; ask the east | `belet.hymn` |
| `dlg.ugarit.sibtu.ask` | Sell the cloth without being merchandise | She asks plainly and hates it | Take the bundle; pay the five | opening journal |
| `dlg.ugarit.refugee-ask` | Find a buyer without the yard | She hands over the cloth | Take it; lend silver; refuse | `sibtu.met` |
| `dlg.cyprus.kinyras.meeting` | Learn what copper is worth | He names the yard price | Offer grain; argue the count | opening journal |
| `dlg.cyprus.copper-offer` | Sell at the yard price | He respects an argument | Agree; demand thirty-six | `kinyras.met` |
| `dlg.cyprus.ada.smithy` | Sell tin without being cheated | She lets the girl watch the weighing | Sell the tin; ask the word | opening journal |
| `dlg.cyprus.night-kiln` | See the firing through | She talks about her father selling the yard | Stay; ask why | `ada.work` |
| `dlg.cyprus.shipti.inn` | Find the buyer and the post | She admits her brother owes her | Take the letter; ask about copper | opening journal |
| `dlg.cyprus.arrival` | Find a bed | She warns about the yard and harbor | Take the room; sleep outside | opening journal |

## Still weak

- `dlg.ugarit.mystery`, `dlg.cyprus.copper-offer`, `dlg.ugarit.arrival` and
  `dlg.ugarit.refugee-ask` are scheduled event scenes, so they have no repeat entry. A
  second meeting is deliberately not written; do not add one until M6 owns recurrence.
- The four event scenes use a recurring speaker but are not `talkTo` conversations. The
  model check treats them as events, not as repeatable graphs.

## Resolved in the prose pass

- Amnit's 91-word opening is 90 words after trimming one conjunction, so it stays one beat
  and no illustration plate was added.
- Eleven quoted sentences were split at their existing clause boundaries. The authored
  ceilings were kept: Amnit 22, Ada 20, Hannu 18, Sibtu 16, Tiro 22, Yada 26.
- Sibtu's `after-help` and `after-cloth` follow-ups now offer `deflect` ("Ask nothing
  more") beside the question, so the node is a choice to disengage rather than a second
  probe. The mechanics guard records that change.
- The first-person rule now matches capitalised narration as well as lower case; the
  broken-fixture test caught the old case-sensitive pattern.
