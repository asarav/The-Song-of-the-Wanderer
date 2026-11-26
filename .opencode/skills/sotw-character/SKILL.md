---
name: SotW Characters and Arcs
description: Create characters, itineraries, arcs, lineages, recognition rules, and storylets for The Song of the Wanderer. Use when a person must persist, move, change, reappear, die, or be remembered across years or generations.
---

# Characters, arcs, and lineages

Read `docs/NARRATIVE_SYSTEMS.md` first. This skill is the working procedure.

## Start from a life, not a role

Before writing dialogue, answer:

- What is their ordinary day?
- What do they want this week, and what do they fear losing?
- Who depends on them, and whom do they resent?
- What do they know that matters, and what do they get wrong?
- What would they never do?

Use `docs/templates/character.md`. A character without a want is a vending machine.

## Tiers and budget

| Tier | Per region | Requirement |
|---|---|---|
| Major | 3–5 | Arc with resolution and failure; family/household; possible descendant |
| Recurring | 8–15 | Reason to travel; 2–4 appearances; one relationship arc |
| Local | 20–40 | Daily life, one want, one piece of knowledge |
| Ambient | pooled | Role, voice, one detail; no arc |

## Itinerary before appearance

Every appearance must be explained by an itinerary entry:

```jsonc
{ "from": "1230-04-01", "to": "1230-10-01", "location": "dest.cyprus",
  "reason": "trade", "route": "route.ugarit-cyprus" }
```

- Moving between destinations requires a route and enough time.
- Residents get a default entry; visitors get explicit entries.
- Displacement uses a migration record, not a teleport.
- No one follows the player without an authored reason.

## Arc structure

- Premise: what is at stake for this person.
- ≥3 beats across at least two acts for a major character.
- ≥1 resolution state and ≥1 failure state.
- ≥1 path that does not depend on the player.
- Successor if the owner can die or disappear.
- Delayed consequences, not instant payoffs.

## Lineages

- Descendants are authored. No procedural family trees.
- Inheritance: name, trade, debt, object, story, reframed relationship.
- Descendant recognition uses a story, object, or family account — never face memory.
- Apply inheritance once, at the authored time jump.

## Recognition

- Every recognition has a basis: met before, family story, token, name, resemblance, ritual.
- A recognition may be wrong.
- `claims-divine` is a character's claim, never a fact.
- No recognition may confirm the protagonist's nature.

## Storylets

- Pools per context: arrival, market, harbour/road, temple, evening.
- Tags prevent three jokes or three laments in a row.
- Cooldowns and once-only flags are mandatory.
- Storylets never change phase, control, or major character status.
- A storylet may plant a seed; the payoff is a separate authored event.

## Relationship and memory

- Dimensions: trust, affection, obligation, fear, respect. Show bands, not numbers.
- Promises and debts are explicit records with due dates.
- Character memory is coarse: what they know, what they believe, what they think of the
  player. Do not model every NPC exhaustively.
- Betrayal and forgiveness are events, not thresholds.

## Validation

```
pnpm content:continuity
pnpm content:coverage
pnpm simulate -- --scenario scenario.<arc>
pnpm test
```

The recurrence auditor must pass: no dead speakers, no simultaneous locations, no
impossible ages, no descendant before birth, no appearance without a feasible route.

## Common mistakes

| Symptom | Fix |
|---|---|
| Character feels like a quest-giver | Give them a life, a want, and a cost |
| Reappears for fan service | Add an itinerary reason and travel time |
| Arc never resolves | Add a resolution and a failure state; test both |
| Player learns a secret instantly | Route it through knowledge, not facts |
| Descendant appears too early | Check birth window and generation timing |
| Same tone every travel | Tag storylets and enforce cooldowns |
| Mystery solved by a character | Remove the confirmation; leave a mundane reading |
