/**
 * Maps at three scales: the quarter you are standing in, the region around it, and the
 * world you have heard about.
 *
 * Read models only. They show the places, local marks, terrain and crossings the
 * protagonist has learned of; the world map draws authored region shapes but withholds a
 * region's name and its terrain until some destination in it is known. Fog is the absence
 * of knowledge, not a hidden truth the interface glimpses.
 */

import type { DestinationDef, PlaceDef, RegionDef } from '../content'
import type { ContentIndex } from '../content'
import type { GameState } from '../state'
import { routeProblem } from '../world'

export interface MapPlaceView {
  id: string
  name: string
  kind: string
  /** 0–100, from the authored `mapPosition` or a fallback grid. */
  x: number
  y: number
  current: boolean
  regionId: string
}

export interface MapRouteView {
  id: string
  name: string
  from: string
  to: string
  open: boolean
  reason?: string
  /** Days by the fastest authored mode. */
  days: number
  /** False when the crossing is known but its far end is not yet on the sketch. */
  drawn: boolean
}

export interface MapRegionView {
  id: string
  /** Absent until a destination in the region is known. */
  name?: string
  known: boolean
  x: number
  y: number
  radius: number
}

export type MapFeatureKind = 'river' | 'mountains' | 'border'

/** A schematic ridge, river or border line on the regional and world sketches. */
export interface MapFeatureView {
  id: string
  kind: MapFeatureKind
  /** Points on the 0–100 sketch, in authored order. */
  points: { x: number; y: number }[]
}

/** A building footprint on the quarter sketch, in sketch units. */
export interface LocalBuildingView {
  id: string
  kind: PlaceDef['kind']
  x: number
  y: number
  width: number
  height: number
}

export interface LocalMarkView {
  id: string
  name: string
  kind: PlaceDef['kind']
  description: string
  /** Authored place art ID; the UI resolves it, the map does not. */
  art?: string
  x: number
  y: number
}

export interface LocalMapView {
  destination: { id: string; name: string; kind: string }
  marks: LocalMarkView[]
  buildings: LocalBuildingView[]
}

export interface RegionalMapView {
  region: { id: string; name: string }
  shape: { x: number; y: number; radius: number }
  places: MapPlaceView[]
  routes: MapRouteView[]
  features: MapFeatureView[]
}

export interface WorldMapView {
  regions: MapRegionView[]
  places: MapPlaceView[]
  routes: MapRouteView[]
  features: MapFeatureView[]
}

/**
 * Footprints for the quarter sketch, by place kind. Presentation only: a market is a
 * wider shed than a temple, a harbour a long low mole. None of this is a plan.
 */
const FOOTPRINTS: Record<PlaceDef['kind'], { width: number; height: number }> = {
  market: { width: 17, height: 11 },
  harbour: { width: 19, height: 7 },
  palace: { width: 16, height: 12 },
  temple: { width: 11, height: 11 },
  quarter: { width: 15, height: 10 },
  workshop: { width: 12, height: 8 },
  archive: { width: 11, height: 8 },
}

/** Terrain and border lines of the given regions, in authored order. */
function featureViews(regions: RegionDef[]): MapFeatureView[] {
  return regions.flatMap((region) =>
    (region.mapFeatures ?? []).map((feature) => ({
      id: feature.id,
      kind: feature.kind,
      points: feature.points.map((point) => ({ x: point.x, y: point.y })),
    })),
  )
}

function placePosition(destination: DestinationDef, index: number): { x: number; y: number } {
  if (destination.mapPosition) return destination.mapPosition
  return { x: 18 + (index % 4) * 22, y: 24 + Math.floor(index / 4) * 22 }
}

/** The destination the player is in, or null while travelling or between places. */
function currentDestination(state: GameState, index: ContentIndex): DestinationDef | null {
  return index.destinations.get(state.player.location) ?? null
}

/** The region being travelled from while on a route, else the destination's region. */
function currentRegion(state: GameState, index: ContentIndex): RegionDef | null {
  const destination = currentDestination(state, index)
  if (destination) return index.regions.get(destination.region) ?? null

  const route = index.routes.get(state.player.location)
  if (!route) return null
  const origin = index.destinations.get(route.from)
  return origin ? (index.regions.get(origin.region) ?? null) : null
}

