/**
 * Build playtest checkpoints.
 *
 * A checkpoint is a scenario replayed to a fixed step and written as a normal save
 * envelope. `playtest.html` loads one into localStorage, so an agent can test the
 * palace seal, Sibtu's endings, a crossing scene, or a market without replaying the
 * opening every time.
 *
 * Usage:
 *   pnpm playtest:build
 *   pnpm playtest:build -- --list
 *
 * The save files are generated and ignored; the scenario steps in
 * `tools/playtest/checkpoints.json` are the source of truth.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { serialize } from '../src/engine/save'
import { runScenario, type Scenario } from '../src/engine/testing'
import { loadContent, loadScenario } from './simulate'

const DEFINITIONS = join(process.cwd(), 'tools', 'playtest', 'checkpoints.json')
const OUTPUT = join(process.cwd(), 'public', 'playtests')
/** Fixed so two builds of the same checkpoints are byte-identical. */
const SAVED_AT = '2026-11-27T12:00:00.000Z'

interface Checkpoint {
  id: string
  title: string
  description: string
  scenario: string
  /** How many authored steps to replay before saving. */
  steps: number
}

interface Summary {
  id: string
  title: string
  description: string
  file: string
  location: string
  day: number
  money: number
  pending: string | null
  journey: string | null
}

function isCheckpoint(value: unknown): value is Checkpoint {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.description === 'string' &&
    typeof record.scenario === 'string' &&
    typeof record.steps === 'number' &&
    Number.isInteger(record.steps) &&
    record.steps >= 0
  )
}

async function readDefinitions(): Promise<Checkpoint[]> {
  const parsed = JSON.parse(await readFile(DEFINITIONS, 'utf8')) as unknown
  if (!Array.isArray(parsed) || !parsed.every(isCheckpoint)) {
    throw new Error(`${DEFINITIONS} must be a JSON array of checkpoint definitions.`)
  }
  const seen = new Set<string>()
  for (const entry of parsed) {
    if (seen.has(entry.id)) throw new Error(`Duplicate checkpoint id "${entry.id}".`)
    seen.add(entry.id)
  }
  return parsed
}

async function main(): Promise<void> {
  const listOnly = process.argv.includes('--list')
  const definitions = await readDefinitions()

  if (listOnly) {
    process.stdout.write(
      `checkpoints:\n${definitions
        .map((entry) => `  ${entry.id.padEnd(20)} ${entry.title}`)
        .join('\n')}\n`,
    )
    return
  }

  const index = await loadContent()
  await mkdir(OUTPUT, { recursive: true })

  const summaries: Summary[] = []

  for (const definition of definitions) {
    const scenario = await loadScenario(definition.scenario)
    if (definition.steps > scenario.commands.length) {
      throw new Error(
        `Checkpoint "${definition.id}" asks for ${definition.steps} steps, but ` +
          `"${definition.scenario}" has only ${scenario.commands.length}.`,
      )
    }

    // Replaying a prefix through the normal runner keeps the checkpoint honest: it uses
    // the same opening, seed, RNG cursors and commands as a real run.
    const prefix: Scenario = {
      ...scenario,
      id: definition.id,
      commands: scenario.commands.slice(0, definition.steps),
      assert: [],
    }
    const result = runScenario(prefix, index)
    const rejected = result.steps.filter((step) => !step.accepted)
    if (!result.ok || rejected.length > 0) {
      const detail = rejected
        .map((step) => `step ${step.index}: ${step.reason ?? 'rejected'}`)
        .join('; ')
      throw new Error(
        `Checkpoint "${definition.id}" could not be built${detail ? ` (${detail})` : ''}.`,
      )
    }

    const state = result.finalState
    const envelope = serialize(state, { savedAt: SAVED_AT })
    await writeFile(join(OUTPUT, `${definition.id}.json`), `${JSON.stringify(envelope, null, 2)}\n`)

    summaries.push({
      id: definition.id,
      title: definition.title,
      description: definition.description,
      file: `/playtests/${definition.id}.json`,
      location: state.player.location,
      day: state.calendar.day,
      money: state.player.money,
      pending: state.narrative.pending?.dialogue ?? null,
      journey: state.narrative.journey?.route ?? null,
    })
    process.stdout.write(`  ${definition.id}  (${state.player.location}, day ${state.calendar.day})\n`)
  }

  await writeFile(
    join(OUTPUT, 'index.json'),
    `${JSON.stringify({ checkpoints: summaries }, null, 2)}\n`,
  )
  process.stdout.write(
    `\nWrote ${summaries.length} checkpoints to ${OUTPUT}.\n` +
      'Open /playtest.html in the dev server to load one.\n',
  )
}

await main()
