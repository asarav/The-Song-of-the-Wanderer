# Narrative systems: characters, arcs, lineages, storylets

How people and stories persist across a 300-year game.

Companion to `WORLD_MODEL.md`. Implementation lands in M6; M1–M4 must not contradict it.

## 1. Principles

1. **Characters are not content dispensers.** They have work, households, beliefs, and
   problems that exist before the player arrives.
2. **Time is visible in people.** They age, change status, move, marry, fail, die, and
   are remembered by descendants.
3. **Recurrence must be earned.** Every reappearance has a travel route, a reason, and a
   date that fits.
4. **Arcs are authored, not emergent.** We schedule and gate beats; we do not simulate
   lives.
5. **The player's absence matters.** Characters and arcs continue or decay when the
   player is elsewhere; the world does not wait at the edge of the screen.
6. **Memory is selective.** The journal, character index, and dialogue reflect what the
   protagonist knows, not the world's truth.

## 2. Character model

### 2.1 Definition (authored)

```ts
type CharacterDef = {
  id: CharacterId                  // char.<home>.<slug>
  name: string
  pronunciation?: string
  pronouns: PronounSet
  culture: CultureId
  languages: LanguageId[]
  home: DestinationId
  tier: 'major' | 'recurring' | 'local' | 'ambient'
  roles: RoleId[]                  // merchant, scribe, priestess, smith...
  household?: FamilyId
  position: { role: RoleId; rank?: RankId; institution?: FactionId }
  allegiances: AllegianceRef[]
  fame: Record<FameKey, number>    // region / faction / social stratum
  wants: string[]
  fears: string[]
  contradiction: string
  worldview: WorldviewRef
  brief: DossierRef                // docs/design/characters/<id>.md
  appearance: AppearanceRef
  voice: VoiceRef
  itinerary: ItineraryEntry[]
  arcs: ArcId[]
  knowledge: KnownFactRef[]        // what they know at introduction
  relationships: InitialRelationship[]
  reactionRules: ReactionRule[]
  provenance: Provenance
}
```

### 2.2 Runtime (saved)

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
  flags: Record<string, boolean | number | string>
  lastSeenByPlayer?: { day: Day; location: DestinationId }
  nameUsedByPlayer?: string[]       // local names and titles the player knows
  memory: CharacterMemory           // what they believe about the player
}
```

### 2.3 Tiers and budget

| Tier | Count per region | Appearance budget | Requirements |
|---|---|---|---|
| Major | 3–5 | 3+ scenes across 2+ acts | Arc with ≥1 resolution; family or household; possible descendant |
| Recurring | 8–15 | 2–4 appearances | Reason to travel; one relationship arc |
| Local | 20–40 | 1–2 scenes | Daily life, one want, one piece of knowledge |
| Ambient | pooled | 1 scene | Role, voice, one detail; no arc |

The cast budget is a design constraint, not a target. Coverage tooling reports characters
used once and never again, and characters used so often they become a tour guide.

### 2.4 Position, fame, and allegiance

A character's social data is not one role string:

- **Position** — household head, temple scribe, harbour official, guest, exile. It can
  change by phase or event.
- **Fame** — keyed by region, faction, and social stratum. A person can be famous in one
  city, unknown in the next, and notorious to one institution.
- **Allegiance** — a set of ties and obligations, not a team colour. Loyalty to a
  household, a debt to a temple, fear of a court, and affection for the player can coexist.
- **Worldview** — values, prejudices, taboos, and what they think is wrong with the world.
  It conditions dialogue and reactions.

### 2.5 Reaction rules

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
and the local `DayContext`. It may not improvise a response outside the authored
vocabulary. The canonical entity shapes are in `DATA_MODEL.md` §8.

## 3. Schedules, itineraries, and movement

A character's location is data, not improvisation.

```ts
type ItineraryEntry = {
  from: Day
  to?: Day
  location: DestinationId | 'at-sea' | 'on-road'
  reason: 'resident' | 'trade' | 'family' | 'exile' | 'pilgrimage' | 'posting' | 'captivity'
  route?: RouteId
  conditions?: Condition
}
```

Rules:

- Residents have a default entry covering their home phase; visitors have explicit
  entries.
- Any move between destinations must be reachable by a route in the time available. The
  recurrence auditor checks this.
- When the player arrives somewhere, eligible characters are those whose current
  itinerary places them there and whose status permits presence.
- A character may be `travelling`: visible on a route encounter if the player is on the
  same route in the same window.
- Displacement is authored: a migration record moves a household, not a teleport.
- No character follows the player without an authored reason tied to trade, patronage,
  family, or mission.

## 4. Arcs

### 4.1 Definition

```ts
type ArcDef = {
  id: ArcId
  owner: CharacterId | FamilyId
  title: string
  premise: string
  stakes: string
  beats: BeatDef[]
  branches: BranchDef[]
  resolutionStates: ResolutionState[]   // at least one must be reachable
  failureStates: ResolutionState[]      // at least one authored failure
  successor?: { character?: CharacterId; family?: FamilyId; apprentice?: CharacterId }
  provenance: Provenance
}

