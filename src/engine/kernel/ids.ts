/**
 * Identifier types and helpers.
 *
 * IDs are stable, lowercase, dot-namespaced strings (`docs/CONTENT.md` §1). They are
 * branded at the type level so a `DestinationId` cannot be passed where a `RouteId` is
 * expected, while remaining plain strings at runtime and in saves.
 */

declare const brand: unique symbol

type Branded<T, B extends string> = T & { readonly [brand]: B }

export type EntityId = string
export type RegionId = Branded<string, 'RegionId'>
export type DestinationId = Branded<string, 'DestinationId'>
export type RouteId = Branded<string, 'RouteId'>
export type WaypointId = Branded<string, 'WaypointId'>
export type GoodId = Branded<string, 'GoodId'>
export type CharacterId = Branded<string, 'CharacterId'>
export type EventId = Branded<string, 'EventId'>
export type DialogueId = Branded<string, 'DialogueId'>
export type JournalId = Branded<string, 'JournalId'>
export type CodexId = Branded<string, 'CodexId'>
export type FactionId = Branded<string, 'FactionId'>
export type LanguageId = Branded<string, 'LanguageId'>
export type CultureId = Branded<string, 'CultureId'>
export type ArcId = Branded<string, 'ArcId'>
export type PackId = Branded<string, 'PackId'>
export type SceneId = Branded<string, 'SceneId'>

/** A day count. Day 0 is 1230-01-01 (`docs/design/00-timeline.md`). */
export type Day = Branded<number, 'Day'>

/** The identifier prefixes defined in `docs/CONTENT.md` §1. */
export const ID_PREFIXES = {
  region: 'region.',
  destination: 'dest.',
  route: 'route.',
  waypoint: 'way.',
  good: 'good.',
  character: 'char.',
  event: 'evt.',
  dialogue: 'dlg.',
  journal: 'journal.',
  codex: 'codex.',
  faction: 'faction.',
  language: 'lang.',
  culture: 'culture.',
  arc: 'arc.',
  pack: 'pack.',
  scene: 'dlg.',
} as const

export type IdKind = keyof typeof ID_PREFIXES

/** The content folder each ID kind lives in. Enforced by the linter. */
export const ID_FOLDERS = {
  region: 'regions',
  destination: 'destinations',
  route: 'routes',
  waypoint: 'waypoints',
  good: 'goods',
  character: 'characters',
  event: 'events',
  dialogue: 'dialogues',
  journal: 'journal',
  codex: 'codex',
  faction: 'factions',
  language: 'languages',
  culture: 'cultures',
  arc: 'arcs',
} as const

export type IdFolder = (typeof ID_FOLDERS)[keyof typeof ID_FOLDERS]

export function isNamespacedId(id: string, kind: IdKind): boolean {
  const prefix = ID_PREFIXES[kind]
  return id.startsWith(prefix) && id.length > prefix.length
}

/** The final dot segment of an ID, which must match the entity's file name. */
export function idSegment(id: string): string {
  const parts = id.split('.')
  return parts.length > 0 ? (parts[parts.length - 1] as string) : id
}

/** The folder-relative name a file must use for an entity ID: `char.a.b` -> `b`. */
export function expectedFileName(id: string): string {
  return `${idSegment(id)}.json`
}

/** Cast a plain string to a branded ID. Validation happens in the content registry. */
export function asDestinationId(id: string): DestinationId {
  return id as DestinationId
}

export function asRouteId(id: string): RouteId {
  return id as RouteId
}

export function asCharacterId(id: string): CharacterId {
  return id as CharacterId
}

export function asGoodId(id: string): GoodId {
  return id as GoodId
}

export function asEventId(id: string): EventId {
  return id as EventId
}

export function asDay(day: number): Day {
  return day as Day
}
