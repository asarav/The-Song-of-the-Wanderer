# M7 — Society, culture, and economy at scale

**Status:** Planned · **Depends on:** M5–M6 · **Architecture:** `SCALING.md` §3
**Goal:** regions differ institutionally and culturally, and trade reacts to politics and
history through authored rules — without an economic simulation.

## Non-goals

- Full economic or political simulation.
- Procedural cultures, languages, or pantheons.
- New regions.

## Tasks

### M7-T01 — Factions and obligations

- [ ] `FactionDef`: type, interests, hierarchy, parent faction, phase state.
- [ ] Relationship fields: trust, favour, obligation, standing, suspicion.
- [ ] Obligations between factions and between factions and characters.
- [ ] Conflicts with authored goals; no automatic war resolution.
- [ ] Tests: obligation creation/expiry, relationship changes, nested factions.

### M7-T02 — Political consequences

- [ ] Access gates: audience, market restrictions, tolls, safe passage, lodging.
- [ ] Route permissions and checkpoints driven by faction control and letters.
- [ ] Conflicting loyalties with authored suspicion effects.
- [ ] Local reputation distinct from faction standing.
- [ ] Tests: a favour opens one route and closes another; a letter changes a checkpoint.

### M7-T03 — Culture profiles

- [ ] `CultureDef`: naming conventions, forms of address, hospitality, taboos,
      festivals, body language, food/music/story/dossier references.
- [ ] Regions may contain multiple cultures; destinations reference local variants.
- [ ] Dialogue and events can require cultural knowledge or respect.
- [ ] Validation: every named character's name fits their culture's convention or is
      marked as an exception with a reason.
- [ ] Tests: address form selection, taboo violations, hospitality outcomes.

### M7-T04 — Languages, scripts, and interpreters

- [ ] `LanguageDef`: family, script, related languages, mutual intelligibility matrix,
      trade-language role.
- [ ] Five tiers and XP thresholds per language.
- [ ] Comprehension of related languages at reduced tier.
- [ ] Interpreter characters with fees, loyalties, omissions, availability.
- [ ] Language learning paths: exposure, tutor, documents, ritual, work.
- [ ] Tests: tier transitions, mutual intelligibility, interpreter mediated dialogue.

### M7-T05 — Goods and regional economies

- [ ] Goods taxonomy with categories, substitutes, weight, fragility, perishability.
- [ ] Regional production and consumption profiles with authored bands.
- [ ] Availability by phase, faction control, and local events.
- [ ] Price modifiers stack in a fixed order; no unbounded arbitrage in persona runs.
- [ ] Tests: price bands across seeds, substitution, scarcity and glut.

### M7-T06 — Contracts and commercial relationships

- [ ] Contract templates: delivery, procurement, escort, letter, find buyer.
- [ ] Contracts tied to characters and factions, with deadlines and failure states.
- [ ] Reputation and language affect terms and transparency.
- [ ] Contracts create story hooks and follow-ups, not fetch loops.
- [ ] Tests: completion, breach, deadline, relationship consequences.

### M7-T07 — Transport and scheduled services

- [ ] Ships and caravans with departure dates, capacity, cost, reliability, owners.
- [ ] Booking, waiting, missing departure, partial cargo.
- [ ] Region-appropriate modes only; no universal vehicle.
- [ ] Transport upgrades authored by route and period.
- [ ] Tests: schedule determinism, capacity, cancellation, delay propagation.

### M7-T08 — Hospitality, lodging, and local law

- [ ] Hospitality customs by culture; obligations incurred.
- [ ] Paid lodging vs host household; quality and safety differences.
- [ ] Local law and customs affecting behaviour, fines, disputes.
- [ ] Tests: accepting hospitality creates an obligation; law violation consequences.

### M7-T09 — Port the slice and prove generality

- [ ] Re-express Ugarit's palace/harbour faction, Akkadian learning, and market on the
      general model.
- [ ] Add a synthetic second region with a different culture, language family, and
      faction structure using content only.
- [ ] Scenario proves the synthetic region needs no engine changes.
- [ ] Update slice docs and content IDs where needed, with migrations.

### M7-T10 — Validators and balance v1

- [ ] Culture/language/faction/economy validators.
- [ ] Balance report: price bands, route costs, language pacing, contract profitability.
- [ ] Document thresholds and tune the slice against them.
- [ ] Update `STATUS`, `WORKLOG`, docs.

## Demo script

Play the slice with the general systems: language changes a negotiation, a palace favour
opens a checkpoint, a merchant house contract conflicts with a harbour official, and a
synthetic second region demonstrates a different culture and language without new code.

## Exit criteria

- Slice systems are general, not special-cased.
- A second synthetic region works with content only.
- Price and language pacing within documented bands.
- No new engine dependency added.
