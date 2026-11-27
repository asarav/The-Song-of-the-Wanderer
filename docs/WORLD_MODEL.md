# World model: time, events, and propagation

How the world changes over centuries without a script for every consequence.

This document defines the model. Implementation lands in M5; until then it is the design
contract that M1–M4 must not contradict.

## 1. Principles

1. **History is authored, not simulated.** We schedule events and author their
   consequences. We never compute the collapse from food, armies, or trade.
2. **Time is layered.** Eras bound the world; regional phases bound what a region can
   contain; events change state; local events and storylets fill the days.
3. **Consequences flow downward.** A world event propagates to regions, destinations,
   routes, factions, characters, markets, and knowledge through a closed vocabulary. A
   local event may *suggest* a larger change only through an authored hook.
4. **Truth and knowledge are separate.** The world knows what happened. The player knows
   what they heard, saw, inferred, or got wrong. These must never be conflated.
5. **Distance matters.** News travels along connections and takes time. A collapse in
   Anatolia is a rumor in Ugarit before it is a price change, and a price change before
   it is a refugee at the gate.
6. **No universal clockwork.** Different regions experience different phases at different
   dates. There is no global "year of the collapse".

## 2. Time hierarchy

| Tier | Unit | Lifetime | Examples | Owner |
|---|---|---|---|---|
| 0 | Era | centuries | Late Bronze Age, Early Iron Age | Global timeline |
| 1 | Regional phase | years–decades | "Ugarit at its height", "Ugarit under threat", "Ugarit abandoned" | Region |
| 2 | World event | days–years | Hittite grain crisis, Sea Peoples campaigns, Shang–Zhou war | World timeline |
| 3 | Regional process | months–years | Drought in Anatolia, Assyrian contraction, PGW spread | Region |
| 4 | Local event | days–months | Harbor tax riot, temple festival, workshop fire | Destination |
| 5 | Character beat | scene | A merchant decides to move his family | Arc |
| 6 | Ambient storylet | moment | A sailor's story at the docks | Encounter pool |

Rules:

- A region has exactly one active phase at a time. Phases have date ranges and optional
  preconditions; the timeline validator rejects gaps and overlaps for a region.
- A destination's content is a function of its region phase plus local deltas. A
  destination that does not exist in a phase has no activities, routes, or market.
- World events may be scheduled by date, by condition, or by another event. Major events
  are never random.
- Local events and storylets may be selected randomly from eligible pools; they may not
  change regional phase or world state directly.

### 2.1 Day context

The date is a key, not a mood. The meaningful object is a derived `DayContext` for the
current region:

```ts
type DayContext = {
  day: Day
  date: { year: number; month: string; dayOfMonth: number; season: SeasonId }
  regionPhases: Record<RegionId, RegionPhaseId>
  climate: ClimatePhaseId[]
  weather: WeatherView                  // deterministic presentation, not history
  observances: ObservanceId[]           // festivals, fasts, market days
  astronomical: AstronomicalEventId[]   // authored, regionally visible
  activeEvents: EventId[]
  modifiers: { market: PriceModifier[]; routes: RouteState[]; encounters: EncounterTag[] }
  arrivals: { rumor: RumorId; destination: DestinationId }[]
}
```

Rules:

- `DayContext` is derived from calendar, phases, active events, and player knowledge. It
  is never saved.
- Climate change is an authored phase or regional process, not a simulation. Weather is
  deterministic local color and may not rewrite history.
- Astronomical and religious events record what people observe and claim. They do not
  assert metaphysical facts. A ritual can be a fact; a god's appearance is an
  interpretation.
- Observances are local. There is no single global festival calendar.

Entity shapes and the full field list are in `DATA_MODEL.md` §7.

## 3. Event taxonomy

All event kinds share a common envelope:

```ts
type EventDef = {
  id: EventId
  kind: 'world' | 'regional' | 'local' | 'character' | 'storylet'
  title: string
  description?: string
  dateRange?: { from: DayString; to?: DayString }   // eligible window
  scope: {
    regions?: RegionId[]
    destinations?: DestinationId[]
    routes?: RouteId[]
    waypoints?: WaypointId[]
    groups?: MobileGroupId[]
  }
  conditions: Condition
  priority: number
  once?: boolean
  cooldownDays?: number
  major: boolean
  scene?: SceneId
  cast?: CharacterId[]
  effects: Effect[]
  propagation?: Propagation[]
  knowledge?: KnowledgeEffect[]
  journal?: JournalId | null
  followUps?: { event: EventId; inDays?: number; conditions?: Condition }[]
  art?: AssetId
  audio?: AssetId
  provenance: Provenance
}
```

