# Data model

**Status:** design contract · **Companions:** `ARCHITECTURE.md`, `WORLD_MODEL.md`,
`NARRATIVE_SYSTEMS.md`, `SCALING.md`, `CONTENT.md`

This document answers one question: **what is the shape of everything the game knows?**

It is deliberately broader than the vertical slice. The slice implements a subset, but it
must not invent a shape that the full world cannot grow into.

## 1. Four representations

Every entity is modeled in up to four forms:

| Form | Lives in | Mutable | Saved | Example |
|---|---|---|---|---|
| **Definition** | content pack | no | no | A city's climate profile, a character's wants |
| **State** | `GameState` | yes | yes | The city is occupied; the character is in Cyprus |
| **View** | derived at read time | no | **never** | Current prices, available activities, who is present |
| **Knowledge** | player / character memory | yes | yes | The player was told the city fell; a character believes a rumour |

Not every entity has all four. A culture has no runtime state. The player has no authored
definition beyond background and presentation. But no entity may blur the four: a
definition is not a save field, a view is not persisted, and knowledge is never silently
replaced by truth.

This is the same distinction as ADR-0004 (truth vs knowledge) and ADR-0005 (deltas,
derivation, packs), applied at entity level.

## 2. Universal envelope

Every authored entity carries:

```ts
type EntityEnvelope = {
  id: EntityId            // stable, namespaced, human-readable
  kind: EntityKind        // 'destination' | 'character' | 'route' | ...
  pack: PackId            // content pack that owns it
  contentVersion: number
  provenance: Provenance  // confidence, sources, notes
  tags?: string[]
}
```

Rules:

- Identity is the `id`, never an array index or a filename.
- References are IDs. No inline copies of another entity's data.
- IDs are stable across content versions. Renames need a migration or an alias.
- Player-visible text is localisable; IDs are not.
- Provenance is mandatory for historical entities and for any claim that looks
  historical. Invented people and scenes are tagged `fictional` even inside real places.
- A local exception carries a reason. "It is different here" is data, not a hunch.

## 3. Entity map

| Domain | Authored definitions | Saved state | Derived views |
|---|---|---|---|
| Player | background, presentation, starting contacts | identity, location, resources, languages, deeds, reputation, knowledge | journal, map, index, status |
| World time | eras, phases, calendars, climate phases, observances | current day, region phases, scheduled events | `DayContext`, season, festival status |
| Region | geography, ecology, cultures, languages, polities, resources | phase, deltas, control | regional summary, travel conditions |
| Destination | city/port/village/shrine/camp profile, sites, cast, market, routes | phase, local delta, control, damage | current market, activities, cast, descriptions |
| Route | corridor, segments, waypoints, modes, hazards, encounter pools | route state, closures, known conditions | available modes, duration, risk, encounters |
| Waypoint | wonder, battlefield, shrine, ford, pass, camp, ruin, calm place | condition, control, known state | encounter and knowledge options |
| Mobile group | bandits, pirates, foragers, pastoralists, pilgrims, hermits | position, strength, mood, obligations | encounter behaviour, rumours |
| Character | identity, culture, languages, position, allegiances, wants, fears, worldview, itinerary, arcs | status, location, age, fame, position, relationships, memory, arc states | present cast, dialogue eligibility, index |
| Family | name, home, generations, inheritance | active generation, inherited debts/objects/stories | descendant eligibility |
| Arc | premise, stakes, beats, branches, resolutions, failure, successor | current beat, flags, last advanced, stranded | available beats, arc summary |
| Faction | type, ideology, interests, resources, hierarchy, territory, members, symbols, rituals, conflicts | standing, control, obligations, membership, phase | access, tolls, permissions, faction view |
| Culture | naming, address, hospitality, taboos, festivals, dress, food, art, music, literature, law, currency conventions | local variant and phase | how people speak, what is polite, what is taboo |
| Language | family, script, related languages, registers, tiers, learning sources | player/character tiers and XP | comprehension, interpreter need |
| Religion / cult | deities or powers, practices, festivals, sacred places, clergy, texts, secrecy | local phase, public/secret status | observance, taboo, knowledge options |
| Cultural work | song, poem, inscription, myth, motif, design, performance | variants and knowledge | what the player can hear, read, or repeat |
| Climate / ecology | climate bands, seasons, flora, fauna, hazards, resources | authored climate phase | weather flavour, availability, travel effects |
| Economy | goods, currency/units, production/consumption profiles, contracts, transport | market state, contracts, cargo | prices, availability, terms |
| Object | token, seal, letter, relic, tool, trade good | holder, location, condition, knowledge | what the player can show, use, or recognise |
| Event | world/regional/local/character/storylet envelope | scheduled, fired, cancelled | eligibility, propagation trace |
| Fact | none; facts are asserted by events | objective assertions with validity windows | current truth for simulation |
| Knowledge | none; learned at runtime | player entries, rumours, character beliefs | journal, map, index, dialogue conditions |
| Meta | engine and pack versions | seed, RNG streams, save version, command log | diagnostics |

