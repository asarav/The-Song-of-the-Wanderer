import { describe, expect, it } from 'vitest'

import { createDslContent } from '../content'
import type { KernelContext } from '../kernel'
import { startJourney } from '../narrative'
import { RngCursor } from '../rng'
import { createInitialState } from '../state'
import { testContent } from '../testing'
import { deriveJourney } from './journey'

const index = testContent()
const route = index.routes.get('route.ugarit-cyprus')
if (!route) throw new Error('test route missing')

function travelling(seed = 'journey-view-001'): KernelContext {
  const state = createInitialState({
    seed,
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownRoutes: ['route.ugarit-cyprus'],
    knownDestinations: ['dest.ugarit', 'dest.cyprus'],
  })
  const ctx: KernelContext = {
    state,
    index,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
    events: [],
  }
  if (!route) throw new Error('test route missing')
  startJourney(ctx, route, 'mode.coastal', 5)
  return ctx
}

describe('deriveJourney', () => {
  it('applies the stored journey and authored stops to the view', () => {
    const ctx = travelling()
    const journey = ctx.state.narrative.journey
    if (!journey) throw new Error('journey missing')
    journey.slots = [{ atDay: 2, event: 'evt.squall' }]
    journey.nextSlot = 0
    ctx.state.calendar.day = 2

    expect(deriveJourney(ctx.state, index)).toEqual({
      route: 'route.ugarit-cyprus',
      routeName: 'Crossing to Cyprus',
      mode: 'mode.coastal',
      modeName: 'Coastal',
      origin: 'Ugarit',
      destination: 'The Cypriot harbour',
      departedAt: 'Year 1230 BCE · month 1 · day 1',
      arrivesAt: 'Year 1230 BCE · month 1 · day 6',
      daysRemaining: 3,
      stopsRemaining: 1,
      stops: [
        {
          id: 'way.calm-bay',
          name: 'A calm bay',
          kind: 'calm',
          day: 1,
          date: 'Year 1230 BCE · month 1 · day 2',
          reached: true,
        },
      ],
    })
  })

  it('returns null when there is no journey to show', () => {
    const state = createInitialState({ seed: 'journey-view-002', location: 'dest.ugarit' })
    expect(deriveJourney(state, index)).toBeNull()
  })

  it('clamps remaining days and stops at zero after the arrival day', () => {
    const ctx = travelling()
    const journey = ctx.state.narrative.journey
    if (!journey) throw new Error('journey missing')
    journey.slots = [{ atDay: 1, event: 'evt.squall' }]
    journey.nextSlot = 9
    ctx.state.calendar.day = 20

    const view = deriveJourney(ctx.state, index)
    expect(view?.daysRemaining).toBe(0)
    expect(view?.stopsRemaining).toBe(0)
  })

  it('is deterministic for the same state', () => {
    const ctx = travelling()
    expect(deriveJourney(ctx.state, index)).toEqual(deriveJourney(ctx.state, index))
  })
})
