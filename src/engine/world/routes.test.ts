import { describe, expect, it } from 'vitest'

import { createInitialState, type GameState } from '../state'
import { testContent } from '../testing'
import { deriveRoute, quoteTravel, routeProblem } from './routes'

const index = testContent()
const route = index.routes.get('route.ugarit-cyprus')
const inland = index.routes.get('route.ugarit-inland')
if (!route || !inland) throw new Error('test routes missing')

function state(overrides: Partial<Parameters<typeof createInitialState>[0]> = {}): GameState {
  return createInitialState({
    seed: 'routes-001',
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownRoutes: ['route.ugarit-cyprus', 'route.ugarit-inland'],
    knownDestinations: ['dest.ugarit', 'dest.cyprus'],
    ...overrides,
  })
}

describe('route corridor', () => {
  it('derives segments, waypoints and risk rather than a bare edge', () => {
    const view = deriveRoute(state(), route.id, index)
    expect(view?.segments.map((segment) => segment.id)).toEqual(['leg.coast', 'leg.open'])
    expect(view?.waypoints.map((waypoint) => waypoint.id)).toEqual(['way.calm-bay'])
    expect(view?.risk).toBe('moderate')
    expect(view?.usable).toBe(true)
  })

  it('is deterministic for the same state', () => {
    expect(deriveRoute(state(), route.id, index)).toEqual(deriveRoute(state(), route.id, index))
  })

  it('names both ends for display, never the raw ids', () => {
    const view = deriveRoute(state(), route.id, index)
    expect(view?.from).toBe('dest.ugarit')
    expect(view?.fromName).toBe('Ugarit')
    expect(view?.toName).toBe(index.destinations.get(route.to)?.name)
    expect(view?.fromName).not.toContain('dest.')
  })

  it('reads from the end the trader is standing on', () => {
    const view = deriveRoute(state({ location: 'dest.cyprus' }), route.id, index)
    expect(view?.from).toBe('dest.cyprus')
    expect(view?.to).toBe('dest.ugarit')
    expect(view?.fromName).toBe(index.destinations.get('dest.cyprus')?.name)
    expect(view?.toName).toBe('Ugarit')
    expect(view?.segments.map((segment) => segment.id)).toEqual(['leg.open', 'leg.coast'])
  })
})

describe('routeProblem', () => {
  it('rejects an unknown crossing', () => {
    expect(routeProblem(state({ knownRoutes: [] }), route, index)).toBe(
      'You have not heard of this crossing.',
    )
  })

  it('rejects a closed crossing with its authored note', () => {
    const closed = state()
    closed.world.routeStates[route.id] = 'closed'
    expect(routeProblem(closed, route, index)).toBe('The harbour is closed to departures.')
  })

  it('rejects unmet requirements with their authored note', () => {
    expect(routeProblem(state(), inland, index)).toBe('A pass is needed on this road.')
  })

  it('allows a known, open crossing with no requirements', () => {
    expect(routeProblem(state(), route, index)).toBeNull()
  })
})

describe('quoteTravel', () => {
  it('returns the authored mode for a valid departure', () => {
    expect(quoteTravel(state(), route.id, 'mode.open', index)).toMatchObject({
      ok: true,
      mode: { id: 'mode.open', days: 3 },
    })
  })

  it('quotes from either end of the corridor', () => {
    expect(quoteTravel(state({ location: 'dest.cyprus' }), route.id, 'mode.open', index).ok).toBe(
      true,
    )
    expect(
      quoteTravel(state({ location: 'dest.elsewhere' }), route.id, 'mode.open', index).reason,
    ).toBe('You are not at either end of this crossing.')
  })

  it('rejects an unknown crossing, mode, fare and overloaded cargo', () => {
    expect(quoteTravel(state(), 'route.none', 'mode.open', index).reason).toBe(
      'There is no such crossing.',
    )
    expect(quoteTravel(state(), route.id, 'mode.flying', index).reason).toBe(
      'There is no such way to travel.',
    )
    expect(quoteTravel(state({ money: 1 }), route.id, 'mode.open', index).reason).toBe(
      'You cannot pay the passage.',
    )
    expect(
      quoteTravel(
        state({ capacity: 40, inventory: [{ item: 'good.copper', quantity: 6 }] }),
        route.id,
        'mode.coastal',
        index,
      ).reason,
    ).toBe('Your cargo is too heavy for this passage.')
  })
})
