/**
 * Derived destination and place views.
 *
 * Read models only: nothing here is persisted, and nothing here may reveal a fact the
 * protagonist has not learned. Cast presence is derived from runtime location (or the
 * character's home) and status, never from a stored "who is here" list.
 *
 * A destination owns the cast and market. A place owns presence and the verbs available
 * there; a character assigned to no place appears under "Elsewhere in the port".
 */

import type { CharacterDef, PlaceAction, PlaceDef } from '../content'
import type { ContentIndex } from '../content'
import type { GameState } from '../state'
import { deriveMarket, type MarketView } from '../economy'
import { deriveRoute, type RouteView } from '../world'

export interface PresentCharacter {
  id: string
  name: string
  tier: CharacterDef['tier']
  roles: string[]
}

export interface PlaceView {
  id: string
  name: string
  kind: PlaceDef['kind']
  description: string
  art?: string
  mapPosition?: { x: number; y: number }
  /** People assigned here who are also present at the destination right now. */
  cast: PresentCharacter[]
  /** Only actions the place actually affords. Empty means the place is a scene, not a menu. */
  actions: PlaceAction[]
}

export interface DestinationView {
  id: string
  name: string
  kind: string
  intro: string
  introBeatArt?: string[]
  states: string[]
  places: PlaceView[]
  /** Present at the destination but assigned to no place, so nobody vanishes. */
  elsewhere: PresentCharacter[]
  routes: RouteView[]
  market: MarketView | null
}

export function presentCharacters(
  state: GameState,
  destinationId: string,
  index: ContentIndex,
): PresentCharacter[] {
  const destination = index.destinations.get(destinationId)
  if (!destination) return []

  const present: PresentCharacter[] = []
  for (const characterId of destination.cast) {
    const character = index.characters.get(characterId)
    if (!character) continue

    const runtime = state.narrative.characterStates[characterId]
    const location = runtime?.location ?? character.home
    const status = runtime?.status ?? 'alive'
    if (location !== destinationId || status !== 'alive') continue

    present.push({
      id: character.id,
      name: character.name,
      tier: character.tier,
      roles: character.roles,
    })
  }

  return present
}

function placeView(place: PlaceDef, present: PresentCharacter[]): PlaceView {
  const byId = new Map(present.map((character) => [character.id, character]))
  return {
    ...place,
    cast: (place.cast ?? [])
      .map((characterId) => byId.get(characterId))
      .filter((character): character is PresentCharacter => character !== undefined),
    actions: place.actions ?? [],
  }
}

export function deriveDestination(
  state: GameState,
  destinationId: string,
  index: ContentIndex,
): DestinationView | null {
  const destination = index.destinations.get(destinationId)
  if (!destination) return null

  const present = presentCharacters(state, destination.id, index)
  const assigned = new Set(destination.places.flatMap((place) => place.cast ?? []))

  return {
    id: destination.id,
    name: destination.name,
    kind: destination.kind,
    intro: destination.intro,
    introBeatArt: destination.beatArt,
    states: state.world.destinationStates[destination.id] ?? [],
    places: destination.places.map((place) => placeView(place, present)),
    elsewhere: present.filter((character) => !assigned.has(character.id)),
    // A road the traveller has not learned of is not theirs to see yet: naming it on the
    // port screen would leak a destination before any character, rumor or map disclosed it.
    routes: destination.routes
      .map((routeId) => deriveRoute(state, routeId, index))
      .filter((view): view is RouteView => view !== null && view.known),
    market: deriveMarket(state, destination.id, index),
  }
}

/** A single place, for the place screen. Null when either the port or place is unknown. */
export function derivePlace(
  state: GameState,
  destinationId: string,
  placeId: string,
  index: ContentIndex,
): PlaceView | null {
  const destination = deriveDestination(state, destinationId, index)
  return destination?.places.find((place) => place.id === placeId) ?? null
}
