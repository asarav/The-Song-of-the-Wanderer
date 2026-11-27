# M3 — Slice content

**Status:** Done · **Depends on:** M2, dossiers for Ugarit and Cyprus
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

- [x] Destination entity: profiles, activities, sites, routes, local goods, state phases.
- [x] Harbor, market, palace gate, temple, and one residential/workplace quarter as
      narrative activities, not maps. Shared profiles are referenced, not copied.
- [x] 5–7 characters from ordinary life, trade, craft, and one religious specialist.
- [x] Dossier linked; provenance on every historical claim.
- [x] Scenario: arrival, market visit, one conversation, departure.

### M3-T02 — Cyprus destination

- [x] Harbor community and copper-working settlement.
- [x] 3–5 characters; at least one from the Ugarit crossing or connected to it.
- [x] Distinct sensory and material identity from Ugarit, including climate, culture,
      language, currency, architecture and art. Final ambient audio profiles and
      commissioned recordings wait for M18; the exploratory slice beds are documented in
      `docs/ASSETS.md` §6.
- [x] Scenario: arrival, copper negotiation, one relationship beat, return preparation.

### M3-T03 — Goods and markets

- [x] 8–12 goods appropriate to both destinations and the crossing.
- [x] Regional price differences that are legible without a spreadsheet.
- [x] One good whose price changes while a local event state is active.
- [x] Tests: price sanity across seeds; no negative or zero-value trades.

### M3-T04 — Route and travel modes

- [x] Ugarit ↔ Cyprus route with coastal and open-water modes, segments, and waypoints.
- [x] Requirements: knowledge, a captain/guide, and capacity. Season gating is deferred
      to M5.
- [x] Waypoints include at least one quiet vignette and one encounter that depends on
      language, relationship, or faction.
- [x] 8 travel encounters across pools, including at least one quiet vignette.
- [x] One encounter that depends on language, one on a relationship, one on a faction.

### M3-T05 — Recurring character

- [x] A merchant or sailor met in Ugarit reappears in Cyprus for a plausible reason.
- [x] Relationship state changes what they offer.
- [x] Delayed consequence scheduled on first meeting.
- [x] Scenario covering both appearances and the delayed effect.

### M3-T06 — Language example

- [x] Akkadian as the trade language, with an in-world reason.
- [x] Learning path: tutor, market exposure, a shared task, an inscription or label.
- [x] At least three scenes where Basic or Conversational changes the available choice.
- [x] No scene where language is the only way forward.

### M3-T07 — Faction example

- [x] Ugarit palace/harbor authority with interests that conflict with a merchant house.
- [x] One request that helps one and inconveniences the other.
- [x] Travel consequence: a token or letter changes a checkpoint encounter.
- [x] No global reputation bar in the UI.

### M3-T08 — Refugee thread

- [x] A household displaced by a local disruption (not the collapse).
- [x] Three possible interventions with modest costs and delayed outcomes.
- [x] One outcome visible on the return leg; one left uncertain.
- [x] No population-management mechanics.

### M3-T09 — Mystery encounter

- [x] One recognition scene that cannot be explained, with a mundane reading available.
- [x] One dream, symbol, or story fragment that echoes it.
- [x] Journal records it as unresolved, without interpretation.
- [x] No confirmation of divinity (see protagonist rules).

### M3-T10 — Journal, codex, and framing

- [x] Journal entries in the protagonist's voice for every major slice beat.
- [x] Codex entries for both destinations, the route, and the trade language.
- [x] Destination introductions: ~150–250 words each, sensory, not expository.
- [x] Ending-the-slice beat: a reason to continue (letter, rumor, name, obligation).

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
