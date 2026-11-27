# ADR-0008 — The codex glosses period measures in modern units

**Status:** accepted · 2026-11-27
**Related:** `docs/CONTENT.md` §4, §10, `codex.shekel`, `codex.mina`, `codex.year`

## Context

`CONTENT.md` §4 tells authors to keep modern idiom and anachronistic metaphor out of
player-facing prose, and that rule is right for scenes: nobody in 1230 BCE compares a
shekel to a gram. But the codex is the reader's own reference shelf, and a price of
"three shekels", a fare of "ten shekels" or a load of "four minas" carries no weight for a
reader who has no idea what a shekel or a mina is. The player is asked to judge whether a
fare is fair and whether the hold has room, and the interface answers in units it never
explains.

## Decision

Codex entries on the `measure` shelf may gloss a period unit in modern measures — grams,
kilograms, days — and may compare a weight to a familiar modern object. The gloss:

- lives only in the codex, never in dialogue, scene narration, journal entries or
  interface labels;
- is written as the reader's comparison, not as something anyone in the world says;
- never converts a price into modern money. Prices in play are authored for play rather
  than converted from a metrological table, so a modern equivalent would be a historical
  and economic claim the game does not make.

Everything else in `CONTENT.md` §4 still applies to codex prose: no build talk, no
lecturing, no modern metaphor beyond the measure itself.

## Consequences

- The `measure` entries are the only place a modern unit appears. `src/ui/codex.test.ts`
  fails if the shekel, mina or year entry loses its gloss.
- Each historical figure in those entries carries provenance saying which part is
  documented (silver by weight, the mina and talent ratios, the 365-day count) and which
  part is the reader's gloss.
- A new shelf requires editing the closed list in the entry schema and the reading order in
  `src/ui/codex.ts`. An entry on a shelf the reader does not know is shown under "Other"
  rather than disappearing from the index.