type BeatDef = {
  id: BeatId
  scene: SceneId
  conditions: Condition
  window?: { from: Day; to?: Day }
  priority: number
  optional: boolean
  once: boolean
  effects: Effect[]
  consequences: { onChoice: Record<ChoiceId, Effect[]> }
  next?: BeatId | BeatId[]
  cooldownDays?: number
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

The definition says what can happen next; the state says where the arc is, who owns it, and
whether it has stalled. A beat can resolve off-screen and arrive later as a letter, rumour,
changed status, or inherited obligation.

### 4.2 Director

The arc director runs on time advance, arrival, and after major events:

1. Collect beats whose conditions and windows are satisfied.
2. Exclude beats whose owner is dead, missing, or elsewhere without a plausible scene.
3. Exclude beats in cooldown; enforce one beat per character per day.
4. Do not interrupt an active scene; queue until the player is free.
5. Select by priority, then authored order, then seeded tie-break.
6. Apply effects; route choices; schedule follow-ups.
7. If an arc has no reachable resolution left, mark it `stranded` and surface it in the
   coverage report — never leave it silently open.

Arcs do not require the player. A beat may resolve off-screen and be reported later
through a letter, a rumour, or a changed character state. The player learns what happened
through the knowledge model.

### 4.3 Branching

Branches are authored, not generated:

- **Choice branches** — the player's decision changes the next beat.
- **Presence branches** — whether the player was there at all.
- **Timing branches** — arriving before/after a window.
- **Relationship branches** — trust bands, not raw numbers.
- **World branches** — phase or local state.
- **Failure branches** — the arc can end badly, unresolved, or with someone else carrying
  it forward.

Every major arc must have at least one path that does not depend on the player, so a run
that misses it still produces a coherent world.

### 4.4 Successors

When an arc's owner dies or disappears, the arc may transfer to:

- a descendant with inherited stakes,
- an apprentice or colleague,
- a rival who now carries the obligation,
- a community or institution.

Successor transfer is authored in the arc definition. It is how family stories survive
time jumps without resurrecting characters.

## 5. Lineages and generations

Families make centuries legible.

```ts
type FamilyDef = {
  id: FamilyId
  name: string
  home: DestinationId
  generations: GenerationDef[]
  inheritance: InheritanceRule[]
}
```

Inheritance rules cover:

- a name or house name,
- a trade or workshop,
- a debt or obligation,
- an object (token, seal, letter, tool),
- a story about the protagonist,
- a relationship band with the player (usually reduced and reframed).

Generation rules:

- Descendants are authored, not generated, for anything that appears on screen.
- On a long time jump, the engine advances family generations and applies inheritance;
  authored descendants become eligible.
- A descendant may recognise the protagonist through a story, object, or family account —
  never through unexplained recognition.
- Intermarriage, adoption, and household membership are authored; no procedural family
  trees.

## 6. Recurrence and the auditor

Recurrence is an authored itinerary plus a feasibility check.

The recurrence auditor (M6, surfaced in M8) fails when:

- a character appears at a destination with no route and insufficient time since their
  last known location,
- a character appears while dead, missing, imprisoned, or displaced with no authored
  reason,
- a character appears in two places in the same window,
- a character's age is impossible for the date,
- a descendant appears before their birth window,
- a reappearance has no authored reason tag.

It also reports soft problems:

- the same character appears more than four times without an arc,
- a major character has no appearance after their introduction,
- an arc has no resolution reachable from any save state.

## 7. Recognition and names

Recognition is a rule, not a mood:

```ts
type RecognitionRule = {
  id: RecognitionId
  character: CharacterId
  basis: 'met-before' | 'family-story' | 'token' | 'name' | 'resemblance' | 'ritual'
  minYearsSinceMeeting?: number
  requires?: Condition
  outcome: 'recognises-person' | 'recognises-name' | 'mistakes-identity' | 'claims-divine'
  effects: Effect[]
}
```

Rules:

- Every recognition has a basis the player can eventually understand.
- A recognition may be wrong. Characters can mistake the protagonist for a figure from a
  story, a relative, or a god.
- No recognition confirms divinity. `claims-divine` is a character's claim, not a fact.
- The protagonist's local names are tracked per region in `nameUsedByPlayer`; using the
  right name changes dialogue, never gates the main path.
- Descendant recognition uses family stories and objects, not face memory.

## 8. Storylets and ambient life

Storylets keep the world inhabited between major beats.

```ts
type StoryletDef = {
  id: EventId
  pool: StoryletPoolId            // docks, market, temple, road, household, court...
  conditions: Condition
  weight: number
  priority: number
  cooldownDays: number
  oncePerRegion?: boolean
  tags: string[]                  // 'food', 'music', 'rumour', 'craft', 'grief'...
  scene: SceneId
  effects: Effect[]
}
```

Rules:

- Storylets never change regional phase, faction control, or major character status.
- They may add local colour, a small relationship change, a rumour, a recipe, a song, a
  story, or a minor favour.
- Pools are tagged so the director can avoid repeating the same tone three times in a row.
- Each destination should have pools for arrival, market, harbour/road, temple, and
  evening. Quiet vignettes are first-class storylets, not filler.
- A storylet may plant a seed for a later arc, but the payoff is a separate authored
  event.

## 9. Relationships

Keep dimensions small and legible:

| Dimension | Meaning | Shown as |
|---|---|---|
| trust | Will they believe or rely on you? | narrative bands |
| affection | Do they like you? | narrative bands |
| obligation | What do they owe or expect? | explicit promises |
| fear | Are they afraid of you? | narrative bands |
| respect | Do they value your judgement? | narrative bands |

Rules:

- Faction standing is separate from personal relationships (`WORLD_MODEL.md` §8).
- Promises and debts are explicit records with due dates, not hidden numbers.
- Decay is authored, not automatic: absence can cool a friendship only where a scene or
  event says so.
- Betrayal and forgiveness are events, not a meter crossing a threshold.

## 10. Character knowledge

Each character has a coarse belief model:

```ts
type CharacterMemory = {
  knows: KnownFactRef[]           // facts they have learned
  believes: { fact: FactId; value: string | boolean; confidence: number }[]
  aboutPlayer: {
    names: string[]
    deeds: { deed: string; witnessed: boolean; day: Day }[]
    suspicion: number
    reverence: number
  }
}
```

Use it for:

- dialogue conditions ("she has heard you helped the refugees"),
- rumours (a character repeats what they believe, not the truth),
- recognition and suspicion,
- faction reactions through their members.

Do not simulate every NPC's knowledge exhaustively. Author it for characters who matter
and use regional defaults for the rest.

## 11. Journal, index, and codex

- **Journal** — the protagonist's voice; may be incomplete, uncertain, or wrong. Entries
  are authored or generated from consequences, never auto-summarised from state.
- **Character index** — derived from player knowledge: last seen, known relationships,
  shared events, current status if known, rumours. Never reveals unlearned facts.
- **Map** — known, rumoured, and inaccessible destinations; route status only as known.
- **Codex** — optional context, short, phase-appropriate; never resolves deliberate
  ambiguity.

All four are read models over knowledge, not over world truth.

## 12. Continuity and narrative QA

The continuity checker (M8) enforces:

- no dead or missing character speaks or acts,
- no character in two places at once,
- ages consistent with dates,
- no scene before its prerequisites,
- no route used while closed or unknown,
- no language-dependent line above the player's tier,
- no arc left stranded without an authored failure state,
- no descendant before their birth window,
- no object in two places,
- no fact contradicted without an authored revision event.

Narrative QA also covers:

- cast heat (who is overused, who is orphaned),
- regional representation (ordinary life, not only elites),
- mystery discipline (no confirmation of divinity),
- tone (no grimdark drift, no exoticism),
- prose lint (anachronisms, repetition, readability).

## 13. Worked example: Amnit of Ugarit

A recurring merchant in the slice, extended across the full game.

| Phase | Amnit |
|---|---|
| Prologue (1230) | Mid-sized household; grain and oil contracts; wary of palace officials. Meets the player over a disputed cargo weight. |
| Act I (1220s) | Profits from coastal trade; introduces the player to a Cypriot copper buyer. Arc beat: whether to take a risky open-water contract. |
| Act II (1205) | Grain prices rise; a palace requisition ruins a contract. Player can lend money, find a new buyer, or advise her to leave. |
| Act III (1190s) | If helped: family flees to Cyprus with goods and a letter of introduction. If not: household splits; son stays, daughter leaves with nothing. |
| Act IV (1130) | If helped: her granddaughter runs a workshop in Cyprus and knows the player's local name from a family story. If not: a descendant is a harbour labourer who resents the name. |
| Act V (1040) | A family account of "the one who came before the ships stopped" appears in a Cypriot song. The player may correct or preserve it. |

This is the shape every major arc should take: a personal stake, a decision, a delayed
consequence, a generational echo, and a connection to the world model.

## 14. Authoring checklist

- [ ] Character brief in `docs/design/characters/` using the template.
- [ ] At least one want, one fear, one contradiction, one useful piece of knowledge.
- [ ] Itinerary with reasons, not just locations.
- [ ] Arc with a premise, ≥3 beats, ≥1 resolution, ≥1 failure.
- [ ] One possible non-player resolution.
- [ ] Reappearance basis and travel feasibility.
- [ ] Descendant or successor plan if the timeline outlives them.
- [ ] Recognition rules, if any, with a mundane basis.
- [ ] Knowledge: what they know, what they get wrong.
- [ ] Voice notes and three concrete details.
- [ ] Provenance tag.
