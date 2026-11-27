# Historical standards

The game's credibility depends on disciplined uncertainty. This document defines how we
classify, source, and review historical content.

## 1. Confidence categories

Every historically significant entity carries exactly one:

| Category | Meaning | In-game treatment |
|---|---|---|
| `documented` | Directly attested by contemporary texts, inscriptions, archaeology, or secure records | May be stated plainly; cite the source in the dossier |
| `strongly-supported` | Scholarly reconstruction supported by multiple independent lines of evidence | State with appropriate hedging ("most scholars", "the evidence suggests") |
| `plausible` | Consistent with the evidence but not demonstrated | Present as ordinary fictional texture, not as fact; codex must not assert it |
| `fictional` | Invented characters, dialogue, events, connective story | Free to write, but no false citation and no fake quotation |
| `unresolved` | Deliberately ambiguous (protagonist, Punt's location, some migrations) | Preserve ambiguity; multiple in-world interpretations, no codex verdict |

Notes:

- The category describes the **claim**, not the entity. A fictional character can live
  in a documented city. Split the entity if needed.
- A `documented` event can still have fictional participants. Tag the event
  `strongly-supported` and tag the participants `fictional`.
- Never promote a claim's category to make a scene easier.

## 2. Sourcing

Minimum for `documented` and `strongly-supported`:

- At least one primary or specialist secondary source, with a specific citation
  (author, year, title; for inscriptions, the standard siglum such as `RS 20.238`).
- A one-sentence note saying what the source actually supports.
- A date range for the claim.

Minimum for `plausible`: a source for the general practice plus a note explaining the
inference.

`fictional` needs no source but must not mimic citation. Do not write "as the tablets
say" around invented content.

Store sources on the entity (`provenance.sources`) and in full in the destination
dossier's bibliography.

## 3. Dossier workflow (gate)

No destination content is written before its dossier exists in
`docs/design/dossiers/<destination>.md`. The dossier follows spec §25 and the template
in `docs/templates/destination-dossier.md`:

1. People and social roles
2. Food and drink
3. Music
4. Stories and oral tradition
5. Religion and ritual
6. Language and scripts
7. Daily life
8. Historical change over the game's chronology
9. Recurring characters and visitors
10. Sensory identity

Each section separates:

- **Attested** for this place and period
- **Borrowed** from a nearby region or different period (say which)
- **Reconstructed** by reasonable inference
- **Invented** for the game

The dossier is the review artifact. If it is not there, the content is not ready.

## 4. Dating conventions

- The game's internal calendar is day-based; display uses approximate BCE dates.
- Convert all research dates to a single convention in docs: **BCE**, no year zero.
- Write ranges as `c. 1230–1185 BCE`, and say what is uncertain.
- Never imply that a regional process happened everywhere at once. The "collapse" is a
  set of regionally varied transformations (spec §3.1).
- Keep a margin of uncertainty in-game: "some years ago", "within living memory",
  "before the old king died" are often better than precise years in dialogue.

## 5. Region-specific pitfalls

**Eastern Mediterranean / Ugarit**
- Ugarit's destruction is not explained by a single cause. Do not stage one villain.
- Distinguish the city, its port (Ras Shamra / Minet el-Beida), and the kingdom's
  wider territory.
- Palace, temple, and merchant archives imply different social worlds. Do not treat
  "the palace" as the whole state.

**Cyprus**
- Copper is central, but do not reduce the island to a mine. It is a network of
  polities and communities with Aegean, Anatolian, and Levantine ties.
- "Alashiya" in texts is not automatically the whole island in every period.

**Egypt and Nubia**
- Distinguish Kerma-period political formations from later Napatan and Meroitic states.
  Do not project later Kush backward (spec §4.2E).
- Egyptian imperial presence is uneven in time and place; local elites negotiated.

**Punt and the Red Sea**
- Punt's location is unresolved. Never fix it on the map with a certainty the evidence
  does not support. Use `unresolved`.
- Red Sea exchange is long-running and multi-directional; avoid a single expedition
  narrative as the whole story.

**Mesopotamia and Iran**
- There is no unified Iranian empire at this date. Write a patchwork of regions,
  settlements, and pastoral communities.
- Babylonian and Assyrian political fortunes differ; do not collapse them.

**South Asia**
- The Mature Harappan urban system had already declined. Do not write "the Indus
  civilization" as a contemporary unified state.
- Painted Gray Ware, early Vedic traditions, and archaeological cultures are not
  interchangeable labels. Correlating texts with material culture is contested.
- Do not project later religious forms backward as fixed canon.

**China**
- Center the Late Shang world on Anyang/Yinxu, with oracle-bone divination, bronze
  production, royal warfare, and court politics.
- Distinguish contemporary Shang evidence from later Zhou accounts of the conquest.
- The Shang–Zhou transition is not a simple morality tale.

## 6. Mythological figures

Before a deity, demigod, hero, or spirit appears:

- [ ] Culture and period of the tradition identified.
- [ ] Names, epithets, domains, stories, iconography recorded.
- [ ] Contemporary evidence separated from later literary versions.
- [ ] Local/regional/widely-worshipped status noted.
- [ ] Portrayal labeled: direct, adapted, speculative, or deliberately ambiguous.
- [ ] Contradictions between sources preserved where meaningful.
- [ ] At least one mundane interpretation available to the player.

Do not build a universal pantheon. Similar domains do not imply the same being.

## 7. Review gate

Before merging content tagged `documented` or `strongly-supported`:

1. Citation present and specific.
2. Claim matches what the source supports.
3. No invented quotation presented as attested.
4. Date and region consistent with `docs/design/00-timeline.md`.
5. Uncertainty visible in-game where it matters to the player's understanding.
6. Reviewer noted in `WORKLOG.md` (name or "self-review against cited source" until a
   specialist reviewer is engaged).

If no reviewer is available, the content may ship as `plausible` — never as
`documented`.

## 8. Language in game

- Short phrases in ancient languages are for atmosphere only, with translations
  available.
- Do not present reconstructed pronunciation as certain.
- Use trade languages (e.g. Akkadian in the Levant) where the evidence supports
  multilingual exchange; do not make every character polyglot for convenience.
- Language names and forms of address are researched per destination, not invented to
  sound foreign.
