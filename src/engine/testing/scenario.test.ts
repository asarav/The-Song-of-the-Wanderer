import { describe, expect, it } from 'vitest'

import {
  formatTrace,
  isScenarioAction,
  resolvePath,
  runScenario,
  type Scenario,
  type ScenarioEntry,
} from './scenario'
import { testContent } from './content'
import { reduce } from '../kernel'
import { deserialize, serialize } from '../save'
import { createRngState } from '../rng'
import { formatDate } from '../time'

const index = testContent()

const crossing: Scenario = {
  id: 'scenario.test.crossing',
  seed: 'scenario-001',
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
    { type: 'talkTo', character: 'char.ugarit.amnit' },
    { type: 'chooseDialogue', choice: 0 },
    { type: 'chooseDialogue', choice: 1 },
    { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' },
    { type: 'resolveEncounter', choice: 0 },
    { type: 'resolveEncounter', choice: 0 },
  ],
  assert: [
    { path: 'player.location', equals: 'dest.cyprus' },
    { path: 'calendar.day', equals: 93 },
    { path: 'knowledge.knownDestinations', contains: 'dest.cyprus' },
    { path: 'narrative.relationships.char.ugarit.amnit.trust', equals: 1 },
  ],
}

describe('resolvePath', () => {
  it('walks objects and arrays', () => {
    const value = { a: { b: [{ c: 3 }] } }
    expect(resolvePath(value, 'a.b.0.c')).toBe(3)
    expect(resolvePath(value, 'a.b.1.c')).toBeUndefined()
    expect(resolvePath(value, 'a.missing.c')).toBeUndefined()
    expect(resolvePath(value, '')).toBe(value)
  })
})

describe('runScenario', () => {
  it('runs an end-to-end crossing and passes its assertions', () => {
    const result = runScenario(crossing, index)
    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)
    // The trailing encounter answers may be one more than the crossing drew.
    expect(result.steps.slice(0, 5).every((step) => step.accepted)).toBe(true)
    expect(result.finalState.player.location).toBe('dest.cyprus')
    // Every event the run emitted was numbered, and the counter ends where they do.
    const emitted = result.steps.reduce((sum, step) => sum + step.eventTypes.length, 0)
    expect(result.finalState.meta.eventSequence).toBe(emitted)
  })

  it('saves mid-crossing, reloads, and finishes exactly as the live run does', () => {
    const opening = runScenario(
      { ...crossing, id: 'scenario.test.crossing-first-half', commands: crossing.commands.slice(0, 5), assert: [] },
      index,
    )
    const text = JSON.stringify(
      serialize(opening.finalState, { savedAt: '2026-11-26T00:00:00.000Z' }),
    )
    const loaded = deserialize(JSON.parse(text))
    if (!loaded.ok) throw new Error(loaded.error.message)

    expect(loaded.state).toEqual(opening.finalState)

    const play = (from: typeof opening.finalState, entries: ScenarioEntry[]) => {
      let state = from
      for (const entry of entries) {
        if (isScenarioAction(entry)) continue
        const result = reduce(state, entry, index)
        if (!result.rejected) state = result.state
      }
      return state
    }

    const direct = play(opening.finalState, crossing.commands.slice(5))
    const resumed = play(loaded.state, crossing.commands.slice(5))

    expect(JSON.stringify(resumed)).toBe(JSON.stringify(direct))
    expect(resumed.player.location).toBe('dest.cyprus')
    expect(resumed.calendar.day).toBe(93)
  })

  it('records a rejected command without failing the run', () => {
    const scenario: Scenario = {
      ...crossing,
      id: 'scenario.test.rejected',
      commands: [{ type: 'buy', item: 'good.nothing', quantity: 1 }],
      assert: [{ path: 'calendar.day', equals: 90 }],
    }
    const result = runScenario(scenario, index)
    expect(result.ok).toBe(true)
    expect(result.steps[0]?.accepted).toBe(false)
    expect(result.steps[0]?.reason).toBe('This market does not sell that.')
  })

  it('fails with a readable diff when an assertion is wrong', () => {
    const scenario: Scenario = {
      ...crossing,
      id: 'scenario.test.failing',
      assert: [{ path: 'player.location', equals: 'dest.byblos' }],
    }
    const result = runScenario(scenario, index)
    expect(result.ok).toBe(false)
    expect(result.failures[0]?.message).toBe('expected "dest.byblos", found "dest.cyprus"')

    const trace = formatTrace(result)
    expect(trace).toContain('FAILED')
    expect(trace).toContain('! player.location')
  })

  it('changes outcome when the seed changes the encounter draw', () => {
    const a = runScenario({ ...crossing, seed: 'seed-one' }, index)
    const b = runScenario({ ...crossing, seed: 'seed-two' }, index)
    expect(JSON.stringify(a.finalState.rng)).not.toBe(JSON.stringify(b.finalState.rng))
  })

  it('supports length and contains assertions', () => {
    const result = runScenario(
      {
        ...crossing,
        id: 'scenario.test.length',
        assert: [
          { path: 'knowledge.journalEntries', length: 0 },
          { path: 'player.inventory.0.item', equals: 'good.grain' },
        ],
      },
      index,
    )
    expect(result.ok).toBe(false)
    expect(result.failures[0]?.message).toContain('expected length 0')
  })
})

