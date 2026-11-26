# Regions and scope order

The spec defines ten playable regions. They are not all built at once. Each region is
gated on a completed dossier set and a milestone file.

## 1. Region board

| # | Region | Slice | Stage | Notes |
|---|---|---|---|---|
| A | Aegean and Mycenaean world | — | 3 | Palace systems, craft mobility |
| B | Anatolia and Cyprus | **Cyprus** | **Slice** | Crossroads; copper; harbour society |
| C | Levant and eastern Mediterranean | **Ugarit** | **Slice** | Opening; commercial and scribal world |
| D | Egypt and the Nile | — | 3 | Multiple destinations, not one capital |
| E | Nubia and the Middle Nile | — | 3 | Kerma legacy; Egyptian reach |
| F | Red Sea and Punt | — | 3 | Maritime corridor; Punt unresolved |
| G | Mesopotamia | — | 3 | Urban commerce, temples, courts |
| H | Iranian plateau and Central Asia | — | 3 | Overland bridge; patchwork polities |
| I | South Asia | — | 4 | Post-urban Indus; early Vedic worlds |
| J | Ancient China | — | 4 | Late Shang Anyang; Zhou transition |

Stage numbers follow spec §22.2. The slice is Stage 1 and only covers C → B.

## 2. Slice geography

**Ugarit (C)** — the opening destination. A port city with a palace, temples, scribal
archive, merchant houses, and a working harbour. The player begins here with modest
stock, partial Akkadian, and one contact.

**Cyprus (B)** — the second destination. A harbour community and copper-working
settlement, connected to Aegean, Anatolian, and Levantine networks. The return leg
creates the first loop.

**Route** — Ugarit to Cyprus by sea, with a coastal option and an open-water option. The
coastal route is slower, cheaper, and safer; the open-water route is faster and exposes
different encounters. Both are authored as staged journeys, not loading screens.

## 3. Expansion corridors

Long-distance travel is a chain of regional stages, not a single road (spec §4.3):

- **South:** Levant → Egypt → Nubia → Middle Nile → Red Sea coast.
- **East overland:** Levant → Mesopotamia → Iranian plateau → Central Asia → northwest
  South Asia.
- **East maritime:** Red Sea and Gulf routes, with intermediaries, not direct Levant–
  China passage.
- **Far east:** overland corridors toward the Shang world, arriving late in the game's
  chronology.

Each corridor requires guides, contacts, languages, or patronage at its joints. Unknown
routes appear as rumours, not as menu options.

## 4. Destination standard

Every destination must have, before content:

- A dossier (`docs/design/dossiers/<id>.md`) following the ten-section template.
- A cultural profile covering food, music, stories, religion, daily life, people,
  language, material culture, sensory identity, and historical context (spec §15.6).
- A cast spanning ordinary households, crafts, trade, performance, religion, and power.
- Local goods and price logic.
- Historical status at the slice's date, with phases for change.
- Available routes with requirements.
- At least one quiet scene and one scene of consequence.

A destination is not complete with "a market, a palace, and a temple". It must feel
inhabited.

## 5. Between places

The map is not only nodes. Travel content must include the land, water, weather, animals,
and silence between destinations (spec §23, Worldbuilding). Some journeys should have no
crisis at all: a night watch, a meal shared, a story told, a moment to think.

## 6. Naming

Place names use the form most defensible for the period, with a short in-game note where
a modern name would mislead. Do not use modern country names as in-world labels. The
codex may explain the identification (`codex.` entries), but characters speak in their
own geographical vocabulary.
