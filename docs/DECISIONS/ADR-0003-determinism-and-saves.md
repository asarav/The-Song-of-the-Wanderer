# ADR-0003 — Deterministic engine, seeded streams, versioned saves

**Date:** 2026-11-25
**Status:** Accepted

## Context

The game spans decades of in-world time and many hours of play. Players expect saves to
survive patches. Developers need to reproduce bugs from a save file. Tests need stable
outcomes when content changes.

## Decision

1. The engine is a pure function: `reduce(state, command, content) → { state, events }`.
2. No wall clock, no `Math.random`, no DOM inside `src/engine`.
3. Randomness comes from **named, serializable RNG streams** (`market`, `encounters`,
   `travel`, `flavour`), stored in `GameState`.
4. Saves are a versioned envelope around `GameState`, with an ordered migration chain.
5. Time is a day counter; formatting is a UI concern.

## Consequences

- Any playthrough can be replayed from a save plus a command log.
- Regression tests are cheap and precise; scenario scripts replace manual QA for logic.
- Content changes can be tested against fixed seeds, and balance can be sampled across
  many seeds.
- Authors must think in terms of conditions and effects rather than imperative scripts.
- Migrations are mandatory work whenever state shape changes. This is a real cost, paid
  deliberately to protect players' saves.
- Separate streams prevent a new market item from changing which encounter you meet.

## Alternatives considered

- **Realtime simulation with floating timers** — impossible to test and to save
  consistently.
- **Single global RNG** — simpler, but content additions reshuffle unrelated outcomes and
  make bug reports irreproducible.
- **No save migration, "early access resets saves"** — unacceptable for a long-form
  narrative game where a single run spans many sessions.

## Revisit when

Never for determinism. If the state grows too large to snapshot cheaply, add structural
sharing or delta saves — not nondeterminism.
