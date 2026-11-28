/**
 * Content registry.
 *
 * Loads packs, validates every entity against its schema, checks IDs and references,
 * and exposes typed lookups plus the narrow `DslContent` view the DSL is allowed to use.
 *
 * The same function powers `pnpm content:lint`, so the CLI and the runtime can never
 * disagree about what a valid pack is.
 */

import { parseCondition } from '../dsl'
import { parseEffects } from '../dsl'
import type { Condition, DslContent } from '../dsl'
import {
  ENTITY_SCHEMAS,
  ManifestSchema,
  type AmbientObservationDef,
  type AnyEntity,
  type CharacterDef,
  type ClimateDef,
  type CodexDef,
  type CultureDef,
  type DestinationDef,
  type DialogueDef,
  type EntityFolder,
  type EventDef,
  type FactionDef,
  type GoodDef,
  type AfflictionDef,
  type JournalDef,
  type LanguageDef,
  type RegionDef,
  type RouteDef,
} from './schema'

export interface ContentIssue {
  level: 'error' | 'warning'
  path: string
  message: string
}

export interface RawEntityFile {
  folder: EntityFolder
  /** File name including `.json`, used in issue paths. */
  file: string
  data: unknown
}

export interface RawPack {
  /** `manifest.json`, already parsed. */
  manifest: unknown
  files: RawEntityFile[]
}

export interface ContentIndex {
  packs: string[]
  contentVersions: Record<string, number>
  byId: Map<string, { folder: EntityFolder; entity: AnyEntity; path?: string }>
  climates: Map<string, ClimateDef>
  cultures: Map<string, CultureDef>
  languages: Map<string, LanguageDef>
  factions: Map<string, FactionDef>
  regions: Map<string, RegionDef>
  destinations: Map<string, DestinationDef>
  routes: Map<string, RouteDef>
  goods: Map<string, GoodDef>
  afflictions: Map<string, AfflictionDef>
  characters: Map<string, CharacterDef>
  events: Map<string, EventDef>
  ambient: Map<string, AmbientObservationDef>
  dialogues: Map<string, DialogueDef>
  journal: Map<string, JournalDef>
  codex: Map<string, CodexDef>
}

export interface ContentCounts {
  packs: number
  entities: number
  byFolder: Record<string, number>
}

export interface BuildResult {
  index: ContentIndex
  issues: ContentIssue[]
  counts: ContentCounts
}

const SINGULAR: Record<EntityFolder, string> = {
  climates: 'climate',
  cultures: 'culture',
  languages: 'language',
  factions: 'faction',
  regions: 'region',
  destinations: 'destination',
  routes: 'route',
  goods: 'good',
  afflictions: 'affliction',
  characters: 'character',
  events: 'event',
  ambient: 'ambient observation',
  dialogues: 'dialogue',
  journal: 'journal entry',
  codex: 'codex entry',
}

export function emptyContentIndex(): ContentIndex {
  return {
    packs: [],
    contentVersions: {},
    byId: new Map(),
    climates: new Map(),
    cultures: new Map(),
    languages: new Map(),
    factions: new Map(),
    regions: new Map(),
    destinations: new Map(),
    routes: new Map(),
    goods: new Map(),
    afflictions: new Map(),
    characters: new Map(),
    events: new Map(),
    ambient: new Map(),
    dialogues: new Map(),
    journal: new Map(),
    codex: new Map(),
  }
}

/** The map for a folder. Folder names are the index's own keys, so this stays a lookup. */
function folderMap(index: ContentIndex, folder: EntityFolder): Map<string, AnyEntity> {
  return index[folder] as unknown as Map<string, AnyEntity>
}

function issue(issues: ContentIssue[], path: string, message: string): void {
  issues.push({ level: 'error', path, message })
}

function warn(issues: ContentIssue[], path: string, message: string): void {
  issues.push({ level: 'warning', path, message })
}

