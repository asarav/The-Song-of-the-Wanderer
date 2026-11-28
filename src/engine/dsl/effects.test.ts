import { describe, expect, it } from 'vitest'

import { RngCursor } from '../rng'
import { createInitialState } from '../state'
import type { GameState } from '../state'
import { stubContent } from '../testing'
import {
  EFFECT_ATOMS,
  applyEffects,
  effectAtomNames,
  effectSchema,
  parseEffects,
  runEffects,
} from './effects'
import { MAX_EFFECTS } from './limits'
import type { Effect, EffectContext } from './types'

const content = stubContent({
  characters: { 'char.ugarit.amnit': { home: 'dest.ugarit' } },
  routes: { 'route.ugarit-cyprus': {} },
  weights: { 'good.grain': 2, 'good.copper': 4 },
  afflictions: {
    'aff.fever': { treatments: ['rest', 'healer'] },
    'aff.thirst': { treatments: ['town', 'water'] },
  },
})

function base(mutate: (state: GameState) => void = () => {}): GameState {
  const state = createInitialState({ seed: 'dsl-effects', location: 'dest.ugarit' })
  state.player.money = 100
  state.player.capacity = 20
  mutate(state)
  return state
}

function run(effects: Effect[], mutate?: (state: GameState) => void) {
  const state = base(mutate)
  return runEffects(state, effects, content, new RngCursor(state.rng))
}

describe('money', () => {
  it('applies a delta', () => {
    const result = run([{ money: -40 }])
    expect(result.state.player.money).toBe(60)
    expect(result.events).toContainEqual({ type: 'MoneyChanged', delta: -40, money: 60 })
  })

  it('clamps at zero and reports it', () => {
    const result = run([{ money: -500 }])
    expect(result.state.player.money).toBe(0)
    expect(result.events.some((event) => event.type === 'EffectClamped')).toBe(true)
  })
})

describe('afflictions and treatment', () => {
  it('adds an affliction once and records the day', () => {
    const result = run([{ affliction: { id: 'aff.fever', source: 'the road' } }])

    expect(result.state.player.afflictions).toEqual([
      { id: 'aff.fever', sinceDay: 0, source: 'the road' },
    ])
    expect(result.events).toContainEqual({ type: 'AfflictionChanged', id: 'aff.fever', active: true })
  })

  it('removes only the afflictions a treatment tag cures', () => {
    const result = run(
      [
        { affliction: { id: 'aff.fever' } },
        { affliction: { id: 'aff.thirst' } },
        { treatment: 'rest' },
      ],
    )

    expect(result.state.player.afflictions.map((entry) => entry.id)).toEqual(['aff.thirst'])
    expect(result.events).toContainEqual({ type: 'Treated', treatment: 'rest', removed: ['aff.fever'] })
  })
})

describe('items', () => {
  it('adds cargo', () => {
    const result = run([{ items: { item: 'good.grain', quantity: 3 } }])
    expect(result.state.player.inventory).toEqual([{ item: 'good.grain', quantity: 3 }])
  })

  it('stacks cargo', () => {
    const result = run([{ items: { item: 'good.grain', quantity: 2 } }, { items: { item: 'good.grain', quantity: 1 } }])
    expect(result.state.player.inventory).toEqual([{ item: 'good.grain', quantity: 3 }])
  })

  it('clamps an addition that would exceed capacity', () => {
    const result = run([{ items: { item: 'good.copper', quantity: 10 } }], (state) => {
      state.player.capacity = 10
    })
    // copper weighs 4, capacity 10 -> two units fit.
    expect(result.state.player.inventory).toEqual([{ item: 'good.copper', quantity: 2 }])
    expect(result.events.some((event) => event.type === 'EffectClamped')).toBe(true)
  })

  it('refuses to remove more than is carried', () => {
    const result = run([{ items: { item: 'good.grain', quantity: -5 } }], (state) => {
      state.player.inventory.push({ item: 'good.grain', quantity: 2 })
    })
    expect(result.state.player.inventory).toEqual([])
    expect(result.events.some((event) => event.type === 'EffectClamped')).toBe(true)
  })

  it('keeps protected cargo out of trades', () => {
    const result = run([{ items: { item: 'good.grain', quantity: -1 } }], (state) => {
      state.player.inventory.push({ item: 'good.grain', quantity: 1, protected: true })
    })
    expect(result.state.player.inventory).toEqual([{ item: 'good.grain', quantity: 1, protected: true }])
    expect(result.events.some((event) => event.type === 'EffectClamped')).toBe(true)
  })
})