## 4. Player

The player is not a content definition with stats. The player is a saved identity plus a
ledger of what they have done and what they know.

```ts
type PlayerState = {
  identity: {
    selfName: string
    presentation: Presentation
    background: BackgroundId[]
    localNames: Record<RegionId, string[]>   // names others use, not translations
  }
  location: DestinationId | RouteId
  money: number
  inventory: CargoEntry[]
  capacity: number
  transport: TransportId
  languages: Record<LanguageId, { xp: number; tier: LanguageTier }>
  deeds: DeedRecord[]
  reputation: Record<ReputationKey, ReputationBand>
  obligations: ObligationId[]
  flags: Record<string, boolean | number | string>   // small local state only
}
```

### 4.1 Deeds, not just flags

"What the player has accomplished" is a first-class ledger:

```ts
type DeedRecord = {
  id: DeedId
  kind: 'traded' | 'helped' | 'refused' | 'learned' | 'preserved' | 'betrayed' | ...
  day: Day
  place: DestinationId | RouteId
  subject: EntityId
  witnesses: CharacterId[]
  knowledge: { fact: FactId; spread: 'private' | 'local' | 'regional' }[]
  consequence?: string
}
```

A flag can answer "did this happen?" A deed answers "who saw it, who heard about it, and
what did it change?" Names, fame, obligations, and endings read deeds, not a single
reputation number.

### 4.2 Reputation and names

- Reputation is keyed by region, faction, and social stratum. There is no global score.
- Local names are local. A name in Ugarit is not a translation of a name in Egypt.
- The player's own interpretation of their nature is a choice, not a stat. There is no
  `isDivine` field. See `design/02-protagonist.md`.

### 4.3 Player read models

The journal, map, character index, codex, and dialogue eligibility are views over
knowledge. They never read the fact ledger directly.

## 5. Places: regions, destinations, sites

### 5.1 Region

A region is a large authored area with shared geography and history:

```ts
type RegionDef = {
  id: RegionId
  name: string
  climate: ClimateId
  ecology: EcologyId
  cultures: CultureId[]
  languages: LanguageId[]
  resources: GoodId[]
  destinations: DestinationId[]
  routes: RouteId[]
  phases: RegionPhaseId[]
  provenance: Provenance
}
```

Regions own phase tables and world-event hooks. They do not own the definition of a
culture or language; they reference shared entities.

### 5.2 Destination

A destination is any place the player can be: city, port, village, shrine, camp, ruin, or
quarter. "City" is a kind, not the only kind.

A destination is a **composition of profiles plus local truth**:

