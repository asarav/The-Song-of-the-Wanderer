# ADR-0011 — Cargo remembers what it cost

**Status:** accepted · 2026-11-27
**Related:** `docs/DATA_MODEL.md` §4, `src/engine/state/schema.ts`, `src/engine/economy/market.ts`, `src/engine/save/migrations.ts`

## Context

The market showed what a good fetches but not whether selling it would make or lose
silver. The player can buy in one harbor, carry the cargo across the sea, and sell in
another; the purchase price is not visible in the inventory, so the decision was blind.
The information existed at the moment of purchase, but was thrown away.

Cargo is stored as one stack per item, not as purchase lots. Save v1 also contains cargo
with no purchase history at all. A gain figure must not invent a cost for that cargo.

## Decision

- **A stack carries a total integer `costBasis`** — the silver actually paid for the
  quantity still in the hold. It is persisted state, never a derived view.
- **Omitted means known zero.** Starting cargo, gifts, and authored `items` effects with
  no cash cost have a zero basis; the whole sale is gain.
- **`null` means unknown.** A v1 save has no way to reconstruct what its cargo cost, so
  the v1→v2 migration writes `null`; the interface says “cost not recorded” rather than
  claiming the goods were free.
- **Purchases add their actual total.** The market command records the haggled total it
  charged, not a recomputed list price. Authored effects may pass an optional `cost`.
- **Removals release cost proportionally.** Selling or losing part of a stack removes
  `round(costBasis × quantity removed / quantity held)` from the basis. The remainder stays
  with the units that remain. This is a moving average, not FIFO, and one-shekel rounding
  is deliberate.
- **The market shows the total gain or loss for the whole carried stack**, plus the
  average paid per unit. It does not pretend a partial sale's next unit has a separate
  exact cost.
- **Save format v2.** The field is part of `CargoEntry`; `SAVE_FORMAT_VERSION` moves to 2
  and a pure v1→v2 migration marks every existing stack unknown.

## Consequences

- Profit is exact for a whole-stack sale and for purchases whose total divides evenly.
  Partial sales can move a fraction of a shekel between “sold” and “remaining” because
  silver is counted in whole units; the total paid and total proceeds never drift.
- A purchase added to a legacy `null` stack leaves that stack unknown rather than
  blending a known price into an unknown history.
- There is no per-lot provenance (which harbor, which day, which merchant) in the save.
  If the game later needs FIFO or lot-level accounting, this field is the migration point.
- Cargo screens and the market both read the same basis. No screen may infer cost from
  today's asking price, because the whole point is that the asking price has moved.
