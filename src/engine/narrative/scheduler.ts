/**
 * Scheduled events and eligibility.
 *
 * Scheduling is keyed by due day with a stable ID tie-break, so two saves of the same
 * run fire in the same order. Events may be date-driven, condition-driven, or chained by
 * another event's `schedule` effect (`docs/WORLD_MODEL.md` §3).
 */

import type { DslContent } from '../dsl'
import { evaluateCondition } from '../dsl'
import { applyEffects } from '../dsl'
import type { EventDef } from '../content'
import type { ContentIndex } from '../content'
import type { RngCursor } from '../rng'
import type { GameState, ScheduledEvent } from '../state'
import type { DomainEvent } from '../kernel'

export interface SchedulerContext {
  state: GameState
  index: ContentIndex
  content: DslContent
  rng: RngCursor
  events: DomainEvent[]
}

/** How many chained events may fire in one pass before we stop. */
const MAX_CHAIN = 64

export function lastFiredDay(state: GameState, eventId: string): number | undefined {
  return state.narrative.storyletCooldowns[eventId]
}

export function isOnCooldown(state: GameState, event: EventDef): boolean {
  const last = lastFiredDay(state, event.id)
  if (last === undefined) return false
  if (event.once) return true
  if (!event.cooldownDays) return false
  return state.calendar.day < last + event.cooldownDays
}

/** Where the player is: a destination ID, or a route ID while travelling. */
function playerScopeMatches(state: GameState, event: EventDef): boolean {
  const scope = event.scope
  if (!scope) return true

  const location = state.player.location
  const inDestinations = scope.destinations?.includes(location) ?? false
  const onRoute = scope.routes?.includes(location) ?? false
  const hasScope = Boolean(scope.destinations?.length || scope.routes?.length)
  if (!hasScope) return true
  return inDestinations || onRoute
}

export function isEligible(
  state: GameState,
  event: EventDef,
  content: DslContent,
  rng: RngCursor,
): boolean {
  if (isOnCooldown(state, event)) return false
  if (!playerScopeMatches(state, event)) return false
  return evaluateCondition(event.conditions, { state, content, rng })
}

export function dueScheduled(state: GameState): ScheduledEvent[] {
  return state.world.scheduled
    .filter((entry) => entry.dueDay <= state.calendar.day)
    .slice()
    .sort((a, b) => (a.dueDay === b.dueDay ? a.event.localeCompare(b.event) : a.dueDay - b.dueDay))
}

function removeScheduled(state: GameState, entry: ScheduledEvent): void {
  const index = state.world.scheduled.indexOf(entry)
  if (index >= 0) state.world.scheduled.splice(index, 1)
}

/** Apply an event's consequences. Shared by scheduled firing and encounter resolution. */
export function applyEvent(
  ctx: SchedulerContext,
  event: EventDef,
  options: { presentScene?: boolean } = {},
): { presented: boolean } {
  ctx.state.narrative.storyletCooldowns[event.id] = ctx.state.calendar.day
  ctx.events.push({ type: 'EventFired', event: event.id })

  applyEffects(event.effects, ctx)

  if (typeof event.journal === 'string') {
    if (!ctx.state.knowledge.journalEntries.includes(event.journal)) {
      ctx.state.knowledge.journalEntries.push(event.journal)
    }
    ctx.events.push({ type: 'JournalEntryAdded', entry: event.journal })
  }

  if (options.presentScene !== false && event.scene) {
    const dialogue = ctx.index.dialogues.get(event.scene)
    if (dialogue) {
      ctx.state.narrative.pending = {
        kind: 'dialogue',
        dialogue: dialogue.id,
        node: dialogue.start,
        event: event.id,
      }
      ctx.events.push({ type: 'DialoguePresented', dialogue: dialogue.id, node: dialogue.start })
      return { presented: true }
    }
  }

  return { presented: false }
}

/**
 * Fire everything due today, in stable order. A scene pauses the queue: the remaining
 * due events stay scheduled and fire on the next command.
 */
export function fireDue(ctx: SchedulerContext): void {
  for (let chain = 0; chain < MAX_CHAIN; chain += 1) {
    const due = dueScheduled(ctx.state)
    const next = due[0]
    if (!next) return

    removeScheduled(ctx.state, next)
    const event = ctx.index.events.get(next.event)
    if (!event) {
      ctx.events.push({ type: 'EffectSkipped', effect: next.event, reason: 'unknown event' })
      continue
    }
    if (!isEligible(ctx.state, event, ctx.content, ctx.rng)) continue

    const applied = applyEvent(ctx, event)
    if (applied.presented) return
  }
}

/**
 * Choose an encounter for a journey slot.
 *
 * Only eligible, non-major events are drawn, by authored weight, from the seeded
 * `encounters` stream. Major events are scheduled, never random (spec §20.4).
 */
export function selectEncounter(
  ctx: SchedulerContext,
  candidates: readonly { event: string; weight: number }[],
): EventDef | null {
  const eligible = candidates
    .map((candidate) => ({ event: ctx.index.events.get(candidate.event), weight: candidate.weight }))
    .filter((entry): entry is { event: EventDef; weight: number } => Boolean(entry.event))
    .filter((entry) => !entry.event.major)
    .filter((entry) => isEligible(ctx.state, entry.event, ctx.content, ctx.rng))

  if (eligible.length === 0) return null

  const picked = ctx.rng.weightedPick(
    'encounters',
    eligible.map((entry) => ({ value: entry.event, weight: entry.weight })),
  )
  return picked ?? null
}

/**
 * The night that follows a day at a destination.
 *
 * At most one authored encounter is drawn from the place's `night` band, by authored
 * weight from the seeded encounters stream, and only when nothing else already has the
 * traveller's attention. Major events are never drawn here: they are scheduled. A night
 * with no encounter is still a night — the interface shows the place after dark and the
 * next command is morning.
 */
export function fireNight(ctx: SchedulerContext): void {
  if (ctx.state.narrative.pending || ctx.state.narrative.journey) return
  const destination = ctx.index.destinations.get(ctx.state.player.location)
  if (!destination?.night || destination.night.events.length === 0) return

  const event = selectEncounter(ctx, destination.night.events)
  if (!event) return
  applyEvent(ctx, event)
}
