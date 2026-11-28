/**
 * Authored content schemas.
 *
 * Content is JSON validated by Zod (ADR-0002). These schemas are the single source of
 * truth for both the runtime registry and `pnpm content:lint` — there is no second set
 * of rules.
 */

import { z } from 'zod'

import { conditionSchema } from '../dsl'
import { effectSchema, TREATMENT_TAGS } from '../dsl'
import { splitBeats } from '../text/beats'

export const PROVENANCE_CONFIDENCES = [
  'documented',
  'strongly-supported',
  'plausible',
  'fictional',
  'unresolved',
] as const
export type ProvenanceConfidence = (typeof PROVENANCE_CONFIDENCES)[number]

export const ProvenanceSchema = z
  .object({
    confidence: z.enum(PROVENANCE_CONFIDENCES),
    sources: z.array(z.string()),
    notes: z.string().optional(),
  })
  .strict()

/** Fields every authored entity carries (`docs/DATA_MODEL.md` §2). */
const envelope = {
  id: z.string().min(1),
  pack: z.string().min(1).optional(),
  contentVersion: z.int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  provenance: ProvenanceSchema,
}

// --- world ----------------------------------------------------------------

export const ClimateSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    notes: z.string().optional(),
  })
  .strict()

export const CultureSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    /** How people address a stranger, a guest, a superior. */
    address: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .strict()

export const LanguageSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    family: z.string().optional(),
    script: z.string().optional(),
    trade: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .strict()

export const FactionSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    type: z.enum(['court', 'temple', 'household', 'guild', 'army', 'cult', 'community']),
    interests: z.array(z.string()),
    description: z.string().optional(),
  })
  .strict()

/**
 * A schematic line on a map sketch: a ridge, a river, or the edge of what a region's
 * sketch knows. Presentation data, not geography, and never a political claim.
 */
export const MapFeatureSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['river', 'mountains', 'border']),
    points: z
      .array(z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).strict())
      .min(2),
  })
  .strict()

export const RegionSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    climate: z.string().optional(),
    cultures: z.array(z.string()),
    languages: z.array(z.string()),
    destinations: z.array(z.string()).optional(),
    routes: z.array(z.string()).optional(),
    /** Schematic map centre and radius, 0–100. Presentation data, not geography. */
    mapPosition: z
      .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .strict()
      .optional(),
    mapRadius: z.number().min(1).max(50).optional(),
    /** Schematic ridges, rivers and border lines. Presentation data, not geography. */
    mapFeatures: z.array(MapFeatureSchema).optional(),
  })
  .strict()

export const MarketEntrySchema = z
  .object({
    item: z.string().min(1),
    basePrice: z.int().min(1),
    /**
     * A story-priced good: this exact price is charged and paid in every local state and
     * at every language tier, so a scene that quotes a number cannot be undercut by a
     * festival multiplier or haggling. Use it for goods whose price is in the prose.
     */
    fixedPrice: z.int().min(1).optional(),
    stock: z.int().min(0),
  })
  .strict()

export const DestinationMarketSchema = z
  .object({
    /** Multiplied into every base price. Authored band, not a simulation. */
    priceModifier: z.number().min(0.1).max(10),
    goods: z.array(MarketEntrySchema),
    /**
     * This harbour's own picture for a good, where the local craft looks different.
     * A good without an override keeps its general picture from the pack.
     */
    art: z.record(z.string().min(1), z.string().min(1)).optional(),
  })
  .strict()

/** The verbs a place can offer. A place without an action is a place to stand, not a menu. */
export const PLACE_ACTIONS = ['trade', 'passage'] as const
export const PlaceActionSchema = z.enum(PLACE_ACTIONS)

/**
 * A place within a destination: the market, the harbor, the temple. This is the unit of
 * arrival and presence; its `cast` is a subset of its destination's cast.
 */
export const PlaceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(['market', 'harbour', 'palace', 'temple', 'quarter', 'workshop', 'archive']),
    description: z.string().min(1),
    /** Exploratory illustration ID (`docs/ASSETS.md` §3). Presentation only. */
    art: z.string().min(1).optional(),
    /**
     * People assigned to this place. Must be a subset of the destination's cast; someone
     * present at the destination but assigned nowhere is shown under Elsewhere.
     */
    cast: z.array(z.string()).optional(),
    /** Actions the place actually affords; never a placeholder for an unwritten mechanic. */
    actions: z.array(PlaceActionSchema).optional(),
    /** Position on the local sketch, 0–100. Presentation data, not geography. */
    mapPosition: z
      .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .strict()
      .optional(),
  })
  .strict()

