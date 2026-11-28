import { describe, expect, it } from 'vitest'

import { createInitialState } from '../state'
import { testContent } from '../testing'
import { deriveDestination, derivePlace } from './destination'

const index = testContent()

function state() {
  return createInitialState({
    seed: 'destination-view-001',
    location: 'dest.ugarit',
    money: 40,
    capacity: 20,
  })
}

describe('deriveDestination', () => {
  it('lists places with only the actions they afford', () => {
    const view = deriveDestination(state(), 'dest.ugarit', index)

    expect(view?.places.map((place) => place.id)).toEqual([
      'act.ugarit.market',
      'act.ugarit.harbour',
    ])
    expect(view?.places[0]).toMatchObject({ actions: ['trade'] })
    expect(view?.places[1]).toMatchObject({ actions: ['passage'] })
  })

  it('does not name a road until the traveller has learned it', () => {
    const unknown = deriveDestination(state(), 'dest.ugarit', index)
    expect(unknown?.routes).toEqual([])

    const learned = createInitialState({
      seed: 'destination-view-002',
      location: 'dest.ugarit',
      money: 40,
      capacity: 20,
      knownRoutes: ['route.ugarit-cyprus'],
    })
    expect(deriveDestination(learned, 'dest.ugarit', index)?.routes.map((route) => route.id)).toEqual([
      'route.ugarit-cyprus',
    ])
  })

  it('explains an active state instead of leaving a bare tag', () => {
    const localIndex = testContent()
    const destination = localIndex.destinations.get('dest.ugarit')
    if (!destination) throw new Error('test destination missing')
    destination.stateNotes = { tense: 'Food is dear and the road inland is watched.' }

    const game = state()
    game.world.destinationStates['dest.ugarit'] = ['tense']

    const view = deriveDestination(game, 'dest.ugarit', localIndex)
    expect(view?.states).toEqual(['tense'])
    expect(view?.stateNotes).toEqual({ tense: 'Food is dear and the road inland is watched.' })
  })

  it('scopes present people to the place they are assigned to', () => {
    const view = deriveDestination(state(), 'dest.ugarit', index)

    expect(view?.places[0]?.cast.map((person) => person.id)).toEqual(['char.ugarit.amnit'])
    expect(view?.places[1]?.cast).toEqual([])
    expect(view?.elsewhere).toEqual([])
  })

  it('puts a present but unassigned person under elsewhere, not in a place', () => {
    const localIndex = testContent()
    const destination = localIndex.destinations.get('dest.ugarit')
    destination?.cast.push('char.cyprus.kinyras')

    const game = state()
    game.narrative.characterStates['char.cyprus.kinyras'] = {
      status: 'alive',
      location: 'dest.ugarit',
      age: 30,
      relationships: {},
      flags: {},
    }

    const view = deriveDestination(game, 'dest.ugarit', localIndex)

    expect(view?.elsewhere.map((person) => person.id)).toEqual(['char.cyprus.kinyras'])
    expect(view?.places.flatMap((place) => place.cast.map((person) => person.id))).not.toContain(
      'char.cyprus.kinyras',
    )
  })
})

describe('derivePlace', () => {
  it('returns one place for its own screen', () => {
    const view = derivePlace(state(), 'dest.ugarit', 'act.ugarit.market', index)

    expect(view?.name).toBe('The market')
    expect(view?.actions).toEqual(['trade'])
    expect(view?.cast.map((person) => person.name)).toEqual(['Amnit'])
  })

  it('returns null for an unknown place', () => {
    expect(derivePlace(state(), 'dest.ugarit', 'act.nowhere', index)).toBeNull()
  })
})
