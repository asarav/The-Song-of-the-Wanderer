# ADR-0012 — Places own presence and actions

**Status:** accepted · 2026-11-27
**Related:** `docs/DATA_MODEL.md` §5.2, `src/engine/content/schema.ts`, `src/engine/views/destination.ts`, `src/ui/App.tsx`

## Context

The destination was doing three jobs at once: the port as a whole, the places inside it,
and the people and verbs attached to those places. The code called each place an
"activity" — naming the noun after the verb — and showed one port-wide list of everyone
present. A scene started at the smithy returned to the port, not the smithy, and the
quarter map sent a market or harbor straight to its screen while every other mark opened
a card on the destination.

That made the hierarchy cosmetic. Presence was port-wide, actions were implied by a
place's `kind`, and there was nowhere for a place to be a place.

## Decision

- **A destination is the port:** arrival and intro, states, the local sketch, a compact
  list of places, roads, and spending the day. It is an index, not a directory of people.
- **A place is the unit of arrival:** the market, the harbor, the gate, the temple, the
  workshop quarter, the inn. It owns its hero art, description, people, and actions.
- **A person is found at a place.** Each destination keeps the cast; each place carries an
  authored `cast` that must be a subset of it. A character present at the destination but
  assigned nowhere appears under **Elsewhere in the port**. Nobody is hidden.
- **An action is a verb a place affords.** `trade` belongs to the market; `passage` belongs
  to the harbor. A place with no implemented action shows no buttons. `actions` is an
  authored list, not inferred from `kind`.
- **The concept is renamed to places in the schema, views, and interface.** Existing `act.*`
  IDs stay. Stable IDs matter more than a spelling pass, and renaming them would churn
  content, tests, and saves for no player-visible gain.
- **Presence remains runtime state; assignment is authored.** No save field is added. The
  selected place is presentation-only `placeId` in the store, cleared when the player
  leaves the port, and used to return from a market, the roads, or a scene to the place
  they began in.
- **The local map navigates to places.** Every mark opens its place; the place screen then
  offers only the actions that actually exist there. This replaces the old direct-to-market
  and direct-to-roads shortcuts.
- **The port-wide "People here" list is removed.** The People screen remains the
  relationship index. A place shows its own people with **Speak**.

## Consequences

- A place screen costs one extra click before talking or trading. Arrival is the emotional
  beat of the game and place art was previously only a card thumbnail, so the extra step
  is accepted. The port index stays short, remembers the last place, and the quarter map
  jumps straight in.
- Every place cast member must be in the destination cast, and a character may be assigned
  to only one place in the slice. The content linter enforces both rules.
- Dynamic presence — people moving between places by time or event — is a later, explicit
  model change. This ADR does not pretend authored assignment is a schedule.
- Place actions are a closed list for now. Adding a verb means adding an action ID, a
  place screen control, and the mechanic behind it; no placeholder buttons.
