/**
 * Content linter.
 *
 * Reads `src/content/packs/<pack>/`, validates every entity through the same registry
 * the game uses, and reports issues with file paths. `src/content/__fixtures__` is
 * excluded by default so test fixtures can be deliberately broken without failing the
 * gate.
 *
 * Usage: `pnpm content:lint [root] [--json]`
 */

import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildContentIndex,
  contentErrorCount,
  type ContentCounts,
  type ContentIssue,
  type RawEntityFile,
  type RawPack,
} from '../src/engine/content'
import { ENTITY_SCHEMAS, type EntityFolder } from '../src/engine/content'

export interface LintResult {
  issues: ContentIssue[]
  counts: ContentCounts
}

const FOLDERS = Object.keys(ENTITY_SCHEMAS) as EntityFolder[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Scripts the slice can show: Greek, Linear B, Ugaritic, Cypriot, cuneiform, Egyptian
 * hieroglyphs. Egyptian appears here ahead of use so the rule is one list.
 */
const NON_LATIN_SCRIPT =
  /[\u{0370}-\u{03FF}\u{1F00}-\u{1FFF}\u{10000}-\u{1007F}\u{10380}-\u{1039F}\u{12000}-\u{123FF}\u{13000}-\u{1342F}]+/gu

const READING_AFTER = /^\s*\(([^()]{1,80})\)/

/**
 * A word in another script carries its reading in parentheses — `𐀁𐀔𐀀 (e-ma-a₂, read
 * Ermahas)` — because most players cannot read the signs and no character explains them.
 * Warnings rather than errors: the prose still reads, but the convention is enforced by
 * the gate's report.
 */
export function findScriptReadingIssues(packs: RawPack[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const seen = new Set<string>()

  for (const pack of packs) {
    const packId = isRecord(pack.manifest) && typeof pack.manifest.id === 'string'
      ? pack.manifest.id
      : 'pack'

    for (const file of pack.files) {
      const path = `${packId}/${file.folder}/${file.file}`

      const visit = (value: unknown, where: string): void => {
        if (typeof value === 'string') {
          for (const match of value.matchAll(NON_LATIN_SCRIPT)) {
            const after = value.slice((match.index ?? 0) + match[0].length)
            const gloss = READING_AFTER.exec(after)?.[1]
            if (gloss && /[A-Za-z]/.test(gloss)) continue

            const key = `${path}|${match[0]}`
            if (seen.has(key)) continue
            seen.add(key)

            issues.push({
              level: 'warning',
              path,
              message: `script word "${match[0]}" needs a reading in parentheses, for example "𐀁𐀔𐀀 (e-ma-a₂, read Ermahas)"`,
            })
          }
          return
        }

        if (Array.isArray(value)) {
          value.forEach((item, index) => visit(item, `${where}[${index}]`))
          return
        }

        if (isRecord(value)) {
          for (const key of Object.keys(value)) visit(value[key], `${where}.${key}`)
        }
      }

      visit(file.data, path)
    }
  }

  return issues
}

async function readJson(path: string, issues: ContentIssue[], label: string): Promise<unknown> {
  const text = await readFile(path, 'utf8')
  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    issues.push({
      level: 'error',
      path: label,
      message: `invalid JSON: ${(error as Error).message}`,
    })
    return undefined
  }
}

/**
 * Load every pack under `root/packs`. Returns partially loaded packs plus loader-level
 * issues, so a broken file is reported rather than throwing away the whole run.
 */
export async function loadPacks(
  root: string,
  options: { skipFixtures?: boolean } = {},
): Promise<{ packs: RawPack[]; issues: ContentIssue[] }> {
  const issues: ContentIssue[] = []
  const packs: RawPack[] = []
  const packsRoot = join(root, 'packs')

  if (!existsSync(packsRoot)) {
    return { packs, issues }
  }

  const entries = await readdir(packsRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (options.skipFixtures !== false && entry.name.startsWith('__')) continue

    const packRoot = join(packsRoot, entry.name)
    const manifestPath = join(packRoot, 'manifest.json')
    if (!existsSync(manifestPath)) {
      issues.push({
        level: 'error',
        path: `${entry.name}/manifest.json`,
        message: 'pack has no manifest.json',
      })
      continue
    }

    const manifest = await readJson(manifestPath, issues, `${entry.name}/manifest.json`)
    const files: RawEntityFile[] = []

    for (const folder of FOLDERS) {
      const folderPath = join(packRoot, folder)
      if (!existsSync(folderPath)) continue

      const folderEntries = await readdir(folderPath, { withFileTypes: true })
      for (const fileEntry of folderEntries) {
        if (!fileEntry.isFile() || !fileEntry.name.endsWith('.json')) continue

        const label = `${entry.name}/${folder}/${fileEntry.name}`
        const data = await readJson(join(folderPath, fileEntry.name), issues, label)
        if (data === undefined) continue

        if (!isRecord(data) || typeof data.id !== 'string') {
          issues.push({
            level: 'error',
            path: label,
            message: 'expected a JSON object with a string "id"',
          })
          continue
        }

        // IDs are namespaced (`evt.ugarit.arrival`), so a file may be named for the whole
        // ID, its flattened form, or any name that ends with its last segment. Names
        // repeat across places, so `arrival.json` alone cannot be required.
        const fileKey = basename(fileEntry.name).replace(/\.json$/, '')
        const lastSegment = data.id.split('.').pop() ?? data.id
        const flattened = data.id.replace(/\./g, '-')
        if (!fileKey.includes(lastSegment) && fileKey !== flattened) {
          issues.push({
            level: 'error',
            path: label,
            message: `"${data.id}" should live in a file named after its ID (for example "${lastSegment}.json")`,
          })
        }

        files.push({ folder, file: fileEntry.name, data })
      }
    }

    packs.push({ manifest, files })
  }

  return { packs, issues }
}

/**
 * Keys that reach the player as prose. Ids, conditions and provenance are excluded on
 * purpose: a design note may name the slice where the game text may not.
 */
const PLAYER_PROSE_KEYS = new Set([
  'text',
  'title',
  'intro',
  'name',
  'description',
  'unavailableNote',
  'requirementsNote',
  'closureNote',
])

/** Copy that belongs to a design review, not to a player in 1230 BCE. */
const DEVELOPER_PROSE = [
  /\bthe slice\b/i,
  /\bthis slice\b/i,
  /\bthe game\b/i,
  /\bthis game\b/i,
  /\bthe player\b/i,
  /\bplayer's\b/i,
  /\bgreybox\b/i,
  /\bprototype\b/i,
  /\bplaceholder\b/i,
  /\bthis build\b/i,
  /\bdossier\b/i,
  /\bdeveloper\b/i,
  /\bsimulation\b/i,
  /\bthe interface\b/i,
  /\bsave format\b/i,
]

/**
 * Every word the player reads is written for the player. A codex entry that says "the
 * slice shows…" is an author's note left on screen, and this finds it.
 */
export function findDeveloperProseIssues(packs: RawPack[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const seen = new Set<string>()

  for (const pack of packs) {
    const packId = isRecord(pack.manifest) && typeof pack.manifest.id === 'string'
      ? pack.manifest.id
      : 'pack'

    for (const file of pack.files) {
      const path = `${packId}/${file.folder}/${file.file}`

      const visit = (value: unknown, key: string | undefined): void => {
        if (typeof value === 'string') {
          if (!key || !PLAYER_PROSE_KEYS.has(key)) return

          for (const pattern of DEVELOPER_PROSE) {
            const match = pattern.exec(value)
            if (!match) continue

            const phrase = match[0]
            const id = `${path}|${phrase}`
            if (seen.has(id)) continue
            seen.add(id)

            issues.push({
              level: 'warning',
              path,
              message: `player-facing text says "${phrase.toLowerCase()}" — write it for the player, not for the build`,
            })
          }
          return
        }

        if (Array.isArray(value)) {
          value.forEach((item) => visit(item, key))
          return
        }

        if (isRecord(value)) {
          for (const childKey of Object.keys(value)) visit(value[childKey], childKey)
        }
      }

      visit(file.data, undefined)
    }
  }

  return issues
}

/**
 * Scene text must not name a cargo the trader may not be carrying. A scene that takes
 * something out of the hold writes `{cargo}` and the engine fills it from the real
 * inventory; any other cargo word in that scene is a hard-coded hold.
 */
export function findCargoClaimIssues(packs: RawPack[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const goodWords = new Set<string>([
    'jar',
    'jars',
    'ingot',
    'ingots',
    'sack',
    'sacks',
    'bale',
    'bales',
    'log',
    'logs',
    'pot',
    'pots',
  ])
  for (const pack of packs) {
    for (const file of pack.files) {
      if (file.folder !== 'goods' || !isRecord(file.data)) continue
      if (typeof file.data.name !== 'string') continue
      for (const word of file.data.name.toLowerCase().split(/[^a-z]+/)) {
        if (word.length >= 4) goodWords.add(word)
      }
    }
  }

  for (const pack of packs) {
    const packId = isRecord(pack.manifest) && typeof pack.manifest.id === 'string'
      ? pack.manifest.id
      : 'pack'

    for (const file of pack.files) {
      if (file.folder !== 'dialogues' || !isRecord(file.data)) continue
      const path = `${packId}/${file.folder}/${file.file}`
      const nodes = isRecord(file.data.nodes) ? file.data.nodes : {}

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!isRecord(node) || typeof node.text !== 'string') continue
        const choices = (Array.isArray(node.choices) ? node.choices : []).filter(isRecord)

        const losses = new Set<string>()
        let losesWhateverIsHeld = false
        for (const choice of choices) {
          if (!Array.isArray(choice.effects)) continue
          for (const effect of choice.effects) {
            if (!isRecord(effect)) continue
            if ('loseCargo' in effect) losesWhateverIsHeld = true
            if (
              isRecord(effect.items) &&
              typeof effect.items.quantity === 'number' &&
              effect.items.quantity < 0 &&
              typeof effect.items.item === 'string'
            ) {
              losses.add(effect.items.item)
            }
          }
        }

        if (losesWhateverIsHeld) {
          const named = [...goodWords].filter((word) =>
            new RegExp(`\\b${word}\\b`, 'i').test(node.text as string),
          )
          if (named.length > 0) {
            issues.push({
              level: 'warning',
              path,
              message: `node ${nodeId} takes whatever is in the hold but names "${named[0]}" — write {cargo} so the scene reads what the trader carries`,
            })
          } else if (!node.text.includes('{cargo}')) {
            issues.push({
              level: 'warning',
              path,
              message: `node ${nodeId} takes cargo out of the hold without naming it — write {cargo} so the scene reads what the trader carries`,
            })
          }
        }

        for (const item of losses) {
          const unconditional = choices.some(
            (choice) =>
              Array.isArray(choice.effects) &&
              choice.effects.some(
                (effect) =>
                  isRecord(effect) &&
                  isRecord(effect.items) &&
                  effect.items.item === item &&
                  typeof effect.items.quantity === 'number' &&
                  effect.items.quantity < 0,
              ) &&
              !JSON.stringify(choice.conditions ?? {}).includes(item),
          )
          if (unconditional) {
            issues.push({
              level: 'warning',
              path,
              message: `node ${nodeId} takes "${item}" without checking the trader carries it — condition the choice on the item or write {cargo}`,
            })
          }
        }
      }
    }
  }

  return issues
}

export async function lintContentDirectory(
  root: string,
  options: { skipFixtures?: boolean } = {},
): Promise<LintResult> {
  const loaded = await loadPacks(root, options)
  const built = buildContentIndex(loaded.packs)
  return {
    issues: [
      ...loaded.issues,
      ...built.issues,
      ...findScriptReadingIssues(loaded.packs),
      ...findDeveloperProseIssues(loaded.packs),
      ...findCargoClaimIssues(loaded.packs),
    ],
    counts: built.counts,
  }
}

function printResult(result: LintResult): void {
  const { issues, counts } = result
  for (const entry of issues) {
    const stream = entry.level === 'error' ? process.stderr : process.stdout
    stream.write(`content:lint ${entry.level} ${entry.path}: ${entry.message}\n`)
  }

  const errors = contentErrorCount(issues)
  const warnings = issues.length - errors
  const folders = Object.entries(counts.byFolder)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, count]) => `${folder} ${count}`)
    .join(', ')

  process.stdout.write(
    `content:lint - ${counts.entities} entities in ${counts.packs} packs, ${errors} errors, ${warnings} warnings${
      folders ? ` (${folders})` : ''
    }\n`,
  )
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const json = args.includes('--json')
  const rootArg = args.find((arg) => !arg.startsWith('--'))
  const root = rootArg ? resolve(rootArg) : join(process.cwd(), 'src', 'content')

  if (!existsSync(root)) {
    process.stdout.write('content:lint - no content directory yet, nothing to check\n')
    return
  }

  const result = await lintContentDirectory(root)
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } else {
    printResult(result)
  }

  if (contentErrorCount(result.issues) > 0) {
    process.exitCode = 1
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
const isMain = invokedPath === fileURLToPath(import.meta.url)

if (isMain) {
  await main()
}
