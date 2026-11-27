/**
 * Run a headless scenario against the authored content.
 *
 * Usage: `pnpm simulate -- scenario.slice.crossing [--json]`
 */

import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildContentIndex } from '../src/engine/content'
import {
  formatTrace,
  runScenario,
  type Scenario,
  type ScenarioResult,
} from '../src/engine/testing'
import { loadPacks } from './content-lint'

export const SCENARIO_ROOT = join(process.cwd(), 'src', 'engine', 'scenarios')

export async function loadContent() {
  const loaded = await loadPacks(join(process.cwd(), 'src', 'content'))
  const built = buildContentIndex(loaded.packs)
  const errors = built.issues.filter((entry) => entry.level === 'error')
  if (errors.length > 0) {
    throw new Error(
      `content is invalid, run pnpm content:lint:\n${errors
        .map((entry) => `${entry.path}: ${entry.message}`)
        .join('\n')}`,
    )
  }
  return built.index
}

export async function loadScenario(id: string): Promise<Scenario> {
  const files = await readdir(SCENARIO_ROOT)
  const match = files.find((file) => file === `${id}.json`)
  if (!match) {
    throw new Error(`No scenario "${id}" in ${SCENARIO_ROOT}. Found: ${files.join(', ')}`)
  }
  return JSON.parse(await readFile(join(SCENARIO_ROOT, match), 'utf8')) as Scenario
}

/** The human trace, or the machine record `--json` prints. */
export function reportScenario(result: ScenarioResult, json: boolean): string {
  if (!json) return formatTrace(result)
  return JSON.stringify(
    { id: result.id, ok: result.ok, failures: result.failures, steps: result.steps },
    null,
    2,
  )
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const json = args.includes('--json')
  const id = args.find((arg) => !arg.startsWith('--'))

  if (!id) {
    const files = existsSync(SCENARIO_ROOT) ? await readdir(SCENARIO_ROOT) : []
    process.stdout.write(
      `simulate - choose a scenario:\n${files
        .filter((file) => file.endsWith('.json'))
        .map((file) => `  ${file.replace(/\.json$/, '')}`)
        .join('\n')}\n`,
    )
    return
  }

  const index = await loadContent()
  const scenario = await loadScenario(id)
  const result = runScenario(scenario, index)

  process.stdout.write(`${reportScenario(result, json)}\n`)

  if (!result.ok) process.exitCode = 1
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
