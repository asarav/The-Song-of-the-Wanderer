# ADR-0007 — Save v1 carries a minimal `world` partition

**Status:** accepted · 2026-11-26
**Related:** `ARCHITECTURE.md` §3, `DATA_MODEL.md` §14, `src/engine/state/schema.ts`

## Context

ADR-0005 describes a partitioned state with world truth, knowledge, and derived views,
and reserves save v2 for the full timeline model (eras, phases, facts, ledger). But the
slice's content already needs to write things that are neither player nor narrative:

- `destinationState` (a tense market, a festival),
- route closure (`closeRoute`, `unlockRoute`),
- scheduled events,
- migration records (the refugee thread).

Deferring all of that to M5 would mean the slice's events either lie (writing world state
into player flags) or lose their consequences on save.

## Decision

Save **v1** includes a minimal `world` partition:

```ts
world: {
  destinationStates: Record<string, string[]>
  routeStates: Record<string, 'open' | 'closed'>
  migrations: { group; from; to; day; outcome? }[]
  scheduled: { event; dueDay }[]
}
```

Eras, phases, the fact ledger, and propagation remain deferred to save **v2** (M5), which
will migrate v1 forward with the ordered chain in `src/engine/save/migrations.ts`.

Arrival scenes are authored on the destination (`onArrival`), not stored as a flag: the
event fires when the player arrives, and its `once` cooldown lives in
`narrative.storyletCooldowns` like any other event.

## Consequences

- Slice events can have durable consequences without inventing a second state shape.
- M5 adds fields and a migration; it does not have to re-home the slice's data.
- Anything derived (route availability, prices, presence) is still computed on read and
  never persisted, so this partition does not become a display cache.
