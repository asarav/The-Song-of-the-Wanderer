/**
 * Boundary contract for the `state` module (M1-T01).
 *
 * This file imports only the module's public surface, exactly as another module must, so
 * it proves the milestone's promises are reachable through `index.ts` and are not an
 * accident of the private file layout.
 */

import { describe, expect, it } from 'vitest'

import {
  DEFAULT_CAPACITY,
  DEFAULT_DIFFICULTY,
  DEFAULT_SELF_NAME,
  DEFAULT_TRANSPORT,
  DIFFICULTIES,
  DIFFICULTY_CONFIG,
  DIMENSION_MAX,
  DIMENSION_MIN,
  GameStateSchema,
  LANGUAGE_TIERS,
  cloneState,
  createInitialState,
  deepFreeze,
  isGameState,
  stateIssues,
  validateState,
  type GameState,
} from '@engine/state'

const input = { seed: 'contract-001', location: 'dest.ugarit' }

describe('state module public surface', () => {
  it('exposes the M1-T01 builders and validators', () => {
    expect(typeof createInitialState).toBe('function')
    expect(typeof validateState).toBe('function')
    expect(typeof stateIssues).toBe('function')
    expect(typeof isGameState).toBe('function')
    expect(typeof cloneState).toBe('function')
    expect(typeof deepFreeze).toBe('function')
    expect(GameStateSchema).toBeDefined()
  })

  it('exposes the authored limits and defaults', () => {
    expect(DEFAULT_CAPACITY).toBe(20)
    expect(DEFAULT_TRANSPORT).toBe('transport.on-foot')
    expect(DEFAULT_SELF_NAME).toBe('e-ma-a₂')
    expect(DIMENSION_MIN).toBe(-5)
    expect(DIMENSION_MAX).toBe(5)
    expect(LANGUAGE_TIERS).toContain('conversational')
  })

  it('offers three ordered roads and defaults to the measured one', () => {
    expect(DIFFICULTIES).toEqual(['gentle', 'wanderer', 'perilous'])
    expect(DEFAULT_DIFFICULTY).toBe('wanderer')
    expect(DIFFICULTY_CONFIG.wanderer.hazardShift).toBe(0)
    expect(DIFFICULTY_CONFIG.gentle.startingMoney).toBeGreaterThan(
      DIFFICULTY_CONFIG.wanderer.startingMoney,
    )
    expect(DIFFICULTY_CONFIG.perilous.startingMoney).toBeLessThan(
      DIFFICULTY_CONFIG.wanderer.startingMoney,
    )
    expect(DIFFICULTY_CONFIG.gentle.hazardShift).toBeLessThan(0)
    expect(DIFFICULTY_CONFIG.perilous.hazardShift).toBeGreaterThan(0)
  })

  it('builds, validates and narrows a state through the surface alone', () => {
    const state = createInitialState(input)

    expect(isGameState(state)).toBe(true)
    expect(stateIssues(state)).toEqual([])

    const result = validateState(JSON.parse(JSON.stringify(state)))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.state).toEqual(state)
  })

  it('refuses junk without throwing', () => {
    for (const junk of [null, undefined, 0, '', [], {}]) {
      expect(() => validateState(junk)).not.toThrow()
      expect(stateIssues(junk).length).toBeGreaterThan(0)
      expect(isGameState(junk)).toBe(false)
    }
  })

  it('clones without sharing structure', () => {
    const state = createInitialState({ ...input, money: 10 })
    const copy = cloneState(state)

    expect(copy).toEqual(state)
    expect(copy).not.toBe(state)

    copy.player.money = 99
    copy.narrative.relationships['char.x'] = {
      trust: 1,
      affection: 0,
      obligation: 0,
      fear: 0,
      respect: 0,
    }

    expect(state.player.money).toBe(10)
    expect(state.narrative.relationships).toEqual({})
  })

  it('freezes a state so a command cannot mutate its input', () => {
    const state = deepFreeze(createInitialState(input))

    expect(Object.isFrozen(state.player.identity)).toBe(true)
    expect(() => {
      ;(state as GameState).calendar.day = 5
    }).toThrow(TypeError)
  })
})
