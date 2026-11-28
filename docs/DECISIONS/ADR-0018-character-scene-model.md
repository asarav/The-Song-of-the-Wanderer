# ADR-0018 — Characters, scenes and obligations are model, not prose

**Status:** accepted · **Date:** 2026-11-28 · **Milestone:** M4b-T00a/T00b

## Context

The M4 evaluation found characters, factions and mystery weak. The prose pass improved
voice, but the model could not represent what the prose was doing:

- `wants`, `fears` and `contradiction` were inert strings. No engine, linter, scenario or
  UI read them.
- Relationships were five integers per character, with no band and no memory of what had
  already been discussed.
- A dialogue graph had no goal, obstacle, turn or stakes. Three probing answers in a row
  were structurally valid.
- `characterStates` existed in the save but dialogue did not use it.
- Obligations were bare ids on the player, with no creditor, amount or due day.
- Scenarios addressed answers by numeric index, so a prose edit could silently change
  what a test exercised.

Depth was not enforceable because it was not data. Two failures recurred: a prose rewrite
removed the gate tax, and Yada's lesson said five shekels while charging four.

## Decision

Add an additive character/scene model, make it mandatory where the slice needs it, and
fingerprint the mechanics prose must not change.

1. **Character v2.** Recurring and major characters carry object wants
   (`id`, `text`, `stake`, `scene`), a voice profile (register, address, tics, avoid,
   sentence ceiling, three sample lines), ties, knowledge and appearances. Local and
   ambient characters may stay light.
2. **Scene contract.** A conversation graph may declare `goal`, `obstacle`, `turn`,
   `stakes`, an optional want and a callback. Every answer gets a stable `id` and a
   dramatic `intent` (`probe|reveal|bargain|help|refuse|deflect|cost`). A recurring scene
   must have a contract and at least one non-probe answer.
3. **Interaction memory.** `CharacterState` gains optional `metDay`, `lastScene` and
   `topics`. Dialogue records the day it first met the traveller, the node it last played
   and every node it has already discussed.
4. **Obligations.** `narrative.promises[]` records `{id, character, kind, text, openedDay,
   dueDay?, status, closedDay?}`. Sibtu's five shekels, Amnit's debt and Shipti's brother
   use this record. New effects: `promise`, `settlePromise`, `markTopic`. New conditions:
   `deed`, `topicAsked`, `knowsFact`, `regardBand`, `promiseOpen`.
5. **Regard bands.** `hostile|cold|wary|neutral|warm|close` are derived from the five
   dimensions; they are never stored. `RegardChanged` is emitted when the band moves, and
   the store turns it into a standing notice.
6. **Choice ids.** Scenario commands may use `chooseChoice {choiceId, dialogue, node}`.
   Numeric `chooseDialogue` remains for compatibility only.
7. **Mechanics guard.** Choice order and ids, effects, conditions, entries and scene
   contracts are fingerprinted in `content/mechanics.lock.json`. Changing them requires
   `pnpm content:guard --update --reason "<why>"`. Prose edits remain free.

## Consequences

- Save format v6. A v5 save migrates to an empty promise list and no remembered topics;
  the existing migration chain is unchanged. `round-trip-v5.json` is kept as the migration
  fixture, `round-trip-v6.json` as the current round trip.
- Nine characters and thirty-seven graphs gained data, not new branches. The slice's
  story is unchanged; its structure is now visible to tools.
- `pnpm check` gains `model:check`, `prose:lint`, `price:check`, `content:guard`,
  `invariant:check` and `docs:check`.
- The model stops at what these nine characters use. Arcs, directors and off-screen
  simulation remain M6, and are not implied by promises or ties.
- A new recurring scene now fails the gate until it names a goal, a turn, stakes, a
  callback and at least one answer that does something other than ask.
