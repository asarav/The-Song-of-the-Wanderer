/**
 * `GameState` — the single persisted object.
 *
 * Partitioned by rate of change and ownership (ADR-0005): `meta`, `calendar`, `world`,
 * `player`, `knowledge`, `narrative`, `rng`. Entity shapes follow `docs/DATA_MODEL.md`.
 *
 * Rules this schema is responsible for:
 * - every field is JSON-serialisable (no Map, Set, Date, or class);
 * - derived values are never stored;
 * - the player-facing stores are `knowledge`, never `world` truth.
 *
 * The slice needs `world.destinationStates`, `world.routeStates`, `world.migrations`, and
 * `world.scheduled` because events author them (ADR-0007). Eras, region phases, and the
 * facts ledger arrive with save v2 in M5.
 */

import { z } from 'zod'

import { RNG_STREAMS } from '../rng'

export const LANGUAGE_TIERS = [
  'unfamiliar',
  'basic',
  'conversational',
  'fluent',
  'deep',
] as const
export type LanguageTier = (typeof LANGUAGE_TIERS)[number]

export const RELATIONSHIP_DIMENSIONS = [
  'trust',
  'affection',
  'obligation',
  'fear',
  'respect',
] as const
export type RelationshipDimension = (typeof RELATIONSHIP_DIMENSIONS)[number]

export const FACTION_DIMENSIONS = [
  'trust',
  'favour',
  'obligation',
  'standing',
  'suspicion',
] as const
export type FactionDimension = (typeof FACTION_DIMENSIONS)[number]

export const CHARACTER_STATUSES = [
  'alive',
  'missing',
  'dead',
  'displaced',
  'unknown',
] as const
export type CharacterStatus = (typeof CHARACTER_STATUSES)[number]

export const KNOWLEDGE_SOURCES = [
  'witnessed',
  'told',
  'document',
  'rumor',
  'inferred',
  'misremembered',
] as const
export type KnowledgeSource = (typeof KNOWLEDGE_SOURCES)[number]

export const BELIEFS = ['believed', 'doubted', 'disbelieved'] as const
export type Belief = (typeof BELIEFS)[number]

export const DEED_KINDS = [
  'traded',
  'helped',
  'refused',
  'learned',
  'preserved',
  'betrayed',
  'witnessed',
  'travelled',
] as const
export type DeedKind = (typeof DEED_KINDS)[number]

export const ROUTE_STATES = ['open', 'risky', 'closed', 'seasonal'] as const
export type RouteState = (typeof ROUTE_STATES)[number]

export const PRESENTATIONS = ['weathered', 'mercantile', 'formal'] as const
export type Presentation = (typeof PRESENTATIONS)[number]

/** A run's chosen pressure. Stored once, not per scene. */
export const DIFFICULTIES = ['gentle', 'wanderer', 'perilous'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const REPUTATION_BANDS = ['unknown', 'noted', 'trusted', 'honoured', 'suspect'] as const
export type ReputationBand = (typeof REPUTATION_BANDS)[number]

export const KNOWLEDGE_SPREADS = ['private', 'local', 'regional'] as const
export type KnowledgeSpread = (typeof KNOWLEDGE_SPREADS)[number]

export const ARC_VISIBILITIES = ['player-present', 'offscreen', 'reported'] as const
export type ArcVisibility = (typeof ARC_VISIBILITIES)[number]

/** Minimum and maximum value of every personal and faction dimension. */
export const DIMENSION_MIN = -5
export const DIMENSION_MAX = 5

/** The one light-survival track. It is not hunger, thirst and fatigue separately. */
export const STAMINA_MAX = 8

/** A cap on simultaneous afflictions, so a save cannot grow without bound. */
export const AFFLICTION_MAX = 12

const IdSchema = z.string().min(1)
const DaySchema = z.int().min(0)
const DimensionSchema = z.int().min(DIMENSION_MIN).max(DIMENSION_MAX)

// --- meta -----------------------------------------------------------------

export const MetaSchema = z
  .object({
    saveVersion: z.int().min(1),
    engineVersion: z.string().min(1),
    contentVersions: z.record(z.string(), z.int().min(0)),
    seed: z.string().min(1),
    /** The player's chosen pressure for this run. */
    difficulty: z.enum(DIFFICULTIES),
    /** Monotonic counter behind `CommandResult.events[].sequence`. */
    eventSequence: z.int().min(0),
  })
  .strict()

// --- calendar -------------------------------------------------------------

export const CalendarSchema = z.object({ day: DaySchema }).strict()

// --- world ----------------------------------------------------------------

export const MigrationRecordSchema = z
  .object({
    group: IdSchema,
    from: IdSchema,
    to: IdSchema,
    day: DaySchema,
    outcome: z.string().optional(),
  })
  .strict()

export const ScheduledEventSchema = z
  .object({
    event: IdSchema,
    dueDay: DaySchema,
    source: z.string().optional(),
  })
  .strict()

export const WorldSchema = z
  .object({
    destinationStates: z.record(z.string(), z.array(z.string())),
    routeStates: z.record(z.string(), z.enum(ROUTE_STATES)),
    migrations: z.array(MigrationRecordSchema),
    scheduled: z.array(ScheduledEventSchema),
  })
  .strict()

// --- player ---------------------------------------------------------------

export const CargoEntrySchema = z
  .object({
    item: IdSchema,
    quantity: z.int().min(1),
    protected: z.boolean().optional(),
    /**
     * Total silver paid for the quantity still carried. Omitted means known zero (a
     * gift or starting cargo); `null` means the save predates cost tracking.
     */
    costBasis: z.int().min(0).nullable().optional(),
  })
  .strict()

export const LanguageStateSchema = z
  .object({
    xp: z.int().min(0),
    tier: z.enum(LANGUAGE_TIERS),
  })
  .strict()

export const DeedKnowledgeSchema = z
  .object({
    fact: IdSchema,
    spread: z.enum(KNOWLEDGE_SPREADS),
  })
  .strict()

export const DeedRecordSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(DEED_KINDS),
    day: DaySchema,
    place: IdSchema,
    subject: IdSchema,
    witnesses: z.array(IdSchema),
    knowledge: z.array(DeedKnowledgeSchema),
    consequence: z.string().optional(),
  })
  .strict()