describe('loseCargo', () => {
  it('takes from the largest stack in the hold', () => {
    const result = run([{ loseCargo: { quantity: 1 } }], (state) => {
      state.player.inventory.push(
        { item: 'good.copper', quantity: 1 },
        { item: 'good.grain', quantity: 3 },
      )
    })
    expect(result.state.player.inventory).toEqual([
      { item: 'good.copper', quantity: 1 },
      { item: 'good.grain', quantity: 2 },
    ])
    expect(result.events).toContainEqual({
      type: 'ItemChanged',
      item: 'good.grain',
      delta: -1,
      quantity: 2,
    })
  })

  it('is deterministic when stacks are equal', () => {
    const first = run([{ loseCargo: { quantity: 1 } }], (state) => {
      state.player.inventory.push(
        { item: 'good.grain', quantity: 1 },
        { item: 'good.copper', quantity: 1 },
      )
    })
    const second = run([{ loseCargo: { quantity: 1 } }], (state) => {
      state.player.inventory.push(
        { item: 'good.copper', quantity: 1 },
        { item: 'good.grain', quantity: 1 },
      )
    })
    expect(first.state.player.inventory).toEqual(second.state.player.inventory)
    expect(first.state.player.inventory.map((entry) => entry.item)).toEqual(['good.grain'])
  })

  it('clamps when the hold is empty and says why', () => {
    const result = run([{ loseCargo: { quantity: 1 } }])
    expect(result.state.player.inventory).toEqual([])
    expect(result.events).toContainEqual({
      type: 'EffectClamped',
      effect: 'loseCargo',
      requested: -1,
      applied: 0,
      reason: 'nothing in the hold to lose',
    })
  })

  it('leaves protected cargo out of the sea', () => {
    const result = run([{ loseCargo: { quantity: 1 } }], (state) => {
      state.player.inventory.push({ item: 'good.grain', quantity: 1, protected: true })
    })
    expect(result.state.player.inventory).toEqual([
      { item: 'good.grain', quantity: 1, protected: true },
    ])
    expect(result.events.some((event) => event.type === 'EffectClamped')).toBe(true)
  })
})

describe('time', () => {
  it('advances the calendar', () => {
    const result = run([{ advanceTime: { days: 3 } }])
    expect(result.state.calendar.day).toBe(3)
    expect(result.events).toContainEqual({ type: 'TimeAdvanced', days: 3, day: 3 })
  })

  it('ignores a zero-day advance', () => {
    const result = run([{ advanceTime: { days: 0 } }])
    expect(result.state.calendar.day).toBe(0)
    expect(result.events).toHaveLength(0)
  })
})

describe('relationships and factions', () => {
  it('creates a relationship at zero and applies the default dimension', () => {
    const result = run([{ relationship: { character: 'char.ugarit.amnit', delta: 2 } }])
    expect(result.state.narrative.relationships['char.ugarit.amnit']?.trust).toBe(2)
  })

  it('applies a named dimension', () => {
    const result = run([
      { relationship: { character: 'char.ugarit.amnit', dimension: 'respect', delta: 3 } },
    ])
    expect(result.state.narrative.relationships['char.ugarit.amnit']?.respect).toBe(3)
    expect(result.state.narrative.relationships['char.ugarit.amnit']?.trust).toBe(0)
  })

  it('clamps a relationship at the authored cap', () => {
    const result = run([{ relationship: { character: 'char.ugarit.amnit', delta: 50 } }])
    expect(result.state.narrative.relationships['char.ugarit.amnit']?.trust).toBe(5)
    expect(result.events.some((event) => event.type === 'EffectClamped')).toBe(true)
  })

  it('applies faction standing and clamps it', () => {
    const result = run([{ faction: { faction: 'faction.ugarit.palace', delta: -20 } }])
    expect(result.state.narrative.factions['faction.ugarit.palace']?.standing).toBe(-5)
    expect(result.events.some((event) => event.type === 'EffectClamped')).toBe(true)
  })
})

