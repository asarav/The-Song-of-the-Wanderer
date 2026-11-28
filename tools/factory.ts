/**
 * Authored content factory.
 *
 * The factory is offline and deterministic. It writes valid shapes, ids and provenance
 * stubs; it never invents canon and never calls a model. `new` is a scaffolder (dry-run
 * by default), `variants` expands an authored recipe, `audit` reports where a culture or
 * route is thin, and `check` makes the recipes and TODO markers part of `pnpm check`.
 *
 * Usage:
 *   pnpm factory -- new ambient ambient.levant.day.market
 *   pnpm factory -- variants ambient-example --count 4 --seed harbor
 *   pnpm factory -- audit
 *   pnpm factory -- check
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

import { ENTITY_SCHEMAS, type EntityFolder } from '../src/engine/content'
import { loadContent } from './simulate'

export const FACTORY_KINDS = [
  'ambient',
  'event',
  'dialogue',
  'journal',
  'codex',
  'character',
  'destination',
  'route',
  'arc-brief',
] as const
export type FactoryKind = (typeof FACTORY_KINDS)[number]

const FOLDERS: Record<Exclude<FactoryKind, 'arc-brief'>, EntityFolder> = {
  ambient: 'ambient',
  event: 'events',
  dialogue: 'dialogues',
  journal: 'journal',
  codex: 'codex',
  character: 'characters',
  destination: 'destinations',
  route: 'routes',
}

const fiction = {
  confidence: 'fictional',
  sources: [],
  notes: 'TODO: why this entity exists and what it changes.',
}

function idSegments(id: string): string[] {
  return id.split('.').filter(Boolean)
}

function fileName(id: string): string {
  return `${idSegments(id).at(-1) ?? 'entity'}.json`
}

function provenance(): typeof fiction {
  return { ...fiction, sources: [...fiction.sources] }
}

/** The scaffold shapes are deliberately valid enough to parse, but never ship: TODO. */
export function scaffoldFor(
  kind: FactoryKind,
  id: string,
  options: { speaker?: string } = {},
): Record<string, unknown> | string {
  if (kind === 'arc-brief') {
    return `# Arc brief — ${id}\n\n**Status:** brief only. Runtime \`ArcDef\` is M6 work.\n\n## Owner\n\nTODO: character, family, or institution.\n\n## Premise\n\nTODO: what the owner wants and what stands in the way.\n\n## Pressure\n\nTODO: the cost of failing, and who notices.\n\n## Beats\n\n1. TODO: opening pressure.\n2. TODO: turn.\n3. TODO: resolution or failure.\n\n## Callback\n\nTODO: the earlier scene this arc answers.\n\n## Provenance\n\nTODO: sources and invention notes.\n`
  }

  switch (kind) {
    case 'ambient':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        context: 'day',
        cultures: ['culture.levant.coastal'],
        scope: { destinations: ['dest.ugarit'] },
        conditions: { all: [] },
        weight: 1,
        tags: ['TODO'],
        text: 'TODO: one short observation, said in this culture’s voice.',
        beatArt: ['art.ugarit.market'],
        provenance: provenance(),
      }
    case 'event':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        kind: 'storylet',
        title: 'TODO: a title',
        description: 'TODO: the situation in one sentence.',
        conditions: { all: [] },
        priority: 10,
        major: false,
        cooldownDays: 7,
        effects: [],
        provenance: provenance(),
      }
    case 'dialogue':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        speaker: options.speaker ?? 'char.ugarit.amnit',
        start: 'greet',
        scene: {
          goal: 'TODO',
          obstacle: 'TODO',
          turn: 'TODO',
          stakes: 'TODO',
        },
        nodes: {
          greet: {
            text: 'TODO: the scene opens on a pressure, not a greeting.',
            beatArt: ['art.ugarit.market'],
            choices: [
              {
                id: 'answer',
                intent: 'probe',
                text: 'TODO: an answer that does something.',
                next: 'close',
              },
            ],
          },
          close: {
            text: 'TODO: the consequence, in one beat.',
            beatArt: ['art.ugarit.high'],
            choices: [{ id: 'leave', intent: 'probe', text: 'Go on.', next: null }],
          },
        },
        provenance: provenance(),
      }
    case 'journal':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        title: 'TODO: a title',
        text: 'TODO: what the traveller writes down.',
        provenance: provenance(),
      }
    case 'codex':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        title: 'TODO: a title',
        text: 'TODO: what the traveller can look up later.',
        category: 'place',
        provenance: provenance(),
      }
    case 'character':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        name: 'TODO: a name',
        languages: ['lang.akkadian'],
        home: 'dest.ugarit',
        tier: 'local',
        roles: ['TODO'],
        provenance: provenance(),
      }
    case 'destination':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        name: 'TODO: a place name',
        kind: 'port',
        region: 'region.levant',
        intro: 'TODO: what the traveller sees first.',
        cast: [],
        places: [],
        market: { priceModifier: 1, goods: [] },
        routes: [],
        provenance: provenance(),
      }
    case 'route':
      return {
        id,
        pack: 'pack.slice',
        contentVersion: 1,
        name: 'TODO: a route name',
        kind: 'sea',
        from: 'dest.ugarit',
        to: 'dest.cyprus',
        modes: [
          {
            id: 'mode.default',
            name: 'TODO: a mode',
            days: 3,
            baseCost: 5,
            capacity: 20,
            description: 'TODO: what this way of travelling costs.',
          },
        ],
        encounters: [],
        encountersPerJourney: { min: 0, max: 0 },
        provenance: provenance(),
      }
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

