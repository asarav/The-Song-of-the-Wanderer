# ADR-0006 — The protagonist's names are local interpretations

**Status:** accepted · 2026-11-26
**Supersedes:** the single placeholder name in `design/02-protagonist.md` §3
**Related:** `design/02-protagonist.md` §4, `content/packs/slice/codex/names.json`

## Context

The protagonist is a traveler whose name changes with the people who name them. The
design rules already forbid a universal pantheon and a translation table
(`design/02-protagonist.md` rules 4–5), but the documents carried no agreed names, so
content, tests, and tooling each risked inventing one.

Three real name-shapes are available for the slice:

- `Ninshubur`, a messenger's name attested in Sumerian and Akkadian texts, and reachable
  at Ugarit through the scribal world.
- `e-ma-a₂`, the spelling of a name in the Linear B tablets, reachable through Cyprus and
  Aegean traffic.
- `Hermes`, the later Greek name, which is where a modern reader will jump.

The historical risk is not the spellings; it is asserting that they are the same name.

## Decision

1. The three names are **separate local interpretations, never a translation table**.
2. In-game display is the tablet form `e-ma-a₂`; the stable ASCII id is
   `name.aegean.ema-a2`. The id is the technical key used by fixtures, tools and tests;
   the persisted field stores the display form. Every new game fixes `identity.selfName`
   to `e-ma-a₂`; no name is entered by the player (amended 2026-11-26).
3. The reconstructed form (*Ermahas* / *Hermahas*) is a scholarly gloss for the dossier
   and codex only. No character in 1230 BCE says it.
4. The theonym in the tablets is `documented` and cited. Its identification with later
   Hermes is `strongly-supported` and must be attributed ("read as…"), never asserted in
   dialogue.
5. Every scene that uses a name keeps a mundane reading: a shipwrecked traveler, a
   merchant with a memorable face, a jar label, a hymn learned from a trader.

## Consequences

- Content can use `Ninshubur` at Ugarit and `e-ma-a₂` at Cyprus without a codex entry
  claiming an identity.
- Tests and tools key the name by the ASCII id (`PROTAGONIST_NAME.id`); display text
  stays typographically correct and is never used as a stable key.
- A future region adds its own name and cites its own source; nothing here has to be
  revised, because the names were never a table.

## Amendment — 2026-11-26: the name is not a player choice

The player no longer sets a self-name. The protagonist is a specific person with a
specific tablet spelling; asking the player to rename them made the identity a costume and
contradicted `design/02-protagonist.md` §4.1. `createInitialState` no longer accepts a
name, the new-game screen no longer asks for one, and every new run starts as `e-ma-a₂`.
The `selfName` field remains in save v1 so existing saves load. Local names are still
acquired in play and recorded in `identity.localNames`.