/**
 * A new run through the real new-game path: `createInitialState` builds the state, the
 * kernel fires the destination's arrival scene, and the runner asserts the opening a
 * player actually gets. This is the M1-T01 mechanic end to end.
 */
describe('a new run', () => {
  const newRun: Scenario = {
    id: 'scenario.test.new-run',
    seed: 'scenario-new-001',
    newGame: true,
    start: {
      date: '1230-04-01',
      location: 'dest.ugarit',
      money: 40,
      capacity: 20,
      languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
      knownDestinations: ['dest.ugarit'],
      knownRoutes: [],
      inventory: [{ item: 'good.oil', quantity: 2 }],
    },
    commands: [],
    assert: [
      { path: 'player.location', equals: 'dest.ugarit' },
      { path: 'calendar.day', equals: 90 },
      { path: 'player.money', equals: 40 },
      { path: 'player.capacity', equals: 20 },
      { path: 'player.inventory', length: 1 },
      { path: 'knowledge.journalEntries', length: 0 },
      { path: 'meta.saveVersion', equals: 6 },
      { path: 'narrative.pending.dialogue', equals: 'dlg.test.arrival' },
      { path: 'narrative.pending.node', equals: 'gate' },
      { path: 'narrative.storyletCooldowns.evt.test.arrival', equals: 90 },
    ],
  }

  it('opens on the arrival scene with the requested opening state', () => {
    const result = runScenario(newRun, index)

    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.steps).toEqual([])
    expect(result.finalState.player.identity.selfName).toBe('e-ma-a₂')
  })

  it('builds the same opening twice from one seed', () => {
    const first = runScenario(newRun, index).finalState
    const second = runScenario(newRun, index).finalState

    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
  })

  it('changes only the seeded streams when the seed changes', () => {
    const one = runScenario(newRun, index).finalState
    const two = runScenario({ ...newRun, seed: 'scenario-new-002' }, index).finalState

    expect(one.rng).not.toEqual(two.rng)
    expect(one.player).toEqual(two.player)
    expect(one.calendar).toEqual(two.calendar)
    expect(one.narrative.pending).toEqual(two.narrative.pending)
  })
})

/**
 * The calendar's end-to-end case: a run that opens on the last day of the year crosses
 * into the next year by commanding days, and jumps the reducer will not allow are
 * refused with a reason while the clock stays put.
 */