export const IdentitySchema = z
  .object({
    selfName: z.string().min(1),
    presentation: z.enum(PRESENTATIONS),
    background: z.array(IdSchema),
    localNames: z.record(z.string(), z.array(z.string())),
  })
  .strict()

/** A lasting consequence on the traveller, cured by an authored treatment tag. */
export const AfflictionStateSchema = z
  .object({
    id: IdSchema,
    sinceDay: DaySchema,
    source: z.string().optional(),
  })
  .strict()

export const PlayerSchema = z
  .object({
    identity: IdentitySchema,
    /** A destination ID while at a place, a route ID while travelling. */
    location: IdSchema,
    money: z.int().min(0),
    inventory: z.array(CargoEntrySchema),
    capacity: z.int().min(1),
    stamina: z.int().min(0).max(STAMINA_MAX),
    afflictions: z.array(AfflictionStateSchema).max(AFFLICTION_MAX),
    transport: IdSchema,
    languages: z.record(z.string(), LanguageStateSchema),
    deeds: z.array(DeedRecordSchema),
    reputation: z.record(z.string(), z.enum(REPUTATION_BANDS)),
    obligations: z.array(IdSchema),
    flags: z.record(z.string(), z.union([z.boolean(), z.int(), z.string()])),
  })
  .strict()

// --- knowledge ------------------------------------------------------------

export const KnowledgeEntrySchema = z
  .object({
    fact: IdSchema,
    learnedAt: DaySchema,
    source: z.enum(KNOWLEDGE_SOURCES),
    reliability: z.number().min(0).max(1),
    belief: z.enum(BELIEFS),
    detail: z.string().optional(),
  })
  .strict()

export const KnownCharacterEntrySchema = z
  .object({
    name: z.string().min(1),
    lastSeen: z.object({ day: DaySchema, location: IdSchema }).strict().optional(),
    status: z.enum(CHARACTER_STATUSES).optional(),
    notes: z.array(z.string()).optional(),
  })
  .strict()

export const KnowledgeSchema = z
  .object({
    entries: z.array(KnowledgeEntrySchema),
    knownRoutes: z.array(IdSchema),
    knownDestinations: z.array(IdSchema),
    characterIndex: z.record(z.string(), KnownCharacterEntrySchema),
    journalEntries: z.array(IdSchema),
  })
  .strict()

// --- narrative ------------------------------------------------------------

export const RelationshipSchema = z
  .object({
    trust: DimensionSchema,
    affection: DimensionSchema,
    obligation: DimensionSchema,
    fear: DimensionSchema,
    respect: DimensionSchema,
  })
  .strict()

export const FactionStateSchema = z
  .object({
    trust: DimensionSchema,
    favour: DimensionSchema,
    obligation: DimensionSchema,
    standing: DimensionSchema,
    suspicion: DimensionSchema,
    phase: z.string().optional(),
  })
  .strict()