export function deriveLocalMap(state: GameState, index: ContentIndex): LocalMapView | null {
  const destination = currentDestination(state, index)
  if (!destination) return null

  const marks = destination.places.map((place, position) => {
    const authored = place.mapPosition
    const angle = (position / Math.max(destination.places.length, 1)) * Math.PI * 2
    return {
      id: place.id,
      name: place.name,
      kind: place.kind,
      description: place.description,
      ...(place.art ? { art: place.art } : {}),
      x: authored?.x ?? 50 + Math.cos(angle) * 26,
      y: authored?.y ?? 50 + Math.sin(angle) * 26,
    }
  })

  const buildings = marks.map((mark) => ({
    id: mark.id,
    kind: mark.kind,
    x: mark.x,
    y: mark.y,
    ...FOOTPRINTS[mark.kind],
  }))

  return {
    destination: { id: destination.id, name: destination.name, kind: destination.kind },
    marks,
    buildings,
  }
}

function placeViews(
  state: GameState,
  index: ContentIndex,
  destinationIds: string[],
): MapPlaceView[] {
  return destinationIds
    .map((id) => index.destinations.get(id))
    .filter((destination): destination is DestinationDef => Boolean(destination))
    .map((destination, position) => {
      const { x, y } = placePosition(destination, position)
      return {
        id: destination.id,
        name: destination.name,
        kind: destination.kind,
        x,
        y,
        current: destination.id === state.player.location,
        regionId: destination.region,
      }
    })
}

function routeViews(
  state: GameState,
  index: ContentIndex,
  onMap: Set<string>,
  routes: { id: string }[],
): MapRouteView[] {
  return routes.map((candidate) => {
    const route = index.routes.get(candidate.id)
    if (!route) {
      return {
        id: candidate.id,
        name: candidate.id,
        from: '',
        to: '',
        open: false,
        reason: 'This crossing is missing from the content.',
        days: 0,
        drawn: false,
      }
    }

    const problem = routeProblem(state, route, index)
    return {
      id: route.id,
      name: route.name,
      from: route.from,
      to: route.to,
      open: problem === null,
      reason: problem ?? undefined,
      days: Math.min(...route.modes.map((mode) => mode.days)),
      drawn: onMap.has(route.from) && onMap.has(route.to),
    }
  })
}

/** Known destinations in authored order; the current place is always included. */
function knownPlaceIds(state: GameState, index: ContentIndex): string[] {
  return [...new Set([state.player.location, ...state.knowledge.knownDestinations])].filter((id) =>
    index.destinations.has(id),
  )
}

export function deriveRegionalMap(state: GameState, index: ContentIndex): RegionalMapView | null {
  const region = currentRegion(state, index)
  if (!region) return null

  const places = placeViews(
    state,
    index,
    knownPlaceIds(state, index).filter((id) => index.destinations.get(id)?.region === region.id),
  )
  const onMap = new Set(places.map((place) => place.id))
  const routes = routeViews(
    state,
    index,
    onMap,
    [...index.routes.values()].filter(
      (route) =>
        state.knowledge.knownRoutes.includes(route.id) &&
        index.destinations.get(route.from)?.region === region.id &&
        index.destinations.get(route.to)?.region === region.id,
    ),
  )

  const shape = regionView(state, index, region, true)
  return {
    region: { id: region.id, name: region.name },
    shape: { x: shape.x, y: shape.y, radius: shape.radius },
    places,
    routes,
    features: featureViews([region]),
  }
}

function regionView(
  state: GameState,
  index: ContentIndex,
  region: RegionDef,
  known: boolean,
): MapRegionView {
  const knownPlaces = [...index.destinations.values()].filter(
    (destination) =>
      destination.region === region.id &&
      state.knowledge.knownDestinations.includes(destination.id),
  )
  const centre = region.mapPosition ?? {
    x: knownPlaces.length
      ? knownPlaces.reduce((total, place) => total + (place.mapPosition?.x ?? 50), 0) /
        knownPlaces.length
      : 50,
    y: knownPlaces.length
      ? knownPlaces.reduce((total, place) => total + (place.mapPosition?.y ?? 50), 0) /
        knownPlaces.length
      : 50,
  }

  return {
    id: region.id,
    ...(known ? { name: region.name } : {}),
    known,
    x: centre.x,
    y: centre.y,
    radius: region.mapRadius ?? 18,
  }
}

export function deriveWorldMap(state: GameState, index: ContentIndex): WorldMapView {
  const places = placeViews(state, index, knownPlaceIds(state, index))
  const onMap = new Set(places.map((place) => place.id))
  const routes = routeViews(
    state,
    index,
    onMap,
    [...index.routes.values()].filter((route) => state.knowledge.knownRoutes.includes(route.id)),
  )

  const knownRegions = new Set(places.map((place) => place.regionId))
  const listed = [...index.regions.values()]
  const regions = listed.map((region) =>
    regionView(state, index, region, knownRegions.has(region.id)),
  )

  // Terrain is knowledge too: a fogged region's ridges and rivers stay off the sketch.
  const features = featureViews(listed.filter((region) => knownRegions.has(region.id)))

  return { regions, places, routes, features }
}