describe('the calendar across a year boundary', () => {
  const yearEnd: Scenario = {
    id: 'scenario.test.year-end',
    seed: 'scenario-clock',
    start: { date: '1230-13-04', location: 'dest.ugarit' },
    commands: [
      { type: 'advanceTime', days: 1 },
      { type: 'advanceTime', days: 1 },
      { type: 'rest', days: 3 },
      { type: 'advanceTime', days: 400 },
      { type: 'rest', days: 0 },
    ],
    assert: [
      { path: 'calendar.day', equals: 368 },
      { path: 'player.location', equals: 'dest.ugarit' },
    ],
  }

  it('rolls the year while ordinary commands move the clock', () => {
    const result = runScenario(yearEnd, index)

    expect(result.failures).toEqual([])
    expect(result.steps.map((step) => step.accepted)).toEqual([true, true, true, false, false])
    expect(result.steps[0]?.eventTypes).toEqual(['TimeAdvanced'])
    expect(result.steps[3]?.reason).toBe('Time cannot pass that way.')
    expect(result.steps[4]?.reason).toBe('You can rest for between one and thirty days.')
    expect(result.finalState.calendar.day).toBe(368)
    expect(formatDate(result.finalState.calendar.day)).toBe('1229-01-04')
  })
})

/**
 * The RNG's end-to-end case, built on the crossing fixture: a journey draws its encounters
 * from the `encounters` and `travel` streams, the kernel writes the drawn state back to
 * the save, streams nobody drew from keep their seeded values, and one seed replays one
 * run.
 */
describe('seeded draws across a crossing', () => {
  const seeded: Scenario = {
    ...crossing,
    id: 'scenario.test.seeded-draws',
    seed: 'scenario-seed-a',
    commands: [
      { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' },
      { type: 'resolveEncounter', choice: 0 },
      { type: 'resolveEncounter', choice: 0 },
    ],
    assert: [{ path: 'player.location', equals: 'dest.cyprus' }],
  }

  it('advances the streams it drew from and leaves the others alone', () => {
    const result = runScenario(seeded, index)
    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)

    const start = createRngState(seeded.seed)
    expect(result.finalState.rng.encounters).not.toBe(start.encounters)
    for (const stream of ['market', 'flavour', 'tests'] as const) {
      expect(result.finalState.rng[stream]).toBe(start[stream])
    }
  })

  it('replays one seed identically and draws a different run from another', () => {
    const firstRun = runScenario(seeded, index)
    const again = runScenario(seeded, index)
    const otherRun = runScenario({ ...seeded, seed: 'scenario-seed-b' }, index)
    const first = firstRun.finalState
    const other = otherRun.finalState

    expect(JSON.stringify(again.finalState)).toBe(JSON.stringify(first))
    expect(other.rng).not.toEqual(first.rng)
    expect(other.player.location).toBe(first.player.location)
    expect(other.calendar).toEqual(first.calendar)
    // The fixed squall grants the same language xp on every seeding; the second seed
    // changes which random encounter is drawn, and so the shape of the crossing.
    expect(otherRun.steps).not.toEqual(firstRun.steps)
  })
})

/**
 * The DSL's end-to-end case, over the opening scene's gate: one answered line carries the
 * three effects the milestone approved — a named relationship dimension, a deed, and a
 * piece of knowledge — through the real choice command into the save.
 */
describe('a choice that changes the world through effects', () => {
  const dslEffects: Scenario = {
    id: 'scenario.test.dsl-effects',
    seed: 'scenario-dsl',
    newGame: true,
    start: { location: 'dest.ugarit' },
    commands: [{ type: 'chooseDialogue', choice: 1 }],
    assert: [
      { path: 'narrative.relationships.char.ugarit.amnit.respect', equals: 2 },
      { path: 'player.deeds', length: 1 },
      { path: 'player.deeds.0.id', equals: 'deed.test.declared-load' },
      { path: 'player.deeds.0.place', equals: 'dest.ugarit' },
      { path: 'knowledge.entries', length: 1 },
      { path: 'knowledge.entries.0.fact', equals: 'ugarit.gate-count' },
      { path: 'knowledge.entries.0.source', equals: 'witnessed' },
      { path: 'knowledge.entries.0.reliability', equals: 0.8 },
    ],
  }

  it('records the dimension, the deed and the knowledge in one command', () => {
    const result = runScenario(dslEffects, index)

    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.steps.map((step) => step.accepted)).toEqual([true])
    expect(result.finalState.narrative.pending).toBeNull()
  })

  it('replays the same choice identically', () => {
    const first = runScenario(dslEffects, index).finalState
    const again = runScenario(dslEffects, index).finalState

    expect(JSON.stringify(again)).toBe(JSON.stringify(first))
  })
})