export function scaffoldPath(
  kind: FactoryKind,
  id: string,
  options: { pack?: string; root?: string } = {},
): string {
  const root = options.root ?? process.cwd()
  if (kind === 'arc-brief') return join(root, 'docs', 'design', 'arcs', `${idSegments(id).at(-1) ?? 'arc'}.md`)
  const pack = options.pack ?? 'pack.slice'
  return join(root, 'src', 'content', 'packs', pack, FOLDERS[kind], fileName(id))
}

export function validateScaffold(kind: FactoryKind, data: unknown): string[] {
  if (kind === 'arc-brief') return []
  const folder = FOLDERS[kind]
  const parsed = ENTITY_SCHEMAS[folder].safeParse(data)
  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
}

export function containsPlaceholder(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('TODO:')
  if (Array.isArray(value)) return value.some(containsPlaceholder)
  if (value && typeof value === 'object') return Object.values(value).some(containsPlaceholder)
  return false
}

export interface WriteResult {
  path: string
  wrote: boolean
}

/** Write a scaffold, refusing to replace a file that already exists. */
export async function writeScaffold(
  kind: FactoryKind,
  id: string,
  options: { pack?: string; root?: string; write?: boolean; speaker?: string } = {},
): Promise<WriteResult> {
  const path = scaffoldPath(kind, id, options)
  if (!options.write) return { path, wrote: false }
  if (existsSync(path)) throw new Error(`${path} already exists; refusing to overwrite`)
  const data = scaffoldFor(kind, id, options)
  const problems = validateScaffold(kind, data)
  if (problems.length > 0) throw new Error(problems.join('\n'))
  await mkdir(dirname(path), { recursive: true })
  const body = typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`
  await writeFile(path, body)
  return { path, wrote: true }
}

const RecipeVariantSchema = z.record(z.string(), z.unknown())
const RecipeSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(FACTORY_KINDS),
    pack: z.string().min(1).default('pack.slice'),
    description: z.string().optional(),
    defaults: z.record(z.string(), z.unknown()).default({}),
    variants: z.array(RecipeVariantSchema).min(1),
  })
  .strict()

export type FactoryRecipe = z.infer<typeof RecipeSchema>

export async function readRecipe(name: string, root = process.cwd()): Promise<FactoryRecipe> {
  const direct = resolve(root, name)
  const path = existsSync(direct)
    ? direct
    : join(root, 'tools', 'factory', 'recipes', name.endsWith('.json') ? name : `${name}.json`)
  const raw = JSON.parse(await readFile(path, 'utf8')) as unknown
  const parsed = RecipeSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `${path}: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ')}`,
    )
  }
  return parsed.data
}

