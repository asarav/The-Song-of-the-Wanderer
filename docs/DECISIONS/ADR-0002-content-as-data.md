# ADR-0002 — Content as data, with a closed condition/effect DSL

**Date:** 2026-11-25
**Status:** Accepted

## Context

The game will contain hundreds of events, characters, and dialogue graphs across many
regions. Authors (human and agent) need to add content without touching engine code.
At the same time, hidden imperative logic inside content makes saves fragile,
behavior untestable, and bugs hard to locate.

## Decision

All authored content is **JSON validated by Zod**. Runtime behavior is expressed with a
**closed, serializable DSL** of conditions and effects. There is no embedded script
language and no per-entity code.

- Conditions compose with `all` / `any` / `not` over a fixed set of atoms.
- Effects are an ordered list from a fixed vocabulary.
- Unknown keys fail schema validation.
- Extending the vocabulary requires a schema change, unit tests, and an ADR if it alters
  the model.

## Consequences

- Content can be linted, diffed, translated, and simulated without executing code.
- Saves remain portable; they contain only data.
- Some expressive ideas will not fit the DSL. The correct response is to add a tested
  atom/effect, not to smuggle logic into content.
- Designers cannot implement one-off mechanics in a single file. This is intentional:
  one-off mechanics are usually scope creep (spec §21).
- Tooling can generate documentation and editors from the schemas.

## Alternatives considered

- **TypeScript content modules** — type-safe and flexible, but arbitrary code executes at
  load, breaking determinism and making review harder. Agents also tend to add logic.
- **Ink or Yarn Spinner** — good for dialogue branching, but not for markets, routes,
  delayed consequences, or faction state. We would end up with two content systems.
- **Lua/JS sandbox** — maximum flexibility, unacceptable testability and determinism.

## Revisit when

A genuinely new mechanic cannot be expressed after adding two well-tested atoms. If that
happens repeatedly, the DSL is the wrong abstraction and deserves a redesign, not an
escape hatch.