```ts
type DestinationDef = {
  id: DestinationId
  kind: 'city' | 'port' | 'village' | 'shrine' | 'camp' | 'ruin' | 'quarter'
  region: RegionId
  name: string
  location: { coastal?: boolean; river?: RiverId; terrain: TerrainId }
  profiles: {
    climate: ClimateId
    ecology: EcologyId
    cultures: CultureRef[]
    languages: LanguageRef[]
    religions: ReligionRef[]
    architecture: ArchitectureStyleId
    economy: EconomyProfileId
    currency: CurrencyId
    arts: CulturalWorkRef[]
  }
  localOverrides?: LocalOverride[]
  sites: SiteId[]
  institutions: FactionId[]
  cast: CharacterId[]
  activities: ActivityId[]
  market: MarketProfileId
  routes: RouteId[]
  eventPools: EventPoolId[]
  phaseStates: DestinationPhaseState[]
  assets?: { art?: AssetId[]; audio?: AssetId[] }
  provenance: Provenance
}
```

The profile list is how a city carries climate, culture, language, currency, architecture,
art, religion, literature, and music without duplicating them. A local override is for a
real difference, not a copy.

### 5.3 Phase states and deltas

```ts
type DestinationPhaseState = {
  phase: RegionPhaseId
  intro: TextRef
  sites: SiteId[]
  activities: ActivityId[]
  cast: { character: CharacterId; presence: 'resident' | 'visitor' | 'absent' }[]
  market: { available: GoodId[]; modifiers: PriceModifier[] }
  routes: RouteId[]
  eventPools: EventPoolId[]
  art?: AssetId
}
```

Saved deltas sit on top: destroyed, occupied, flooded, festival, quarantine, siege, and
authored local changes. The current display state is derived from phase + delta + active
events. It is never saved.

### 5.4 What a city must be able to answer

For any destination, the model must be able to answer:

- What does it look like, smell like, and sound like here?
- Who lives here, who rules here, and who is merely present?
- What is ordinary work, food, dress, and hospitality?
- What languages are spoken, read, and written?
- What is sacred, taboo, fashionable, or forbidden?
- What is made, sold, needed, and scarce?
- What stories, songs, inscriptions, and styles come from here?
- What is different in this phase, and why?
- What does the player know, and what do they merely believe?

## 6. Routes and the spaces between

A route is not a graph edge. It is a corridor with its own places and life.

```ts
type RouteDef = {
  id: RouteId
  kind: 'sea' | 'river' | 'road' | 'pass' | 'canyon' | 'desert' | 'steppe' | 'coastal'
  from: DestinationId | WaypointId
  to: DestinationId | WaypointId
  segments: RouteSegment[]
  waypoints: WaypointId[]
  modes: TravelMode[]
  requirements: RouteRequirement[]
  seasonality: SeasonRule[]
  hazards: HazardId[]
  encounterPools: EncounterPoolId[]
  phaseStates: RoutePhaseState[]
  provenance: Provenance
}
```

### 6.1 Waypoints

Waypoints are first-class places along a route:

- a spring, ford, pass, anchorage, or oasis
- a shrine, hermitage, cult site, or pilgrimage stop
- a battlefield, ruin, monument, or natural wonder
- a camp, caravanserai, toll post, or market
- a quiet place for rest, meditation, or conversation

A waypoint can have cast, events, knowledge, art, and its own local state. This is how the
space between cities becomes playable instead of being a loading screen.

### 6.2 Mobile groups

Bandits, pirates, foragers, pastoralists, pilgrims, merchants, and hermits are not one
category:

```ts
type MobileGroupDef = {
  id: MobileGroupId
  kind: 'bandit' | 'pirate' | 'forager' | 'pastoralist' | 'pilgrim' | 'hermit' | ...
  territory: RouteId[]
  motives: string[]
  taboos: string[]
  strength: number
  seasonality: SeasonRule[]
  relationships: GroupRelationship[]
  encounterPools: EncounterPoolId[]
  provenance: Provenance
}
```

Bandits and pirates prey on travellers. Foragers and pastoralists are communities with
their own territories and rights; they are not generic hazards. A group may be linked to a
faction, but it is not automatically a faction.

### 6.3 Encounter pools

Pools are authored, tagged, and phase-aware:

