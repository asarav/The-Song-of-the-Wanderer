# M3 — Slice content

**Status:** Planned · **Depends on:** M2, dossiers for Ugarit and Cyprus
**Goal:** the authored Ugarit → Cyprus slice, complete enough to play for 30–60 minutes
and answer the spec's seven questions.

## Non-goals

- A third destination or a second route pair.
- Acts II–V, the collapse sequence, or endgame content.
- Historical figures as major characters.
- Full localisation.

## Entry gate

- `docs/design/dossiers/ugarit.md` and `docs/design/dossiers/cyprus.md` complete,
  evidence-tagged, with bibliographies.
- Tone and voice approved against `docs/design/02-protagonist.md` §7.
- M2 systems stable; no schema changes expected during authoring.

## Tasks

### M3-T01 — Ugarit destination

- [ ] Destination entity: profiles, activities, sites, routes, local goods, state phases.
- [ ] Harbour, market, palace gate, temple, and one residential/workplace quarter as
      narrative activities, not maps. Shared profiles are referenced, not copied.
- [ ] 5–7 characters from ordinary life, trade, craft, and one religious specialist.
- [ ] Dossier linked; provenance on every historical claim.
- [ ] Scenario: arrival, market visit, one conversation, departure.

### M3-T02 — Cyprus destination

- [ ] Harbour community and copper-working settlement.
- [ ] 3–5 characters; at least one from the Ugarit crossing or connected to it.
- [ ] Distinct sensory and material identity from Ugarit, including climate, culture,
      language, currency, architecture, art, and music profiles.
- [ ] Scenario: arrival, copper negotiation, one relationship beat, return preparation.

### M3-T03 — Goods and markets

- [ ] 8–12 goods appropriate to both destinations and the crossing.
- [ ] Regional price differences that are legible without a spreadsheet.
- [ ] One good whose availability changes with a local event.
- [ ] Tests: price sanity across seeds; no negative or zero-value trades.

### M3-T04 — Route and travel modes

- [ ] Ugarit ↔ Cyprus route with coastal and open-water modes, segments, and waypoints.
- [ ] Requirements: knowledge, a captain/guide, season, capacity.
- [ ] Waypoints include at least one quiet vignette and one encounter that depends on
      language, relationship, or faction.
- [ ] 8 travel encounters across pools, including at least one quiet vignette.
- [ ] One encounter that depends on language, one on a relationship, one on a faction.

### M3-T05 — Recurring character

- [ ] A merchant or sailor met in Ugarit reappears in Cyprus for a plausible reason.
- [ ] Relationship state changes what they offer.
- [ ] Delayed consequence scheduled on first meeting.
- [ ] Scenario covering both appearances and the delayed effect.

### M3-T06 — Language example

- [ ] Akkadian as the trade language, with an in-world reason.
- [ ] Learning path: tutor, market exposure, a shared task, an inscription or label.
- [ ] At least three scenes where Basic or Conversational changes the available choice.
- [ ] No scene where language is the only way forward.

### M3-T07 — Faction example

- [ ] Ugarit palace/harbour authority with interests that conflict with a merchant house.
- [ ] One request that helps one and inconveniences the other.
- [ ] Travel consequence: a token or letter changes a checkpoint encounter.
- [ ] No global reputation bar in the UI.

### M3-T08 — Refugee thread

- [ ] A household displaced by a local disruption (not the collapse).
- [ ] Three possible interventions with modest costs and delayed outcomes.
- [ ] One outcome visible on the return leg; one left uncertain.
- [ ] No population-management mechanics.

### M3-T09 — Mystery encounter

- [ ] One recognition scene that cannot be explained, with a mundane reading available.
- [ ] One dream, symbol, or story fragment that echoes it.
- [ ] Journal records it as unresolved, without interpretation.
- [ ] No confirmation of divinity (see protagonist rules).

### M3-T10 — Journal, codex, and framing

- [ ] Journal entries in the protagonist's voice for every major slice beat.
- [ ] Codex entries for both destinations, the route, and the trade language.
- [ ] Destination introductions: ~150–250 words each, sensory, not expository.
- [ ] Ending-the-slice beat: a reason to continue (letter, rumour, name, obligation).

## Prose budget

| Area | Budget |
|---|---|
| Destination scenes | ~1,200 words each |
| Dialogue | ~2,500 words total |
| Journal | ~800 words |
| Codex | ~600 words |
| UI strings | as needed, extracted |

## Demo script

New game → Ugarit arrival → market trade → meet the recurring character → faction
request → language improvement → refugee choice → prepare crossing → travel encounters →
Cyprus arrival → consequence → mystery beat → journal → save.

## Definition of done

The loop is completable, all spec §22.1 inclusions are present, every scene has a
scenario, `pnpm check` green, and M4 is ready.
