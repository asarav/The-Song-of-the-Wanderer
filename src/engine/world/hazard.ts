/**
 * Road hazards.
 *
 * A route may ask the seeded `hazard` stream one question: does this crossing go wrong?
 * The chance is derived, never stored: language, roads already known, local ties, health,
 * reserve, route condition and the world's own pressures all move it. The outcome is an
 * authored scene, so a rescue and a wreck are content, not a hard-coded table.
 */

import { languageName, type ContentIndex, type RouteDef, type TravelModeDef } from '../content'
import { difficultyConfig, LANGUAGE_TIERS, type GameState } from '../state'

export interface HazardFactor {
  label: string
  delta: number
}

export interface HazardView {
  /** Percent chance that the road asks its question at all. */
  chance: number
  band: 'low' | 'moderate' | 'high'
  factors: HazardFactor[]
}

const RISK_DELTA: Record<NonNullable<RouteDef['risk']>, number> = {
  low: 0,
  moderate: 4,
  high: 8,
}

const LANGUAGE_DELTA: Record<string, number> = {
  unfamiliar: 5,
  basic: 2,
  conversational: 0,
  fluent: -2,
  deep: -4,
}

const PRESSURE_DELTA: Record<string, number> = {
  war: 8,
  famine: 6,
  disease: 6,
  unrest: 4,
}

const PRESSURE_LABEL: Record<string, string> = {
  war: 'War at the port',
  famine: 'Famine at the port',
  disease: 'Disease at the port',
  unrest: 'Unrest at the port',
}

function languageFactor(state: GameState, destinationId: string, index: ContentIndex): HazardFactor | null {
  const languages = index.destinations.get(destinationId)?.languages ?? []
  if (languages.length === 0) return null

  let best = 0
  let bestName = languages[0] ?? ''
  for (const languageId of languages) {
    const tier = state.player.languages[languageId]?.tier ?? 'unfamiliar'
    const rank = LANGUAGE_TIERS.indexOf(tier)
    if (rank > best) {
      best = rank
      bestName = languageId
    }
  }
  const tier = LANGUAGE_TIERS[best] ?? 'unfamiliar'
  const name = languageName(index, bestName)
  return {
    label: `${name}: ${tier}`,
    delta: LANGUAGE_DELTA[tier] ?? 0,
  }
}

function healthFactor(state: GameState, index: ContentIndex): HazardFactor | null {
  let delta = 0
  for (const affliction of state.player.afflictions) {
    delta += index.afflictions.get(affliction.id)?.severity === 'grave' ? 5 : 2
  }
  if (state.player.stamina < 3) delta += 5
  if (delta === 0) return null
  return { label: 'Health and reserve', delta: Math.min(12, delta) }
}

function tiesFactor(state: GameState, destinationId: string, index: ContentIndex): HazardFactor | null {
  let ties = 0
  for (const [characterId, relationship] of Object.entries(state.narrative.relationships)) {
    if (relationship.trust < 2) continue
    const home = index.characters.get(characterId)?.home
    if (home === destinationId) ties += 1
  }
  if (ties === 0) return null
  return { label: 'People who know you here', delta: -Math.min(6, ties * 3) }
}

/** The derived chance and the lines a player can read to understand it. */
export function assessHazard(
  state: GameState,
  route: RouteDef,
  mode: TravelModeDef,
  destinationId: string,
  index: ContentIndex,
): HazardView | null {
  if (!route.hazard) return null

  const factors: HazardFactor[] = []
  if (route.risk && RISK_DELTA[route.risk] !== 0) {
    factors.push({ label: `${route.risk} crossing`, delta: RISK_DELTA[route.risk] })
  }
  const difficulty = difficultyConfig(state.meta.difficulty)
  if (difficulty.hazardShift !== 0) {
    factors.push({ label: difficulty.hazardLabel, delta: difficulty.hazardShift })
  }
  if (mode.hazardModifier) {
    factors.push({ label: mode.name, delta: mode.hazardModifier })
  }

  const language = languageFactor(state, destinationId, index)
  if (language && language.delta !== 0) factors.push(language)

  const knownRoads = Math.max(0, state.knowledge.knownDestinations.length - 2)
  if (knownRoads > 0) {
    factors.push({ label: 'Roads you already know', delta: -Math.min(5, knownRoads) })
  }

  const ties = tiesFactor(state, destinationId, index)
  if (ties) factors.push(ties)

  const health = healthFactor(state, index)
  if (health) factors.push(health)

  if (state.world.routeStates[route.id] === 'risky') {
    factors.push({ label: 'The road is marked risky', delta: 5 })
  }

  const pressures = state.world.destinationStates[destinationId] ?? []
  for (const pressure of pressures) {
    const delta = PRESSURE_DELTA[pressure]
    if (delta) factors.push({ label: PRESSURE_LABEL[pressure] ?? pressure, delta })
  }

  const raw = route.hazard.baseChance + factors.reduce((total, factor) => total + factor.delta, 0)
  const chance = Math.max(5, Math.min(60, Math.round(raw)))
  return {
    chance,
    band: chance < 15 ? 'low' : chance < 30 ? 'moderate' : 'high',
    factors,
  }
}