---
name: SotW Historical Review
description: Research, tag, and review historical content for The Song of the Wanderer, including destination dossiers, confidence categories, sources, and mythological figures. Use before writing any content that names a real place, date, people, event, deity, or historical person.
---

# Historical discipline

The game's credibility rests on honest uncertainty. Read `docs/HISTORY.md` for the full
rules; this is the working procedure.

## Decide the claim first

Write the claim as one sentence in the dossier's evidence ledger, then classify it:

| Category | Test |
|---|---|
| `documented` | Direct contemporary evidence, or secure archaeological record |
| `strongly-supported` | Multiple independent lines, but reconstructed in detail |
| `plausible` | Consistent with evidence, not demonstrated |
| `fictional` | Invented people, words, or events |
| `unresolved` | Ambiguity is deliberate and must survive |

If you cannot name the evidence, it is not `documented` or `strongly-supported`.

## Dossier gate

No destination content before `docs/design/dossiers/<id>.md` exists, using
`docs/templates/destination-dossier.md`. Each of the ten sections separates:

- attested for this place and period,
- borrowed from another region or period (say which),
- reconstructed,
- invented.

The evidence ledger and bibliography are mandatory. Thin is acceptable; confident
invention is not.

## Sourcing format

- Secondary: author, year, title (and page/chapter where specific).
- Primary: standard siglum or edition, e.g. `RS 20.238`, `EA 1`, an excavation report.
- One sentence per source: what it actually supports.
- Never attach a citation to an invented quotation or private motive.

## Game text rules

- Characters speak from their own knowledge and biases; the narrator does not adjudicate.
- Do not date events more precisely in dialogue than the evidence allows.
- Do not give a single cause to a multi-causal process (the collapse, a destruction layer,
  a migration).
- Do not project later political formations backward (Kerma ≠ Napata ≠ Meroe; Shang
  evidence ≠ later Zhou accounts; Mature Harappan ≠ the game's South Asia).
- Do not fix Punt's location as settled fact.
- Regional timelines differ. Say so when a character would notice.

## Mythological figures

Before a deity or hero appears, complete the checklist in `docs/HISTORY.md` §6. In
particular:

- period and culture of the tradition,
- names, epithets, domains, iconography,
- contemporary evidence vs later literary versions,
- direct / adapted / speculative / deliberately ambiguous portrayal,
- at least one mundane interpretation for the player.

Do not build a universal pantheon. Similar domains do not mean the same being, and the
protagonist is not confirmed as any of them.

## Review gate

For content tagged `documented` or `strongly-supported`:

1. Specific citation present.
2. Claim matches the source.
3. No fake quotation, no invented private motive.
4. Date and region consistent with `docs/design/00-timeline.md`.
5. Uncertainty visible in-game where it matters.
6. Reviewer recorded in `WORKLOG.md`.

If no reviewer is available, downgrade to `plausible` and say why in `notes`.

## Red flags

- "The tablets say…" around invented speech.
- A famous name used as a cameo with no bearing on the scene.
- One villain or one cause behind a regional collapse.
- A modern national identity assigned to an ancient population.
- Exotic names with no linguistic note.
- A codex entry that resolves a deliberately open question.