describe('flags, scheduling, journal', () => {
  it('accepts the shorthand and the explicit form', () => {
    const result = run([{ flag: 'shorthand' }, { flag: { name: 'explicit', value: 3 } }])
    expect(result.state.player.flags['shorthand']).toBe(true)
    expect(result.state.player.flags['explicit']).toBe(3)
  })

  it('schedules an event relative to today', () => {
    const result = run([{ schedule: { event: 'evt.slice.later', inDays: 30 } }])
    expect(result.state.world.scheduled).toEqual([{ event: 'evt.slice.later', dueDay: 30 }])
  })

  it('records a journal entry once', () => {
    const result = run([{ journal: { entry: 'journal.slice.first-crossing' } }, { journal: { entry: 'journal.slice.first-crossing' } }])
    expect(result.state.knowledge.journalEntries).toEqual(['journal.slice.first-crossing'])
  })
})

describe('language xp', () => {
  it('creates a language record and reports a tier change', () => {
    const result = run([{ languageXp: { language: 'lang.akkadian', amount: 25 } }])
    expect(result.state.player.languages['lang.akkadian']).toEqual({ xp: 25, tier: 'basic' })
    const event = result.events.find((entry) => entry.type === 'LanguageXpGained')
    expect(event).toBeDefined()
    if (event && event.type === 'LanguageXpGained') expect(event.tierChanged).toBe(true)
  })

  it('never drops below zero xp', () => {
    const result = run([{ languageXp: { language: 'lang.akkadian', amount: -40 } }])
    expect(result.state.player.languages['lang.akkadian']?.xp).toBe(0)
  })
})

describe('characters', () => {
  it('moves a character and creates runtime state on demand', () => {
    const result = run([{ moveCharacter: { character: 'char.ugarit.amnit', to: 'dest.cyprus' } }])
    expect(result.state.narrative.characterStates['char.ugarit.amnit']).toMatchObject({
      status: 'alive',
      location: 'dest.cyprus',
    })
  })

  it('changes status without losing location', () => {
    const result = run([
      { moveCharacter: { character: 'char.ugarit.amnit', to: 'dest.cyprus' } },
      { characterStatus: { character: 'char.ugarit.amnit', status: 'displaced' } },
    ])
    expect(result.state.narrative.characterStates['char.ugarit.amnit']?.status).toBe('displaced')
    expect(result.state.narrative.characterStates['char.ugarit.amnit']?.location).toBe('dest.cyprus')
  })
})

describe('world state', () => {
  it('opens and closes routes', () => {
    const closed = run([{ closeRoute: 'route.ugarit-cyprus' }])
    expect(closed.state.world.routeStates['route.ugarit-cyprus']).toBe('closed')
    const opened = run([{ closeRoute: 'route.ugarit-cyprus' }, { unlockRoute: 'route.ugarit-cyprus' }])
    expect(opened.state.world.routeStates['route.ugarit-cyprus']).toBe('open')
    expect(opened.state.knowledge.knownRoutes).toContain('route.ugarit-cyprus')

    const twice = run([
      { unlockRoute: 'route.ugarit-cyprus' },
      { unlockRoute: 'route.ugarit-cyprus' },
    ])
    expect(twice.state.knowledge.knownRoutes.filter((id) => id === 'route.ugarit-cyprus')).toHaveLength(1)
  })

  it('adds and removes destination states idempotently', () => {
    const added = run([
      { destinationState: { destination: 'dest.ugarit', state: 'tense' } },
      { destinationState: { destination: 'dest.ugarit', state: 'tense' } },
    ])
    expect(added.state.world.destinationStates['dest.ugarit']).toEqual(['tense'])

    const removed = run([
      { destinationState: { destination: 'dest.ugarit', state: 'tense' } },
      { destinationState: { destination: 'dest.ugarit', state: 'tense', active: false } },
    ])
    expect(removed.state.world.destinationStates['dest.ugarit']).toEqual([])
  })

  it('records a migration with the current day', () => {
    const result = run([
      { advanceTime: { days: 5 } },
      { migration: { group: 'migration.amnit-household', from: 'dest.ugarit', to: 'dest.cyprus' } },
    ])
    expect(result.state.world.migrations[0]).toMatchObject({ day: 5, to: 'dest.cyprus' })
  })

  it('advances an arc and keeps its owner', () => {
    const result = run([
      { arc: { arc: 'arc.slice.amnit', beat: 'beat.one', owner: 'char.ugarit.amnit' } },
      { arc: { arc: 'arc.slice.amnit', beat: 'beat.two', owner: 'char.cyprus.kinyras' } },
    ])
    expect(result.state.narrative.arcStates['arc.slice.amnit']).toMatchObject({
      current: 'beat.two',
      owner: 'char.ugarit.amnit',
      stranded: false,
    })
  })
})