export const EncounterEntrySchema = z
  .object({
    event: z.string().min(1),
    weight: z.number().min(0),
  })
  .strict()

export const DestinationSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    kind: z.enum(['city', 'port', 'village', 'shrine', 'camp', 'ruin', 'quarter']),
    /** Exploratory illustration ID (`docs/ASSETS.md` §3). Presentation only. */
    art: z.string().min(1).optional(),
    region: z.string().min(1),
    intro: z.string().min(1),
    /** One illustration per introductory beat; the hero remains the place's own picture. */
    beatArt: z.array(z.string().min(1)).min(1).optional(),
    cultures: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    /**
     * Descriptive: what people here weigh when they value a thing. Never a second purse —
     * prices and the traveller's money stay in weighed silver (ADR-0009).
     */
    currency: z.string().optional(),
    /** Schematic map position, 0–100 on each axis. Presentation data, not geography. */
    mapPosition: z
      .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .strict()
      .optional(),
    institutions: z.array(z.string()).optional(),
    cast: z.array(z.string()),
    places: z.array(PlaceSchema),
    /**
     * A daytime pool. It is drawn after exactly one day spent here, by authored weight
     * and cooldown; major events are never drawn from it. Ambient copy is separate.
     */
    day: z
      .object({
        events: z.array(EncounterEntrySchema),
      })
      .strict()
      .optional(),
    /**
     * The place after dark: its own picture and passage, and the encounters that may
     * find the traveller there when a day ends. One fires per night, by authored weight;
     * major events are never drawn here. The night itself is presentation, not state.
     */
    night: z
      .object({
        art: z.string().min(1).optional(),
        text: z.string().min(1),
        /** One illustration per night beat. */
        beatArt: z.array(z.string().min(1)).min(1).optional(),
        events: z.array(EncounterEntrySchema),
      })
      .strict()
      .optional(),
    market: DestinationMarketSchema,
    routes: z.array(z.string()),
    /** Local conditions that alter the place: tense, festival, flooded, ... */
    /** Fired when the player first steps ashore here (and at the start of a new game). */
    onArrival: z.string().min(1).optional(),
    states: z.array(z.string()).optional(),
    /**
     * What an active local state means for the traveller, in plain language. A tag such
     * as "tense" is a mood, not an explanation; this is the sentence under it.
     */
    stateNotes: z.record(z.string().min(1), z.string().min(1)).optional(),
    /** Authored price pressure while a local state is active. */
    stateModifiers: z
      .array(
        z
          .object({
            state: z.string().min(1),
            multiplier: z.number().min(0.1).max(10),
            categories: z.array(z.string()).optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict()

export const TravelModeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    days: z.int().min(1),
    baseCost: z.int().min(0),
    capacity: z.int().min(1),
    /** The stamina one departure costs. Omitted means a gentle mode. */
    exertion: z.int().min(0).optional(),
    /** Grain the passage eats before it begins. Omitted means none. */
    provisions: z.int().min(0).optional(),
    /** Added to the route's hazard chance for this way of travelling. */
    hazardModifier: z.int().min(-50).max(50).optional(),
    description: z.string().min(1),
  })
  .strict()

/** An ordered leg of a corridor: the between-space a route crosses. */
export const RouteSegmentSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(['coast', 'open-water', 'approach', 'road', 'river', 'pass']),
    days: z.int().min(1).optional(),
    notes: z.string().min(1).optional(),
  })
  .strict()

/** A place along the route, optionally carrying an authored stop event. */
export const RouteWaypointSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(['anchorage', 'shrine', 'ford', 'pass', 'camp', 'ruin', 'calm', 'checkpoint']),
    afterDays: z.int().min(1),
    description: z.string().min(1),
    event: z.string().min(1).optional(),
  })
  .strict()

export const ROUTE_RISKS = ['low', 'moderate', 'high'] as const

