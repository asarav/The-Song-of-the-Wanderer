import { describe, expect, it } from 'vitest'

import { createDslContent } from '../content'
import type { KernelContext } from '../kernel'
import { RngCursor } from '../rng'
import { createInitialState } from '../state'
import { testContent } from '../testing'
import { assessHazard } from './hazard'
import { startJourney } from '../narrative'

const index = testContent()
const route = index.routes.get('route.ugarit-cyprus')
if (!route) throw new Error('test route missing')
const coastal = route.modes.find((mode) => mode.id === 'mode.coastal')
if (!coastal) throw new Error('test mode missing')

const risked = {
  ...route,
  hazard: { baseChance: 14, outcomes: [{ event: 'evt.test.arrival', weight: 1 }] },
}

function state() {
  return createInitialState({
    seed: 'hazard-001',
    location: 'dest.ugarit',
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownDestinations: ['dest.ugarit', 'dest.cyprus'],
  })
}

function context(seed: string): KernelContext {
  const current = createInitialState({
    seed,
    location: 'dest.ugarit',
    money: 100,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownDestinations: ['dest.ugarit', 'dest.cyprus'],
  })
  return {
    state: current,
    index,
    content: createDslContent(index),
    rng: new RngCursor(current.rng),
    events: [],
  }
}

describe('assessHazard', () => {
  it('opens at twenty percent with basic Akkadian and two known ports', () => {
    const view = assessHazard(state(), risked, coastal, 'dest.cyprus', index)

    expect(view?.chance).toBe(20)
    expect(view?.band).toBe('moderate')
  })

  it('falls with the destination language, known roads and local trust', () => {
    const better = state()
    better.player.languages['lang.akkadian'] = { xp: 100, tier: 'fluent' }
    better.knowledge.knownDestinations.push('dest.third')
    better.narrative.relationships['char.ugarit.amnit'] = {
      trust: 3,
      affection: 0,
      obligation: 0,
      fear: 0,
      respect: 0,
    }
    const view = assessHazard(better, risked, coastal, 'dest.ugarit', index)

    expect(view?.chance).toBeLessThan(20)
    expect(view?.factors.some((factor) => factor.delta < 0)).toBe(true)
  })

  it('rises with wounds, low reserve and a port under pressure', () => {
    const worse = state()
    worse.player.stamina = 2
    worse.player.afflictions.push({ id: 'aff.fever', sinceDay: 1 })
    worse.world.destinationStates['dest.cyprus'] = ['war']
    const view = assessHazard(worse, risked, coastal, 'dest.cyprus', index)

    expect(view?.chance).toBeGreaterThan(20)
    expect(view?.band).toBe('high')
  })

  it('is null when the route authors no hazard', () => {
    expect(assessHazard(state(), route, coastal, 'dest.cyprus', index)).toBeNull()
  })

  it('moves with the chosen road without changing the other factors', () => {
    const gentle = state()
    gentle.meta.difficulty = 'gentle'
    const perilous = state()
    perilous.meta.difficulty = 'perilous'

    expect(assessHazard(gentle, risked, coastal, 'dest.cyprus', index)?.chance).toBe(12)
    expect(assessHazard(state(), risked, coastal, 'dest.cyprus', index)?.chance).toBe(20)
    expect(assessHazard(perilous, risked, coastal, 'dest.cyprus', index)?.chance).toBe(30)
  })
})

describe('a hazardous journey', () => {
  it('can schedule an authored outcome and records the roll', () => {
    let triggered = false
    for (let attempt = 0; attempt < 40 && !triggered; attempt += 1) {
      const ctx = context(`hazard-journey-${attempt}`)
      startJourney(ctx, { ...risked, hazard: { baseChance: 100, outcomes: risked.hazard.outcomes } }, 'mode.coastal', 5)
      const fired = ctx.events.find((event) => event.type === 'HazardTriggered')
      if (!fired) continue
      triggered = true
      expect(ctx.state.narrative.journey?.slots.some((slot) => slot.event === 'evt.test.arrival')).toBe(true)
      expect(ctx.events.some((event) => event.type === 'HazardRolled')).toBe(true)
    }
    expect(triggered).toBe(true)
  })
})