function hash32(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Turn one authored row into a complete entity. A variant row may name `culture`, `art`
 * and `tags`; the recipe defaults supply the rest. Everything else is copied, never
 * inferred.
 */
export function variantEntity(recipe: FactoryRecipe, variant: Record<string, unknown>): Record<string, unknown> {
  const { slug, culture, art, ...rest } = variant
  if (typeof slug !== 'string' || slug.length === 0) {
    throw new Error(`recipe ${recipe.id}: every variant needs a slug`)
  }
  const id = `${recipe.id}.${slug}`
  const entity: Record<string, unknown> = {
    ...recipe.defaults,
    ...rest,
    id,
    pack: recipe.pack,
    contentVersion: 1,
  }
  if (recipe.kind === 'ambient') {
    if (typeof culture === 'string' && culture.length > 0) {
      entity.cultures = [culture]
    }
    if (typeof art === 'string' && art.length > 0) {
      entity.beatArt = [art]
    }
  }
  return entity
}

export interface VariantResult {
  path: string
  data: Record<string, unknown>
}

/** Deterministic selection: sort by id, then shuffle by the seed, then take count. */
export function variantBatch(
  recipe: FactoryRecipe,
  options: { count?: number; seed?: string; root?: string } = {},
): VariantResult[] {
  const rows = recipe.variants
    .map((variant) => variantEntity(recipe, variant))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))

  const seed = options.seed ?? 'stable'
  const ordered = [...rows].sort((a, b) => {
    const left = hash32(`${seed}|${String(a.id)}`)
    const right = hash32(`${seed}|${String(b.id)}`)
    return left === right ? String(a.id).localeCompare(String(b.id)) : left - right
  })
  const count = options.count ?? ordered.length
  if (!Number.isInteger(count) || count < 1) throw new Error('--count must be a positive integer')
  const selected = ordered.slice(0, count)

  const seen = new Set<string>()
  for (const entity of selected) {
    const id = String(entity.id)
    if (seen.has(id)) throw new Error(`recipe ${recipe.id}: duplicate variant id ${id}`)
    seen.add(id)
    const problems = validateScaffold(recipe.kind, entity)
    if (problems.length > 0) {
      throw new Error(`recipe ${recipe.id} generated an invalid ${recipe.kind}:\n${problems.join('\n')}`)
    }
  }

  return selected.map((data) => ({
    path: scaffoldPath(recipe.kind, String(data.id), { pack: recipe.pack, root: options.root }),
    data,
  }))
}

export async function writeVariants(
  recipe: FactoryRecipe,
  options: { count?: number; seed?: string; root?: string; write?: boolean } = {},
): Promise<WriteResult[]> {
  const batch = variantBatch(recipe, options)
  const results: WriteResult[] = []
  for (const entry of batch) {
    if (options.write && existsSync(entry.path)) {
      throw new Error(`${entry.path} already exists; refusing to overwrite`)
    }
    results.push({ path: entry.path, wrote: false })
  }
  if (!options.write) return results

  for (const entry of batch) {
    await mkdir(dirname(entry.path), { recursive: true })
    await writeFile(entry.path, `${JSON.stringify(entry.data, null, 2)}\n`)
  }
  return results.map((entry) => ({ ...entry, wrote: true }))
}

export interface AmbientAudit {
  destinations: {
    id: string
    culture: string
    day: number
    night: number
    dayEvents: number
    nightEvents: number
  }[]
  routes: { id: string; travel: number; encounters: number }[]
  problems: string[]
}

export function auditContent(index: Awaited<ReturnType<typeof loadContent>>): AmbientAudit {
  const destinations = [...index.destinations.values()].flatMap((destination) =>
    (destination.cultures ?? []).map((culture) => {
      const matches = (context: 'day' | 'night') =>
        [...index.ambient.values()].filter(
          (entry) =>
            entry.context === context &&
            entry.cultures.includes(culture) &&
            (!entry.scope?.destinations || entry.scope.destinations.includes(destination.id)),
        ).length
      return {
        id: destination.id,
        culture,
        day: matches('day'),
        night: matches('night'),
        dayEvents: destination.day?.events.length ?? 0,
        nightEvents: destination.night?.events.length ?? 0,
      }
    }),
  )
  const routes = [...index.routes.values()].map((route) => ({
    id: route.id,
    travel: [...index.ambient.values()].filter(
      (entry) =>
        entry.context === 'travel' &&
        (!entry.scope?.routes || entry.scope.routes.includes(route.id)),
    ).length,
    encounters: route.encounters.length,
  }))

  const problems: string[] = []
  for (const row of destinations) {
    if (row.day < 4) problems.push(`${row.id} (${row.culture}) has ${row.day} day observations; 4 required`)
    if (row.night < 4) problems.push(`${row.id} (${row.culture}) has ${row.night} night observations; 4 required`)
    if (row.dayEvents < 2) problems.push(`${row.id} has ${row.dayEvents} daytime events; 2 required`)
    if (row.nightEvents < 1) problems.push(`${row.id} has ${row.nightEvents} night events; 1 required`)
  }
  for (const row of routes) {
    if (row.travel < 6) problems.push(`${row.id} has ${row.travel} travel observations; 6 required`)
  }

  return { destinations, routes, problems }
}