```ts
type EncounterPoolDef = {
  id: EncounterPoolId
  context: 'sea' | 'river' | 'road' | 'pass' | 'desert' | 'shrine' | 'camp' | ...
  tags: ('danger' | 'trade' | 'rumour' | 'calm' | 'ritual' | 'grief' | 'music')[]
  events: EventId[]
  weight: number
  cooldownDays: number
}
```

Calm, meditation, philosophising, songs, and small kindnesses are first-class storylets,
not filler between fights. They are authored and optional, and they do not become a
survival meter.

## 7. Time: calendar, climate, observance, and events

### 7.1 Layers

| Layer | Authored? | Example |
|---|---|---|
| Era | yes | Late Bronze Age |
| Regional phase | yes | Ugarit at its height |
| Climate phase | yes | Drier decades in Anatolia |
| Season | yes | Flood, harvest, sailing season |
| Day | derived from calendar | The specific date |
| Event | yes, scheduled or conditional | Grain crisis, festival, eclipse report |
| Weather | deterministic flavour | A hot wind, a sudden squall |

Climate change is authored, not simulated. Weather is local colour derived from climate
and seed; it does not rewrite history. Major environmental change belongs in a phase or a
world event.

### 7.2 Day context

The player never reads a global "world mood." They read a derived `DayContext`:

```ts
type DayContext = {
  day: Day
  date: { year: number; month: string; dayOfMonth: number; season: SeasonId }
  regionPhases: Record<RegionId, RegionPhaseId>
  climate: ClimatePhaseId[]
  weather: WeatherView                 // deterministic, presentation only
  observances: ObservanceId[]
  astronomical: AstronomicalEventId[]
  activeEvents: EventId[]
  modifiers: { market: PriceModifier[]; routes: RouteState[]; encounters: EncounterTag[] }
  arrivals: { rumor: RumorId; destination: DestinationId }[]
}
```

It is derived from the calendar, timeline, active events, and player knowledge. It is never
saved.

### 7.3 Observances, astronomy, and the divine

- Calendars carry festivals, fasts, processions, market days, and agricultural work.
- Astronomical events are authored and scheduled. They may be visible only in some
  regions and known only through reports.
- A religious event records what people **do** and what they **claim**: a ritual, an omen,
  a sighting, an interpretation. It never asserts a metaphysical fact such as "a god
  appeared."
- The fact ledger may hold `temple.performed.ritual`; it must not hold `god.is.real`.
  Mystery is preserved through interpretation, not through a hidden boolean.
- Local cults may be public, restricted, or secret. Knowledge of them follows the same
  rules as any other knowledge.

## 8. Characters

### 8.1 Definition

```ts
type CharacterDef = {
  id: CharacterId
  name: string
  pronunciation?: string
  pronouns: PronounSet
  culture: CultureId
  languages: LanguageId[]
  home: DestinationId
  tier: 'major' | 'recurring' | 'local' | 'ambient'
  household?: FamilyId
  position: { role: RoleId; rank?: RankId; institution?: FactionId }
  allegiances: AllegianceRef[]
  fame: Record<FameKey, number>          // region / faction / social stratum
  wants: string[]
  fears: string[]
  contradiction: string
  worldview: WorldviewRef
  appearance: AppearanceRef
  voice: VoiceRef
  itinerary: ItineraryEntry[]
  arcs: ArcId[]
  knowledge: KnownFactRef[]
  relationships: InitialRelationship[]
  reactionRules: ReactionRule[]
  provenance: Provenance
}
```

### 8.2 State

```ts
type CharacterState = {
  status: 'alive' | 'missing' | 'dead' | 'displaced' | 'unknown'
  location: DestinationId | 'travelling' | 'unknown'
  age: number | 'unknown'
  fame: Record<FameKey, number>
  position: { role: RoleId; rank?: RankId; institution?: FactionId }
  allegiances: AllegianceRef[]
  arcStates: Record<ArcId, ArcState>
  relationships: Record<CharacterId, Relationship>
  memory: CharacterMemory
  lastSeenByPlayer?: { day: Day; location: DestinationId }
  flags: Record<string, boolean | number | string>
}
```

