/**
 * `reduce(state, command, content) → { state, events, rejected? }`
 *
 * Pure and deterministic (ADR-0003). The reducer clones the incoming state, runs one
 * handler from a registry, fires any due scheduled events, then commits RNG state and
 * event sequence numbers. Expected failure returns the original state and a reason.
 */

import { createDslContent, type ContentIndex } from '../content'
import { applyEffects } from '../dsl'
import { quoteBuy, quoteSell } from '../economy'
import { resolveChoice, startDialogue } from '../narrative'
import { continueJourney, startJourney } from '../narrative'
import { fireDue, fireNight } from '../narrative'
import { RngCursor } from '../rng'
import { cloneState, type GameState } from '../state'
import { advanceDays } from '../time'
import { exertionOf, quoteTravel } from '../world'
import {
  COMMAND_SCHEMAS,
  commandTypeOf,
  type Command,
  type CommandDefinition,
  type CommandType,
} from './commands'
import type { KernelContext } from './context'
import type { SequencedEvent } from './events'

export interface CommandResult {
  state: GameState
  events: SequencedEvent[]
  rejected?: { reason: string }
}

type Handler = (ctx: KernelContext, command: Command) => string | null

/** Longest single time jump a command may request. */
const MAX_JUMP_DAYS = 365

function guardTravel(ctx: KernelContext): string | null {
  if (ctx.state.narrative.journey) return 'You are already on the road.'
  return null
}

const advanceTime: Handler = (ctx, command) => {
  if (command.type !== 'advanceTime') return 'Wrong command.'
  if (!Number.isInteger(command.days) || command.days < 0 || command.days > MAX_JUMP_DAYS) {
    return 'Time cannot pass that way.'
  }
  const blocked = guardTravel(ctx)
  if (blocked) return blocked
  if (command.days === 0) return null

  ctx.state = advanceDays(ctx.state, command.days)
  ctx.events.push({ type: 'TimeAdvanced', days: command.days, day: ctx.state.calendar.day })
  // Time in a settled place is not only the clock: water, shade and a roof are
  // treatments an ordinary day can supply. It never cures a wound or a curse.
  if (ctx.index.destinations.has(ctx.state.player.location)) {
    applyEffects([{ treatment: 'town' }], ctx)
  }
  return null
}

const rest: Handler = (ctx, command) => {
  if (command.type !== 'rest') return 'Wrong command.'
  if (!Number.isInteger(command.days) || command.days < 1 || command.days > 30) {
    return 'You can rest for between one and thirty days.'
  }
  const blocked = guardTravel(ctx)
  if (blocked) return blocked

  ctx.state = advanceDays(ctx.state, command.days)
  ctx.events.push({ type: 'TimeAdvanced', days: command.days, day: ctx.state.calendar.day })
  // Rest is the only command that restores the one stamina track. Spending a day at a
  // port is errands, not recovery.
  applyEffects([{ stamina: command.days * 2 }], ctx)
  applyEffects([{ treatment: 'rest' }, { treatment: 'town' }], ctx)
  return null
}

/**
 * A day's labour at the harbor. The fallback that keeps a broke traveller from being
 * stranded: three shekels, one day, one reserve. It is not a career, and it cannot be
 * done when there is no harbor or no strength left.
 */
const work: Handler = (ctx, command) => {
  if (command.type !== 'work') return 'Wrong command.'
  if (!Number.isInteger(command.days) || command.days < 1 || command.days > 7) {
    return 'You can work between one and seven days.'
  }
  const blocked = guardTravel(ctx)
  if (blocked) return blocked
  const destination = ctx.index.destinations.get(ctx.state.player.location)
  if (!destination?.places.some((place) => place.kind === 'harbour')) {
    return 'There is no harbor work here.'
  }
  if (ctx.state.player.stamina < command.days) {
    return 'You do not have the strength for that many days of work.'
  }

  ctx.state = advanceDays(ctx.state, command.days)
  ctx.events.push({ type: 'TimeAdvanced', days: command.days, day: ctx.state.calendar.day })
  applyEffects([{ money: command.days * 3 }, { stamina: -command.days }], ctx)
  applyEffects([{ treatment: 'town' }], ctx)
  return null
}

const travel: Handler = (ctx, command) => {
  if (command.type !== 'travel') return 'Wrong command.'
  const blocked = guardTravel(ctx)
  if (blocked) return blocked
  if (ctx.state.narrative.pending) return 'Finish what is in front of you first.'

  const quote = quoteTravel(ctx.state, command.route, command.mode, ctx.index)
  if (!quote.ok || !quote.mode) return quote.reason ?? 'You cannot travel that way.'

  const route = ctx.index.routes.get(command.route)
  if (!route) return 'There is no such crossing.'

  // The corridor runs both ways: from its authored end you sail to the other end,
  // and from the other end you sail home.
  const destination = ctx.state.player.location === route.to ? route.from : route.to

  const exertion = exertionOf(quote.mode)
  const provisions = quote.mode.provisions ?? 0
  applyEffects(
    [
      { money: -quote.mode.baseCost },
      { stamina: -exertion },
      ...(provisions > 0
        ? [{ items: { item: 'good.grain', quantity: -provisions } }]
        : []),
    ],
    ctx,
  )
  // Spending the last of one's strength to get aboard is not a collapse at sea; the
  // return only becomes a scene when a choice spends it on the road itself.
  delete ctx.state.player.flags['road.exhausted']
  startJourney(ctx, route, quote.mode.id, quote.mode.days, destination)
  continueJourney(ctx)
  return null
}