function requireRef(
  index: ContentIndex,
  issues: ContentIssue[],
  folder: EntityFolder,
  id: string,
  path: string,
  field: string,
): void {
  const found = index.byId.get(id)
  if (!found) {
    issue(issues, path, `${field} references unknown ${SINGULAR[folder]} "${id}"`)
    return
  }
  if (found.folder !== folder) {
    issue(
      issues,
      path,
      `${field} expects a ${SINGULAR[folder]} but "${id}" is a ${SINGULAR[found.folder]}`,
    )
  }
}

/** `documented` and `strongly-supported` claims must name a source (HISTORY.md §2). */
function checkProvenance(entity: AnyEntity, path: string, issues: ContentIssue[]): void {
  const { confidence, sources } = entity.provenance
  if (
    (confidence === 'documented' || confidence === 'strongly-supported') &&
    sources.length === 0
  ) {
    issue(issues, path, `"${confidence}" claims need at least one source`)
  }
}

function checkConditionsAndEffects(
  entity: EventDef | RouteDef | CodexDef,
  folder: EntityFolder,
  path: string,
  issues: ContentIssue[],
): void {
  if (folder === 'events') {
    const event = entity as EventDef
    const parsed = parseCondition(event.conditions)
    if (!parsed.ok) {
      issue(issues, path, `conditions: ${parsed.issues.join('; ')}`)
    }
    const effects = parseEffects(event.effects)
    if (!effects.ok) {
      issue(issues, path, `effects: ${effects.issues.join('; ')}`)
    }
  }

  if (folder === 'routes') {
    const route = entity as RouteDef
    for (const field of ['requirements', 'closedWhen'] as const) {
      const condition = route[field]
      if (!condition) continue
      const parsed = parseCondition(condition)
      if (!parsed.ok) issue(issues, path, `${field}: ${parsed.issues.join('; ')}`)
    }
    if (route.encountersPerJourney.max < route.encountersPerJourney.min) {
      issue(issues, path, 'encountersPerJourney.max is below min')
    }
  }

  if (folder === 'codex') {
    const codex = entity as CodexDef
    if (codex.unlockedBy) {
      const parsed = parseCondition(codex.unlockedBy)
      if (!parsed.ok) issue(issues, path, `unlockedBy: ${parsed.issues.join('; ')}`)
    }
  }
}

function checkDialogue(
  dialogue: DialogueDef,
  index: ContentIndex,
  path: string,
  issues: ContentIssue[],
): void {
  const nodeIds = Object.keys(dialogue.nodes)
  if (!dialogue.nodes[dialogue.start]) {
    issue(issues, path, `start node "${dialogue.start}" does not exist`)
  }
  if (dialogue.speaker) {
    requireRef(index, issues, 'characters', dialogue.speaker, path, 'speaker')
  }

  const openings = [dialogue.start]
  for (const entry of dialogue.entries ?? []) {
    const parsed = parseCondition(entry.when)
    if (!parsed.ok) issue(issues, path, `entry conditions: ${parsed.issues.join('; ')}`)
    if (!dialogue.nodes[entry.node]) {
      issue(issues, path, `entry node "${entry.node}" does not exist`)
    } else {
      openings.push(entry.node)
    }
  }

  const reached = new Set<string>()
  const queue = [...openings]
  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (nodeId === undefined) break
    if (reached.has(nodeId)) continue
    reached.add(nodeId)
    const node = dialogue.nodes[nodeId]
    if (!node) continue
    for (const choice of node.choices) {
      if (choice.conditions) {
        const parsed = parseCondition(choice.conditions)
        if (!parsed.ok)
          issue(issues, path, `${nodeId} choice conditions: ${parsed.issues.join('; ')}`)
      }
      if (choice.effects) {
        const parsed = parseEffects(choice.effects)
        if (!parsed.ok) issue(issues, path, `${nodeId} choice effects: ${parsed.issues.join('; ')}`)
      }
      if (choice.journal) {
        requireRef(index, issues, 'journal', choice.journal, path, `${nodeId} choice journal`)
      }
      if (choice.next) {
        if (!dialogue.nodes[choice.next]) {
          issue(issues, path, `${nodeId} choice "next" points to missing node "${choice.next}"`)
        } else {
          queue.push(choice.next)
        }
      }
    }
    if (node.nextDialogue) {
      requireRef(index, issues, 'dialogues', node.nextDialogue, path, `${nodeId} nextDialogue`)
    }
  }

  for (const nodeId of nodeIds) {
    if (!reached.has(nodeId)) {
      const from = dialogue.entries?.length ? 'any opening' : `"${dialogue.start}"`
      warn(issues, path, `node "${nodeId}" is unreachable from ${from}`)
    }
  }
}