Meaning by kind:

- **world** — multi-region, authored date or condition. Sets regional phases, closes
  routes, changes faction control, schedules migrations. Always `major`.
- **regional** — affects one region's destinations, markets, factions, or characters.
  May be scheduled by a world event or by its own conditions.
- **local** — belongs to a destination or route. Small, concrete, often optional. This is
  where "the harbor master is angry because the grain shipment is late" lives.
- **character** — an arc beat. Owned by a character or family, not by a place.
- **storylet** — ambient, pooled, repeatable with cooldowns, never major.

The envelope is the only way to introduce change. There is no separate "scripted scene"
path.

## 4. Propagation

Propagation is the bridge between tiers. It is a closed list of effects, each of which
targets a lower tier.

```ts
type Propagation =
  | { to: 'regionPhase'; region: RegionId; phase: PhaseId }
  | { to: 'destinationState'; destination: DestinationId; state: string }
  | { to: 'routeState'; route: RouteId; state: 'open' | 'risky' | 'closed' | 'seasonal' }
  | { to: 'faction'; faction: FactionId; field: FactionField; delta: number }
  | { to: 'factionControl'; destination: DestinationId; faction: FactionId | null }
  | { to: 'characterStatus'; character: CharacterId; status: CharacterStatus }
  | { to: 'characterMove'; character: CharacterId; to: DestinationId; afterDays: number }
  | { to: 'characterArc'; character: CharacterId; arc: ArcId; beat: BeatId }
  | { to: 'market'; destination: DestinationId; good: GoodId; priceMultiplier: number; availabilityDelta: number }
  | { to: 'migration'; group: MigrationGroupId; from: DestinationId; to: DestinationId; afterDays: number }
  | { to: 'schedule'; event: EventId; inDays: number }
  | { to: 'rumor'; template: RumorId; regions: RegionId[]; reliability: number }
  | { to: 'journal'; entry: JournalId; audience: 'player' | 'character'; character?: CharacterId }
```

Rules:

- Propagation is ordered and deterministic. Order is array order, breadth-first.
- A propagation that cannot apply is clamped and recorded; it never throws.
- `afterDays` schedules a follow-up rather than applying instantly, so consequences can
  arrive after the player has moved on.
- Nothing propagates upward. A local fire does not change the regional phase unless an
  authored event says so.

## 5. Truth, knowledge, and rumor

### 5.1 Facts ledger

Objective world state is asserted as facts:

```ts
type Fact = {
  id: FactId                  // "fact.ugarit.destroyed", "fact.amnit.location"
  subject: EntityId
  predicate: string           // "status", "controls", "locatedAt", "believes"
  value: string | number | boolean
  validFrom: Day
  validTo?: Day
  source: EventId
  certainty: 'attested' | 'authored' | 'inferred'
}
```

Facts are the continuity backbone:

- "A character is in two places at once" becomes a fact contradiction.
- "A dead character speaks" is caught by comparing a scene's cast with `status` facts.
- The continuity linter in M8 reads facts, not prose.

Facts are not shown to the player. They are the world's memory.

### 5.2 Player knowledge

```ts
type KnowledgeEntry = {
  fact: FactId
  learnedAt: Day
  source: 'witnessed' | 'told' | 'document' | 'rumor' | 'inferred' | 'misremembered'
  reliability: number          // 0..1
  belief: 'believed' | 'doubted' | 'disbelieved'
  detail?: string              // what they were told, which may differ from the fact
}
```

- Map knowledge, character index, journal, and dialogue conditions read knowledge.
- A player may possess a `KnowledgeEntry` for a fact that is false (a rumor with a
  fabricated FactId variant, or a `detail` that contradicts the truth).
- Learning the truth does not automatically delete a belief; an authored scene may
  replace it, and the journal records both.

### 5.3 Rumor propagation

```ts
type RumorDef = {
  id: RumorId
  about: EventId | FactId
  variants: { text: string; distortion: number; requires?: Condition }[]
  baseDelayDays: number
  hops: { destination: DestinationId; delayDays: number }[]  // authored spread
}
```

- A world event with a `rumor` propagation schedules arrival at connected locations after
  `baseDelayDays + hops`.
- Reliability decreases with hops, language distance, and source interest.
- The UI presents rumor text as reported speech, never as narration.
- A player acting on a false rumor must be able to discover the error without a reload.

This is what lets distant history feel like weather rather than cutscenes.

## 6. Local consequences: how big events reach a person

An authored propagation chain, using the slice's region:

