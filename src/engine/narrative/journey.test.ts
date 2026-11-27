import { describe, expect, it } from 'vitest'

import { createDslContent } from '../content'
import type { KernelContext } from '../kernel'
import { RngCursor } from '../rng'
import { createInitialState } from '../state'
import { testContent } from '../testing'
import { continueJourney, generateSlots, startJourney } from './journey'

const index = testContent()

function context(seed = 'journey-001'): KernelContext {
  const state = createInitialState({
    seed,
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownRoutes: ['route.ugarit-cyprus'],
    knownDestinations: ['dest.ugarit', 'dest.cyprus'],
  })
  return {
    state,
    index,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
    events: [],
  }
}

const route = index.routes.get('route.ugarit-cyprus')
if (!route) throw new Error('test route missing')

describe('generateSlots', () => {
  it('adds the authored waypoint stop on its day', () => {
    const slots = generateSlots(context(), route, 3, 10)
    expect(slots).toContainEqual({ atDay: 11, event: 'evt.squall' })
  })

  it('keeps slots in day order and does not duplicate a stop', () => {
    const slots = generateSlots(context(), route, 3, 10)
    const keys = slots.map((slot) => `${slot.atDay}:${slot.event}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect([...slots].sort((a, b) => a.atDay - b.atDay)).toEqual(slots)
  })

  it('ignores a waypoint beyond the crossing', () => {
    const waypoint = route.waypoints?.[0]
    if (!waypoint) throw new Error('test waypoint missing')
    const far = { ...route, waypoints: [{ ...waypoint, afterDays: 9 }] }
    const slots = generateSlots(context(), far, 3, 10)
    expect(slots.some((slot) => slot.atDay === 19)).toBe(false)
  })

  it('does not repeat an encounter on one journey', () => {
    const repeated = {
      ...route,
      encountersPerJourney: { min: 6, max: 6 },
      encounters: [{ event: 'evt.squall', weight: 1 }],
    }
    const slots = generateSlots(context(), repeated, 5, 10)
    expect(slots.filter((slot) => slot.event === 'evt.squall')).toHaveLength(1)
  })

  it('is deterministic for the same state, seed and route', () => {
    const first = generateSlots(context(), route, 3, 10)
    const second = generateSlots(context(), route, 3, 10)
    expect(second).toEqual(first)
  })
})

describe('collapse', () => {
  it('returns an exhausted traveller to the last port, two days and one cargo lighter', () => {
    const ctx = context('journey-collapse')
    ctx.state.player.inventory = [{ item: 'good.copper', quantity: 2 }]
    startJourney(ctx, route, 'mode.coastal', 5)
    ctx.state.player.stamina = 0
    ctx.state.player.flags['road.exhausted'] = true
    ctx.events = []

    continueJourney(ctx)

    expect(ctx.state.narrative.journey).toBeNull()
    expect(ctx.state.player.location).toBe('dest.ugarit')
    expect(ctx.state.player.stamina).toBe(2)
    expect(ctx.state.calendar.day).toBe(2)
    expect(ctx.state.player.inventory).toEqual([{ item: 'good.copper', quantity: 1 }])
    expect(ctx.state.player.flags['road.exhausted']).toBe(false)
    expect(ctx.events.map((event) => event.type)).toContain('JourneyCollapsed')
  })
})
