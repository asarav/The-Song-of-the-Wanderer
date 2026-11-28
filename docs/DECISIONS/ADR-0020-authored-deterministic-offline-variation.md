# ADR-0020 — Variation is authored, deterministic and offline

**Status:** accepted · **Date:** 2026-11-28 · **Milestone:** M4b-T04/T05

## Context

The slice has one authored night paragraph per port, no daytime event pool, and no
ambient copy on the Journey screen. The only generator is `new:dialogue`. Adding a second
and third region by hand would multiply the same sentences, and a live prose generator
would break the constitution: content is data, the engine is deterministic, and nothing
is generated at play time.

The authoring problem is volume without repetition. The design problem is variation that
still sounds like the place and the hour, not a random sentence spliced together.

## Decision

1. **The factory combines authored fragments; it never writes prose.** `pnpm factory`
   scaffolds a valid entity, expands an authored recipe, or audits coverage. It makes no
   model calls and invents no canon. Every scaffold contains `TODO:` and is rejected by
   `factory:check` until a person fills it.
2. **Dry-run is the default.** Writing requires `--write`, refuses to overwrite, derives
   stable IDs from the recipe id and row slug, and validates through the same Zod registry
   as content lint.
3. **Recipes are data.** `tools/factory/recipes/*.json` declares a kind, defaults and
   variant rows. A row may name a culture, an art ID and tags; the factory copies the
   rest. Variant order is deterministic for a seed.
4. **Arc briefs are documents before M6.** `arc-brief` writes `docs/design/arcs/<id>.md`.
   It does not pretend a runtime `ArcDef` exists; that schema belongs to M6.
5. **Ambient copy is a presentation-only content type.** `AmbientObservation` carries
   `context`, optional cultures/scope/conditions/weight/tags, one or two beats and one
   plate per beat. It has no effects, no scene and no world truth.
6. **Selection is derived.** `deriveAmbient` filters by context, scope, culture, conditions
   and weight, then chooses from the seed, day and location. It never mutates state or the
   RNG, and it avoids the previous day's tag when another eligible observation exists.
   Night falls back to the authored `night.text` when nothing matches.
7. **The day is a pool too.** A destination may author a `day` band. After exactly one day
   at a place, `fireDay` draws at most one eligible daytime event before `fireNight`.
   Major events stay scheduled and never depend on the draw.
8. **No save change.** Ambient is derived from existing state; daytime pools are content
   data. Save format stays v7.

## Alternatives considered

- **Generate lines at runtime with a model.** Rejected: live generated story is out of
  scope, breaks determinism and replays, and cannot carry provenance.
- **One ambient paragraph per place.** Rejected: it is the repetition the milestone is
  fixing; the reader sees the same sentence every night.
- **A global ambient pool keyed only by context.** Rejected: it would put Levantine
  temple copy on a Cypriot harbor. Culture and scope are filters, not decoration.
- **Store the chosen observation in the save.** Rejected: it is a derived view. Storing it
  would add a migration and let a stale choice disagree with the calendar.
- **Random selection without the previous-day check.** Rejected: a four-line pool can
  repeat on consecutive days, which reads as a bug even when the draw is fair.

## Consequences

- Authors get a scaffold and a coverage report, but still write every shipped line. The
  factory's `audit` and `ambient:check` fail when a culture or route is thin.
- `pnpm check` gains `factory:check` and `ambient:check`. The factory gate rejects an
  unmodified scaffold, a non-deterministic recipe, a duplicate id and shipped `TODO:`.
- Ambient copy enters prose lint, the beat-art ledger and the art tests alongside dialogue
  and journal text. It cannot grow beat-art debt: it must reuse existing plates.
- The day/night/travel pools are content, so a new region adds observations and events
  without an engine change. M5 phases and M6 arcs can later provide conditions to the same
  selector; neither is implemented here.
