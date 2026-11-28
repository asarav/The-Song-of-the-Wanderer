/**
 * Boundary contract for the `kernel` module (M1-T06).
 *
 * Imports only the module's public surface, as every other module must. The milestone's
 * promises are the ones asserted here: every command is a `{ schema, run }` registry
 * entry, a rejection returns the original state with a reason and no events, the event
 * sequence only grows, and no command can mutate the state it is handed.
 */

import { describe, expect, it } from 'vitest'

import { createInitialState, deepFreeze, type GameState } from '@engine/state'
import { testContent } from '@engine/testing'
import {
  COMMAND_REGISTRY,
  COMMAND_SCHEMAS,
  commandNames,
  commandTypeOf,
  eventTypes,
  eventsOfType,
  isEventOfType,
  newGame,
  reduce,
  type Command,
} from '@engine/kernel'

const index = testContent()

function fresh(overrides: Partial<Parameters<typeof createInitialState>[0]> = {}): GameState {
  return createInitialState({
    seed: 'kernel-contract',
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
    knownRoutes: ['route.ugarit-cyprus'],
    ...overrides,
  })
}

const intents: Command[] = [
  { type: 'advanceTime', days: 1 },
  { type: 'rest', days: 1 },
  { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.coastal' },
  { type: 'buy', item: 'good.grain', quantity: 1 },
  { type: 'sell', item: 'good.copper', quantity: 1 },
  { type: 'talkTo', character: 'char.ugarit.amnit' },
  { type: 'resolveEncounter', choice: 0 },
  { type: 'chooseDialogue', choice: 0 },
  { type: 'chooseChoice', choiceId: 'go-up-the-hill' },
]

describe('kernel module public surface', () => {
  it('publishes the command vocabulary as a registry', () => {
    expect(commandNames()).toEqual([
      'advanceTime',
      'buy',
      'chooseChoice',
      'chooseDialogue',
      'resolveEncounter',
      'rest',
      'sell',
      'talkTo',
      'travel',
      'work',
    ])
    expect(Object.keys(COMMAND_REGISTRY).sort()).toEqual(commandNames())
    expect(Object.keys(COMMAND_SCHEMAS).sort()).toEqual(commandNames())

    for (const name of commandNames()) {
      expect(typeof COMMAND_REGISTRY[name].schema.safeParse).toBe('function')
      expect(typeof COMMAND_REGISTRY[name].run).toBe('function')
      expect(commandTypeOf({ type: name })).toBe(name)
    }
    expect(commandTypeOf({ type: 'teleport' })).toBeNull()
  })

  it('never mutates the state it is given, even deep-frozen, for any command', () => {
    const state = deepFreeze(fresh({ inventory: [{ item: 'good.copper', quantity: 1 }] }))
    const before = JSON.stringify(state)

    for (const intent of intents) {
      expect(() => reduce(state, intent, index), intent.type).not.toThrow()
    }
    expect(JSON.stringify(state)).toBe(before)
  })

  it('returns the original state and no events when it refuses', () => {
    const state = fresh()
    const result = reduce(state, { type: 'buy', item: 'good.nothing', quantity: 1 }, index)

    expect(result.rejected?.reason).toBe('This market does not sell that.')
    expect(result.state).toBe(state)
    expect(result.events).toEqual([])
  })

  it('numbers events in one growing sequence across commands', () => {
    const first = reduce(fresh(), { type: 'buy', item: 'good.grain', quantity: 1 }, index)
    const second = reduce(first.state, { type: 'buy', item: 'good.grain', quantity: 1 }, index)

    expect(first.events.map((entry) => entry.sequence)).toEqual([1, 2])
    expect(second.events.map((entry) => entry.sequence)).toEqual([3, 4])
    expect(second.state.meta.eventSequence).toBe(4)
    expect(eventTypes(first)).toEqual(['MoneyChanged', 'ItemChanged'])
    expect(isEventOfType(first.events[0]!.event, 'MoneyChanged')).toBe(true)
    expect(eventsOfType(first.events, 'MoneyChanged')).toEqual([
      { type: 'MoneyChanged', delta: -4, money: 96 },
    ])
    expect(eventsOfType(first.events, 'ItemChanged')).toHaveLength(1)
    expect(eventsOfType(first.events, 'TimeAdvanced')).toEqual([])
  })

  it('matches the golden event list for one purchase', () => {
    const result = reduce(fresh(), { type: 'buy', item: 'good.grain', quantity: 2 }, index)

    expect(result.events).toEqual([
      { sequence: 1, event: { type: 'MoneyChanged', delta: -8, money: 92 } },
      { sequence: 2, event: { type: 'ItemChanged', item: 'good.grain', delta: 2, quantity: 2 } },
    ])
  })

  it('is deterministic for one state and one command', () => {
    const runIt = () => JSON.stringify(reduce(fresh(), intents[3]!, index))
    expect(runIt()).toBe(runIt())
  })

  it('rejects an unregistered command without throwing', () => {
    const result = reduce(fresh(), { type: 'teleport' } as unknown as Command, index)

    expect(result.rejected?.reason).toBe('That is not something you can do.')
    expect(result.events).toEqual([])
  })

  it('opens a new game through the same kernel', () => {
    const { state, events } = newGame({ seed: 'kernel-contract', location: 'dest.ugarit' }, index)

    expect(state.player.location).toBe('dest.ugarit')
    expect(state.narrative.pending?.dialogue).toBe('dlg.test.arrival')
    expect(events.map((entry) => entry.event.type)).toEqual(['EventFired', 'DialoguePresented'])
    expect(state.meta.eventSequence).toBe(2)
  })
})
