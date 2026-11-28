/**
 * The closed condition/effect vocabulary (ADR-0002).
 *
 * Content never contains code. It combines these atoms, and the engine evaluates them
 * deterministically. Adding an atom means adding one entry to a registry — never a new
 * branch inside `reduce`.
 */

import type { ZodType } from 'zod'

import type { RngCursor, RngStream } from '../rng'
import type {
  Belief,
  CharacterStatus,
  DeedKind,
  FactionDimension,
  GameState,
  KnowledgeSource,
  LanguageTier,
  RegardBand,
  RelationshipDimension,
} from '../state'
import type { DomainEvent } from '../kernel'

/**
 * The narrow slice of content the DSL is allowed to read. The content registry
 * implements it; the DSL therefore never imports the registry, and the registry can
 * import these schemas without a cycle.
 */
export interface DslContent {
  hasCharacter(id: string): boolean
  characterHome(id: string): string | undefined
  routeExists(id: string): boolean
  /** The authored rule that closes a route, if any. */
  routeClosedWhen(id: string): Condition | undefined
  /** Goods weight, used for capacity clamping. Unknown goods weigh 1. */
  itemWeight(id: string): number
  /** The treatment tags that cure an affliction. An unknown id has none. */
  afflictionTreatments(id: string): readonly string[]
}

export interface ConditionContext {
  state: GameState
  content: DslContent
  rng: RngCursor
}

export interface EffectContext extends ConditionContext {
  /** A mutable draft. The reducer owns the clone; effects never see the caller's state. */
  state: GameState
  events: DomainEvent[]
}

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { flag: string }
  | { languageAtLeast: { language: string; tier: LanguageTier } }
  | { relationship: { character: string; dimension?: RelationshipDimension; atLeast: number } }
  | { factionStanding: { faction: string; dimension?: FactionDimension; atLeast: number } }
  | { dateAfter: string }
  | { dateBefore: string }
  | { routeOpen: string }
  | { itemAtLeast: { item: string; quantity: number } }
  | { moneyAtLeast: number }
  | { characterAlive: string }
  | { characterAt: { character: string; destination: string } }
  | { hasJournalEntry: string }
  | { hasAffliction: string }
  /** A deed the traveller has actually done, optionally narrowed by kind or subject. */
  | { deed: { id?: string; kind?: DeedKind; subject?: string } }
  /** A topic this character has already been asked about. */
  | { topicAsked: { character: string; topic: string } }
  /** Something the traveller has learned, regardless of who told them. */
  | { knowsFact: string }
  /** The readable band a character's regard currently falls into. */
  | { regardBand: { character: string; band: RegardBand } }
  /** An explicit promise or debt that is still open. */
  | { promiseOpen: string }
  | { chance: { p: number; stream?: RngStream } }

export type Effect =
  | { money: number }
  /** Spends or restores the traveller's reserve; clamped to the stamina range. */
  | { stamina: number }
  /** Adds or removes a lasting affliction by id. */
  | { affliction: { id: string; add?: boolean; source?: string } }
  /** Removes every affliction whose authored treatments include this tag. */
  | { treatment: string }
  | { items: { item: string; quantity: number; cost?: number } }
  /** Removes the stated quantity from whichever cargo is actually in the hold. */
  | { loseCargo: { quantity: number } }
  | { advanceTime: { days: number } }
  | { relationship: { character: string; dimension?: RelationshipDimension; delta: number } }
  | { faction: { faction: string; dimension?: FactionDimension; delta: number } }
  | {
      promise: {
        id: string
        character: string
        kind: 'promise' | 'debt'
        owedBy: 'player' | 'character'
        text: string
        dueDay?: number
      }
    }
  | { settlePromise: { id: string; status?: 'settled' | 'broken' } }
  | { markTopic: { character: string; topic: string } }
  | { flag: string | { name: string; value: boolean | number | string } }
  | { schedule: { event: string; inDays: number } }
  | { journal: { entry: string } }
  | { languageXp: { language: string; amount: number } }
  | { moveCharacter: { character: string; to: string } }
  | { characterStatus: { character: string; status: CharacterStatus } }
  | { unlockRoute: string }
  | { closeRoute: string }
  | { destinationState: { destination: string; state: string; active?: boolean } }
  | { migration: { group: string; from: string; to: string; outcome?: string } }
  | { arc: { arc: string; beat: string; owner: string } }
  | {
      deed: {
        id: string
        kind: DeedKind
        subject: string
        witnesses?: string[]
        consequence?: string
      }
    }
  | {
      knowledge: {
        fact: string
        source?: KnowledgeSource
        reliability?: number
        belief?: Belief
        detail?: string
      }
    }

/** A handler pair. Payloads are `unknown` because the schema guarantees the shape. */
export interface ConditionAtom {
  schema: ZodType
  evaluate: (payload: unknown, ctx: ConditionContext) => boolean
}

export interface EffectAtom {
  schema: ZodType
  apply: (payload: unknown, ctx: EffectContext) => void
}
