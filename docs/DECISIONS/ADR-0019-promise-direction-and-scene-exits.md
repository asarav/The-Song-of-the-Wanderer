# ADR-0019 — Promises have a direction, and scenes have an exit

**Status:** accepted · **Date:** 2026-11-28 · **Milestone:** M4b playtest revision

## Context

The playtest found two failures the old gates could not see.

First, a promise record stored a creditor and a `kind` (`promise` or `debt`), but no
direction. The confirmation, Status and Journal inferred who owed whom from `kind` and
from the sign of a relationship value. Sibtu's “Then you are owed” and the Status screen
could therefore disagree. The same record meant different things in different views.

Second, a scene that ended cut straight to the next scene or destination. Belet's temple
ended and Sibtu's first line appeared with no acknowledgement that a conversation had
closed; a hunt ended and the next screen was already the island. Time advanced during the
scene, but the night or morning it produced was silently skipped. The model proved a
callback existed, not that a scene had an aftermath.

## Decision

1. **Store direction, never infer it.** Every promise/debt carries
   `owedBy: 'player' | 'character'`.
   - `player` means the traveler owes the named character.
   - `character` means the named character owes the traveler.
   The field is required in the save schema and in the DSL effect, and is emitted on
   `PromiseOpened`. `promiseConfirmation`, Status and Journal read it directly.
2. **Relationship obligations are directional in the UI.** A positive person obligation
   reads “Owes you N”; a negative one reads “You owe N”. Faction obligations keep a
   faction label because a faction is not a person who can owe a personal debt.
3. **Migrate conservatively.** Save format 7 adds `migrateV6ToV7`, which gives every
   existing v6 promise `owedBy: 'player'`. The old format never stored direction, so a
   guessed `character` would invent a credit the player never had. The fixture round-trip
   and a v6 migration test pin this.
4. **Presentation-only scene exit.** When a dialogue ends and the next screen is not the
   same dialogue, the store holds a `SceneExit` with the speaker, the last line and the
   destination. The UI shows a card and a Continue button before the next scene, journey
   or destination. It is never saved and changes no game state.
5. **Carry a swallowed night.** If a command advances the calendar but a scene is in
   front of the player, the store remembers that the night is owed. When that scene
   closes, the night screen appears instead of the destination. Travel keeps its own
   journey screen.
6. **Guards.** `model:check` rejects a promise effect without a valid `owedBy`, and warns
   on a terminal node with effects but no closing beat. `prose:lint` rejects British
   spellings in player-facing copy and time-anchored `again` nodes. `playtest:review`
   reports abrupt handoffs, repeated entry openings and no-result endings.

## Alternatives considered

- **Infer direction from `kind`.** Rejected: `kind` describes the social form, not the
  creditor. A `debt` can run either way.
- **Infer direction from the relationship sign.** Rejected: regard and obligation are
  different ledgers; a character can owe the traveler while disliking them.
- **Make every migration `character`.** Rejected: it would turn the player's debts into
  claims against others.
- **Add a full scene-transition state machine.** Rejected for this slice: the exit card is
  presentation only, and a saved transition machine would need its own migration and
  recovery rules.

## Consequences

- Old saves open with every existing promise marked as the player's debt. That is the
  only direction the old data supports; the migration note says so.
- Content authors must state `owedBy` on every new promise effect; the schema and
  `model:check` fail without it.
- A scene can no longer end without a visible closing beat unless its node is explicitly
  exempted by its prose (the warning is a prompt, not a silent pass).
- The exit card is not a save point. A reload after the card appears returns to the
  persisted screen, which is the next scene or destination; the card is not replayed.