# ADR-0004 — Separate world truth from player knowledge

**Date:** 2026-11-25
**Status:** Accepted

## Context

The game depends on unreliable information. Rumors arrive before news; distant events are
distorted; characters believe false things; the protagonist may be remembered under
contradictory names. If the interface reads objective state, every one of those effects
collapses into an omniscient quest log.

At the same time, the world must stay coherent. Dead characters cannot speak, locations
must be unique, and migrations must be traceable.

## Decision

Maintain three separate stores:

1. **World facts** — objective assertions with validity windows and a source event.
2. **Player knowledge** — facts learned, with source, reliability, belief, and the
   specific detail the protagonist was told.
3. **Character memory** — a coarse belief model for characters who matter.

All player-facing read models (journal, map, character index, codex, available dialogue)
read **knowledge**, never world truth. World truth is used only by simulation, validation,
and authored scenes that need omniscience (e.g. resolving a scheduled event).

## Consequences

- False beliefs are first-class and can persist until corrected by an authored scene.
- The journal can be wrong, incomplete, or biased, as the spec requires.
- Rumors can be wrong without breaking the world.
- Dialogue can condition on what a character believes, not on what is true.
- Complexity increases: every new fact needs a knowledge path if the player should learn
  it. Coverage tooling must report facts that are never learnable.
- UI bugs where truth leaks into the journal are now a class of defect the tests must
  catch. A "no truth in read models" test is mandatory from M5.

## Alternatives considered

- **Single state with a `known` flag** — simpler, but it cannot represent "the player was
  told X, which is wrong" or two contradictory beliefs. It also encourages UI code to read
  truth.
- **Knowledge as a list of journal strings only** — cheap, but prevents map, index, and
  dialogue from reasoning about knowledge.
- **Per-character full knowledge graphs** — too expensive and unnecessary. Coarse memory
  for major characters, defaults for the rest.

## Revisit when

The knowledge store becomes too large to save or too complex to author. Then compress
beliefs into fact clusters, not into truth.