/** One authored scene a road hazard can resolve into. */
export const HazardOutcomeSchema = z
  .object({
    event: z.string().min(1),
    weight: z.number().min(0),
    /** Reads in the risk note; not a rule by itself. */
    kind: z.enum(['rescue', 'setback', 'grave']).optional(),
  })
  .strict()

/** The seeded chance that a road tests the traveller, and the scenes it can become. */
export const RouteHazardSchema = z
  .object({
    /** Base percent before knowledge, language, ties, health and world pressure. */
    baseChance: z.int().min(0).max(100),
    outcomes: z.array(HazardOutcomeSchema).min(1),
  })
  .strict()

export const RouteSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    kind: z.enum(['sea', 'river', 'road', 'pass', 'canyon', 'desert', 'steppe', 'coastal']),
    from: z.string().min(1),
    to: z.string().min(1),
    segments: z.array(RouteSegmentSchema).min(1).optional(),
    waypoints: z.array(RouteWaypointSchema).optional(),
    risk: z.enum(ROUTE_RISKS).optional(),
    modes: z.array(TravelModeSchema).min(1),
    /** What the traveller must satisfy before departure. */
    requirements: conditionSchema.optional(),
    /** Authored closure rule, evaluated when the route is read. */
    closedWhen: conditionSchema.optional(),
    encounters: z.array(EncounterEntrySchema),
    encountersPerJourney: z.object({ min: z.int().min(0), max: z.int().min(0) }).strict(),
    /** Shown when a traveller does not satisfy `requirements`. */
    requirementsNote: z.string().optional(),
    /** Shown when the route is closed. */
    closureNote: z.string().optional(),
    /** The scene shown if exertion leaves the traveller with nothing in reserve. */
    exhaustionDialogue: z.string().min(1).optional(),
    /** A road's own chance of trouble, resolved once per journey. */
    hazard: RouteHazardSchema.optional(),
  })
  .strict()

export const GoodSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    /** Thumbnail for the market and cargo lists (`docs/ASSETS.md` §3). Presentation only. */
    art: z.string().min(1),
    category: z.enum([
      'food',
      'textile',
      'metal',
      'timber',
      'ceramic',
      'luxury',
      'aromatic',
      'livestock',
      'tool',
      'writing',
    ]),
    weight: z.int().min(0),
    fragile: z.boolean().optional(),
    perishable: z.boolean().optional(),
    description: z.string().optional(),
  })
  .strict()

export const AFFLICTION_KINDS = [
  'thirst',
  'hunger',
  'wound',
  'fever',
  'poison',
  'curse',
] as const

/**
 * A lasting condition on the traveller, not a meter. It is cured by an authored tag:
 * `town`, `rest`, `water`, `healer`, `antidote`, `shrine`. A scene or place applies the
 * tag; it never edits state directly.
 */
export const AfflictionSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    kind: z.enum(AFFLICTION_KINDS),
    severity: z.enum(['light', 'grave']),
    description: z.string().min(1),
    /** Tags that remove it. At least one, so every affliction has a remedy. */
    treatments: z.array(z.enum(TREATMENT_TAGS)).min(1),
    /** Plain-language hint for the Status screen. */
    remedyNote: z.string().min(1).optional(),
    /** What a day with this condition feels like, shown in the daily report. */
    daily: z.string().min(1).optional(),
    /** How it arrives; shown on the day the condition first appears. */
    onset: z.string().min(1).optional(),
    /** How it lifts; shown on the day it is treated. */
    recovery: z.string().min(1).optional(),
  })
  .strict()

// --- people ---------------------------------------------------------------

/**
 * A character's want is a scene hook, not a mood. `scene` names the dialogue that puts
 * the want under pressure; `stake` says what it costs them to lose it. The slice's
 * recurring cast must use this shape, and `pnpm model:check` proves the scene exists.
 */
export const CharacterWantSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    stake: z.string().min(1),
    scene: z.string().min(1),
  })
  .strict()

/** How a character sounds, in rules a linter can read. */
export const CharacterVoiceSchema = z
  .object({
    register: z.string().min(1),
    address: z.array(z.string()).optional(),
    tics: z.array(z.string()).optional(),
    avoid: z.array(z.string()).optional(),
    /** The longest sentence this character would say, in words. Checked by `prose:lint`. */
    maxSentenceWords: z.int().min(6).max(80).optional(),
    sampleLines: z.array(z.string().min(1)).min(3).max(3),
  })
  .strict()

