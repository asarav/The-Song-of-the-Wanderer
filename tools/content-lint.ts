import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'

/**
 * Content linter (M0 scaffold).
 *
 * M0 checks structure: valid JSON, an `id`, namespaced and unique IDs, and a
 * file name that matches the ID's final segment. M1-T05 extends this with the
 * full Zod schema, referential integrity, provenance rules, and dialogue graph
 * reachability.
 */

const CONTENT_ROOT = join(process.cwd(), 'src', 'content')

const ENTITY_DIRS = {
  regions: 'region',
  destinations: 'dest',
  routes: 'route',
  goods: 'good',
  characters: 'char',
  events: 'evt',
  dialogues: 'dlg',
  codex: 'codex',
} as const

type EntityDir = keyof typeof ENTITY_DIRS

const CONFIDENCE_LEVELS = new Set([
  'documented',
  'strongly-supported',
  'plausible',
  'fictional',
  'unresolved',
])

interface Issue {
  level: 'error' | 'warning'
  file: string
  message: string
}

const issues: Issue[] = []
const seenIds = new Map<string, string>()
let entityCount = 0
let fileCount = 0

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function addIssue(level: Issue['level'], file: string, message: string): void {
  issues.push({ level, file, message })
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath)
    }
  }

  return files
}

function validateEntity(file: string, raw: unknown): void {
  if (!isRecord(raw)) {
    addIssue('error', file, 'expected a JSON object (or an array of objects)')
    return
  }

  entityCount += 1
  const entity = raw

  if (typeof entity.id !== 'string' || entity.id.length === 0) {
    addIssue('error', file, 'missing required string field "id"')
    return
  }

  const id = entity.id
  const relativeFile = relative(CONTENT_ROOT, file)

  const previous = seenIds.get(id)
  if (previous) {
    addIssue('error', file, `duplicate id "${id}" (also defined in ${previous})`)
  } else {
    seenIds.set(id, relativeFile)
  }

  const dir = relativeFile.split(/[\\/]/)[0] as EntityDir | undefined
  const expectedPrefix = dir ? ENTITY_DIRS[dir] : undefined

  if (!expectedPrefix) {
    addIssue(
      'error',
      file,
      `entity is not inside a known content folder (${Object.keys(ENTITY_DIRS).join(', ')})`,
    )
    return
  }

  const expectedId = `${expectedPrefix}.${basename(file, '.json')}`
  if (id !== expectedId) {
    addIssue('error', file, `id "${id}" should be "${expectedId}" to match its file name`)
  }

  if (entity.provenance !== undefined) {
    if (!isRecord(entity.provenance)) {
      addIssue('error', file, '"provenance" must be an object')
    } else if (typeof entity.provenance.confidence !== 'string') {
      addIssue('error', file, '"provenance.confidence" is required when provenance is present')
    } else if (!CONFIDENCE_LEVELS.has(entity.provenance.confidence)) {
      addIssue(
        'error',
        file,
        `unknown confidence "${entity.provenance.confidence}" (expected one of ${[...CONFIDENCE_LEVELS].join(', ')})`,
      )
    }
  }
}

async function main(): Promise<void> {
  if (!existsSync(CONTENT_ROOT)) {
    process.stdout.write('content:lint - no content directory yet, nothing to check\n')
    return
  }

  const files = await collectJsonFiles(CONTENT_ROOT)
  fileCount = files.length

  for (const file of files) {
    let parsed: unknown
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'))
    } catch (error) {
      addIssue('error', relative(CONTENT_ROOT, file), `invalid JSON: ${(error as Error).message}`)
      continue
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) validateEntity(file, item)
    } else {
      validateEntity(file, parsed)
    }
  }

  for (const issue of issues) {
    const stream = issue.level === 'error' ? process.stderr : process.stdout
    stream.write(`content:lint ${issue.level} ${issue.file}: ${issue.message}\n`)
  }

  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.length - errors
  process.stdout.write(
    `content:lint - ${entityCount} entities in ${fileCount} files, ${errors} errors, ${warnings} warnings\n`,
  )

  if (errors > 0) {
    process.exitCode = 1
  }
}

await main()
