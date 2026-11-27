import { describe, expect, it } from 'vitest'

import { RngCursor } from '../rng'
import { createInitialState } from '../state'
import type { GameState } from '../state'
import { stubContent } from '../testing'
import {
  CONDITION_ATOMS,
  conditionAtomNames,
  conditionSchema,
  evaluateCondition,
  parseCondition,
} from './conditions'
import { MAX_CONDITION_NODES } from './limits'
import type { Condition, ConditionContext } from './types'

function context(
  mutate: (state: GameState) => void = () => {},
  content = stubContent({
    characters: {
      'char.ugarit.amnit': { home: 'dest.ugarit' },
      'char.cyprus.kinyras': { home: 'dest.cyprus' },
    },
    routes: { 'route.ugarit-cyprus': {}, 'route.closed': { closedWhen: { flag: 'blocked' } } },
    weights: { 'good.copper': 4 },
  }),
): ConditionContext {
  const state = createInitialState({ seed: 'dsl-conditions', location: 'dest.ugarit' })
  mutate(state)
  return { state, content, rng: new RngCursor(state.rng) }
}

const cases: { name: string; condition: Condition; expected: boolean; mutate?: (s: GameState) => void }[] = [
  { name: 'flag set', condition: { flag: 'helped' }, expected: true, mutate: (s) => (s.player.flags['helped'] = true) },
  { name: 'flag absent', condition: { flag: 'helped' }, expected: false },
  { name: 'flag false', condition: { flag: 'helped' }, expected: false, mutate: (s) => (s.player.flags['helped'] = false) },
  {
    name: 'language at tier',
    condition: { languageAtLeast: { language: 'lang.akkadian', tier: 'basic' } },
    expected: true,
    mutate: (s) => (s.player.languages['lang.akkadian'] = { xp: 25, tier: 'basic' }),
  },
  {
    name: 'language below tier',
    condition: { languageAtLeast: { language: 'lang.akkadian', tier: 'conversational' } },
    expected: false,
    mutate: (s) => (s.player.languages['lang.akkadian'] = { xp: 25, tier: 'basic' }),
  },
  { name: 'language unknown', condition: { languageAtLeast: { language: 'lang.hurrian', tier: 'basic' } }, expected: false },
  {
    name: 'relationship at threshold',
    condition: { relationship: { character: 'char.ugarit.amnit', atLeast: 2 } },
    expected: true,
    mutate: (s) =>
      (s.narrative.relationships['char.ugarit.amnit'] = {
        trust: 2,
        affection: 0,
        obligation: 0,
        fear: 0,
        respect: 0,
      }),
  },
  {
    name: 'relationship on a named dimension',
    condition: { relationship: { character: 'char.ugarit.amnit', dimension: 'respect', atLeast: 3 } },
    expected: false,
    mutate: (s) =>
      (s.narrative.relationships['char.ugarit.amnit'] = {
        trust: 5,
        affection: 0,
        obligation: 0,
        fear: 0,
        respect: 1,
      }),
  },
  {
    name: 'faction standing',
    condition: { factionStanding: { faction: 'faction.ugarit.palace', atLeast: 1 } },
    expected: true,
    mutate: (s) =>
      (s.narrative.factions['faction.ugarit.palace'] = {
        trust: 0,
        favour: 0,
        obligation: 0,
        standing: 2,
        suspicion: 0,
      }),
  },
  {
    name: 'faction on a named dimension',
    condition: {
      factionStanding: { faction: 'faction.ugarit.palace', dimension: 'suspicion', atLeast: 2 },
    },
    expected: true,
    mutate: (s) =>
      (s.narrative.factions['faction.ugarit.palace'] = {
        trust: 0,
        favour: 0,
        obligation: 0,
        standing: 0,
        suspicion: 2,
      }),
  },
  { name: 'faction unknown', condition: { factionStanding: { faction: 'faction.unknown', atLeast: 0 } }, expected: false },
  { name: 'date after', condition: { dateAfter: '1230-01-01' }, expected: true, mutate: (s) => (s.calendar.day = 90) },
  { name: 'date after, same day', condition: { dateAfter: '1230-04-01' }, expected: false, mutate: (s) => (s.calendar.day = 90) },
  { name: 'date before', condition: { dateBefore: '1230-04-01' }, expected: true },
  { name: 'date before, same day', condition: { dateBefore: '1230-01-01' }, expected: false },
  { name: 'route open', condition: { routeOpen: 'route.ugarit-cyprus' }, expected: true },
  {
    name: 'route closed by state',
    condition: { routeOpen: 'route.ugarit-cyprus' },
    expected: false,
    mutate: (s) => (s.world.routeStates['route.ugarit-cyprus'] = 'closed'),
  },
  {
    name: 'route closed by authored rule',
    condition: { routeOpen: 'route.closed' },
    expected: false,
    mutate: (s) => (s.player.flags['blocked'] = true),
  },
  { name: 'route unknown', condition: { routeOpen: 'route.nowhere' }, expected: false },
  {
    name: 'item at least',
    condition: { itemAtLeast: { item: 'good.copper', quantity: 2 } },
    expected: true,
    mutate: (s) => s.player.inventory.push({ item: 'good.copper', quantity: 2 }),
  },
  {
    name: 'item short',
    condition: { itemAtLeast: { item: 'good.copper', quantity: 3 } },
    expected: false,
    mutate: (s) => s.player.inventory.push({ item: 'good.copper', quantity: 2 }),
  },
  { name: 'money at least', condition: { moneyAtLeast: 100 }, expected: true, mutate: (s) => (s.player.money = 100) },
  { name: 'money short', condition: { moneyAtLeast: 101 }, expected: false, mutate: (s) => (s.player.money = 100) },
  { name: 'character alive from content', condition: { characterAlive: 'char.ugarit.amnit' }, expected: true },
  {
    name: 'character dead',
    condition: { characterAlive: 'char.ugarit.amnit' },
    expected: false,
    mutate: (s) =>
      (s.narrative.characterStates['char.ugarit.amnit'] = {
        status: 'dead',
        location: 'dest.ugarit',
        age: 50,
        relationships: {},
        flags: {},
      }),
  },
  {
    name: 'character at runtime location',
    condition: { characterAt: { character: 'char.ugarit.amnit', destination: 'dest.cyprus' } },
    expected: true,
    mutate: (s) =>
      (s.narrative.characterStates['char.ugarit.amnit'] = {
        status: 'alive',
        location: 'dest.cyprus',
        age: 40,
        relationships: {},
        flags: {},
      }),
  },
  {
    name: 'character at home by default',
    condition: { characterAt: { character: 'char.cyprus.kinyras', destination: 'dest.cyprus' } },
    expected: true,
  },
  {
    name: 'journal entry known',
    condition: { hasJournalEntry: 'journal.slice.first-crossing' },
    expected: true,
    mutate: (s) => s.knowledge.journalEntries.push('journal.slice.first-crossing'),
  },
  { name: 'journal entry unknown', condition: { hasJournalEntry: 'journal.slice.missing' }, expected: false },
  {
    name: 'affliction active',
    condition: { hasAffliction: 'aff.wound' },
    expected: true,
    mutate: (s) => s.player.afflictions.push({ id: 'aff.wound', sinceDay: 0 }),
  },
  { name: 'affliction absent', condition: { hasAffliction: 'aff.wound' }, expected: false },
  { name: 'chance certain', condition: { chance: { p: 1 } }, expected: true },
  { name: 'chance impossible', condition: { chance: { p: 0 } }, expected: false },
]

