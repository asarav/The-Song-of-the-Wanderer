# ADR-0009 — One purse of silver, no exchange mechanic

**Status:** accepted · 2026-11-27
**Related:** `src/ui/units.ts`, `App.tsx` (market basis line), `codex.shekel`,
`docs/design/dossiers/ugarit.md` ("Trade and money"), destination `currency`

## Context

Destinations carry a descriptive `currency` string — Ugarit "weighed silver", Cyprus
"weighed copper and silver" — while every price, fare, and the traveler's purse are one
number shown in shekels. A reader can reasonably ask whether crossing to Cyprus should
change their money, and whether the yard there quotes another currency.

There are no coins in 1230 BCE: value is weighed metal. A per-region purse would need
exchange rates the game does not have (and which would be a historical claim the slice
cannot support), rounding at every border, and a second balance to weigh against cargo
capacity. None of it serves a pillar: the market already responds to place through the
authored `priceModifier`, and prices are authored for play.

## Decision

- The traveler keeps **one purse**, a weight of silver, named in one unit everywhere:
  the shekel, with the mina for cargo. The interface is the traveler's own ledger, in the
  unit they already count in — which is why the island's prices are written in it too.
- A destination's `currency` is a **description of the place**, never a second purse. No
  screen prints it and no rule reads it.
- The market says once, in words, that the purse is silver by weight and spends at every
  harbor, and that only the asking price changes. `codex.shekel` says the same at length,
  including that the island's copper is cargo in this ledger rather than a second money.
- No conversion, no exchange rate, no second balance. Copper remains a good weighed in
  minas. If a later milestone models copper or barley as media of exchange, they are
  priced goods or local conventions, not the traveler's purse.

## Consequences

- `src/ui/copy.test.ts` pins that the interface never reads a destination's `currency` and
  that the market keeps its basis line.
- `src/ui/money.test.ts` fails if a place stops describing itself as valuing silver, which
  would promise a purse the rules do not have.
- Reversing this needs a new ADR: it would add a stored second balance, rates, rounding,
  and a save migration.