export const CharacterTieSchema = z
  .object({
    character: z.string().min(1),
    kind: z.enum(['kin', 'patron', 'debtor', 'rival', 'neighbor']),
  })
  .strict()

export const CharacterKnowledgeSchema = z
  .object({
    fact: z.string().min(1),
    belief: z.enum(['believed', 'doubted', 'disbelieved']).optional(),
  })
  .strict()

export const CharacterSchema = z
  .object({
    ...envelope,
    name: z.string().min(1),
    pronunciation: z.string().optional(),
    /** Exploratory portrait ID (`docs/ASSETS.md` §3). Presentation only. */
    art: z.string().min(1).optional(),
    culture: z.string().optional(),
    languages: z.array(z.string()),
    home: z.string().min(1),
    tier: z.enum(['major', 'recurring', 'local', 'ambient']),
    roles: z.array(z.string()),
    dialogue: z.string().optional(),
    /** A different conversation in a given destination, for characters who travel. */
    dialogueByDestination: z.record(z.string(), z.string()).optional(),
    /** Object wants for the recurring cast; plain strings remain valid for walk-ons. */
    wants: z.array(z.union([z.string().min(1), CharacterWantSchema])).optional(),
    fears: z.array(z.string()).optional(),
    contradiction: z.string().optional(),
    voice: CharacterVoiceSchema.optional(),
    ties: z.array(CharacterTieSchema).optional(),
    knowledge: z.array(CharacterKnowledgeSchema).optional(),
    /** Scenes this character appears in, for coverage; checked by `model:check`. */
    appearances: z.array(z.string()).optional(),
    /** Destinations where this character can be met. */
    presence: z.array(z.string()).optional(),
  })
  .strict()

// --- narrative content ----------------------------------------------------

export const EventScopeSchema = z
  .object({
    regions: z.array(z.string()).optional(),
    destinations: z.array(z.string()).optional(),
    routes: z.array(z.string()).optional(),
  })
  .strict()

export const FollowUpSchema = z
  .object({
    event: z.string().min(1),
    inDays: z.int().min(0).optional(),
  })
  .strict()

export const EventSchema = z
  .object({
    ...envelope,
    kind: z.enum(['world', 'regional', 'local', 'character', 'storylet']),
    title: z.string().min(1),
    description: z.string().optional(),
    scope: EventScopeSchema.optional(),
    conditions: conditionSchema,
    priority: z.int(),
    major: z.boolean(),
    once: z.boolean().optional(),
    cooldownDays: z.int().min(0).optional(),
    scene: z.string().optional(),
    cast: z.array(z.string()).optional(),
    effects: z.array(effectSchema),
    journal: z.string().nullable().optional(),
    followUps: z.array(FollowUpSchema).optional(),
  })
  .strict()

/**
 * One short piece of time-of-day copy. Ambient observations are presentation only: they
 * never change state, fire scenes or assert world truth. The seed and date choose one;
 * the player never has to answer a card to get on with the day.
 */
export const AMBIENT_CONTEXTS = ['day', 'night', 'travel'] as const
export type AmbientContext = (typeof AMBIENT_CONTEXTS)[number]

