import { describe, expect, it } from 'vitest'

import { createInitialState } from '../state'
import { testContent } from '../testing'
import { deriveLocalMap, deriveRegionalMap, deriveWorldMap } from './map'

const index = testContent()

function state(knownDestinations: string[], knownRoutes: string[]) {
  return createInitialState({
    seed: 'map-001',
    location: 'dest.ugarit',
    money: 40,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownDestinations,
    knownRoutes,
  })
}

describe('deriveLocalMap', () => {
  it('sketches the places of the port you are in, with positions', () => {
    const view = deriveLocalMap(state(['dest.ugarit'], []), index)

    expect(view?.destination.id).toBe('dest.ugarit')
    expect(view?.marks.map((mark) => mark.id)).toEqual(
      index.destinations.get('dest.ugarit')?.places.map((place) => place.id),
    )
    for (const mark of view?.marks ?? []) {
      expect(mark.x).toBeGreaterThanOrEqual(0)
      expect(mark.x).toBeLessThanOrEqual(100)
      expect(mark.y).toBeGreaterThanOrEqual(0)
      expect(mark.y).toBeLessThanOrEqual(100)
      expect(mark.description.length).toBeGreaterThan(0)
    }
  })

  it('carries authored place art without resolving it in the engine', () => {
    const view = deriveLocalMap(state(['dest.ugarit'], []), index)

    expect(view?.marks.find((mark) => mark.id === 'act.ugarit.market')?.art).toBe(
      'art.ugarit.market',
    )
  })

  it('falls back to a ring when a place has no authored position', () => {
    const view = deriveLocalMap(state(['dest.ugarit'], []), index)
    const positions = new Set((view?.marks ?? []).map((mark) => `${mark.x},${mark.y}`))

    expect(positions.size).toBe(view?.marks.length)
  })

  it('has no local sketch while travelling on a route', () => {
    const travelling = state(['dest.ugarit', 'dest.cyprus'], ['route.ugarit-cyprus'])
    travelling.player.location = 'route.ugarit-cyprus'

    expect(deriveLocalMap(travelling, index)).toBeNull()
  })

  it('is deterministic for the same state', () => {
    const game = state(['dest.ugarit'], [])

    expect(deriveLocalMap(game, index)).toEqual(deriveLocalMap(game, index))
  })
})

describe('deriveRegionalMap', () => {
  it('names the region you are in and shows only its known places', () => {
    const view = deriveRegionalMap(
      state(['dest.ugarit', 'dest.cyprus'], ['route.ugarit-cyprus']),
      index,
    )

    expect(view?.region).toEqual({ id: 'region.levant', name: 'The Levantine coast' })
    expect(view?.places.map((place) => place.id)).toEqual(['dest.ugarit'])
    expect(view?.routes).toEqual([])
    expect(view?.shape).toEqual({ x: 72, y: 58, radius: 24 })
  })

  it('follows the player to another region', () => {
    const game = state(['dest.ugarit', 'dest.cyprus'], [])
    game.player.location = 'dest.cyprus'

    const view = deriveRegionalMap(game, index)

    expect(view?.region.id).toBe('region.cyprus')
    expect(view?.places.map((place) => place.id)).toEqual(['dest.cyprus'])
  })

  it('uses the departure region while the player is on a route', () => {
    const game = state(['dest.ugarit', 'dest.cyprus'], ['route.ugarit-cyprus'])
    game.player.location = 'route.ugarit-cyprus'

    expect(deriveRegionalMap(game, index)?.region.id).toBe('region.levant')
  })

  it('hides crossings that leave the region', () => {
    const view = deriveRegionalMap(
      state(['dest.ugarit', 'dest.cyprus'], ['route.ugarit-cyprus']),
      index,
    )

    expect(view?.routes.map((route) => route.id)).not.toContain('route.ugarit-cyprus')
  })
})