describe('condition atoms', () => {
  it.each(cases)('$name', ({ condition, expected, mutate }) => {
    expect(evaluateCondition(condition, context(mutate))).toBe(expected)
  })

  it('registers every atom the milestone names', () => {
    expect(conditionAtomNames()).toEqual(
      [
        'chance',
        'characterAlive',
        'characterAt',
        'dateAfter',
        'dateBefore',
        'factionStanding',
        'flag',
        'hasAffliction',
        'hasJournalEntry',
        'itemAtLeast',
        'languageAtLeast',
        'moneyAtLeast',
        'relationship',
        'routeOpen',
      ].sort(),
    )
  })

  it('evaluates every registered atom without throwing on a shape-valid payload', () => {
    for (const [name, atom] of Object.entries(CONDITION_ATOMS)) {
      const sample = samplePayload(name)
      const parsed = atom.schema.safeParse(sample)
      expect(parsed.success, `${name} sample payload`).toBe(true)
      expect(() => atom.evaluate(sample, context())).not.toThrow()
    }
  })
})

function samplePayload(name: string): unknown {
  const samples: Record<string, unknown> = {
    flag: 'f',
    languageAtLeast: { language: 'lang.akkadian', tier: 'basic' },
    relationship: { character: 'char.ugarit.amnit', atLeast: 0 },
    factionStanding: { faction: 'faction.ugarit.palace', atLeast: 0 },
    dateAfter: '1230-01-01',
    dateBefore: '1230-01-01',
    routeOpen: 'route.ugarit-cyprus',
    itemAtLeast: { item: 'good.copper', quantity: 1 },
    moneyAtLeast: 0,
    characterAlive: 'char.ugarit.amnit',
    characterAt: { character: 'char.ugarit.amnit', destination: 'dest.ugarit' },
    hasJournalEntry: 'journal.x',
    hasAffliction: 'aff.wound',
    chance: { p: 0.5 },
  }
  return samples[name]
}

