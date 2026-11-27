/**
 * Boundary contract for the `testing` module's scenario runner (M1-T08).
 *
 * Imports only public surfaces: `@engine/testing` plus `@engine/state`, `@engine/kernel`
 * and `@engine/save`. Three named scenarios run as real assertions on real state, a save
 * step round-trips through the save module, and a failure is a typed result that names
 * the scenario, the seed and the step.
 */

import { describe, expect, it } from 'vitest'

import { reduce, type Command } from '@engine/kernel'
import { deserialize, serialize } from '@engine/save'
import { createInitialState } from '@engine/state'
import {
  ASSERTION_MATCHERS,
  formatTrace,
  resolvePath,
  runScenario,
  SCENARIO_ACTIONS,
  SCENARIO_SAVED_AT,
  testContent,
  type Scenario,
} from '@engine/testing'

const index = testContent()

const crossing: Scenario = {
  id: 'contract.test.crossing',
  seed: 'contract-001',
  start: {
    date: '1230-04-01',
    location: 'dest.ugarit',
    money: 120,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownRoutes: ['route.ugarit-cyprus'],
    knownDestinations: ['dest.ugarit'],
  },
  commands: [
    { type: 'buy', item: 'good.grain', quantity: 2 },
    { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' },
    { type: 'resolveEncounter', choice: 0 },
    { type: 'resolveEncounter', choice: 0 },
  ],
  assert: [
    { path: 'player.location', equals: 'dest.cyprus' },
    { target: 'events', path: 'types', contains: 'JourneyStarted' },
  ],
}

const yearEnd: Scenario = {
  id: 'contract.test.year-end',
  seed: 'contract-clock',
  start: { date: '1230-13-04', location: 'dest.ugarit' },
  commands: [
    { type: 'advanceTime', days: 2 },
    { type: 'advanceTime', days: 400 },
  ],
  assert: [
    { path: 'calendar.day', equals: 365 },
    { step: 1, path: 'accepted', equals: false },
    { step: 1, path: 'reason', equals: 'Time cannot pass that way.' },
  ],
}

const arrival: Scenario = {
  id: 'contract.test.arrival',
  seed: 'contract-arrival',
  newGame: true,
  start: { location: 'dest.ugarit' },
  commands: [],
  assert: [
    { path: 'narrative.pending.dialogue', equals: 'dlg.test.arrival' },
    { path: 'narrative.pending.node', equals: 'gate' },
    { path: 'player.identity.selfName', equals: 'e-ma-a₂' },
  ],
}

describe('scenario runner public surface', () => {
  it('publishes both registries and the trace helpers', () => {
    expect(Object.keys(SCENARIO_ACTIONS)).toEqual(['save'])
    expect(Object.keys(ASSERTION_MATCHERS).sort()).toEqual(['contains', 'equals', 'length'])
    expect(typeof formatTrace).toBe('function')
    expect(resolvePath({ a: [{ b: 1 }] }, 'a.0.b')).toBe(1)
    expect(SCENARIO_SAVED_AT).toBe('1970-01-01T00:00:00.000Z')
  })

  it('runs the three named scenarios against the shared test pack', () => {
    for (const scenario of [crossing, yearEnd, arrival]) {
      const result = runScenario(scenario, index)
      expect(result.failures, scenario.id).toEqual([])
      expect(result.ok).toBe(true)
      expect(result.seed).toBe(scenario.seed)
    }
  })

  it('records the seeded run the save module can carry', () => {
    const result = runScenario(crossing, index)
    const text = JSON.stringify(serialize(result.finalState, { savedAt: SCENARIO_SAVED_AT }))
    const loaded = deserialize(JSON.parse(text) as unknown)

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.state).toEqual(result.finalState)

    const next: Command = { type: 'buy', item: 'good.grain', quantity: 1 }
    const direct = reduce(result.finalState, next, index)
    const resumed = reduce(loaded.state, next, index)
    expect(JSON.stringify(resumed.state)).toBe(JSON.stringify(direct.state))
  })

  it('keeps a scenario replay byte-identical, trace included', () => {
    const first = runScenario(crossing, index)
    const again = runScenario(crossing, index)

    expect(formatTrace(again)).toBe(formatTrace(first))
    expect(JSON.stringify(again.steps)).toBe(JSON.stringify(first.steps))
  })

  it('reports a failure as a typed result naming scenario, seed and step', () => {
    const failing: Scenario = {
      ...crossing,
      id: 'contract.test.failing',
      assert: [{ step: 0, path: 'accepted', equals: false }],
    }

    const result = runScenario(failing, index)

    expect(result.ok).toBe(false)
    expect(result.failures).toEqual([
      { path: 'accepted', step: 0, message: 'expected false, found true' },
    ])
    expect(formatTrace(result)).toContain('scenario contract.test.failing (seed "contract-001") — FAILED')
  })

  it('opens a state the runner would build, for comparison', () => {
    const state = createInitialState({ seed: 'contract-001', location: 'dest.ugarit' })
    expect(state.meta.seed).toBe(crossing.seed)
    expect(state.player.location).toBe('dest.ugarit')
  })
})