/**
 * The content registry's end-to-end case: the market the pack declares is what the trade
 * commands read. Goods weight comes from the pack (grain 2, copper 4), so a hold of ten
 * fits five grain and no copper beside it; stock and base price come from the same entry.
 */
describe('a trade decided by pack data', () => {
  const registry: Scenario = {
    id: 'scenario.test.registry',
    seed: 'scenario-registry',
    start: {
      date: '1230-04-01',
      location: 'dest.ugarit',
      money: 120,
      capacity: 10,
      languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    },
    commands: [
      { type: 'buy', item: 'good.grain', quantity: 5 },
      { type: 'buy', item: 'good.copper', quantity: 1 },
      { type: 'sell', item: 'good.grain', quantity: 2 },
    ],
    assert: [
      { path: 'player.inventory', length: 1 },
      { path: 'player.inventory.0.item', equals: 'good.grain' },
      { path: 'player.inventory.0.quantity', equals: 3 },
      { path: 'player.capacity', equals: 10 },
    ],
  }

  it('reads weight and stock from the pack and refuses what does not fit', () => {
    const result = runScenario(registry, index)

    expect(result.failures).toEqual([])
    expect(result.steps.map((step) => step.accepted)).toEqual([true, false, true])
    expect(result.steps[1]?.reason).toBe('Your cargo cannot hold that much (10 of 10 used).')
    expect(result.steps[0]?.eventTypes).toEqual(['MoneyChanged', 'ItemChanged'])
  })

  it('trades identically twice from one seed', () => {
    const first = runScenario(registry, index).finalState
    const again = runScenario(registry, index).finalState

    expect(JSON.stringify(again)).toBe(JSON.stringify(first))
  })
})

/**
 * The runner's own contract: entry kinds and assertion kinds are registries, a failure
 * names the scenario, seed and step, and one scenario replays to the same state and the
 * same trace.
 */
