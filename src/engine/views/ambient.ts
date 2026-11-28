/**
 * Time-of-day copy.
 *
 * Ambient observations are presentation, not history: they never change state, open a
 * scene or draw from a seeded stream. The same save, day and place always choose the same
 * observation. Conditions and culture decide what the people here would say.
 */

import { createDslContent, type AmbientObservationDef, type ContentIndex } from '../content'
import { evaluateCondition } from '../dsl'
import { RngCursor } from '../rng'
import type { GameState } from '../state'

export type AmbientViewContext = 'day' | 'night' | 'travel'

export interface AmbientView {
  id: string
  context: AmbientViewContext
  text: string
  beatArt: readonly string[]
  tags: readonly string[]
}

/** FNV-1a over a stable description of the moment. No wall clock, no state mutation. */
function hash32(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function culturesAt(state: GameState, index: ContentIndex, context: AmbientViewContext): string[] {
  if (context === 'travel') {
    const journey = state.narrative.journey
    const route = journey ? index.routes.get(journey.route) : index.routes.get(state.player.location)
    if (!route) return []
    const cultures = new Set<string>()
    for (const id of [route.from, route.to]) {
      for (const culture of index.destinations.get(id)?.cultures ?? []) cultures.add(culture)
    }
    return [...cultures].sort()
  }

  const destination = index.destinations.get(state.player.location)
  return destination?.cultures ?? []
}

function regionsAt(state: GameState, index: ContentIndex, context: AmbientViewContext): string[] {
  if (context === 'travel') {
    const journey = state.narrative.journey
    const route = journey ? index.routes.get(journey.route) : index.routes.get(state.player.location)
    if (!route) return []
    const regions = new Set<string>()
    for (const id of [route.from, route.to]) {
      const region = index.destinations.get(id)?.region
      if (region) regions.add(region)
    }
    return [...regions].sort()
  }

  const region = index.destinations.get(state.player.location)?.region
  return region ? [region] : []
}

function scopeMatches(
  entry: AmbientObservationDef,
  state: GameState,
  context: AmbientViewContext,
  regions: readonly string[],
): boolean {
  const scope = entry.scope
  if (!scope) return true

  const location = state.player.location
  const routeId = state.narrative.journey?.route ?? (context === 'travel' ? location : undefined)
  const hasScope = Boolean(scope.destinations?.length || scope.routes?.length || scope.regions?.length)
  if (!hasScope) return true

  if (scope.destinations?.includes(location)) return true
  if (routeId && scope.routes?.includes(routeId)) return true
  return regions.some((region) => scope.regions?.includes(region) ?? false)
}

function eligible(
  state: GameState,
  index: ContentIndex,
  context: AmbientViewContext,
  cultures: readonly string[],
  regions: readonly string[],
): AmbientObservationDef[] {
  const dsl = createDslContent(index)
  const rng = new RngCursor({ ...state.rng })
  return [...index.ambient.values()]
    .filter((entry) => entry.context === context)
    .filter((entry) => entry.cultures.some((culture) => cultures.includes(culture)))
    .filter((entry) => scopeMatches(entry, state, context, regions))
    .filter((entry) => !entry.conditions || evaluateCondition(entry.conditions, { state, content: dsl, rng }))
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function pick(
  candidates: readonly AmbientObservationDef[],
  seed: string,
  day: number,
  context: AmbientViewContext,
  location: string,
): AmbientObservationDef | undefined {
  if (candidates.length === 0) return undefined
  const total = candidates.reduce((sum, entry) => sum + entry.weight, 0)
  if (total <= 0) return candidates[0]
  const roll = hash32(`${seed}|${day}|${context}|${location}`) % total
  let at = 0
  for (const entry of candidates) {
    at += entry.weight
    if (roll < at) return entry
  }
  return candidates[candidates.length - 1]
}

/**
 * Choose the copy for this context. The previous day is recomputed over the same
 * candidates so the same tone does not run twice when another one is available.
 */
export function deriveAmbient(
  state: GameState,
  index: ContentIndex,
  context: AmbientViewContext,
): AmbientView | null {
  const cultures = culturesAt(state, index, context)
  if (cultures.length === 0) return null

  const regions = regionsAt(state, index, context)
  const candidates = eligible(state, index, context, cultures, regions)
  if (candidates.length === 0) return null

  const location = state.narrative.journey?.route ?? state.player.location
  const seed = state.meta.seed
  const sharesTag = (a: AmbientObservationDef, b: AmbientObservationDef): boolean => {
    const left = new Set(a.tags ?? [])
    return (b.tags ?? []).some((tag) => left.has(tag))
  }

  /**
   * Walk from day zero so "yesterday" means the line actually shown, not the raw draw
   * that a previous day may have replaced. The pool is four lines; the walk is cheap.
   */
  let selected = pick(candidates, seed, 0, context, location)
  for (let day = 1; day <= state.calendar.day; day += 1) {
    const chosen = pick(candidates, seed, day, context, location)
    if (!chosen) continue
    if (!selected) {
      selected = chosen
      continue
    }
    if (chosen.id === selected.id) {
      const other = candidates.find((entry) => entry.id !== selected?.id)
      selected = other ?? chosen
      continue
    }
    if (sharesTag(chosen, selected)) {
      const differentTone = candidates.find(
        (entry) => entry.id !== selected?.id && !sharesTag(entry, selected as AmbientObservationDef),
      )
      selected = differentTone ?? chosen
      continue
    }
    selected = chosen
  }
  if (!selected) return null

  return {
    id: selected.id,
    context,
    text: selected.text,
    beatArt: selected.beatArt,
    tags: selected.tags ?? [],
  }
}
