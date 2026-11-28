/**
 * Display-name lookups for content IDs.
 *
 * Authored IDs are namespaced and machine-readable; a screen must show the authored name
 * when the entity exists and fall back to the ID when it does not. Keeping that contract in
 * one place stops each read model from inventing a slightly different fallback order.
 */

import type { ContentIndex } from './registry'

function nameOf<T extends { name: string }>(
  map: ReadonlyMap<string, T>,
  id: string,
): string | undefined {
  return map.get(id)?.name
}

/** A character's authored name, or the character ID when the index cannot name it. */
export function characterName(index: ContentIndex, id: string): string {
  return nameOf(index.characters, id) ?? id
}

/** A faction's authored name, or the faction ID when the index cannot name it. */
export function factionName(index: ContentIndex, id: string): string {
  return nameOf(index.factions, id) ?? id
}

/** A good's authored name, or the good ID when the index cannot name it. */
export function goodName(index: ContentIndex, id: string): string {
  return nameOf(index.goods, id) ?? id
}

/** A language's authored name, or the language ID when the index cannot name it. */
export function languageName(index: ContentIndex, id: string): string {
  return nameOf(index.languages, id) ?? id
}

/**
 * A place or route's authored name. A destination is preferred because the same ID can be
 * reached on foot or by route; the route name is the fallback for a crossing in progress.
 */
export function placeName(index: ContentIndex, id: string): string {
  return nameOf(index.destinations, id) ?? nameOf(index.routes, id) ?? id
}

/**
 * A name for any subject a view can mention: a character, faction, good, destination or
 * route. The order is deliberate and mirrors the entity namespaces.
 */
export function subjectName(index: ContentIndex, id: string): string {
  return (
    nameOf(index.characters, id) ??
    nameOf(index.factions, id) ??
    nameOf(index.goods, id) ??
    nameOf(index.destinations, id) ??
    nameOf(index.routes, id) ??
    id
  )
}