describe('the runner', () => {
  const saveStep: Scenario = {
    ...crossing,
    id: 'scenario.test.save-step',
    commands: [
      ...crossing.commands.slice(0, 5),
      { kind: 'save' },
      ...crossing.commands.slice(5),
    ],
  }

  it('round-trips a save step inside a run and finishes where the plain run does', () => {
    const withSave = runScenario(saveStep, index)
    const plain = runScenario(crossing, index)

    expect(withSave.failures).toEqual([])
    expect(withSave.steps.map((step) => step.kind)).toEqual([
      'command',
      'command',
      'command',
      'command',
      'command',
      'save',
      'command',
      'command',
    ])
    expect(withSave.steps[5]?.accepted).toBe(true)
    expect(withSave.finalState).toEqual(plain.finalState)
  })

  it('refuses an unknown action kind with a reason, not a throw', () => {
    const unknown = {
      ...crossing,
      id: 'scenario.test.unknown-action',
      commands: [{ kind: 'teleport' }],
      assert: [{ step: 0, path: 'reason', equals: 'Unknown scenario action "teleport".' }],
    } as unknown as Scenario

    const result = runScenario(unknown, index)

    expect(result.failures).toEqual([])
    expect(result.steps[0]?.kind).toBe('teleport')
    expect(result.steps[0]?.accepted).toBe(false)
  })

  it('asserts on the events a run emitted, by type and by payload', () => {
    const result = runScenario(
      {
        ...crossing,
        id: 'scenario.test.events',
        assert: [
          { target: 'events', path: 'types', contains: 'MoneyChanged' },
          { target: 'events', path: 'types', contains: 'JourneyStarted' },
          { target: 'events', path: 'events.0.type', equals: 'MoneyChanged' },
          { target: 'events', path: 'events.0.delta', equals: -8 },
          { step: 4, path: 'eventTypes', contains: 'JourneyStarted' },
        ],
      },
      index,
    )

    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('records a clamp the DSL applied as an ordinary step event', () => {
    const clamped: Scenario = {
      id: 'scenario.test.clamped',
      seed: 'scenario-clamp',
      newGame: true,
      start: { location: 'dest.ugarit' },
      commands: [{ type: 'chooseDialogue', choice: 2 }],
      assert: [
        { step: 0, path: 'eventTypes', contains: 'EffectClamped' },
        { target: 'events', path: 'types', contains: 'EffectClamped' },
        { target: 'events', path: 'events.0.delta', equals: 5 },
        { target: 'events', path: 'events.1.type', equals: 'RegardChanged' },
        { target: 'events', path: 'events.2.type', equals: 'EffectClamped' },
        { target: 'events', path: 'events.2.requested', equals: 10 },
        { target: 'events', path: 'events.2.applied', equals: 5 },
        { target: 'events', path: 'events.2.reason', equals: 'dimension capped' },
        { path: 'narrative.relationships.char.ugarit.amnit.respect', equals: 5 },
      ],
    }

    const result = runScenario(clamped, index)

    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('names the scenario, the seed and the failing step in the trace', () => {
    const failing: Scenario = {
      ...crossing,
      id: 'scenario.test.trace',
      assert: [
        { path: 'player.location', equals: 'dest.byblos' },
        { step: 9, path: 'accepted', equals: true },
      ],
    }

    const result = runScenario(failing, index)
    const trace = formatTrace(result)

    expect(result.ok).toBe(false)
    expect(trace).toContain('scenario scenario.test.trace (seed "scenario-001") — FAILED')
    expect(trace).toContain('! player.location: expected "dest.byblos", found "dest.cyprus"')
    expect(trace).toContain('! step 9 · accepted: step 9 does not exist in this run')
    expect(result.failures.map((failure) => failure.step)).toEqual([undefined, 9])
  })

  it('replays one scenario to the same state and the same trace', () => {
    const first = runScenario(crossing, index)
    const again = runScenario(crossing, index)

    expect(JSON.stringify(again.steps)).toBe(JSON.stringify(first.steps))
    expect(formatTrace(again)).toBe(formatTrace(first))
    expect(JSON.stringify(again.finalState)).toBe(JSON.stringify(first.finalState))
  })

  it('keeps assertions true across a different seed when the seed cannot matter', () => {
    const one = runScenario({ ...crossing, seed: 'seed-a' }, index)
    const two = runScenario({ ...crossing, seed: 'seed-b' }, index)

    expect(one.ok).toBe(true)
    expect(two.ok).toBe(true)
    expect(one.finalState.calendar.day).toBe(two.finalState.calendar.day)
  })
})

describe('the runner against malformed scenarios', () => {
  it('refuses an unbuildable opening with a typed failure naming the field', () => {
    const badDate = {
      ...crossing,
      id: 'scenario.test.bad-date',
      start: { ...crossing.start, date: 'not-a-date' },
    } as Scenario
    const result = runScenario(badDate, index)

    expect(result.ok).toBe(false)
    expect(result.steps).toEqual([])
    expect(result.failures).toEqual([
      { path: 'start.date', message: '"not-a-date" is not a valid game date (expected YYYY-MM-DD)' },
    ])
    expect(formatTrace(result)).toContain('scenario scenario.test.bad-date (seed "scenario-001") — FAILED')

    const badOverride = {
      ...crossing,
      id: 'scenario.test.bad-start',
      start: { ...crossing.start, money: -5 },
    } as Scenario
    const refused = runScenario(badOverride, index)

    expect(refused.ok).toBe(false)
    expect(refused.failures[0]?.path).toBe('start')
    expect(refused.failures[0]?.message).toContain('The opening state was refused')
  })

  it('turns a handler that throws into a step failure, not a runner crash', () => {
    const throwing = {
      get type(): string {
        throw new Error('boom')
      },
    } as unknown as ScenarioEntry
    const scenario: Scenario = {
      ...crossing,
      id: 'scenario.test.throwing-step',
      commands: [throwing],
      assert: [{ step: 0, path: 'reason', equals: 'The runner could not run this step: boom' }],
    }

    const result = runScenario(scenario, index)

    expect(result.failures).toEqual([])
    expect(result.steps[0]?.accepted).toBe(false)
  })
})