describe('deriveWorldMap', () => {
  it('shows only places the protagonist has heard of', () => {
    const view = deriveWorldMap(state(['dest.ugarit'], []), index)

    expect(view.places.map((place) => place.id)).toEqual(['dest.ugarit'])
    expect(view.places[0]?.current).toBe(true)
    expect(view.routes).toEqual([])
  })

  it('adds a known destination and the crossing between them', () => {
    const view = deriveWorldMap(
      state(['dest.ugarit', 'dest.cyprus'], ['route.ugarit-cyprus']),
      index,
    )

    expect(view.places.map((place) => place.id).sort()).toEqual(['dest.cyprus', 'dest.ugarit'])
    expect(view.places.find((place) => place.current)?.id).toBe('dest.ugarit')
    expect(view.routes.map((route) => route.id)).toContain('route.ugarit-cyprus')
    expect(view.routes[0]?.open).toBe(true)
    expect(view.routes[0]?.drawn).toBe(true)
  })

  it('lists a crossing whose far end is not on the sketch, without drawing it', () => {
    const view = deriveWorldMap(state(['dest.ugarit'], ['route.ugarit-cyprus']), index)

    expect(view.places.map((place) => place.id)).toEqual(['dest.ugarit'])
    expect(view.routes.map((route) => route.id)).toContain('route.ugarit-cyprus')
    expect(view.routes[0]?.drawn).toBe(false)
  })

  it('keeps an unvisited region under fog, without its name', () => {
    const view = deriveWorldMap(state(['dest.ugarit'], []), index)
    const levant = view.regions.find((region) => region.id === 'region.levant')
    const cyprus = view.regions.find((region) => region.id === 'region.cyprus')

    expect(levant).toMatchObject({ known: true, name: 'The Levantine coast' })
    expect(cyprus).toMatchObject({ known: false })
    expect(cyprus?.name).toBeUndefined()
    expect(cyprus?.x).toBe(26)
    expect(cyprus?.y).toBe(44)
  })

  it('lifts the fog once a place in the region is known', () => {
    const view = deriveWorldMap(state(['dest.ugarit', 'dest.cyprus'], []), index)
    const cyprus = view.regions.find((region) => region.id === 'region.cyprus')

    expect(cyprus).toMatchObject({ known: true, name: 'Cyprus' })
  })

  it('is deterministic for the same state', () => {
    const game = state(['dest.ugarit', 'dest.cyprus'], ['route.ugarit-cyprus'])

    expect(deriveWorldMap(game, index)).toEqual(deriveWorldMap(game, index))
  })
})

describe('map buildings and terrain', () => {
  it('draws a footprint for every local mark, sized by kind', () => {
    const view = deriveLocalMap(state(['dest.ugarit'], []), index)

    expect(view?.buildings.map((building) => building.id)).toEqual(
      view?.marks.map((mark) => mark.id),
    )
    expect(view?.buildings.find((building) => building.kind === 'market')).toMatchObject({
      width: 17,
      height: 11,
    })

    for (const building of view?.buildings ?? []) {
      expect(building.x - building.width / 2).toBeGreaterThanOrEqual(0)
      expect(building.x + building.width / 2).toBeLessThanOrEqual(100)
      expect(building.y - building.height / 2).toBeGreaterThanOrEqual(0)
      expect(building.y + building.height / 2).toBeLessThanOrEqual(100)
    }
  })

  it('draws the terrain and border lines authored for the region you are in', () => {
    const view = deriveRegionalMap(state(['dest.ugarit'], []), index)

    expect(view?.features.map((feature) => feature.id)).toEqual([
      'feature.test.ridge',
      'feature.test.river',
    ])
    expect(view?.features[0]).toMatchObject({ kind: 'mountains' })
    expect(view?.features[1]?.points).toHaveLength(2)
  })

  it('keeps a fogged region’s terrain off the world sketch', () => {
    const view = deriveWorldMap(state(['dest.ugarit'], []), index)

    expect(view.features.map((feature) => feature.id)).toEqual([
      'feature.test.ridge',
      'feature.test.river',
    ])
  })

  it('shows terrain once the region is known', () => {
    const view = deriveWorldMap(state(['dest.ugarit', 'dest.cyprus'], []), index)

    expect(view.features.map((feature) => feature.id)).toContain('feature.test.cyprus-ridge')
  })

  it('is deterministic with terrain and buildings', () => {
    const game = state(['dest.ugarit', 'dest.cyprus'], ['route.ugarit-cyprus'])

    expect(deriveLocalMap(game, index)).toEqual(deriveLocalMap(game, index))
    expect(deriveRegionalMap(game, index)).toEqual(deriveRegionalMap(game, index))
    expect(deriveWorldMap(game, index)).toEqual(deriveWorldMap(game, index))
  })
})