describe('deeds and knowledge', () => {
  it('records a deed once, with place and day', () => {
    const result = run([
      { advanceTime: { days: 2 } },
      { deed: { id: 'deed.helped-amnit', kind: 'helped', subject: 'char.ugarit.amnit' } },
      { deed: { id: 'deed.helped-amnit', kind: 'helped', subject: 'char.ugarit.amnit' } },
    ])
    expect(result.state.player.deeds).toHaveLength(1)
    expect(result.state.player.deeds[0]).toMatchObject({
      day: 2,
      place: 'dest.ugarit',
      kind: 'helped',
      witnesses: [],
    })
  })

  it('opens a promise once and settles it once', () => {
    const opened = run([
      { promise: { id: 'promise.test', character: 'char.ugarit.amnit', kind: 'debt', text: 'Five shekels' } },
      { promise: { id: 'promise.test', character: 'char.ugarit.amnit', kind: 'debt', text: 'Five shekels' } },
    ])
    expect(opened.state.narrative.promises).toHaveLength(1)
    expect(opened.state.narrative.promises[0]).toMatchObject({ id: 'promise.test', status: 'open' })

    const settled = run([
      { promise: { id: 'promise.test', character: 'char.ugarit.amnit', kind: 'debt', text: 'Five shekels' } },
      { settlePromise: { id: 'promise.test' } },
    ])
    expect(settled.state.narrative.promises[0]).toMatchObject({ status: 'settled', closedDay: 0 })
    expect(settled.events.filter((event) => event.type === 'PromiseOpened')).toHaveLength(1)
    expect(settled.events.filter((event) => event.type === 'PromiseSettled')).toHaveLength(1)
  })

  it('remembers a topic once per character', () => {
    const result = run([
      { markTopic: { character: 'char.ugarit.amnit', topic: 'greet' } },
      { markTopic: { character: 'char.ugarit.amnit', topic: 'greet' } },
    ])
    expect(result.state.narrative.characterStates['char.ugarit.amnit']?.topics).toEqual(['greet'])
  })

  it('emits RegardChanged only when the readable band moves', () => {
    const quiet = run([{ relationship: { character: 'char.ugarit.amnit', delta: 1 } }])
    expect(quiet.events.some((event) => event.type === 'RegardChanged')).toBe(false)

    const moved = run([{ relationship: { character: 'char.ugarit.amnit', delta: 3 } }])
    expect(moved.events).toContainEqual({
      type: 'RegardChanged',
      character: 'char.ugarit.amnit',
      from: 'neutral',
      to: 'warm',
    })
  })

  it('records knowledge with a source and belief', () => {
    const result = run([
      { knowledge: { fact: 'fact.ugarit.grain-shortage', source: 'rumor', reliability: 0.4, belief: 'doubted' } },
    ])
    expect(result.state.knowledge.entries[0]).toMatchObject({
      fact: 'fact.ugarit.grain-shortage',
      source: 'rumor',
      reliability: 0.4,
      belief: 'doubted',
    })
  })
})

