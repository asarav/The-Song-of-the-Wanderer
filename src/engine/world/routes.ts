/**
 * Routes.
 *
 * A route's availability is derived from authored rules plus the player's knowledge,
 * never stored as a display value. Place is derived from phase, deltas, and events in
 * M5; here it is knowledge, authored closure, and requirements.
 */

import { evaluateCondition } from '../dsl'
import type { RouteDef, TravelModeDef } from '../content'
import { createDslContent, type ContentIndex } from '../content'
import { RngCursor } from '../rng'
import type { GameState } from '../state'
import { cargoWeight } from '../economy'
import { assessHazard, type HazardView } from './hazard'

/** The one good a passage expects in the hold. Its content id belongs here, not in screens. */
export const PASSAGE_PROVISION = 'good.grain'

export interface RouteView {
  id: string
  name: string
  kind: RouteDef['kind']
  from: string
  to: string
  /** Display names for the two ends, so no screen ever prints a raw id. */
  fromName: string
  toName: string
  risk?: RouteDef['risk']
  segments: NonNullable<RouteDef['segments']>
  waypoints: NonNullable<RouteDef['waypoints']>
  modes: TravelModeDef[]
  /** The derived road risk for each mode, in the same order as `modes`. */
  hazards: Record<string, HazardView>
  known: boolean
  open: boolean
  usable: boolean
  reason?: string
}

function conditionHolds(state: GameState, index: ContentIndex, condition: RouteDef['closedWhen']): boolean {
  if (!condition) return false
  return evaluateCondition(condition, {
    state,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
  })
}

function placeName(index: ContentIndex, id: string): string {
  return index.destinations.get(id)?.name ?? index.routes.get(id)?.name ?? id
}

/** Why this route cannot be taken, or `null` when it can. */
export function routeProblem(state: GameState, route: RouteDef, index: ContentIndex): string | null {
  if (!state.knowledge.knownRoutes.includes(route.id)) {
    return 'You have not heard of this crossing.'
  }

  if (state.world.routeStates[route.id] === 'closed') {
    return route.closureNote ?? 'This crossing is closed.'
  }

  if (conditionHolds(state, index, route.closedWhen)) {
    return route.closureNote ?? 'This crossing is closed for now.'
  }

  if (route.requirements) {
    const met = evaluateCondition(route.requirements, {
      state,
      content: createDslContent(index),
      rng: new RngCursor(state.rng),
    })
    if (!met) return route.requirementsNote ?? 'You do not have what this crossing asks for.'
  }

  return null
}

export function deriveRoute(
  state: GameState,
  routeId: string,
  index: ContentIndex,
): RouteView | null {
  const route = index.routes.get(routeId)
  if (!route) return null

  const known = state.knowledge.knownRoutes.includes(route.id)
  const problem = routeProblem(state, route, index)
  // A corridor reads from the end the player is standing on, so a trader in Cyprus
  // booking the same crossing sees it as the way home.
  const reversed = state.player.location === route.to
  const segments = route.segments ?? []
  const waypoints = route.waypoints ?? []
  const destinationId = reversed ? route.from : route.to
  const hazards: Record<string, HazardView> = {}
  for (const mode of route.modes) {
    const hazard = assessHazard(state, route, mode, destinationId, index)
    if (hazard) hazards[mode.id] = hazard
  }

  return {
    id: route.id,
    name: route.name,
    kind: route.kind,
    from: reversed ? route.to : route.from,
    to: reversed ? route.from : route.to,
    fromName: placeName(index, reversed ? route.to : route.from),
    toName: placeName(index, reversed ? route.from : route.to),
    risk: route.risk,
    segments: reversed ? [...segments].reverse() : segments,
    waypoints: reversed ? [...waypoints].reverse() : waypoints,
    modes: route.modes,
    hazards,
    known,
    open: problem === null,
    usable: problem === null,
    reason: problem ?? undefined,
  }
}

/** Every route the player knows about, for the travel screen. */
export function deriveKnownRoutes(state: GameState, index: ContentIndex): RouteView[] {
  return [...index.routes.values()]
    .filter((route) => state.knowledge.knownRoutes.includes(route.id))
    .map((route) => deriveRoute(state, route.id, index))
    .filter((view): view is RouteView => view !== null)
}

export interface TravelQuote {
  ok: boolean
  reason?: string
  mode?: TravelModeDef
}

/** How much of the one stamina track a departure asks for. */
export function exertionOf(mode: TravelModeDef): number {
  return mode.exertion ?? Math.max(1, Math.ceil(mode.days / 2))
}

/** Validate a departure: known, open, requirements met, mode exists, cargo and fare fit. */
export function quoteTravel(
  state: GameState,
  routeId: string,
  modeId: string,
  index: ContentIndex,
): TravelQuote {
  const route = index.routes.get(routeId)
  if (!route) return { ok: false, reason: 'There is no such crossing.' }

  const problem = routeProblem(state, route, index)
  if (problem) return { ok: false, reason: problem }

  const mode = route.modes.find((candidate) => candidate.id === modeId)
  if (!mode) return { ok: false, reason: 'There is no such way to travel.' }

  // A corridor has two ends. Anywhere else, the fare and the boat are not there.
  if (state.player.location !== route.from && state.player.location !== route.to) {
    return { ok: false, reason: 'You are not at either end of this crossing.' }
  }

  if (mode.baseCost > state.player.money) {
    return { ok: false, reason: 'You cannot pay the passage.' }
  }

  if (state.player.stamina < exertionOf(mode)) {
    return { ok: false, reason: 'You do not have the strength for this passage. Rest first.' }
  }

  const provisions = mode.provisions ?? 0
  if (provisions > 0) {
    const carried =
      state.player.inventory.find((entry) => entry.item === PASSAGE_PROVISION)?.quantity ?? 0
    if (carried < provisions) {
      return {
        ok: false,
        reason: `You need ${provisions === 1 ? 'one measure' : `${provisions} measures`} of grain for the passage.`,
      }
    }
  }

  if (cargoWeight(state, index) > mode.capacity) {
    return { ok: false, reason: 'Your cargo is too heavy for this passage.' }
  }

  return { ok: true, mode }
}