const buy: Handler = (ctx, command) => {
  if (command.type !== 'buy') return 'Wrong command.'
  const destination = ctx.index.destinations.get(ctx.state.player.location)
  if (!destination) return 'You are not in a market.'

  const quote = quoteBuy(ctx.state, destination, ctx.index, command.item, command.quantity)
  if (!quote.ok) return quote.reason ?? 'That trade is not possible.'

  applyEffects(
    [
      { money: -(quote.total ?? 0) },
      {
        items: {
          item: command.item,
          quantity: command.quantity,
          cost: quote.total ?? 0,
        },
      },
    ],
    ctx,
  )
  return null
}

const sell: Handler = (ctx, command) => {
  if (command.type !== 'sell') return 'Wrong command.'
  const destination = ctx.index.destinations.get(ctx.state.player.location)
  if (!destination) return 'You are not in a market.'

  const quote = quoteSell(ctx.state, destination, ctx.index, command.item, command.quantity)
  if (!quote.ok) return quote.reason ?? 'That trade is not possible.'

  applyEffects(
    [
      { items: { item: command.item, quantity: -command.quantity } },
      { money: quote.total ?? 0 },
    ],
    ctx,
  )
  return null
}

/** Who the open scene belongs to, if it has a speaker. */
function pendingSpeakerName(ctx: KernelContext): string | null {
  const pending = ctx.state.narrative.pending
  if (!pending) return null
  const speaker = ctx.index.dialogues.get(pending.dialogue)?.speaker
  if (!speaker) return null
  return ctx.index.characters.get(speaker)?.name ?? speaker
}

const talkTo: Handler = (ctx, command) => {
  if (command.type !== 'talkTo') return 'Wrong command.'
  if (ctx.state.narrative.pending) {
    const speaker = pendingSpeakerName(ctx)
    return speaker
      ? `${speaker} is still speaking. Answer the scene first.`
      : 'The scene in front of you is not finished.'
  }

  const character = ctx.index.characters.get(command.character)
  if (!character) return 'There is no one of that name here.'

  const runtime = ctx.state.narrative.characterStates[character.id]
  const presentAt = runtime?.location ?? character.home
  const alive = runtime ? runtime.status === 'alive' : true
  if (!alive) return `${character.name} is not here.`
  if (presentAt !== ctx.state.player.location) return `${character.name} is not here.`

  const dialogueId =
    character.dialogueByDestination?.[ctx.state.player.location] ?? character.dialogue
  if (!dialogueId) return `${character.name} has nothing to say just now.`

  return startDialogue(ctx, dialogueId)
}

const resolvePending = (ctx: KernelContext, choice: number): string | null => {
  if (!Number.isInteger(choice)) return 'Choose one of the answers offered.'
  return resolveChoice(ctx, choice)
}

const resolveEncounter: Handler = (ctx, command) =>
  command.type === 'resolveEncounter' ? resolvePending(ctx, command.choice) : 'Wrong command.'

const chooseDialogue: Handler = (ctx, command) =>
  command.type === 'chooseDialogue' ? resolvePending(ctx, command.choice) : 'Wrong command.'

/**
 * The command registry. Adding a command is one union member, one schema, one entry here
 * — never a new branch in `reduce`.
 */
export const COMMAND_REGISTRY: Record<CommandType, CommandDefinition> = {
  advanceTime: { schema: COMMAND_SCHEMAS.advanceTime, run: advanceTime },
  rest: { schema: COMMAND_SCHEMAS.rest, run: rest },
  work: { schema: COMMAND_SCHEMAS.work, run: work },
  travel: { schema: COMMAND_SCHEMAS.travel, run: travel },
  buy: { schema: COMMAND_SCHEMAS.buy, run: buy },
  sell: { schema: COMMAND_SCHEMAS.sell, run: sell },
  talkTo: { schema: COMMAND_SCHEMAS.talkTo, run: talkTo },
  resolveEncounter: { schema: COMMAND_SCHEMAS.resolveEncounter, run: resolveEncounter },
  chooseDialogue: { schema: COMMAND_SCHEMAS.chooseDialogue, run: chooseDialogue },
}

function rejection(state: GameState, reason: string): CommandResult {
  return { state, events: [], rejected: { reason } }
}

export function reduce(state: GameState, command: Command, index: ContentIndex): CommandResult {
  const type = commandTypeOf(command)
  if (!type) return rejection(state, 'That is not something you can do.')

  const definition = COMMAND_REGISTRY[type]
  const parsed = definition.schema.safeParse(command)
  if (!parsed.success) return rejection(state, 'That is not something you can do.')

  const draft = cloneState(state)
  const dayBefore = draft.calendar.day
  const ctx: KernelContext = {
    state: draft,
    index,
    content: createDslContent(index),
    rng: new RngCursor(draft.rng),
    events: [],
  }

  const reason = definition.run(ctx, parsed.data)
  if (reason) return rejection(state, reason)

  fireDue(ctx)

  /*
   * A single day spent at a destination ends in a night, which may bring one authored
   * encounter. A longer skip is a montage and does not stage a scene; a scene already open
   * (a due event, a conversation) owns the evening instead; a journey's nights belong to
   * the crossing.
   */
  if (
    (type === 'advanceTime' || type === 'rest') &&
    ctx.state.calendar.day === dayBefore + 1 &&
    !ctx.state.narrative.pending
  ) {
    fireNight(ctx)
  }

  ctx.state.rng = ctx.rng.snapshot()
  const base = ctx.state.meta.eventSequence
  const events: SequencedEvent[] = ctx.events.map((event, offset) => ({
    sequence: base + offset + 1,
    event,
  }))
  ctx.state.meta.eventSequence = base + events.length

  return { state: ctx.state, events }
}

/** Convenience for scenarios and tests: the events as a compact list of types. */
export function eventTypes(result: CommandResult): string[] {
  return result.events.map((entry) => entry.event.type)
}
