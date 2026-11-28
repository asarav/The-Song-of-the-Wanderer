import { describe, expect, it } from 'vitest'

import { deriveScene } from '../narrative'
import { createDslContent } from '../content'
import { createInitialState } from '../state'
import { deepFreeze } from '../state'
import { commandNames, commandTypeOf, type Command, type CommandType } from './commands'
import { COMMAND_REGISTRY, reduce, type CommandResult } from './reduce'
import { testContent } from '../testing'
import type { GameState } from '../state'

const index = testContent()

function start(overrides: Partial<Parameters<typeof createInitialState>[0]> = {}): GameState {
  return createInitialState({
    seed: 'reduce-001',
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownRoutes: ['route.ugarit-cyprus', 'route.ugarit-inland'],
    knownDestinations: ['dest.ugarit', 'dest.cyprus'],
    ...overrides,
  })
}

function run(state: GameState, command: Command): CommandResult {
  return reduce(state, command, index)
}

function apply(state: GameState, command: Command): GameState {
  const result = run(state, command)
  if (result.rejected) throw new Error(`unexpected rejection: ${result.rejected.reason}`)
  return result.state
}

describe('buy', () => {
  it('takes money, adds cargo, and emits sequenced events', () => {
    const state = start()
    const result = run(state, { type: 'buy', item: 'good.grain', quantity: 2 })

    expect(result.rejected).toBeUndefined()
    expect(result.state.player.money).toBe(92)
    expect(result.state.player.inventory).toEqual([
      { item: 'good.grain', quantity: 2, costBasis: 8 },
    ])
    expect(result.events.map((entry) => entry.event.type)).toEqual(['MoneyChanged', 'ItemChanged'])
    expect(result.events.map((entry) => entry.sequence)).toEqual([1, 2])
  })

  it('rejects what the player cannot afford, carry, or find', () => {
    const poor = start({ money: 1 })
    expect(run(poor, { type: 'buy', item: 'good.grain', quantity: 1 }).rejected?.reason).toBe(
      'You cannot afford that.',
    )

    const loaded = start({ capacity: 2 })
    expect(run(loaded, { type: 'buy', item: 'good.grain', quantity: 2 }).rejected?.reason).toContain(
      'cannot hold',
    )

    expect(run(start(), { type: 'buy', item: 'good.nothing', quantity: 1 }).rejected?.reason).toBe(
      'This market does not sell that.',
    )
    expect(run(start(), { type: 'buy', item: 'good.grain', quantity: 0 }).rejected?.reason).toBe(
      'Choose a whole number of goods to buy.',
    )
    expect(run(start(), { type: 'buy', item: 'good.grain', quantity: 999 }).rejected?.reason).toBe(
      'There is not that much on offer.',
    )
  })

  it('computes a haggled price from the local language', () => {
    const fluent = start({ languages: { 'lang.akkadian': { xp: 200, tier: 'fluent' } } })
    const conversation = run(fluent, { type: 'buy', item: 'good.grain', quantity: 1 })
    expect(conversation.state.player.money).toBe(96)
  })

  it('records what the purchase cost and releases it as the cargo is sold', () => {
    const bought = apply(start(), { type: 'buy', item: 'good.grain', quantity: 2 })
    expect(bought.player.inventory).toEqual([
      { item: 'good.grain', quantity: 2, costBasis: 8 },
    ])

    const sold = apply(bought, { type: 'sell', item: 'good.grain', quantity: 1 })
    expect(sold.player.inventory).toEqual([
      { item: 'good.grain', quantity: 1, costBasis: 4 },
    ])
    expect(sold.player.money).toBe(95)
  })
})

describe('sell', () => {
  it('removes cargo and pays for it', () => {
    const state = start({ inventory: [{ item: 'good.copper', quantity: 2 }] })
    const result = run(state, { type: 'sell', item: 'good.copper', quantity: 1 })

    expect(result.rejected).toBeUndefined()
    expect(result.state.player.inventory).toEqual([{ item: 'good.copper', quantity: 1 }])
    expect(result.state.player.money).toBeGreaterThan(100)
  })

  it('releases a proportional share of cost when only part of a stack is sold', () => {
    const state = start({
      inventory: [{ item: 'good.copper', quantity: 3, costBasis: 10 }],
    })
    const result = run(state, { type: 'sell', item: 'good.copper', quantity: 1 })

    expect(result.state.player.inventory).toEqual([
      { item: 'good.copper', quantity: 2, costBasis: 7 },
    ])
  })

  it('refuses to sell what is not carried, or what is protected', () => {
    expect(run(start(), { type: 'sell', item: 'good.copper', quantity: 1 }).rejected?.reason).toBe(
      'You are not carrying that much.',
    )
    const protectedState = start({ inventory: [{ item: 'good.copper', quantity: 1, protected: true }] })
    expect(
      run(protectedState, { type: 'sell', item: 'good.copper', quantity: 1 }).rejected?.reason,
    ).toBe('You are not carrying that much.')
  })
})