### 8.3 Position, fame, and allegiance

- **Position** is social and institutional: household head, temple scribe, harbour
  official, guest, exile. It can change by phase or event.
- **Fame** is not one number. A person may be famous in a city, unknown in a village, and
  notorious in one faction. `FameKey` combines region, faction, and stratum.
- **Allegiance** is a set of ties and obligations, not a team colour. A character can be
  loyal to a household, owe a temple, fear a court, and still help the player.
- **Worldview** is authored: values, prejudices, taboos, and what they think is wrong with
  the world. It conditions dialogue and reactions.

### 8.4 Reaction rules

Characters react through authored rules, not a general AI:

```ts
type ReactionRule = {
  id: ReactionId
  trigger: EventId | FactId | 'player-arrives' | 'player-leaves' | 'news-arrives'
  conditions: Condition
  response: 'welcome' | 'bargain' | 'flee' | 'report' | 'hide' | 'help' | 'challenge' | ...
  effects: Effect[]
  memory?: { fact: FactId; belief: 'believed' | 'doubted' | 'disbelieved' }
}
```

A rule may read the character's memory, relationship bands, position, allegiances, fame,
and the local `DayContext`. It may not invent a response outside the authored vocabulary.

### 8.5 Itinerary and memory

Location is data, not improvisation: itinerary entries, routes, travel time, and reasons.
Memory is coarse but real: what they know, what they believe, and what they think of the
player. See `NARRATIVE_SYSTEMS.md` §3, §10.

## 9. Arcs

An arc is a state machine over authored beats.

```ts
type ArcDef = {
  id: ArcId
  owner: CharacterId | FamilyId
  premise: string
  stakes: string
  beats: BeatDef[]
  branches: BranchDef[]
  resolutionStates: ResolutionState[]
  failureStates: ResolutionState[]
  successor?: { character?: CharacterId; family?: FamilyId; apprentice?: CharacterId }
  provenance: Provenance
}

type ArcState = {
  arc: ArcId
  owner: EntityId
  current: BeatId
  flags: Record<string, boolean | number | string>
  lastAdvanced: Day
  visibility: 'player-present' | 'offscreen' | 'reported'
  stranded: boolean
}
```

The state says where the arc is, who owns it, and whether it has stalled. The definition
says what can happen next and how it can end. A beat can resolve off-screen and be
delivered later as a letter, rumour, changed status, or inherited obligation.

## 10. Factions and institutions

```ts
type FactionDef = {
  id: FactionId
  type: 'court' | 'temple' | 'household' | 'guild' | 'army' | 'cult' | 'community' | ...
  ideology: IdeologyRef
  interests: string[]
  goals: GoalId[]
  resources: ResourceRef[]
  hierarchy: RankDef[]
  members: CharacterId[]
  territory: DestinationId[]
  relationships: FactionRelationship[]
  obligations: ObligationRef[]
  conflicts: ConflictRef[]
  secrets: SecretRef[]
  symbols: SymbolRef[]
  rituals: RitualRef[]
  phaseStates: FactionPhaseState[]
  currents?: FactionId[]          // internal tendencies, not monoliths
  provenance: Provenance
}
```

Faction state records standing, control, obligations, conflicts, membership, and phase.
Factions are not monolithic: `currents` lets a court contain a rival faction, a temple
contain a reform movement, or a merchant house contain a cadet branch.

## 11. Culture, language, religion, and works

### 11.1 Culture

A culture profile is not a costume or an ethnic essence. It is an authored, local,
historical interpretation that can overlap with others and change by phase.

