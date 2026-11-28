/**
 * Domain events.
 *
 * Events describe what happened. They are the only input to journal updates, interface
 * notifications, and test assertions (`docs/ARCHITECTURE.md` §2). Shapes are stable:
 * adding a field is fine, renaming one is a breaking change for scenarios and tests.
 */

import type {
  Belief,
  CharacterStatus,
  KnowledgeSource,
  LanguageTier,
  RouteState,
} from '../state'

export type DomainEvent =
  | { type: 'TimeAdvanced'; days: number; day: number }
  | { type: 'MoneyChanged'; delta: number; money: number }
  | { type: 'StaminaChanged'; delta: number; stamina: number }
  | { type: 'AfflictionChanged'; id: string; active: boolean }
  | { type: 'Treated'; treatment: string; removed: string[] }
  | { type: 'ItemChanged'; item: string; delta: number; quantity: number }
  | {
      type: 'RelationshipChanged'
      character: string
      dimension: string
      delta: number
      value: number
    }
  /** The readable band moved, so a notice can say who noticed and how. */
  | { type: 'RegardChanged'; character: string; from: string; to: string }
  | { type: 'PromiseOpened'; id: string; character: string; kind: string; dueDay?: number }
  | { type: 'PromiseSettled'; id: string; character: string; status: string }
  | { type: 'TopicMarked'; character: string; topic: string }
  | { type: 'FactionChanged'; faction: string; dimension: string; delta: number; value: number }
  | { type: 'FlagSet'; name: string; value: boolean | number | string }
  | { type: 'EventScheduled'; event: string; dueDay: number }
  | { type: 'EventFired'; event: string }
  | { type: 'JournalEntryAdded'; entry: string }
  | {
      type: 'LanguageXpGained'
      language: string
      amount: number
      xp: number
      tier: LanguageTier
      tierChanged: boolean
    }
  | { type: 'CharacterMoved'; character: string; from: string; to: string }
  | { type: 'CharacterStatusChanged'; character: string; status: CharacterStatus }
  | { type: 'RouteStateChanged'; route: string; state: RouteState }
  | { type: 'DestinationStateChanged'; destination: string; state: string; active: boolean }
  | { type: 'MigrationRecorded'; group: string; from: string; to: string }
  | { type: 'ArcAdvanced'; arc: string; beat: string }
  | { type: 'DeedRecorded'; deed: string; kind: string; subject: string }
  | { type: 'KnowledgeLearned'; fact: string; source: KnowledgeSource; belief: Belief }
  | { type: 'EncounterPresented'; event: string }
  | { type: 'DialoguePresented'; dialogue: string; node: string }
  | { type: 'DialogueEnded'; dialogue: string }
  | { type: 'JourneyStarted'; route: string; mode: string; arrivesAt: number }
  | { type: 'HazardRolled'; route: string; mode: string; chance: number; roll: number }
  | { type: 'HazardTriggered'; route: string; event: string }
  | { type: 'JourneyArrived'; destination: string; day: number }
  | { type: 'JourneyCollapsed'; route: string; origin: string; day: number }
  | { type: 'TravelRejected'; reason: string }
  | {
      type: 'EffectClamped'
      effect: string
      requested: number
      applied: number
      reason: string
    }
  | { type: 'EffectSkipped'; effect: string; reason: string }
  | { type: 'ConditionLimitExceeded'; depth: number }

export interface SequencedEvent {
  /** Monotonic across the save, assigned by the reducer. */
  sequence: number
  event: DomainEvent
}

export function isEventOfType<T extends DomainEvent['type']>(
  event: DomainEvent,
  type: T,
): event is Extract<DomainEvent, { type: T }> {
  return event.type === type
}

/** The typed events of one kind, in sequence order. */
export function eventsOfType<T extends DomainEvent['type']>(
  events: readonly SequencedEvent[],
  type: T,
): Extract<DomainEvent, { type: T }>[] {
  return events.flatMap(({ event }) => (isEventOfType(event, type) ? [event] : []))
}
