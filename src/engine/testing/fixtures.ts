/**
 * Test fixtures for the engine. Not imported by the game.
 */

import type { Condition, DslContent } from '../dsl'
import type { CharacterStatus, GameState } from '../state'

export interface StubContentOptions {
  characters?: Record<string, { home?: string }>
  routes?: Record<string, { closedWhen?: Condition }>
  weights?: Record<string, number>
  afflictions?: Record<string, { treatments: string[] }>
}

/**
 * A `DslContent` implementation backed by two plain objects. Every engine test that
 * needs conditions or effects uses this, so the DSL is tested without loading JSON.
 */
export function stubContent(options: StubContentOptions = {}): DslContent {
  const characters = options.characters ?? {}
  const routes = options.routes ?? {}
  const weights = options.weights ?? {}
  const afflictions = options.afflictions ?? {}

  return {
    hasCharacter: (id) => id in characters,
    characterHome: (id) => characters[id]?.home,
    routeExists: (id) => id in routes,
    routeClosedWhen: (id) => routes[id]?.closedWhen,
    itemWeight: (id) => weights[id] ?? 1,
    afflictionTreatments: (id) => afflictions[id]?.treatments ?? [],
  }
}

/** A single character runtime entry for tests that need one already present. */
export function characterState(
  status: CharacterStatus = 'alive',
  location = 'dest.ugarit',
): {
  status: CharacterStatus
  location: string
  age: 'unknown'
  relationships: Record<string, never>
  flags: Record<string, never>
} {
  return { status, location, age: 'unknown', relationships: {}, flags: {} }
}

export function withCharacters(
  state: GameState,
  entries: Record<string, ReturnType<typeof characterState>>,
): GameState {
  return {
    ...state,
    narrative: { ...state.narrative, characterStates: { ...state.narrative.characterStates, ...entries } },
  }
}