describe('effect application rules', () => {
  it('applies in array order', () => {
    const result = run([{ money: -30 }, { money: -30 }])
    expect(result.state.player.money).toBe(40)
  })

  it('never mutates the state it was given', () => {
    const state = base()
    const before = JSON.stringify(state)
    runEffects(state, [{ money: -10 }, { advanceTime: { days: 1 } }], content, new RngCursor(state.rng))
    expect(JSON.stringify(state)).toBe(before)
  })

  it('is deterministic for the same input', () => {
    const effects: Effect[] = [
      { money: -5 },
      { languageXp: { language: 'lang.akkadian', amount: 7 } },
      { schedule: { event: 'evt.x', inDays: 3 } },
    ]
    expect(JSON.stringify(run(effects))).toBe(JSON.stringify(run(effects)))
  })

  it('skips unknown effects and malformed payloads instead of throwing', () => {
    const state = base()
    const ctx: EffectContext = {
      state,
      content,
      rng: new RngCursor(state.rng),
      events: [],
    }
    applyEffects(
      [{ teleport: 'dest.cyprus' } as unknown as Effect, { money: 'lots' } as unknown as Effect],
      ctx,
    )
    expect(ctx.events.filter((event) => event.type === 'EffectSkipped')).toHaveLength(2)
  })

  it('registers every effect the milestone names', () => {
    expect(effectAtomNames()).toEqual(
      [
        'advanceTime',
        'affliction',
        'arc',
        'characterStatus',
        'closeRoute',
        'deed',
        'destinationState',
        'faction',
        'flag',
        'items',
        'journal',
        'loseCargo',
        'knowledge',
        'languageXp',
        'migration',
        'money',
        'moveCharacter',
        'markTopic',
        'promise',
        'relationship',
        'schedule',
        'settlePromise',
        'stamina',
        'treatment',
        'unlockRoute',
      ].sort(),
    )
  })

  it('validates every registered effect shape', () => {
    for (const name of Object.keys(EFFECT_ATOMS)) {
      expect(effectSchema.safeParse({ [name]: sampleEffect(name) }).success, `${name} sample`).toBe(
        true,
      )
    }
    expect(effectSchema.safeParse({ money: -1, extra: true }).success).toBe(false)
    expect(parseEffects([{ money: 1 }]).ok).toBe(true)
    expect(parseEffects([{ money: 'x' }]).ok).toBe(false)
  })
})

function sampleEffect(name: string): unknown {
  const samples: Record<string, unknown> = {
    money: -1,
    items: { item: 'good.grain', quantity: 1 },
    loseCargo: { quantity: 1 },
    advanceTime: { days: 1 },
    relationship: { character: 'char.ugarit.amnit', delta: 1 },
    faction: { faction: 'faction.ugarit.palace', delta: 1 },
    flag: 'x',
    schedule: { event: 'evt.x', inDays: 1 },
    stamina: -1,
    affliction: { id: 'aff.wound', source: 'the road' },
    treatment: 'rest',
    journal: { entry: 'journal.x' },
    languageXp: { language: 'lang.akkadian', amount: 1 },
    moveCharacter: { character: 'char.ugarit.amnit', to: 'dest.cyprus' },
    characterStatus: { character: 'char.ugarit.amnit', status: 'dead' },
    unlockRoute: 'route.ugarit-cyprus',
    closeRoute: 'route.ugarit-cyprus',
    destinationState: { destination: 'dest.ugarit', state: 'tense' },
    migration: { group: 'g', from: 'dest.ugarit', to: 'dest.cyprus' },
    arc: { arc: 'arc.x', beat: 'beat.x', owner: 'char.ugarit.amnit' },
    deed: { id: 'deed.x', kind: 'helped', subject: 'char.ugarit.amnit' },
    knowledge: { fact: 'fact.x' },
    promise: {
      id: 'promise.x',
      character: 'char.ugarit.amnit',
      kind: 'promise',
      text: 'A test promise',
    },
    settlePromise: { id: 'promise.x' },
    markTopic: { character: 'char.ugarit.amnit', topic: 'greet' },
  }
  return samples[name]
}