describe('condition combinators', () => {
  it('treats an empty all as true and an empty any as false', () => {
    expect(evaluateCondition({ all: [] }, context())).toBe(true)
    expect(evaluateCondition({ any: [] }, context())).toBe(false)
  })

  it('nests all / any / not deterministically', () => {
    const ctx = context((state) => {
      state.player.flags['a'] = true
      state.player.money = 50
    })
    const condition: Condition = {
      all: [
        { flag: 'a' },
        { any: [{ moneyAtLeast: 100 }, { not: { flag: 'b' } }] },
      ],
    }
    expect(evaluateCondition(condition, ctx)).toBe(true)
    expect(evaluateCondition(condition, ctx)).toBe(true)
  })
})

describe('condition validation', () => {
  it('rejects unknown atoms and unknown keys', () => {
    expect(conditionSchema.safeParse({ teleport: 'dest.cyprus' }).success).toBe(false)
    expect(conditionSchema.safeParse({ flag: 'x', extra: true }).success).toBe(false)
  })

  it('rejects malformed payloads', () => {
    expect(conditionSchema.safeParse({ languageAtLeast: { language: 'lang.x', tier: 'fluent-ish' } }).success).toBe(
      false,
    )
    expect(conditionSchema.safeParse({ moneyAtLeast: -1 }).success).toBe(false)
    expect(conditionSchema.safeParse({ dateAfter: 'yesterday' }).success).toBe(false)
    expect(conditionSchema.safeParse({ relationship: { character: 'char.x', atLeast: 1, bogus: 2 } }).success).toBe(
      false,
    )
  })

  it('reports a readable issue through parseCondition', () => {
    const result = parseCondition({ flag: 'x', extra: true })
    expect(result.ok).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('rejects a condition deeper than the limit', () => {
    let condition: Condition = { flag: 'leaf' }
    for (let i = 0; i < 20; i += 1) condition = { all: [condition] }
    const result = parseCondition(condition)
    expect(result.ok).toBe(false)
    expect(result.issues[0]).toContain('levels deep')
  })

  it('evaluates an over-deep tree as false instead of overflowing the stack', () => {
    let condition: Condition = { flag: 'leaf' }
    for (let i = 0; i < 20; i += 1) condition = { all: [condition] }
    expect(evaluateCondition(condition, context((state) => (state.player.flags['leaf'] = true)))).toBe(
      false,
    )
  })

  it('is order-stable and does not mutate the state it reads', () => {
    const ctx = context()
    const before = JSON.stringify(ctx.state)
    evaluateCondition({ all: [{ moneyAtLeast: 0 }, { flag: 'nope' }] }, ctx)
    expect(JSON.stringify(ctx.state)).toBe(before)
  })

  it('rejects a condition with more nodes than the limit', () => {
    const condition: Condition = {
      all: Array.from({ length: MAX_CONDITION_NODES }, () => ({ flag: 'f' }) as Condition),
    }
    const result = parseCondition(condition)

    expect(result.ok).toBe(false)
    expect(result.issues[0]).toContain('nodes')
  })
})

/** One payload each atom must refuse: wrong type, missing field, or out of range. */
const invalidPayloads: Record<string, unknown> = {
  flag: 7,
  languageAtLeast: { language: 'lang.akkadian' },
  relationship: { character: 'char.ugarit.amnit' },
  factionStanding: { faction: 'faction.ugarit.palace', atLeast: 1.5 },
  dateAfter: 'in the spring',
  dateBefore: '1230-13-06',
  routeOpen: '',
  itemAtLeast: { item: 'good.copper', quantity: 0 },
  moneyAtLeast: -1,
  characterAlive: '',
  characterAt: { character: 'char.ugarit.amnit' },
  hasJournalEntry: 5,
  hasAffliction: '',
  chance: { p: 2 },
}

describe('condition rejections', () => {
  it('has a rejection case for every registered atom', () => {
    expect(Object.keys(invalidPayloads).sort()).toEqual(conditionAtomNames())
  })

  it.each(conditionAtomNames())('refuses an invalid %s payload, with a reason', (name) => {
    const parsed = CONDITION_ATOMS[name]?.schema.safeParse(invalidPayloads[name])
    expect(parsed?.success).toBe(false)
    if (parsed && !parsed.success) {
      expect(parsed.error.issues[0]?.message.length).toBeGreaterThan(0)
    }

    const condition = { [name]: invalidPayloads[name] } as unknown as Condition
    expect(conditionSchema.safeParse(condition).success).toBe(false)
    expect(evaluateCondition(condition, context())).toBe(false)
  })
})

describe('condition determinism', () => {
  it.each(conditionAtomNames())('evaluates %s the same way from one state', (name) => {
    const condition = { [name]: samplePayload(name) } as unknown as Condition

    // A fresh context each time: the chance atom draws from the seeded stream, so a
    // shared cursor would be two different draws, not two evaluations of one state.
    expect(evaluateCondition(condition, context())).toBe(
      evaluateCondition(condition, context()),
    )
  })
})