export const AmbientObservationSchema = z
  .object({
    ...envelope,
    context: z.enum(AMBIENT_CONTEXTS),
    /** Cultures whose people would say this. At least one is required. */
    cultures: z.array(z.string()).min(1),
    scope: EventScopeSchema.optional(),
    conditions: conditionSchema.optional(),
    weight: z.number().min(0),
    /** Used to avoid the same tone twice in a row. */
    tags: z.array(z.string()).optional(),
    text: z.string().min(1),
    /** One plate per prose beat. Ambient copy is short by design. */
    beatArt: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((entry, ctx) => {
    const beats = splitBeats(entry.text).length
    if (beats > 2) {
      ctx.addIssue({ code: 'custom', message: 'ambient copy may have at most two beats', path: ['text'] })
    }
    if (entry.beatArt.length !== beats) {
      ctx.addIssue({
        code: 'custom',
        message: `beatArt has ${entry.beatArt.length} plates for ${beats} prose beats`,
        path: ['beatArt'],
      })
    }
  })

/**
 * What an answer does dramatically. A scene of pure probing reads as an interview; the
 * model check requires at least one answer that reveals, bargains, helps, refuses, costs
 * or deflects. The tag is authored, never inferred from the text.
 */
export const CHOICE_INTENTS = [
  'probe',
  'reveal',
  'bargain',
  'help',
  'refuse',
  'deflect',
  'cost',
] as const
export type ChoiceIntent = (typeof CHOICE_INTENTS)[number]

/**
 * The scene's dramatic contract. Prose cannot be checked for quality, but a scene that
 * cannot name its goal, obstacle, turn and stakes is structurally shallow. Required on
 * recurring and major graphs; the editor can still show a walk-on without one.
 */
export const SceneContractSchema = z
  .object({
    goal: z.string().min(1),
    obstacle: z.string().min(1),
    turn: z.string().min(1),
    stakes: z.string().min(1),
    /** The character want this scene puts under pressure, by id. */
    want: z.string().min(1).optional(),
    /** The earlier fact this scene answers: `flag:`, `journal:`, `deed:` or `relationship:`. */
    callback: z.string().min(1).optional(),
  })
  .strict()

export const DialogueChoiceSchema = z
  .object({
    /** Stable, human-readable id within the node. Scenarios address choices by it. */
    id: z.string().min(1).optional(),
    /** Dramatic function, used by `model:check` to reject interview-only scenes. */
    intent: z.enum(CHOICE_INTENTS).optional(),
    text: z.string().min(1),
    conditions: conditionSchema.optional(),
    effects: z.array(effectSchema).optional(),
    /** `null` or omitted ends the conversation. */
    next: z.string().nullable().optional(),
    /** Optional journal entry added when the choice is taken. */
    journal: z.string().optional(),
    /** Why this answer is unavailable, written for the player. */
    unavailableNote: z.string().min(1).optional(),
    /** Hide a secret answer entirely when its conditions fail; public locks stay visible. */
    hiddenWhenUnavailable: z.boolean().optional(),
  })
  .strict()

export const DialogueNodeSchema = z
  .object({
    text: z.string().min(1),
    textByLanguage: z.record(z.string(), z.record(z.string(), z.string())).optional(),
    /** Exploratory illustration ID for this beat (`docs/ASSETS.md` §3). Presentation only. */
    art: z.string().min(1).optional(),
    /** One illustration per prose beat, in order. Every beat must name its own plate. */
    beatArt: z.array(z.string().min(1)).min(1).optional(),
    choices: z.array(DialogueChoiceSchema),
    /** Another graph to enter when the choices resolve. */
    nextDialogue: z.string().optional(),
  })
  .strict()
  .superRefine((node, ctx) => {
    if (node.beatArt) {
      const beats = splitBeats(node.text).length
      if (node.beatArt.length !== beats) {
        ctx.addIssue({
          code: 'custom',
          message: `beatArt has ${node.beatArt.length} plates for ${beats} prose beats`,
          path: ['beatArt'],
        })
      }
    }
    for (const [language, variants] of Object.entries(node.textByLanguage ?? {})) {
      for (const [tier, text] of Object.entries(variants)) {
        const beats = splitBeats(text).length
        const plates = node.beatArt?.length ?? 0
        if (node.beatArt && plates !== beats) {
          ctx.addIssue({
            code: 'custom',
            message: `beatArt has ${plates} plates for ${beats} beats in ${language}/${tier}`,
            path: ['textByLanguage', language, tier],
          })
        }
      }
    }
    const ids = node.choices.flatMap((choice) => (choice.id ? [choice.id] : []))
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'choice ids must be unique within a node' })
    }
  })

export const DialogueSchema = z
  .object({
    ...envelope,
    speaker: z.string().optional(),
    start: z.string().min(1),
    /** The scene's dramatic contract; required for recurring and major dialogue. */
    scene: SceneContractSchema.optional(),
    /**
     * Alternate openings, first match wins. This is how a character remembers an earlier
     * scene: after the player has done something, the conversation opens elsewhere.
     */
    entries: z
      .array(z.object({ when: conditionSchema, node: z.string().min(1) }).strict())
      .optional(),
    nodes: z.record(z.string(), DialogueNodeSchema),
  })
  .strict()

