/**
 * Derived journey views.
 */

import { placeName, type ContentIndex } from '../content'
import { formatDisplayDate } from '../time'
import type { GameState } from '../state'

export interface JourneyStopView {
  id: string
  name: string
  kind: string
  day: number
  date: string
  reached: boolean
}

export interface JourneyView {
  route: string
  routeName: string
  mode: string
  modeName: string
  origin: string
  destination: string
  departedAt: string
  arrivesAt: string
  daysRemaining: number
  stopsRemaining: number
  stops: JourneyStopView[]
}

export function deriveJourney(state: GameState, index: ContentIndex): JourneyView | null {
  const journey = state.narrative.journey
  if (!journey) return null

  const route = index.routes.get(journey.route)
  const mode = route?.modes.find((candidate) => candidate.id === journey.mode)
  const remainingStops = journey.slots.length - journey.nextSlot
  const stops = (route?.waypoints ?? []).map((waypoint) => ({
    id: waypoint.id,
    name: waypoint.name,
    kind: waypoint.kind,
    day: journey.departedAt + waypoint.afterDays,
    date: formatDisplayDate(journey.departedAt + waypoint.afterDays),
    reached: journey.departedAt + waypoint.afterDays <= state.calendar.day,
  }))

  return {
    route: journey.route,
    routeName: route?.name ?? journey.route,
    mode: journey.mode,
    modeName: mode?.name ?? journey.mode,
    origin: placeName(index, journey.origin),
    destination: placeName(index, journey.destination),
    departedAt: formatDisplayDate(journey.departedAt),
    arrivesAt: formatDisplayDate(journey.arrivesAt),
    daysRemaining: Math.max(0, journey.arrivesAt - state.calendar.day),
    stopsRemaining: Math.max(0, remainingStops),
    stops,
  }
}