describe('clamped and idempotent effects', () => {
  it('reports a language xp clamp instead of dropping it silently', () => {
    const result = run([{ languageXp: { language: 'lang.akkadian', amount: -40 } }])

    expect(result.state.player.languages['lang.akkadian']?.xp).toBe(0)
    expect(result.events).toContainEqual({
      type: 'EffectClamped',
      effect: 'languageXp',
      requested: -40,
      applied: 0,
      reason: 'xp cannot fall below zero',
    })
  })

  it('records a deed once and reports it once', () => {
    const deed: Effect = {
      deed: { id: 'deed.once', kind: 'helped', subject: 'char.ugarit.amnit' },
    }
    const result = run([deed, deed])

    expect(result.state.player.deeds).toHaveLength(1)
    expect(result.events.filter((event) => event.type === 'DeedRecorded')).toHaveLength(1)
  })

  it('fills the knowledge defaults', () => {
    const result = run([{ knowledge: { fact: 'fact.defaults' } }])

    expect(result.state.knowledge.entries[0]).toEqual({
      fact: 'fact.defaults',
      learnedAt: 0,
      source: 'told',
      reliability: 0.9,
      belief: 'believed',
      detail: undefined,
    })
  })

  it('clamps an over-long effect list and says so', () => {
    const many: Effect[] = Array.from({ length: MAX_EFFECTS + 1 }, () => ({ money: 1 }))
    const result = run(many)

    expect(result.state.player.money).toBe(100 + MAX_EFFECTS)
    expect(result.events).toContainEqual({
      type: 'EffectClamped',
      effect: 'effects',
      requested: MAX_EFFECTS + 1,
      applied: MAX_EFFECTS,
      reason: `limit is ${MAX_EFFECTS} effects`,
    })
    expect(parseEffects(many).ok).toBe(false)
  })
})

/** One payload each atom must refuse: wrong type, unknown key, or out of range. */
const invalidPayloads: Record<string, unknown> = {
  money: 'lots',
  items: { item: 'good.grain' },
  loseCargo: { quantity: 0 },
  advanceTime: { days: -1 },
  relationship: { character: 'char.ugarit.amnit', delta: 1, extra: true },
  faction: { faction: 'faction.ugarit.palace', delta: 1.5 },
  flag: 7,
  schedule: { event: 'evt.x', inDays: -2 },
  stamina: 'strong',
  affliction: { id: '' },
  treatment: 5,
  journal: '',
  languageXp: { language: 'lang.akkadian', amount: 1, extra: true },
  moveCharacter: { character: 'char.ugarit.amnit' },
  characterStatus: { character: 'char.ugarit.amnit', status: 'undead' },
  unlockRoute: '',
  closeRoute: 42,
  destinationState: { destination: 'dest.ugarit', state: '' },
  migration: { group: 'g', from: 'dest.ugarit' },
  arc: { arc: 'arc.x', beat: 'beat.x' },
  deed: { id: 'deed.x', kind: 'stole', subject: 'char.ugarit.amnit' },
  knowledge: { fact: 'fact.x', reliability: 2 },
  promise: { id: 'promise.x', character: 'char.ugarit.amnit', kind: 'gift', text: '' },
  settlePromise: { id: '' },
  markTopic: { character: '', topic: '' },
}

describe('effect rejections', () => {
  it('has a rejection case for every registered effect', () => {
    expect(Object.keys(invalidPayloads).sort()).toEqual(effectAtomNames())
  })

  it.each(effectAtomNames())('refuses an invalid %s payload, with a reason', (name) => {
    const parsed = EFFECT_ATOMS[name]?.schema.safeParse(invalidPayloads[name])
    expect(parsed?.success).toBe(false)
    if (parsed && !parsed.success) {
      expect(parsed.error.issues[0]?.message.length).toBeGreaterThan(0)
    }

    const state = base()
    const before = JSON.stringify(state)
    const ctx: EffectContext = { state, content, rng: new RngCursor(state.rng), events: [] }
    applyEffects([{ [name]: invalidPayloads[name] } as unknown as Effect], ctx)

    expect(ctx.events).toEqual([{ type: 'EffectSkipped', effect: name, reason: 'invalid payload' }])
    expect(JSON.stringify(state)).toBe(before)
  })
})

describe('effect determinism', () => {
  it.each(effectAtomNames())('applies %s identically from one state', (name) => {
    const effect = { [name]: sampleEffect(name) } as unknown as Effect
    expect(JSON.stringify(run([effect]))).toBe(JSON.stringify(run([effect])))
  })
})