1. **World event** `evt.world.hittite-grain-crisis` (c. 1207 BCE) sets:
   - `region.anatolia` phase → `phase.anatolia.pressure`
   - market multipliers for grain in `dest.ugarit` (+25%, availability −2)
   - a rumor scheduled at Ugarit in 12 days
2. **Regional process** `evt.region.levant.grain-anxiety` becomes eligible once the market
   multiplier exists. It sets a destination state `dest.ugarit.state = 'tense'`.
3. **Local event** `evt.local.ugarit.harbour-dispute` becomes eligible in the `tense`
   state: a harbor official is short with merchants and a shipment is impounded.
4. **Character beat** `arc.ugarit.amnit.grain-decision` triggers for the merchant Amnit,
   whose contract is now unprofitable. The player can advise her, lend money, or do
   nothing.
5. **Delayed propagation** schedules `migration.ugarit.amnit-household` in 90 days and a
   follow-up event in Cyprus in 2 years.
6. If the player helped, the family arrives in Cyprus as a workshop household and the
   daughter becomes a recurring character in Act IV. If not, they arrive destitute, or
   not at all, and the daughter's story changes.

Every step is authored. The chain is the unit of design: **world event → regional
condition → local pressure → character decision → delayed consequence → later
reappearance**. M5 must make this chain expressible without engine code.

## 7. Destination and route states

### 7.1 Destination state

A destination's phase state selects content variants:

```ts
type DestinationPhaseState = {
  phase: PhaseId
  intro: TextRef
  activities: ActivityId[]
  cast: { character: CharacterId; presence: 'resident' | 'visitor' | 'absent' }[]
  market: { available: GoodId[]; modifiers: PriceModifier[] }
  routes: RouteId[]
  localEventPool: EventId[]
  art?: AssetId
  audio?: AssetId
}
```

Local deltas on top of the phase state:

- destroyed, occupied, flooded, festival, quarantine, siege
- each delta adds/removes activities and modifies markets, routes, and cast availability.

The UI must always be able to explain *why* an activity or route is unavailable, using
authored reason strings.

### 7.2 Route state

Routes have phase-dependent availability and requirements:

- open, risky, closed, seasonal
- requirement sets: guide, language, pass, faction permission, cargo limit
- closure reasons: war, weather, politics, destroyed endpoint

Route changes are authored by events, not inferred from destination states, so the
designer stays in control of the map.

## 8. Interactions with other systems

| System | Reads from world model | Writes through world model |
|---|---|---|
| Travel | route state, requirements, destination phase | travel events, arrival knowledge |
| Market | phase availability, price modifiers, faction control | contract outcomes, local events |
| Dialogue | character knowledge, local state, phase | relationship and flag effects only |
| Journal | facts the player learned, events witnessed | entries, map/character index updates |
| Factions | control, obligations, conflict state | access, tolls, route permissions |
| Arcs | phase, local pressure, world events | character beats, migrations, status |
| Codex | phase-appropriate context | nothing (read-only) |

## 9. Authoring a timeline

Per region, write:

1. **Phase table** — phase id, date range, short description, what changed, which
   destinations exist.
2. **World-event hooks** — which world events enter this region, when, and with what
   local consequences.
3. **Regional processes** — the slow pressures the player can feel.
4. **Local event pools** — per destination and phase.
5. **Knowledge plan** — what can be learned, from whom, how it distorts, and how it is
   corrected.
6. **Route plan** — which connections open, close, or become risky, and why.
7. **Character impact table** — which recurring characters are affected, how, and when.

The timeline validator (M5) checks: phase gaps/overlaps, events outside a phase, events
with no effect, follow-ups that never resolve, rumors with no reachable destination, and
migrations with no origin or destination.

## 10. Save representation

Only authored deltas and learned knowledge are persisted; untouched regions derive from
the timeline. See ADR-0005 and `SCALING.md` §6.

```ts
WorldState = {
  era: EraId
  regionPhases: Record<RegionId, PhaseId>
  destinationDeltas: Record<DestinationId, DestinationDelta>
  routeStates: Record<RouteId, RouteState>
  facts: Fact[]                      // asserted, with validity windows
  scheduled: ScheduledEvent[]
  migrations: MigrationRecord[]
}
```

Derivation must be pure and testable: `deriveDestination(world, destinationId, content)`
returns the current state. A save that stores a derived value as truth is a bug.

## 11. What we do not simulate

- No emergence: no famines, wars, or migrations arise from variables.
- No global economy: prices are authored bands with modifiers.
- No population or army tracking.
- No procedural history.
- No event not present in content, ever.

The model exists to make authored history *feel* systemic, not to replace the author.
