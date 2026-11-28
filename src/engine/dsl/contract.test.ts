/**
 * Boundary contract for the `dsl` module (M1-T04).
 *
 * Imports only the module's public surface, as every other module must. The milestone's
 * promises are the ones asserted here: both vocabularies are registries of
 * `{ schema, run }` pairs, unknown atoms fail validation rather than throwing, effects
 * apply in array order, clamping is reported as `EffectClamped`, and applying effects to a
 * state never mutates it.
 */

import { describe, expect, it } from 'vitest'

import { RngCursor } from '@engine/rng'
import { createInitialState, type GameState } from '@engine/state'
import {
  CONDITION_ATOMS,
  EFFECT_ATOMS,
  MAX_CONDITION_DEPTH,
  MAX_EFFECTS,
  applyEffects,
  conditionAtomNames,
  effectAtomNames,
  emptyState,
  evaluateCondition,
  parseCondition,
  parseEffects,
  runEffects,
  type Condition,
  type DslContent,
  type Effect,
  type EffectContext,
} from '@engine/dsl'

const content: DslContent = {
  hasCharacter: (id) => id === 'char.ugarit.amnit',
  characterHome: (id) => (id === 'char.ugarit.amnit' ? 'dest.ugarit' : undefined),
  routeExists: (id) => id === 'route.ugarit-cyprus',
  routeClosedWhen: () => undefined,
  itemWeight: () => 1,
  afflictionTreatments: () => [],
}

function base(): GameState {
  const state = createInitialState({ seed: 'dsl-contract', location: 'dest.ugarit' })
  state.player.money = 100
  return state
}

function apply(effects: Effect[], mutate: (state: GameState) => void = () => {}) {
  const state = base()
  mutate(state)
  const ctx: EffectContext = { state, content, rng: new RngCursor(state.rng), events: [] }
  applyEffects(effects, ctx)
  return { state: ctx.state, events: ctx.events }
}

describe('dsl module public surface', () => {
  it('publishes both vocabularies as { schema, run } registries', () => {
    expect(conditionAtomNames()).toEqual(Object.keys(CONDITION_ATOMS).sort())
    expect(effectAtomNames()).toEqual(Object.keys(EFFECT_ATOMS).sort())
    expect(conditionAtomNames()).toHaveLength(19)
    expect(effectAtomNames()).toHaveLength(25)

    for (const atom of Object.values(CONDITION_ATOMS)) {
      expect(typeof atom.schema.safeParse).toBe('function')
      expect(typeof atom.evaluate).toBe('function')
    }
    for (const atom of Object.values(EFFECT_ATOMS)) {
      expect(typeof atom.schema.safeParse).toBe('function')
      expect(typeof atom.apply).toBe('function')
    }
  })

  it('names the additions the milestone approved', () => {
    expect(effectAtomNames()).toContain('deed')
    expect(effectAtomNames()).toContain('knowledge')
    expect(CONDITION_ATOMS['relationship']?.schema.safeParse({ character: 'c', dimension: 'respect', atLeast: 1 }).success).toBe(true)
    expect(CONDITION_ATOMS['factionStanding']?.schema.safeParse({ faction: 'f', dimension: 'suspicion', atLeast: 1 }).success).toBe(true)
  })

  it('refuses unknown atoms instead of throwing', () => {
    const state = base()
    const ctx: EffectContext = { state, content, rng: new RngCursor(state.rng), events: [] }

    expect(evaluateCondition({ teleport: 'dest.cyprus' } as unknown as Condition, ctx)).toBe(false)
    applyEffects([{ teleport: 'dest.cyprus' } as unknown as Effect], ctx)
    expect(ctx.events).toEqual([{ type: 'EffectSkipped', effect: 'teleport', reason: 'unknown effect' }])

    expect(parseCondition({ teleport: 'dest.cyprus' }).ok).toBe(false)
    expect(parseEffects([{ teleport: 'dest.cyprus' } as unknown as Effect]).ok).toBe(false)
  })

  it('applies effects in array order', () => {
    const result = apply([
      { flag: 'ordered' },
      { money: -10 },
      { journal: { entry: 'journal.contract' } },
    ])

    expect(result.events.map((event) => event.type)).toEqual([
      'FlagSet',
      'MoneyChanged',
      'JournalEntryAdded',
    ])
    expect(result.state.player.money).toBe(90)
    expect(result.state.knowledge.journalEntries).toEqual(['journal.contract'])
  })

  it('reports a clamp as EffectClamped with the request and the result', () => {
    const result = apply([{ money: -500 }])

    expect(result.state.player.money).toBe(0)
    expect(result.events).toContainEqual({
      type: 'EffectClamped',
      effect: 'money',
      requested: -500,
      applied: -100,
      reason: 'money cannot fall below zero',
    })
  })

  it('never mutates the state it is given', () => {
    const state = base()
    const before = JSON.stringify(state)
    const after = runEffects(
      state,
      [{ money: -10 }, { advanceTime: { days: 1 } }, { deed: { id: 'deed.x', kind: 'traded', subject: 'good.olive-oil' } }],
      content,
      new RngCursor(state.rng),
    )

    expect(JSON.stringify(state)).toBe(before)
    expect(after.state).not.toBe(state)
    expect(after.state.calendar.day).toBe(1)
    expect(after.state.player.deeds[0]?.place).toBe('dest.ugarit')
  })

  it('is deterministic for one state and seed', () => {
    const effects: Effect[] = [
      { relationship: { character: 'char.ugarit.amnit', dimension: 'respect', delta: 2 } },
      { knowledge: { fact: 'fact.contract', source: 'witnessed', reliability: 0.8 } },
    ]
    expect(JSON.stringify(apply(effects))).toBe(JSON.stringify(apply(effects)))
  })

  it('enforces the authored structural limits', () => {
    expect(parseEffects(Array.from({ length: MAX_EFFECTS + 1 }, () => ({ money: 1 }))).ok).toBe(false)

    let deep: Condition = { flag: 'leaf' }
    for (let i = 0; i < MAX_CONDITION_DEPTH + 2; i += 1) deep = { all: [deep] }
    expect(parseCondition(deep).ok).toBe(false)
  })

  it('offers a valid blank state for content validation', () => {
    const state = emptyState()
    expect(Object.keys(state).sort()).toEqual([
      'calendar',
      'knowledge',
      'meta',
      'narrative',
      'player',
      'rng',
      'world',
    ])
  })
})