export const ArcStateSchema = z
  .object({
    arc: IdSchema,
    owner: IdSchema,
    current: IdSchema,
    flags: z.record(z.string(), z.union([z.boolean(), z.int(), z.string()])),
    lastAdvanced: DaySchema,
    visibility: z.enum(ARC_VISIBILITIES),
    stranded: z.boolean(),
  })
  .strict()

export const CharacterStateSchema = z
  .object({
    status: z.enum(CHARACTER_STATUSES),
    /** A destination ID, `travelling`, or `unknown`. */
    location: IdSchema,
    age: z.union([z.int().min(0), z.literal('unknown')]),
    relationships: z.record(z.string(), RelationshipSchema),
    flags: z.record(z.string(), z.union([z.boolean(), z.int(), z.string()])),
    lastSeenByPlayer: z.object({ day: DaySchema, location: IdSchema }).strict().optional(),
    nameUsedByPlayer: z.array(z.string()).optional(),
  })
  .strict()

export const PendingSceneSchema = z
  .object({
    kind: z.literal('dialogue'),
    dialogue: IdSchema,
    node: IdSchema,
    event: IdSchema.optional(),
  })
  .strict()

export const JourneySlotSchema = z
  .object({
    /** Absolute day the slot falls on. */
    atDay: DaySchema,
    event: IdSchema,
  })
  .strict()

export const JourneySchema = z
  .object({
    route: IdSchema,
    mode: IdSchema,
    origin: IdSchema,
    destination: IdSchema,
    departedAt: DaySchema,
    arrivesAt: DaySchema,
    slots: z.array(JourneySlotSchema),
    nextSlot: z.int().min(0),
  })
  .strict()

export const NarrativeSchema = z
  .object({
    arcStates: z.record(z.string(), ArcStateSchema),
    characterStates: z.record(z.string(), CharacterStateSchema),
    relationships: z.record(z.string(), RelationshipSchema),
    factions: z.record(z.string(), FactionStateSchema),
    pending: PendingSceneSchema.nullable(),
    journey: JourneySchema.nullable(),
    storyletCooldowns: z.record(z.string(), DaySchema),
  })
  .strict()

// --- rng ------------------------------------------------------------------

/**
 * One integer per stream. Written explicitly so a missing stream is a validation error;
 * `rng.test.ts` asserts these keys match `RNG_STREAMS`.
 */
export const RngSchema = z
  .object({
    market: z.int(),
    encounters: z.int(),
    travel: z.int(),
    hazard: z.int(),
    flavour: z.int(),
    narrative: z.int(),
    tests: z.int(),
  })
  .strict()

// --- the state ------------------------------------------------------------

export const GameStateSchema = z
  .object({
    meta: MetaSchema,
    calendar: CalendarSchema,
    world: WorldSchema,
    player: PlayerSchema,
    knowledge: KnowledgeSchema,
    narrative: NarrativeSchema,
    rng: RngSchema,
  })
  .strict()

export type Meta = z.infer<typeof MetaSchema>
export type Calendar = z.infer<typeof CalendarSchema>
export type WorldState = z.infer<typeof WorldSchema>
export type MigrationRecord = z.infer<typeof MigrationRecordSchema>
export type ScheduledEvent = z.infer<typeof ScheduledEventSchema>
export type CargoEntry = z.infer<typeof CargoEntrySchema>
export type AfflictionState = z.infer<typeof AfflictionStateSchema>
export type LanguageState = z.infer<typeof LanguageStateSchema>
export type DeedRecord = z.infer<typeof DeedRecordSchema>
export type Identity = z.infer<typeof IdentitySchema>
export type PlayerState = z.infer<typeof PlayerSchema>
export type KnowledgeEntry = z.infer<typeof KnowledgeEntrySchema>
export type KnownCharacterEntry = z.infer<typeof KnownCharacterEntrySchema>
export type KnowledgeState = z.infer<typeof KnowledgeSchema>
export type Relationship = z.infer<typeof RelationshipSchema>
export type FactionState = z.infer<typeof FactionStateSchema>
export type ArcState = z.infer<typeof ArcStateSchema>
export type CharacterRuntimeState = z.infer<typeof CharacterStateSchema>
export type PendingScene = z.infer<typeof PendingSceneSchema>
export type JourneySlot = z.infer<typeof JourneySlotSchema>
export type Journey = z.infer<typeof JourneySchema>
export type NarrativeState = z.infer<typeof NarrativeSchema>
export type RngStateValues = z.infer<typeof RngSchema>
export type GameState = z.infer<typeof GameStateSchema>

export { RNG_STREAMS }