export const JournalSchema = z
  .object({
    ...envelope,
    title: z.string().min(1),
    text: z.string().min(1),
    /** One illustration per prose beat, in order. */
    beatArt: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict()

/**
 * The shelves of the codex, in the order a reader meets them. A closed list: an entry
 * that belongs nowhere is a sign the content needs a shelf, not a free-text label.
 */
export const CODEX_CATEGORIES = ['place', 'people', 'language', 'road', 'measure'] as const

export const CodexCategorySchema = z.enum(CODEX_CATEGORIES)

export const CodexSchema = z
  .object({
    ...envelope,
    title: z.string().min(1),
    text: z.string().min(1),
    /** One illustration per prose beat, in order. */
    beatArt: z.array(z.string().min(1)).min(1).optional(),
    /** Which shelf of the codex the entry sits on (`docs/CONTENT.md` §10). */
    category: CodexCategorySchema,
    unlockedBy: conditionSchema.optional(),
  })
  .strict()

// --- pack manifest --------------------------------------------------------

export const ManifestSchema = z
  .object({
    id: z.string().min(1),
    contentVersion: z.int().min(1),
    requires: z.array(z.string()),
    /** Folder name to the entity IDs it declares. */
    entities: z.record(z.string(), z.array(z.string())),
  })
  .strict()

export type Provenance = z.infer<typeof ProvenanceSchema>
export type ClimateDef = z.infer<typeof ClimateSchema>
export type CultureDef = z.infer<typeof CultureSchema>
export type LanguageDef = z.infer<typeof LanguageSchema>
export type FactionDef = z.infer<typeof FactionSchema>
export type RegionDef = z.infer<typeof RegionSchema>
export type MapFeatureDef = z.infer<typeof MapFeatureSchema>
export type MarketEntry = z.infer<typeof MarketEntrySchema>
export type DestinationMarket = z.infer<typeof DestinationMarketSchema>
export type PlaceDef = z.infer<typeof PlaceSchema>
export type PlaceAction = z.infer<typeof PlaceActionSchema>
export type DestinationDef = z.infer<typeof DestinationSchema>
export type TravelModeDef = z.infer<typeof TravelModeSchema>
export type RouteHazardDef = z.infer<typeof RouteHazardSchema>
export type HazardOutcomeDef = z.infer<typeof HazardOutcomeSchema>
export type RouteSegmentDef = z.infer<typeof RouteSegmentSchema>
export type RouteWaypointDef = z.infer<typeof RouteWaypointSchema>
export type RouteDef = z.infer<typeof RouteSchema>
export type GoodDef = z.infer<typeof GoodSchema>
export type AfflictionDef = z.infer<typeof AfflictionSchema>
export type CharacterDef = z.infer<typeof CharacterSchema>
export type EventDef = z.infer<typeof EventSchema>
export type AmbientObservationDef = z.infer<typeof AmbientObservationSchema>
export type DialogueChoiceDef = z.infer<typeof DialogueChoiceSchema>
export type DialogueNodeDef = z.infer<typeof DialogueNodeSchema>
export type DialogueDef = z.infer<typeof DialogueSchema>
export type JournalDef = z.infer<typeof JournalSchema>
export type CodexDef = z.infer<typeof CodexSchema>
export type CodexCategory = z.infer<typeof CodexCategorySchema>
export type Manifest = z.infer<typeof ManifestSchema>

/** Folder name to schema. The loader and the linter both use this table. */
export const ENTITY_SCHEMAS = {
  climates: ClimateSchema,
  cultures: CultureSchema,
  languages: LanguageSchema,
  factions: FactionSchema,
  regions: RegionSchema,
  destinations: DestinationSchema,
  routes: RouteSchema,
  goods: GoodSchema,
  afflictions: AfflictionSchema,
  characters: CharacterSchema,
  events: EventSchema,
  ambient: AmbientObservationSchema,
  dialogues: DialogueSchema,
  journal: JournalSchema,
  codex: CodexSchema,
} as const

export type EntityFolder = keyof typeof ENTITY_SCHEMAS

export type AnyEntity =
  | ClimateDef
  | CultureDef
  | LanguageDef
  | FactionDef
  | RegionDef
  | DestinationDef
  | RouteDef
  | GoodDef
  | AfflictionDef
  | CharacterDef
  | EventDef
  | AmbientObservationDef
  | DialogueDef
  | JournalDef
  | CodexDef