/** Recipes are checked without writing anything; stable output is part of the gate. */
export async function checkFactory(root = process.cwd()): Promise<{ ok: boolean; problems: string[] }> {
  const problems: string[] = []
  const recipesDir = join(root, 'tools', 'factory', 'recipes')
  const files = existsSync(recipesDir)
    ? (await readdir(recipesDir)).filter((file) => file.endsWith('.json')).sort()
    : []
  if (files.length === 0) problems.push('no factory recipes found')

  for (const file of files) {
    try {
      const recipe = await readRecipe(file, root)
      const first = variantBatch(recipe, { seed: 'gate', root })
      const second = variantBatch(recipe, { seed: 'gate', root })
      if (JSON.stringify(first) !== JSON.stringify(second)) {
        problems.push(`${file}: generated variants are not deterministic`)
      }
      const ids = new Set<string>()
      for (const entry of first) {
        const id = String(entry.data.id)
        if (ids.has(id)) problems.push(`${file}: duplicate id ${id}`)
        ids.add(id)
        if (containsPlaceholder(entry.data)) {
          problems.push(`${file}: variant ${id} still contains TODO`)
        }
      }
    } catch (error) {
      problems.push(`${file}: ${(error as Error).message}`)
    }
  }

  const contentRoot = join(root, 'src', 'content')
  const filesUnder = existsSync(contentRoot) ? await readdir(contentRoot, { recursive: true }) : []
  for (const file of filesUnder) {
    if (!file.endsWith('.json')) continue
    const path = join(contentRoot, file)
    const raw = await readFile(path, 'utf8')
    if (raw.includes('TODO:')) problems.push(`${path}: shipped content contains TODO`)
  }

  return { ok: problems.length === 0, problems }
}

function flagValue(args: string[], name: string): string | undefined {
  const exact = args.indexOf(name)
  if (exact >= 0) return args[exact + 1]
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`))
  return prefixed ? prefixed.slice(name.length + 1) : undefined
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((arg) => arg !== '--')
  const command = argv[0]
  const args = argv.slice(1)
  const write = args.includes('--write')
  const json = args.includes('--json')

  if (command === 'new') {
    const positional = args.filter((arg) => !arg.startsWith('--'))
    const kind = positional[0] as FactoryKind | undefined
    const id = positional[1]
    if (!kind || !FACTORY_KINDS.includes(kind) || !id) {
      throw new Error(`new: usage: pnpm factory -- new <${FACTORY_KINDS.join('|')}> <id>`)
    }
    const pack = flagValue(args, '--pack')
    const result = await writeScaffold(kind, id, { pack, write })
    const data = scaffoldFor(kind, id)
    const problems = validateScaffold(kind, data)
    if (problems.length > 0) throw new Error(problems.join('\n'))
    process.stdout.write(
      json
        ? `${JSON.stringify({ command: 'new', kind, id, ...result, problems }, null, 2)}\n`
        : `factory new - ${result.wrote ? 'wrote' : 'dry run'} ${result.path}${result.wrote ? '\nFill the TODO fields before pnpm check.' : '\nAdd --write to create the file.'}\n`,
    )
    return
  }

  if (command === 'variants') {
    const positional = args.filter((arg) => !arg.startsWith('--'))
    const name = positional[0]
    if (!name) throw new Error('variants: usage: pnpm factory -- variants <recipe> [--count N] [--seed S] [--write]')
    const recipe = await readRecipe(name)
    const count = flagValue(args, '--count') ? Number(flagValue(args, '--count')) : undefined
    const seed = flagValue(args, '--seed')
    const results = await writeVariants(recipe, { count, seed, write })
    process.stdout.write(
      json
        ? `${JSON.stringify({ command: 'variants', recipe: recipe.id, results }, null, 2)}\n`
        : `factory variants - ${results.length} ${write ? 'written' : 'planned'} from ${recipe.id}\n${results
            .map((entry) => `  ${entry.path}`)
            .join('\n')}\n`,
    )
    return
  }

  if (command === 'audit') {
    const index = await loadContent()
    const audit = auditContent(index)
    if (json) {
      process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`)
    } else {
      for (const row of audit.destinations) {
        process.stdout.write(
          `factory audit ${row.id} ${row.culture}: day ${row.day}, night ${row.night}, day events ${row.dayEvents}, night events ${row.nightEvents}\n`,
        )
      }
      for (const row of audit.routes) {
        process.stdout.write(`factory audit ${row.id}: travel ${row.travel}, encounters ${row.encounters}\n`)
      }
      for (const problem of audit.problems) process.stdout.write(`factory audit missing ${problem}\n`)
      process.stdout.write(
        `factory audit - ${audit.destinations.length} destination cultures, ${audit.routes.length} routes, ${audit.problems.length} gaps\n`,
      )
    }
    if (audit.problems.length > 0) process.exitCode = 1
    return
  }

  if (command === 'check') {
    const result = await checkFactory()
    if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    else {
      for (const problem of result.problems) process.stdout.write(`factory:check ${problem}\n`)
      process.stdout.write(`factory:check - ${result.problems.length} problems\n`)
    }
    if (!result.ok) process.exitCode = 1
    return
  }

  throw new Error('usage: pnpm factory -- <new|variants|audit|check> ...')
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(`factory: ${(error as Error).message}\n`)
    process.exitCode = 1
  })
}
