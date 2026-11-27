import { describe, expect, it } from 'vitest'

import { createInitialState } from '../state'
import { testContent } from '../testing'
import { deriveSelf } from './self'

const index = testContent()

function game() {
  return createInitialState({
    seed: 'self-001',
    location: 'dest.ugarit',
    money: 40,
    capacity: 20,
    inventory: [{ item: 'good.grain', quantity: 2 }],
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
  })
}

describe('deriveSelf', () => {
  it('reports identity, place, date, purse and load', () => {
    const view = deriveSelf(game(), index)

    expect(view.name).toBe('e-ma-a₂')
    expect(view.locationName).toBe('Ugarit')
    expect(view.travelling).toBe(false)
    expect(view.date).toContain('1230 BCE')
    expect(view.money).toBe(40)
    expect(view.carried).toBe(4)
    expect(view.capacity).toBe(20)
    expect(view.stamina).toBe(8)
    expect(view.staminaMax).toBe(8)
    expect(view.transport).toBe('on foot')
    expect(view.difficulty).toEqual({
      id: 'wanderer',
      name: 'Wanderer',
      note: expect.stringContaining('measured journey'),
      hazardShift: 0,
    })
    expect(view.goods).toEqual([
      { id: 'good.grain', name: 'Grain', quantity: 2, weight: 4, protected: false },
    ])
  })

  it('keeps an unknown good visible and falls back to unit weight', () => {
    const state = game()
    state.player.inventory = [{ item: 'good.unknown', quantity: 3 }]

    const view = deriveSelf(state, index)

    expect(view.goods[0]).toEqual({
      id: 'good.unknown',
      name: 'good.unknown',
      quantity: 3,
      weight: 3,
      protected: false,
    })
  })

  it('shows languages with their tier and progress', () => {
    const view = deriveSelf(game(), index)

    expect(view.languages).toEqual([
      {
        id: 'lang.akkadian',
        name: 'Akkadian',
        tier: 'basic',
        xp: 25,
        nextTier: 'conversational',
        xpToNext: expect.any(Number),
      },
    ])
  })

  it('lists only non-zero obligations, from people and factions', () => {
    const state = game()
    state.narrative.relationships['char.ugarit.amnit'] = {
      trust: 0,
      affection: 0,
      obligation: 2,
      fear: 0,
      respect: 0,
    }
    state.narrative.relationships['char.cyprus.kinyras'] = {
      trust: 0,
      affection: 0,
      obligation: 0,
      fear: 0,
      respect: 0,
    }
    state.narrative.factions['faction.ugarit.palace'] = {
      trust: 0,
      favour: 0,
      obligation: -1,
      standing: 2,
      suspicion: 0,
    }

    const view = deriveSelf(state, index)

    expect(view.obligations).toEqual([
      { id: 'char.ugarit.amnit', name: 'Amnit', amount: 2, kind: 'person' },
      { id: 'faction.ugarit.palace', name: 'The palace', amount: -1, kind: 'faction' },
    ])
  })

  it('resolves deeds to names and dates, newest first', () => {
    const state = game()
    state.player.deeds.push(
      {
        id: 'deed.first',
        kind: 'helped',
        day: 0,
        place: 'dest.ugarit',
        subject: 'char.ugarit.amnit',
        witnesses: [],
        knowledge: [],
      },
      {
        id: 'deed.second',
        kind: 'traded',
        day: 4,
        place: 'dest.ugarit',
        subject: 'faction.ugarit.palace',
        witnesses: [],
        knowledge: [],
        consequence: 'A clerk remembers the weight.',
      },
    )

    const view = deriveSelf(state, index)

    expect(view.deeds.map((deed) => deed.id)).toEqual(['deed.second', 'deed.first'])
    expect(view.deeds[0]).toMatchObject({
      kind: 'traded',
      placeName: 'Ugarit',
      subjectName: 'The palace',
      consequence: 'A clerk remembers the weight.',
    })
    expect(view.deeds[1]?.subjectName).toBe('Amnit')
  })

  it('does not reveal people, factions or deeds the player has no knowledge of', () => {
    const view = deriveSelf(game(), index)

    expect(view.factions).toEqual([])
    expect(view.reputation).toEqual([])
    expect(view.obligations).toEqual([])
    expect(view.deeds).toEqual([])
    expect(view.goods.map((good) => good.id)).toEqual(['good.grain'])
  })

  it('names a route while travelling', () => {
    const state = game()
    state.player.location = 'route.ugarit-cyprus'

    const view = deriveSelf(state, index)

    expect(view.travelling).toBe(true)
    expect(view.locationName).toBe('Crossing to Cyprus')
  })

  it('is deterministic for the same state', () => {
    const state = game()

    expect(deriveSelf(state, index)).toEqual(deriveSelf(state, index))
  })
})
