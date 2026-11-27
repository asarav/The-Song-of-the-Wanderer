# Afflictions and road hazards

**Status:** implemented in the playable slice · 2026-11-27
**Decisions:** [ADR-0015](../DECISIONS/ADR-0015-afflictions-and-road-hazards.md) · related [ADR-0014](../DECISIONS/ADR-0014-one-reserve-and-grain.md) · [ADR-0016](../DECISIONS/ADR-0016-three-roads.md)
**Data:** `docs/DATA_MODEL.md` §4.4 and §6.4

## What the player feels

A crossing is no longer only a price and a delay. Before boarding, the roads screen says
how risky the passage is:

```
Coastal — 20% risk · moderate
moderate crossing +4 · Akkadian: basic +2
```

Most crossings are quiet. About one in five, at the opening state, the road asks a
question. A caravan may find the traveller at the verge and share water; a patrol may
escort the boat into harbor; a healer may treat a fever at a waystation. Or the road takes
something: a day of thirst, a fever that outlasts the port, a shifting load that costs
reserve and cargo. The same table includes a spring where the traveller can fill skins.
None of these are separate systems; they are authored scenes selected by the hazard's
weighted outcome table.

A town is the other half of the loop. A day in port supplies the `town` treatment, which
cures thirst and hunger. **Rest** supplies `town` and `rest`, so it can also clear a
wound or fever that a mere day of errands would not. A healer scene supplies `healer`,
which reaches conditions a town cannot. The Status screen lists active **Conditions** in
plain language with the day they began; the player does not have to remember a hidden
counter.

The design rule is: **the road inflicts, the world cures.** A condition is never removed
by time alone. It is removed by a place, a person, an item or a rite.

## The model

### Afflictions are discrete entities

```json
{
  "id": "aff.thirst",
  "name": "Dry throat",
  "kind": "thirst",
  "severity": "light",
  "description": "Dust in the mouth, a headache behind the eyes.",
  "treatments": ["town", "water"],
  "onset": "By midday your tongue is thick.",
  "daily": "Your mouth is dry from waking; the day does not improve it.",
  "recovery": "The first clean water goes down like a held breath let out.",
  "provenance": { "confidence": "plausible", "sources": ["..."] }
}
```

Persisted state is only `{id, sinceDay, source?}`. The definition, prose and remedies are
content. This is deliberately not a hunger/thirst/fatigue bar: there is no number that
drains continuously, no death spiral from an empty meter, and no hidden arithmetic in the
UI. A condition is either present or absent.

The six authored conditions in the core pack:

| Id | Kind | Severity | Cured by |
|---|---|---|---|
| `aff.thirst` | thirst | light | town, water |
| `aff.hunger` | hunger | light | town, food |
| `aff.wound` | wound | grave | rest, healer |
| `aff.fever` | fever | grave | rest, healer |
| `aff.poison` | poison | grave | antidote, healer |
| `aff.curse` | curse | grave | shrine |

The world currently inflicts thirst, hunger, wound and fever on the road. Poison and curse
are authored and supported by the engine but have no slice source yet; they are waiting
for an antidote seller, a god's offence, or a shrine quest.

### Treatment tags, not direct removal

The DSL has two atoms:

```json
{ "affliction": { "id": "aff.fever", "source": "the road" } }
{ "treatment": "water" }
```

A scene applies a tag, and the engine removes every active affliction whose definition
lists that tag. Content never names an affliction to delete. That means a new remedy can be
added to an existing condition, a new condition can reuse an existing remedy, and a quest
can grant a tag without a save migration. It also means an unknown affliction id is inert
rather than destructive: content that has not been loaded cannot delete a condition.

Tags currently in use: `town`, `rest`, `water`, `food`, `healer`, `antidote`, `shrine`.
Town time supplies `town`; Rest supplies `rest` and `town`; harbor work supplies `town`.
The rest are supplied by authored scenes and, in future, by items and quests.

### The daily condition report

Every command that moves the calendar derives a report from the afflictions before and
after it (`src/engine/views/day.ts`). It is presentation only: nothing new is saved, and
there is no hidden condition meter. The report classifies each condition:

| Before | After | Line | Report |
|---|---|---|---|
| absent | present | `onset` | **worse** |
| present | present | `daily` | **same** |
| present | absent | `recovery` | **better** |
| one arrives while another lifts | both | both | **mixed** |

The day note shows the count of days, the new date, a short headline and up to four
condition lines; it stays on screen longer than a bare date. A three-day Rest reports once
for the interval, not three separate toasts. The prose is authored in each affliction's
`onset`, `daily` and `recovery` fields, so a new condition gets a voice without a new UI
branch.

"Worse" means a condition arrived; an untreated condition does not silently change
severity on a timer. This preserves the rule that the road inflicts and the world cures.
Conditions already feed road risk, and content can gate a choice or event with
`hasAffliction`; the daily report is the narrative surface that keeps the body present
between those beats.

### Hazard is a derived chance

A route may author:

```json
{
  "hazard": {
    "baseChance": 14,
    "outcomes": [
      { "event": "evt.travel.rescue-caravan", "weight": 2, "kind": "rescue" },
      { "event": "evt.travel.peril-thirst", "weight": 2, "kind": "setback" },
      { "event": "evt.travel.peril-wreck", "weight": 1, "kind": "grave" }
    ]
  }
}
```

The displayed chance is derived, never stored:

| Factor | Delta |
|---|---|
| Route risk | low 0 · moderate +4 · high +8 |
| Mode | authored `hazardModifier` (coastal 0, open water +5) |
| Destination language | unfamiliar +5 · basic +2 · conversational 0 · fluent −2 · deep −4 |
| Known destinations beyond the first two | −1 each, capped at −5 |
| Local ties | −3 per trusted character with a home at the destination, capped at −6 |
| Active afflictions | +2 each; grave conditions +5 |
| Low reserve (< 3) | +5 |
| Route marked risky | +5 |
| Destination pressure | war +8 · famine +6 · disease +6 · unrest +4 |

The raw value is clamped to 5–60%. On **Wanderer**, the opening Ugarit–Cyprus coastal crossing is exactly **20%**: base 14,
moderate crossing +4, basic Akkadian +2. Open water is 25%. The three run-wide modes shift
this by −8 / 0 / +10: see [The three roads](difficulty.md). The number is a read model;
loading a save and replaying produces the same value from the same state.

Once per passage, the engine asks the dedicated `hazard` stream one question. On a
trigger it selects one outcome by weight and adds that event to the journey's slots at a
day inside the crossing. It does not replace the waypoints or the ordinary encounters, and
it cannot schedule the same scene twice. The event then runs through the normal dialogue,
effects and journal pipeline. A failure to reach the right place still arrives on time;
the hazard changes what the road costs, not whether the boat exists.

### Why a separate stream

`market`, `encounters`, `travel`, `flavour`, `narrative` and `tests` already had golden
vectors. Rolling hazard from any of them would have shifted every existing sequence and
silently changed old saves' replay. `hazard` is fourth in the named list, seeded from
`${seed}:hazard`, so adding the mechanic does not move any other stream. Reordering or
renaming the streams would still change replay; that needs a migration and a new golden
vector, not a casual edit.

## The failure envelope

The brief asks for roughly a **20% chance of death or failure at the start**, falling with
knowledge and rising in new lands, war, famine and disease. The slice implements the
20% as **exposure**: at the opening state, one crossing in five produces a hazard scene.
The scene may rescue the traveller, cost reserve and cargo, or force the existing
collapse/return. It does not delete the run.

That distinction is deliberate:

- The game's failure grammar is a return, a loss and a story, not a game-over screen.
  ADR-0014 established that; this feature extends it to conditions.
- Permanent death is an explicit ending, not a random tax on a boat trip. It needs its own
  authored trigger, its own consent from the player, and its own milestone. Adding it as a
  hidden 20% would violate the "never invent canon silently" rule and the spec's ending
  model.
- The 20% is still meaningful because a hazard can leave a grave condition, empty the
  reserve, or trigger the return. The expected cost of a crossing is no longer only the
  fare.

Tuning the opening figure is a content edit (`hazard.baseChance`, outcome weights, mode
modifier) plus, if needed, a factor delta in `src/engine/world/hazard.ts`. No save field
changes.

## Difficulty scaling

The derivation is the single place where difficulty lives. The factors already cover:

- **Learning the world:** knowing more destinations lowers the chance; fluency lowers it
  further; trusted people at the destination lower it again.
- **Being new somewhere:** an unfamiliar language, no known roads and no ties push the
  chance up.
- **Route choice:** open water is riskier than coast; a high-risk route is riskier than a
  moderate one; a route marked risky adds more.
- **Condition:** a wound, poison or curse is worse than thirst; low reserve compounds it.
- **World pressure:** destination war, famine, disease and unrest already add fixed
  spikes.

What is deliberately future work:

1. **The Bronze Age collapse as a phase.** `world.destinationStates` is a string list, not
   yet a regional phase engine. A later world-timeline milestone should set `war`,
   `famine`, `disease` and `unrest` from authored phases and events, so the same hazard
   derivation rises without a new risk system.
2. **A regional difficulty floor.** New lands beyond the slice may need an authored
   `pressure` or `strangeness` factor on the region, not only on the destination.
3. **Permanent conditions with quest cures.** `aff.poison` needs an antidote item or a
   healer who sells one; `aff.curse` needs a shrine, a god and a rite. The state and the
   treatment tag exist; the content does not yet.
4. **Failure that ends a run.** Explicit endings, not random death. This needs a milestone
   decision and a player-facing warning.
5. **Changing road mid-run.** The three modes are chosen at the start (ADR-0016). A later
   switch would need to define what happens to an in-flight hazard and the run's history;
   it should reuse the same shift, not fork the derivation.

The important constraint is that all of these attach to the same four things: route
content, destination/route state, player knowledge and condition, and the authored
outcome table. None needs a second hidden difficulty number.

## What is deliberately absent

- No hunger, thirst, fatigue, temperature or disease meters.
- No per-day condition tick. A condition persists until treated; it does not silently
  worsen on a timer.
- No random death and no forced game over.
- No combat, no HP, no wound locations.
- No generic "medicine" item yet. `healer` and `antidote` are tags; the item that carries
  an antidote is future content.
- No disease transmission between characters. A future plague is an authored world event,
  not a simulation.

## Verification

- Engine tests cover adding an affliction once, treatment removing only matching tags,
  town and rest treatment, the derived chance at the opening state, movement with
  knowledge, condition and pressure, and a hazardous journey scheduling an authored
  outcome. View tests cover new, lingering, lifted and mixed day reports, and the store
  test proves the report is attached to a passing day.
- Save tests cover the v3→v4 affliction migration, the v4→v5 road migration and the v5
  round trip.
- Content lint covers all six afflictions and every new event/dialogue reference.
- Browser: the roads screen shows the risk line and the Status screen shows Conditions.
  The slice has no source for poison or curse yet, so those two are engine- and
  content-validated rather than reached in play.
