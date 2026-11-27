# ADR-0005 — Content packs, derived world state, and delta saves

**Date:** 2026-11-25
**Status:** Accepted

## Context

The full game is expected to hold 10 regions, 40–60 destinations, 300–500 named
characters, and 800–1,600 events. If a save stores the full derived state of every
destination, saves grow without bound, content patches cannot reach untouched regions, and
every schema change becomes a mass migration.

The vertical slice can ignore this. Wave 1 cannot.

## Decision

1. **Content is organized in packs** with manifests, a shared `pack.core`, an acyclic
   dependency graph, and lazy loading per region.
2. **Only deltas are persisted.** Untouched regions derive their state from the authored
   timeline plus any stored overrides.
3. **Derived values are never stored.** Destination display state, market prices, character
   presence, and route availability are pure functions of world state, content, and date.
4. **Facts are stored explicitly** with validity windows, because they are authored
   assertions, not derivations.
5. **One global save version** with ordered migrations, plus a golden save corpus loaded
   in CI on every merge.
6. Content pack versions are recorded in the save for diagnosis, not for load gating.

## Consequences

- Saves stay small and survive content patches to regions the player has not touched.
- Content authors can add a destination without migrating every save.
- Derivation functions become load-bearing and must be pure, fast, and heavily tested.
- Debugging needs a "derived vs stored" view in the studio; otherwise mysterious state is
  hard to explain.
- A content patch can change an untouched region retroactively. This is intended: history
  should be consistent, not frozen at save time. Authored events that already happened are
  protected by facts and event history, not by cached display state.
- Cross-pack references and cycles must be validated at build time.

## Alternatives considered

- **Store full state everywhere** — simple at first, unmaintainable at 10 regions.
- **Snapshot every region on first visit** — smaller than full state, but content patches
  cannot improve untouched places and saves still grow with visits.
- **Event sourcing only** — elegant, but replay cost and migration complexity are high for
  a narrative game. Facts plus deltas give most of the benefit at a fraction of the cost.

## Revisit when

Derivation becomes a performance bottleneck or content patches routinely invalidate
in-progress regional stories. Then add per-region snapshots with explicit invalidation
rules — not global full-state saves.
