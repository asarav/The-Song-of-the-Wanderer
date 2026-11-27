/**
 * Starting a new game.
 *
 * `createInitialState` knows nothing about content; this function joins the two: it
 * builds the state, then fires the starting destination's authored arrival event so the
 * game opens on a scene rather than a map. Deterministic, no clock.
 */

import { createDslContent, type ContentIndex } from '../content'
import { applyEvent, isEligible } from '../narrative'
import { RngCursor } from '../rng'
import {
  createInitialState,
  DEFAULT_DIFFICULTY,
  difficultyConfig,
  type NewGameInput,
} from '../state'
import type { GameState } from '../state'
import type { KernelContext } from './context'
import type { SequencedEvent } from './events'

export interface NewGameResult {
  state: GameState
  events: SequencedEvent[]
}

export function newGame(input: NewGameInput, index: ContentIndex): NewGameResult {
  const mode = difficultyConfig(input.difficulty ?? DEFAULT_DIFFICULTY)
  const state = createInitialState({
    ...input,
    money: input.money ?? mode.startingMoney,
    stamina: input.stamina ?? mode.startingStamina,
  })
  const ctx: KernelContext = {
    state,
    index,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
    events: [],
  }

  const destination = index.destinations.get(state.player.location)
  const arrival = destination?.onArrival ? index.events.get(destination.onArrival) : undefined
  if (arrival && isEligible(ctx.state, arrival, ctx.content, ctx.rng)) {
    applyEvent(ctx, arrival)
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