describe('talkTo and dialogue', () => {
  it('opens a conversation and records the meeting in the index', () => {
    const result = run(start(), { type: 'talkTo', character: 'char.ugarit.amnit' })
    expect(result.rejected).toBeUndefined()
    expect(result.state.narrative.pending).toMatchObject({
      kind: 'dialogue',
      dialogue: 'dlg.ugarit.amnit.meeting',
      node: 'greet',
    })
    expect(result.state.knowledge.characterIndex['char.ugarit.amnit']?.name).toBe('Amnit')
  })

  it('refuses to talk to someone who is not here', () => {
    expect(run(start(), { type: 'talkTo', character: 'char.cyprus.kinyras' }).rejected?.reason).toBe(
      'Kinyras is not here.',
    )
    expect(run(start(), { type: 'talkTo', character: 'char.nobody' }).rejected?.reason).toBe(
      'There is no one of that name here.',
    )
  })

  it('names the speaker when the traveller tries to talk over an open scene', () => {
    const opened = apply(start(), { type: 'talkTo', character: 'char.ugarit.amnit' })
    expect(run(opened, { type: 'talkTo', character: 'char.ugarit.amnit' }).rejected?.reason).toBe(
      'Amnit is still speaking. Answer the scene first.',
    )
  })

  it('applies a choice effect and advances the node', () => {
    const opened = apply(start(), { type: 'talkTo', character: 'char.ugarit.amnit' })
    const chosen = run(opened, { type: 'chooseDialogue', choice: 0 })

    expect(chosen.rejected).toBeUndefined()
    expect(chosen.state.narrative.relationships['char.ugarit.amnit']?.trust).toBe(1)
    expect(chosen.state.narrative.pending).toMatchObject({ node: 'laughs' })
  })

  it('ends the scene when a choice has no next node', () => {
    const opened = apply(start(), { type: 'talkTo', character: 'char.ugarit.amnit' })
    const ended = run(opened, { type: 'chooseDialogue', choice: 1 })

    expect(ended.state.narrative.pending).toBeNull()
    expect(ended.events.map((entry) => entry.event.type)).toContain('DialogueEnded')
  })

  it('hides a choice whose conditions fail and rejects it when forced', () => {
    const opened = apply(start(), { type: 'talkTo', character: 'char.ugarit.amnit' })
    const laughs = apply(opened, { type: 'chooseDialogue', choice: 0 })
    const scene = deriveScene(laughs, index, createDslContent(index))

    expect(scene?.choices.map((choice) => choice.available)).toEqual([false, true])
    expect(run(laughs, { type: 'chooseDialogue', choice: 0 }).rejected?.reason).toBe(
      'You cannot follow where this would lead.',
    )
  })

  it('shows a language variant once the player can read it', () => {
    const opened = apply(start(), { type: 'talkTo', character: 'char.ugarit.amnit' })
    const laughs = apply(opened, { type: 'chooseDialogue', choice: 0 })
    const scene = deriveScene(laughs, index, createDslContent(index))
    expect(scene?.text).toBe('Then sit where the light is.')

    const fluent = apply(
      start({ languages: { 'lang.akkadian': { xp: 300, tier: 'deep' } } }),
      { type: 'talkTo', character: 'char.ugarit.amnit' },
    )
    const fluentLaughs = apply(fluent, { type: 'chooseDialogue', choice: 0 })
    expect(deriveScene(fluentLaughs, index, createDslContent(index))?.text).toBe(
      'Then you will want the good end of the table.',
    )
  })

  it('rejects a nonsense answer', () => {
    const opened = apply(start(), { type: 'talkTo', character: 'char.ugarit.amnit' })
    expect(run(opened, { type: 'chooseDialogue', choice: 9 }).rejected?.reason).toBe(
      'That is not one of the answers available.',
    )
    expect(run(start(), { type: 'chooseDialogue', choice: 0 }).rejected?.reason).toBe(
      'There is nothing to answer.',
    )
  })
})

