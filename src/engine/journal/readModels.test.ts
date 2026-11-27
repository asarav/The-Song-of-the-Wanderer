import { describe, expect, it } from 'vitest'

import { createInitialState } from '../state'
import { testContent } from '../testing'
import { deriveCharacterIndex, deriveCodex, deriveFactions, formatRegard } from './readModels'

const index = testContent()

function state() {
  return createInitialState({
    seed: 'read-models-001',
    location: 'dest.ugarit',
    money: 10,
    capacity: 20,
    knownDestinations: ['dest.ugarit'],
    knownRoutes: [],
  })
}

describe('faction standing', () => {
  it('surfaces a dimension even when standing itself is still zero', () => {
    const game = state()
    game.narrative.factions['faction.ugarit.merchants'] = {
      trust: 1,
      favour: 0,
      obligation: 0,
      standing: 0,
      suspicion: 0,
    }

    const [merchants] = deriveFactions(game, index)
    expect(merchants?.standing).toBe(0)
    expect(merchants?.band).toBe('unproven')
    expect(merchants?.regard).toEqual([{ dimension: 'trust', label: 'trust', value: 1 }])
    expect(formatRegard(merchants?.regard ?? [])).toBe('trust +1')
  })

  it('shows every recorded dimension, so no outcome is hidden', () => {
    const game = state()
    game.narrative.factions['faction.ugarit.merchants'] = {
      trust: 2,
      favour: -1,
      obligation: 3,
      standing: 1,
      suspicion: 1,
    }

    const [merchants] = deriveFactions(game, index)
    const recorded = Object.entries(game.narrative.factions['faction.ugarit.merchants'] ?? {})
      .filter(([key, value]) => key !== 'standing' && key !== 'phase' && value !== 0)
      .map(([key]) => key)

    expect(merchants?.regard.map((entry) => entry.dimension).sort()).toEqual(recorded.sort())
    expect(formatRegard(merchants?.regard ?? [])).toBe(
      'trust +2 · favor -1 · obligation +3 · suspicion +1',
    )
  })

  it('says nothing about a faction that has not recorded a dimension', () => {
    const game = state()
    game.narrative.factions['faction.ugarit.merchants'] = {
      trust: 0,
      favour: 0,
      obligation: 0,
      standing: 0,
      suspicion: 0,
    }

    const [merchants] = deriveFactions(game, index)
    expect(merchants?.regard).toEqual([])
    expect(formatRegard(merchants?.regard ?? [])).toBe('')
  })
})

describe('codex shelf', () => {
  it('says which shelf an entry sits on, so the index can group it', () => {
    const [entry] = deriveCodex(state(), index)
    expect(entry?.category).toBe('place')
  })
})

describe('people regard', () => {
  it('surfaces the obligation a person actually carries', () => {
    const game = state()
    game.knowledge.characterIndex['char.ugarit.amnit'] = {
      name: 'Amnit',
      notes: [],
    }
    game.narrative.relationships['char.ugarit.amnit'] = {
      trust: 1,
      affection: 0,
      obligation: 2,
      fear: 0,
      respect: 0,
    }

    const [amnit] = deriveCharacterIndex(game, index, (day) => `day ${day}`)
    expect(amnit?.regard).toEqual([
      { dimension: 'trust', label: 'trust', value: 1 },
      { dimension: 'obligation', label: 'obligation', value: 2 },
    ])
    expect(formatRegard(amnit?.regard ?? [])).toBe('trust +1 · obligation +2')
  })
})