```ts
type CultureDef = {
  id: CultureId
  names: NamingConvention
  address: AddressConvention
  kinship: KinshipNotes
  hospitality: HospitalityRule[]
  taboos: TabooRule[]
  purity: PurityRule[]
  festivals: FestivalId[]
  dress: DressNotes
  food: FoodNotes
  bodyLanguage: BodyLanguageNotes
  law: LawNotes
  currencyConventions: CurrencyConvention[]
  art: CulturalWorkRef[]
  music: CulturalWorkRef[]
  literature: CulturalWorkRef[]
  religion: ReligionRef[]
  materialCulture: MaterialCultureNotes
  provenance: Provenance
}
```

Destinations and characters reference cultures; they do not copy them. A city can contain
several cultures, and a character can move between them.

### 11.2 Language

Languages define family, script, related languages, mutual intelligibility, registers,
tiers, and learning sources. Comprehension of a related language is reduced, not free.
Interpreters are characters with fees, loyalties, omissions, and availability.

### 11.3 Religion and cult

Religion is local and plural. A `ReligionDef` or `CultDef` covers powers, practices,
festivals, sacred places, clergy, texts, taboos, secrecy, and internal disagreement. Do not
build a universal pantheon; do not equate similar domains across cultures.

### 11.4 Cultural works

Songs, poems, inscriptions, myths, motifs, and performance traditions are entities, not
decorative strings:

```ts
type CulturalWorkDef = {
  id: CulturalWorkId
  kind: 'song' | 'poem' | 'inscription' | 'myth' | 'motif' | 'performance'
  culture: CultureId
  language: LanguageId
  medium: string
  variants: WorkVariant[]
  knowledge: KnowledgeRef[]
  performanceContext?: string
  provenance: Provenance
}
```

A work can carry a memory of the player, a faction's propaganda, a family's grief, or a
false story about the protagonist. It can be learned, misquoted, translated, or lost.

## 12. Economy, objects, and transport

- **Goods** have categories, substitutes, weight, fragility, perishability, and tags.
- **Currency** is a convenience term for units of account and exchange. Do not assume
  coinage; use weighed metal, barter units, or palace accounting where the period and place
  require it.
- **Markets** are authored bands plus phase, faction, and event modifiers. No full economic
  simulation.
- **Contracts** are promises with deadlines, parties, and failure states.
- **Transport** has schedules, capacity, cost, reliability, and owners.
- **Objects** have a holder, a location, a condition, and a knowledge path. A seal, letter,
  token, or relic must not be in two places at once.

## 13. Knowledge, rumour, and deeds

Three stores, never conflated:

1. **Facts** — objective, time-bound assertions from events.
2. **Player knowledge** — what the protagonist learned, from whom, with what reliability,
   and what they believe.
3. **Character memory** — coarse beliefs for characters who matter.

A rumour is a knowledge delivery with delay, distortion, and a source. It is presented as
reported speech, never as narration. A correction is an authored event or scene, not an
automatic overwrite.

`DeedRecord` connects the player's actions to knowledge: who witnessed it, who heard about
it, and what it changed. The journal, index, map, and dialogue read the knowledge store.

## 14. Ownership and storage

| Data | Definition | Saved state | Derived | Notes |
|---|---|---|---|---|
| Region | yes | phase, control, deltas | summary, conditions | phases are authored |
| Destination | yes | phase, delta, control, damage | current market, cast, activities | display state never saved |
| Route | yes | state, closures, known conditions | duration, risk, modes | route state is authored by events |
| Character | yes | status, location, fame, position, memory | presence, dialogue eligibility | itinerary is definition |
| Arc | yes | current beat, flags, stranded | available beats | off-screen resolution allowed |
| Faction | yes | standing, control, obligations | access, permissions | internal currents exist |
| Culture / language / religion | yes | local phase only | address, comprehension, observance | shared, referenced |
| Player | background only | identity, resources, deeds, reputation, knowledge | journal, map, index | no `isDivine` |
| Fact | no | asserted facts | truth queries | source event required |
| Knowledge | no | entries, rumours, beliefs | read models | never leaks truth |

Rules:

- Untouched regions derive from the timeline. Only deltas are saved.
- A derived value in a save is a bug, not an optimisation.
- A state change has a source event or an authored initial condition.
- Content versions are recorded for diagnosis; save versions are migrated.
- Saves are small because the world is authored, not simulated.

## 15. Modeling rules

1. **Reference, do not copy.** A city references a culture, climate, language, and economy
   profile. It does not contain private duplicates.
2. **Model only what a system reads or a player experiences.** Data with no reader is
   clutter. Add it when a scene, check, or view needs it.
3. **Prefer phase variants to duplicate entities.** A city that changes is one destination
   with phase states, not three unrelated cities.
4. **Every mutable fact has a source.** Events, not vibes, change state.
5. **Every derived value has a pure function.** If it cannot be derived, it is state.
6. **Every player-facing assertion has a knowledge path.** Truth existing is not enough.
7. **Every local exception has a reason and provenance.** Difference is authored.
8. **Culture is plural and historical.** Avoid bounded ethnic essences, modern national
   identities, and universal pantheons.
9. **No logic in content.** Conditions and effects only. If the DSL cannot express it, the
   DSL is extended with tests.
10. **No simulation of history.** We simulate consequences of authored events, not
    famines, wars, or migrations from variables.
11. **No hidden global mood.** Conditions are regional and local; `DayContext` is derived.
12. **No unmodeled entity in shipped prose.** If a scene names a place, person, work, or
    object that matters, it has an ID or is explicitly ambient.

## 16. Anti-patterns

| Anti-pattern | Why it fails | Correct shape |
|---|---|---|
| City as a bag of strings | Cannot validate, translate, or evolve | Composition of referenced profiles |
| Route as a bare edge | The journey has no places or life | Corridor with waypoints and pools |
| One global fame score | Nobody is famous everywhere | Fame keyed by region/faction/stratum |
| Allegiance as a team colour | People have conflicting ties | Ties + obligations + fear + interest |
| Faction as a monolith | Courts and temples have currents | Sub-factions and internal tendencies |
| Culture as costume | Essentialist and unhistorical | Local, plural, phase-aware profile |
| Date as world mood | Erases regional difference | Derived `DayContext` per region |
| Character as quest dispenser | No life beyond the player | Wants, fears, position, itinerary, memory |
| Arc as a linear script | Cannot survive absence or death | Graph with branches, failure, successor |
| Storing derived state | Saves rot and patches fail | Derive from definition + state + date |
| Rumour as narration | Destroys truth/knowledge split | Reported speech with source and reliability |
| `isDivine` | Resolves the mystery | Interpretations, claims, ambiguity |

## 17. New entity checklist

- [ ] `id`, `kind`, `pack`, `contentVersion`, `provenance`.
- [ ] Definition fields and a clear owner system.
- [ ] State fields, if it can change.
- [ ] Derived view, if the UI or simulation needs one.
- [ ] Knowledge path, if the player can learn it.
- [ ] References resolve; no copied shared data.
- [ ] Phase and date validity.
- [ ] Local exceptions have reasons.
- [ ] At least one test or scenario reaches it.
- [ ] Coverage and continuity reports know about it.
- [ ] Player-visible text is localisable.
- [ ] Historical claims are tagged and sourced.

## 18. Milestone mapping

| Milestone | Data model work |
|---|---|
| M1 | Envelope, `GameState`, calendar, RNG, save version |
| M2 | Player, destination, route, character, market, dialogue basics |
| M5 | Full time model, phases, `DayContext`, facts, propagation, rumours |
| M6 | Characters, fame, position, reaction rules, arcs, lineages, memory |
| M7 | Culture, language, religion, cultural works, factions, economy, currency |
| M8 | Studio inspection, coverage, continuity, data-completeness checks |
| M9–M14 | Region packs: destinations, routes, waypoints, cast, factions, works |
| M15–M17 | Fates, migrations, descendants, inherited objects and stories |
| M18–M19 | Localisation, asset manifests, save compatibility |

The slice implements a subset. It must use the same shape, so scale work is extension,
not replacement.