function checkPackGraph(packs: { id: string; requires: string[] }[], issues: ContentIssue[]): void {
  const ids = new Set(packs.map((pack) => pack.id))
  for (const pack of packs) {
    for (const requirement of pack.requires) {
      if (!ids.has(requirement)) {
        issue(issues, `${pack.id}/manifest.json`, `requires unknown pack "${requirement}"`)
      }
    }
  }

  const state = new Map<string, 'visiting' | 'done'>()
  const walk = (id: string, trail: string[]): void => {
    const status = state.get(id)
    if (status === 'done') return
    if (status === 'visiting') {
      issue(issues, `${id}/manifest.json`, `pack requirement cycle: ${[...trail, id].join(' -> ')}`)
      return
    }
    state.set(id, 'visiting')
    const pack = packs.find((candidate) => candidate.id === id)
    for (const requirement of pack?.requires ?? []) walk(requirement, [...trail, id])
    state.set(id, 'done')
  }
  for (const pack of packs) walk(pack.id, [])
}

export function buildContentIndex(packs: RawPack[]): BuildResult {
  const issues: ContentIssue[] = []
  const index = emptyContentIndex()
  const byFolder: Record<string, number> = {}

  const manifests: { id: string; requires: string[]; path: string }[] = []
  const declared = new Map<string, Set<string>>()

  for (const pack of packs) {
    const manifestPath = 'manifest'
    const parsedManifest = ManifestSchema.safeParse(pack.manifest)
    if (!parsedManifest.success) {
      for (const detail of parsedManifest.error.issues) {
        issue(
          issues,
          `${manifestPath}/${detail.path.join('.') || '(root)'}`,
          `manifest: ${detail.message}`,
        )
      }
      continue
    }

    const manifest = parsedManifest.data
    manifests.push({ id: manifest.id, requires: manifest.requires, path: manifestPath })
    index.packs.push(manifest.id)
    index.contentVersions[manifest.id] = manifest.contentVersion

    const declaredIds = new Set<string>()
    for (const ids of Object.values(manifest.entities)) {
      for (const id of ids) declaredIds.add(id)
    }
    declared.set(manifest.id, declaredIds)

    for (const file of pack.files) {
      const path = `${manifest.id}/${file.folder}/${file.file}`
      const schema = ENTITY_SCHEMAS[file.folder]
      if (!schema) {
        issue(issues, path, `unknown content folder "${file.folder}"`)
        continue
      }

      const parsed = schema.safeParse(file.data)
      if (!parsed.success) {
        for (const detail of parsed.error.issues) {
          issue(issues, `${path}:${detail.path.join('.') || '(root)'}`, detail.message)
        }
        continue
      }

      const entity = parsed.data as AnyEntity
      const existing = index.byId.get(entity.id)
      if (existing) {
        issue(
          issues,
          path,
          `duplicate id "${entity.id}" (already defined as a ${SINGULAR[existing.folder]})`,
        )
        continue
      }

      folderMap(index, file.folder).set(entity.id, entity)
      index.byId.set(entity.id, { folder: file.folder, entity, path })
      byFolder[file.folder] = (byFolder[file.folder] ?? 0) + 1

      if (!declaredIds.has(entity.id)) {
        warn(issues, path, `"${entity.id}" is not declared in the pack manifest`)
      }
    }

    for (const id of declaredIds) {
      if (!index.byId.has(id)) {
        issue(issues, `${manifest.id}/manifest.json`, `declares "${id}" but no entity defines it`)
      }
    }
  }

  checkPackGraph(manifests, issues)

  for (const [id, entry] of index.byId) {
    const path = `${entry.folder}/${id}`
    checkProvenance(entry.entity, path, issues)
    checkConditionsAndEffects(entry.entity as EventDef, entry.folder, path, issues)
  }

  for (const [id, region] of index.regions) {
    const path = `regions/${id}`
    if (region.climate) requireRef(index, issues, 'climates', region.climate, path, 'climate')
    for (const culture of region.cultures)
      requireRef(index, issues, 'cultures', culture, path, 'cultures')
    for (const language of region.languages)
      requireRef(index, issues, 'languages', language, path, 'languages')
  }

  for (const [id, destination] of index.destinations) {
    const path = `destinations/${id}`
    requireRef(index, issues, 'regions', destination.region, path, 'region')
    for (const culture of destination.cultures ?? [])
      requireRef(index, issues, 'cultures', culture, path, 'cultures')
    for (const language of destination.languages ?? [])
      requireRef(index, issues, 'languages', language, path, 'languages')
    for (const faction of destination.institutions ?? [])
      requireRef(index, issues, 'factions', faction, path, 'institutions')
    for (const character of destination.cast)
      requireRef(index, issues, 'characters', character, path, 'cast')
    const destinationCast = new Set(destination.cast)
    const assigned = new Map<string, string>()
    for (const place of destination.places) {
      const placePath = `${path}.places.${place.id}`
      for (const character of place.cast ?? []) {
        requireRef(index, issues, 'characters', character, placePath, 'cast')
        if (!destinationCast.has(character)) {
          issue(issues, placePath, `cast "${character}" is not in the destination's cast`)
        }
        const previous = assigned.get(character)
        if (previous === place.id) {
          issue(issues, placePath, `cast lists "${character}" twice`)
        } else if (previous) {
          issue(issues, placePath, `cast "${character}" is already assigned to place "${previous}"`)
        } else {
          assigned.set(character, place.id)
        }
      }
    }
    for (const route of destination.routes)
      requireRef(index, issues, 'routes', route, path, 'routes')
    const seen = new Set<string>()
    for (const entry of destination.market.goods) {
      requireRef(index, issues, 'goods', entry.item, path, 'market goods')
      if (seen.has(entry.item)) issue(issues, path, `market lists "${entry.item}" twice`)
      seen.add(entry.item)
    }
  }

  for (const [id, route] of index.routes) {
    const path = `routes/${id}`
    requireRef(index, issues, 'destinations', route.from, path, 'from')
    requireRef(index, issues, 'destinations', route.to, path, 'to')
    if (route.from === route.to)
      issue(issues, path, 'a route cannot start and end at the same place')
    const modes = new Set<string>()
    for (const mode of route.modes) {
      if (modes.has(mode.id)) issue(issues, path, `travel mode "${mode.id}" is listed twice`)
      modes.add(mode.id)
    }
    for (const encounter of route.encounters) {
      requireRef(index, issues, 'events', encounter.event, path, 'encounters')
    }
    for (const outcome of route.hazard?.outcomes ?? []) {
      requireRef(index, issues, 'events', outcome.event, path, 'hazard outcomes')
    }
    const waypointIds = new Set<string>()
    for (const waypoint of route.waypoints ?? []) {
      if (waypointIds.has(waypoint.id))
        issue(issues, path, `waypoint "${waypoint.id}" is listed twice`)
      waypointIds.add(waypoint.id)
      if (waypoint.event) {
        requireRef(index, issues, 'events', waypoint.event, path, `waypoints.${waypoint.id}.event`)
      }
      const longest = Math.max(...route.modes.map((mode) => mode.days))
      if (waypoint.afterDays > longest) {
        issue(
          issues,
          path,
          `waypoint "${waypoint.id}" falls after the longest crossing (${longest} days)`,
        )
      }
    }
  }

  for (const [id, character] of index.characters) {
    const path = `characters/${id}`
    requireRef(index, issues, 'destinations', character.home, path, 'home')
    if (character.culture) requireRef(index, issues, 'cultures', character.culture, path, 'culture')
    for (const language of character.languages)
      requireRef(index, issues, 'languages', language, path, 'languages')
    if (character.dialogue)
      requireRef(index, issues, 'dialogues', character.dialogue, path, 'dialogue')
    for (const [destination, dialogueId] of Object.entries(character.dialogueByDestination ?? {})) {
      requireRef(index, issues, 'destinations', destination, path, 'dialogueByDestination')
      requireRef(
        index,
        issues,
        'dialogues',
        dialogueId,
        path,
        `dialogueByDestination.${destination}`,
      )
    }
    for (const place of character.presence ?? [])
      requireRef(index, issues, 'destinations', place, path, 'presence')
  }

  for (const [id, destination] of index.destinations) {
    const path = `destinations/${id}`
    for (const entry of destination.day?.events ?? []) {
      requireRef(index, issues, 'events', entry.event, path, 'day events')
    }
    for (const entry of destination.night?.events ?? []) {
      requireRef(index, issues, 'events', entry.event, path, 'night events')
    }
  }

  for (const [id, event] of index.events) {
    const path = `events/${id}`
    for (const destination of event.scope?.destinations ?? [])
      requireRef(index, issues, 'destinations', destination, path, 'scope.destinations')
    for (const route of event.scope?.routes ?? [])
      requireRef(index, issues, 'routes', route, path, 'scope.routes')
    for (const region of event.scope?.regions ?? [])
      requireRef(index, issues, 'regions', region, path, 'scope.regions')
    if (event.scene) requireRef(index, issues, 'dialogues', event.scene, path, 'scene')
    for (const character of event.cast ?? [])
      requireRef(index, issues, 'characters', character, path, 'cast')
    if (typeof event.journal === 'string') {
      requireRef(index, issues, 'journal', event.journal, path, 'journal')
    }
    for (const followUp of event.followUps ?? []) {
      requireRef(index, issues, 'events', followUp.event, path, 'followUps')
    }
  }

  for (const [id, entry] of index.ambient) {
    const path = `ambient/${id}`
    for (const culture of entry.cultures) {
      requireRef(index, issues, 'cultures', culture, path, 'cultures')
    }
    for (const destination of entry.scope?.destinations ?? [])
      requireRef(index, issues, 'destinations', destination, path, 'scope.destinations')
    for (const route of entry.scope?.routes ?? [])
      requireRef(index, issues, 'routes', route, path, 'scope.routes')
    for (const region of entry.scope?.regions ?? [])
      requireRef(index, issues, 'regions', region, path, 'scope.regions')
    if (entry.conditions) {
      const parsed = parseCondition(entry.conditions)
      if (!parsed.ok) issue(issues, path, `conditions: ${parsed.issues.join('; ')}`)
    }
  }

  for (const [id, dialogue] of index.dialogues) {
    checkDialogue(dialogue, index, `dialogues/${id}`, issues)
  }

  return {
    index,
    issues,
    counts: {
      packs: index.packs.length,
      entities: index.byId.size,
      byFolder,
    },
  }
}

/** The read-only content view the DSL uses. Built from the index, never from files. */
export function createDslContent(index: ContentIndex): DslContent {
  return {
    hasCharacter: (id) => index.characters.has(id),
    characterHome: (id) => index.characters.get(id)?.home,
    routeExists: (id) => index.routes.has(id),
    routeClosedWhen: (id) => index.routes.get(id)?.closedWhen as Condition | undefined,
    itemWeight: (id) => index.goods.get(id)?.weight ?? 1,
    afflictionTreatments: (id) => index.afflictions.get(id)?.treatments ?? [],
  }
}

export function contentErrorCount(issues: readonly ContentIssue[]): number {
  return issues.filter((entry) => entry.level === 'error').length
}