describe('travel', () => {
  it('rejects an unknown or unheard-of route', () => {
    expect(run(start(), { type: 'travel', route: 'route.none', mode: 'mode.coastal' }).rejected?.reason).toBe(
      'There is no such crossing.',
    )
    const unknowing = start({ knownRoutes: [] })
    expect(
      run(unknowing, { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.coastal' }).rejected
        ?.reason,
    ).toBe('You have not heard of this crossing.')
  })

  it('rejects an unmet requirement with the authored note', () => {
    expect(
      run(start(), { type: 'travel', route: 'route.ugarit-inland', mode: 'mode.walking' }).rejected
        ?.reason,
    ).toBe('A pass is needed on this road.')
  })

  it('rejects a mode that does not exist or cannot be paid for', () => {
    expect(
      run(start(), { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.flying' }).rejected
        ?.reason,
    ).toBe('There is no such way to travel.')

    const poor = start({ money: 1 })
    expect(
      run(poor, { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' }).rejected?.reason,
    ).toBe('You cannot pay the passage.')
  })

  it('rejects cargo heavier than the passage allows', () => {
    const heavy = start({ inventory: [{ item: 'good.copper', quantity: 6 }], capacity: 40 })
    expect(
      run(heavy, { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.coastal' }).rejected
        ?.reason,
    ).toBe('Your cargo is too heavy for this passage.')
  })

  it('departs, pays the fare, and puts the player on the route', () => {
    const result = run(start(), { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.coastal' })
    expect(result.rejected).toBeUndefined()
    expect(result.state.player.money).toBe(92)
    expect(result.state.player.location).toBe('route.ugarit-cyprus')
    expect(result.state.narrative.journey).not.toBeNull()
    expect(result.events.map((entry) => entry.event.type)).toContain('JourneyStarted')
  })

  it('resolves every encounter and arrives at the destination', () => {
    let state = apply(start(), { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' })

    for (let guard = 0; guard < 10 && state.narrative.pending; guard += 1) {
      state = apply(state, { type: 'resolveEncounter', choice: 0 })
    }

    expect(state.player.location).toBe('dest.cyprus')
    expect(state.narrative.journey).toBeNull()
    expect(state.knowledge.knownDestinations).toContain('dest.cyprus')
    expect(state.player.deeds.some((deed) => deed.kind === 'travelled')).toBe(true)
  })

  it('sails the corridor home from its far end', () => {
    let state = apply(start({ location: 'dest.cyprus' }), {
      type: 'travel',
      route: 'route.ugarit-cyprus',
      mode: 'mode.open',
    })

    expect(state.narrative.journey?.origin).toBe('dest.cyprus')
    expect(state.narrative.journey?.destination).toBe('dest.ugarit')

    for (let guard = 0; guard < 10 && state.narrative.pending; guard += 1) {
      state = apply(state, { type: 'resolveEncounter', choice: 0 })
    }

    expect(state.player.location).toBe('dest.ugarit')
    expect(state.narrative.journey).toBeNull()

    const deed = state.player.deeds.at(-1)
    expect(deed?.place).toBe('dest.ugarit')
    expect(deed?.subject).toBe('route.ugarit-cyprus')
  })

  it('resumes identically when the save is taken mid-crossing', () => {
    const departed = apply(start(), { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' })
    const snapshot = JSON.parse(JSON.stringify(departed)) as GameState

    let direct = departed
    let resumed = snapshot
    for (let guard = 0; guard < 10 && direct.narrative.pending; guard += 1) {
      direct = apply(direct, { type: 'resolveEncounter', choice: 0 })
      resumed = apply(resumed, { type: 'resolveEncounter', choice: 0 })
    }

    expect(JSON.stringify(resumed)).toBe(JSON.stringify(direct))
  })

  it('refuses a second departure while already travelling', () => {
    const departed = apply(start(), { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' })
    expect(
      run(departed, { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' }).rejected
        ?.reason,
    ).toBe('You are already on the road.')
  })
})

describe('time', () => {
  it('advances the calendar and fires scheduled events', () => {
    const state = start()
    state.world.scheduled.push({ event: 'evt.test.letter', dueDay: 2 })

    const result = run(state, { type: 'advanceTime', days: 3 })

    expect(result.rejected).toBeUndefined()
    expect(result.state.calendar.day).toBe(3)
    expect(result.state.knowledge.journalEntries).toContain('journal.test.letter')
    expect(result.events.map((entry) => entry.event.type)).toContain('EventFired')
    expect(result.state.world.scheduled).toHaveLength(0)
  })

  it('fires a once-only event only once', () => {
    const state = start()
    state.world.scheduled.push({ event: 'evt.test.letter', dueDay: 1 })
    const first = apply(state, { type: 'advanceTime', days: 1 })

    first.world.scheduled.push({ event: 'evt.test.letter', dueDay: 5 })
    const second = apply(first, { type: 'advanceTime', days: 5 })
    expect(second.knowledge.journalEntries.filter((id) => id === 'journal.test.letter')).toHaveLength(1)
  })

  it('does not fire an event whose scope excludes the player', () => {
    const state = start({ location: 'dest.cyprus' })
    state.world.scheduled.push({ event: 'evt.test.letter', dueDay: 1 })
    const result = apply(state, { type: 'advanceTime', days: 1 })
    expect(result.knowledge.journalEntries).not.toContain('journal.test.letter')
  })

  it('rejects impossible time jumps and travel-time meddling', () => {
    expect(run(start(), { type: 'advanceTime', days: -1 }).rejected?.reason).toBe(
      'Time cannot pass that way.',
    )
    expect(run(start(), { type: 'advanceTime', days: 400 }).rejected?.reason).toBe(
      'Time cannot pass that way.',
    )
    const departed = apply(start(), { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' })
    expect(run(departed, { type: 'advanceTime', days: 1 }).rejected?.reason).toBe(
      'You are already on the road.',
    )
  })

  it('rests for a bounded number of days', () => {
    expect(apply(start(), { type: 'rest', days: 3 }).calendar.day).toBe(3)
    const tired = start()
    tired.player.stamina = 1
    expect(apply(tired, { type: 'rest', days: 3 }).player.stamina).toBe(7)
    expect(run(start(), { type: 'rest', days: 0 }).rejected?.reason).toBe(
      'You can rest for between one and thirty days.',
    )
  })

  it('lets one authored night event fire after a day at a place', () => {
    const state = start()
    state.player.flags['test.night'] = true
    const result = run(state, { type: 'advanceTime', days: 1 })

    expect(result.state.knowledge.journalEntries).toContain('journal.test.night')
    expect(
      result.events
        .map((entry) => entry.event)
        .filter((event) => event.type === 'EventFired')
        .map((event) => (event as { event: string }).event),
    ).toContain('evt.test.night')
  })

  it('does not draw a night event when no day has passed', () => {
    const state = start()
    state.player.flags['test.night'] = true
    const result = apply(state, { type: 'advanceTime', days: 0 })
    expect(result.knowledge.journalEntries).not.toContain('journal.test.night')
  })

  it('keeps a fired night event on cooldown for the next night', () => {
    const state = start()
    state.player.flags['test.night'] = true
    const first = run(state, { type: 'advanceTime', days: 1 })
    const second = run(first.state, { type: 'advanceTime', days: 1 })
    const fired = (result: CommandResult) =>
      result.events.filter(
        (entry) => entry.event.type === 'EventFired' && entry.event.event === 'evt.test.night',
      ).length

    expect(fired(first)).toBe(1)
    expect(fired(second)).toBe(0)
  })

  it('leaves the morning after a night with no eligible event', () => {
    const state = start({ location: 'dest.cyprus' })
    state.player.flags['test.night'] = true
    const morning = apply(state, { type: 'rest', days: 1 })

    expect(morning.calendar.day).toBe(1)
    expect(morning.narrative.pending).toBeNull()
    expect(morning.knowledge.journalEntries).not.toContain('journal.test.night')
  })
})

describe('reducer guarantees', () => {
  it('never mutates its input state', () => {
    const state = deepFreeze(
      start({ inventory: [{ item: 'good.copper', quantity: 1 }] }),
    )
    expect(() => reduce(state, { type: 'buy', item: 'good.grain', quantity: 1 }, index)).not.toThrow()
    expect(() => reduce(state, { type: 'talkTo', character: 'char.ugarit.amnit' }, index)).not.toThrow()
    expect(state.player.money).toBe(100)
  })

  it('returns the original state and no events on rejection', () => {
    const state = start()
    const result = run(state, { type: 'buy', item: 'good.nothing', quantity: 1 })
    expect(result.state).toBe(state)
    expect(result.events).toEqual([])
    expect(result.rejected).toBeDefined()
  })

  it('numbers events monotonically across commands', () => {
    const first = run(start(), { type: 'buy', item: 'good.grain', quantity: 1 })
    const second = run(first.state, { type: 'buy', item: 'good.grain', quantity: 1 })

    expect(first.state.meta.eventSequence).toBe(2)
    expect(second.events[0]?.sequence).toBe(3)
  })

  it('is deterministic for the same state and commands', () => {
    const commands: Command[] = [
      { type: 'buy', item: 'good.grain', quantity: 1 },
      { type: 'talkTo', character: 'char.ugarit.amnit' },
      { type: 'chooseDialogue', choice: 0 },
      { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.coastal' },
    ]

    const runAll = () => {
      let state = start()
      for (const command of commands) {
        const result = reduce(state, command, index)
        if (!result.rejected) state = result.state
      }
      return JSON.stringify(state)
    }

    expect(runAll()).toBe(runAll())
  })

  it('rejects resolving an encounter when nothing is waiting', () => {
    expect(run(start(), { type: 'resolveEncounter', choice: 0 }).rejected?.reason).toBe(
      'There is nothing to answer.',
    )
  })

  it('rejects an unknown command without throwing', () => {
    const result = reduce(start(), { type: 'teleport' } as unknown as Command, index)
    expect(result.rejected?.reason).toBe('That is not something you can do.')
  })
})

/**
 * One row per command: the intent that succeeds on a fresh state, the intent that must be
 * refused, and the exact reason. `state` is a factory because two commands need a scene or
 * a journey already open.
 */
const commandTable: {
  type: CommandType
  state: () => GameState
  accepted: Command
  rejected: Command
  reason: string
}[] = [
  {
    type: 'chooseChoice',
    state: () => {
      const state = start()
      state.narrative.pending = {
        kind: 'dialogue',
        dialogue: 'dlg.test.arrival',
        node: 'gate',
      }
      return state
    },
    accepted: { type: 'chooseChoice', choiceId: 'declare' },
    rejected: { type: 'chooseChoice', choiceId: 'missing' },
    reason: 'There is nothing to answer.',
  },
  {
    type: 'advanceTime',
    state: () => start(),
    accepted: { type: 'advanceTime', days: 2 },
    rejected: { type: 'advanceTime', days: 400 },
    reason: 'Time cannot pass that way.',
  },
  {
    type: 'rest',
    state: () => start(),
    accepted: { type: 'rest', days: 2 },
    rejected: { type: 'rest', days: 0 },
    reason: 'You can rest for between one and thirty days.',
  },
  {
    type: 'travel',
    state: () => start(),
    accepted: { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.coastal' },
    rejected: { type: 'travel', route: 'route.none', mode: 'mode.coastal' },
    reason: 'There is no such crossing.',
  },
  {
    type: 'work',
    state: () => start(),
    accepted: { type: 'work', days: 1 },
    rejected: { type: 'work', days: 0 },
    reason: 'You can work between one and seven days.',
  },
  {
    type: 'buy',
    state: () => start(),
    accepted: { type: 'buy', item: 'good.grain', quantity: 1 },
    rejected: { type: 'buy', item: 'good.nothing', quantity: 1 },
    reason: 'This market does not sell that.',
  },
  {
    type: 'sell',
    state: () => start({ inventory: [{ item: 'good.copper', quantity: 1 }] }),
    accepted: { type: 'sell', item: 'good.copper', quantity: 1 },
    rejected: { type: 'sell', item: 'good.copper', quantity: 1 },
    reason: 'You are not carrying that much.',
  },
  {
    type: 'talkTo',
    state: () => start(),
    accepted: { type: 'talkTo', character: 'char.ugarit.amnit' },
    rejected: { type: 'talkTo', character: 'char.nobody' },
    reason: 'There is no one of that name here.',
  },
  {
    type: 'resolveEncounter',
    state: () => apply(start(), { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open' }),
    accepted: { type: 'resolveEncounter', choice: 0 },
    rejected: { type: 'resolveEncounter', choice: 0 },
    reason: 'There is nothing to answer.',
  },
  {
    type: 'chooseDialogue',
    state: () => apply(start(), { type: 'talkTo', character: 'char.ugarit.amnit' }),
    accepted: { type: 'chooseDialogue', choice: 0 },
    rejected: { type: 'chooseDialogue', choice: 0 },
    reason: 'There is nothing to answer.',
  },
]

describe('every command', () => {
  it('covers every name in the registry', () => {
    expect(commandTable.map((entry) => entry.type).sort()).toEqual(commandNames())
  })

  it.each(commandTable)('applies $type and numbers its events', ({ state, accepted }) => {
    const before = state()
    const base = before.meta.eventSequence
    const result = run(before, accepted)

    expect(result.rejected).toBeUndefined()
    expect(result.events.length).toBeGreaterThan(0)
    expect(result.events.map((entry) => entry.sequence)).toEqual(
      result.events.map((_, offset) => base + offset + 1),
    )
    expect(result.state.meta.eventSequence).toBe(base + result.events.length)
  })

  it.each(commandTable)('refuses $type with its reason and no side effects', ({ rejected, reason }) => {
    // Every refusal in the table is one a fresh state produces, so the accepted path's
    // extra setup (a scene, a journey) cannot make the rejected intent legal.
    const before = start({ inventory: [] })
    const result = run(before, rejected)

    expect(result.rejected?.reason).toBe(reason)
    expect(result.events).toEqual([])
    expect(result.state).toBe(before)
  })

  it.each(commandTable)('runs $type identically twice from one state', ({ state, accepted }) => {
    expect(JSON.stringify(run(state(), accepted))).toBe(JSON.stringify(run(state(), accepted)))
  })

  it.each(commandTable)('leaves a deep-frozen state untouched for $type', ({ state, accepted, rejected }) => {
    const frozen = deepFreeze(state())
    const before = JSON.stringify(frozen)

    expect(() => reduce(frozen, accepted, index)).not.toThrow()
    expect(() => reduce(frozen, rejected, index)).not.toThrow()
    expect(JSON.stringify(frozen)).toBe(before)
  })
})

describe('a day of harbor work', () => {
  it('pays three shekels, spends one day and one reserve', () => {
    const before = start()
    const result = run(before, { type: 'work', days: 1 })

    expect(result.rejected).toBeUndefined()
    expect(result.state.player.money).toBe(before.player.money + 3)
    expect(result.state.player.stamina).toBe(before.player.stamina - 1)
    expect(result.state.calendar.day).toBe(before.calendar.day + 1)
  })

  it('refuses work where there is no harbor', () => {
    const result = run(start({ location: 'dest.nowhere' }), { type: 'work', days: 1 })

    expect(result.rejected?.reason).toBe('There is no harbor work here.')
    expect(result.events).toEqual([])
  })
})

describe('settled time and treatment', () => {
  it('clears thirst on an ordinary day in port, but not a fever', () => {
    const before = start({
      afflictions: [
        { id: 'aff.thirst', sinceDay: 0 },
        { id: 'aff.fever', sinceDay: 0 },
      ],
    })
    const result = run(before, { type: 'advanceTime', days: 1 })

    expect(result.rejected).toBeUndefined()
    expect(result.state.player.afflictions.map((entry) => entry.id)).toEqual(['aff.fever'])
  })

  it('rest clears a fever as well as thirst', () => {
    const before = start({
      afflictions: [
        { id: 'aff.thirst', sinceDay: 0 },
        { id: 'aff.fever', sinceDay: 0 },
      ],
    })
    const result = run(before, { type: 'rest', days: 3 })

    expect(result.rejected).toBeUndefined()
    expect(result.state.player.afflictions).toEqual([])
  })
})

describe('the command registry', () => {
  it('registers every command with a schema and a handler', () => {
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

    for (const name of commandNames()) {
      expect(typeof COMMAND_REGISTRY[name].schema.safeParse).toBe('function')
      expect(typeof COMMAND_REGISTRY[name].run).toBe('function')
      expect(COMMAND_REGISTRY[name].schema.safeParse(commandTable.find((entry) => entry.type === name)?.accepted).success).toBe(true)
    }
  })

  it('reads a command name from the registry, not a switch', () => {
    for (const name of commandNames()) expect(commandTypeOf({ type: name })).toBe(name)
    expect(commandTypeOf({ type: 'teleport' })).toBeNull()
    expect(commandTypeOf({ type: '' })).toBeNull()
    expect(commandTypeOf({ type: 'toString' })).toBeNull()
  })

  it('refuses a malformed intent before any handler runs', () => {
    const broken = [
      { type: 'advanceTime' },
      { type: 'buy', item: '', quantity: 1 },
      { type: 'buy', item: 'good.grain', quantity: 1.5 },
      { type: 'talkTo', character: 5 },
      { type: 'travel', route: 'route.ugarit-cyprus', mode: 'mode.open', extra: true },
    ] as unknown as Command[]

    for (const command of broken) {
      const result = run(start(), command)
      expect(result.rejected?.reason).toBe('That is not something you can do.')
      expect(result.events).toEqual([])
    }
  })
})
