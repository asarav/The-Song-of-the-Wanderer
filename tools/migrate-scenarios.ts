/**
 * Rewrite scenario choice commands to stable choice ids.
 *
 * A numeric index couples the scenario to answer order. This walks each scenario the way
 * the runner does, reads the pending node before every choice, and replaces the index
 * with the id of the answer that was actually taken. Existing `chooseChoice` entries are
 * left alone so the migration can run twice.
 *
 * Usage: `pnpm migrate:scenarios`
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { Command } from '../src/engine/kernel'
import { newGame, reduce } from '../src/engine/kernel'
import { deserialize, serialize } from '../src/engine/save'
import { createInitialState, type GameState } from '../src/engine/state'
import { parseDate } from '../src/engine/time'
import { loadContent } from './simulate'

interface Entry {
  type?: string
  kind?: string
  choice?: number
  [key: string]: unknown
}

interface ScenarioFile {
  id: string
  seed: string
  start: Record<string, unknown>
  newGame?: boolean
  commands: Entry[]
  assert: unknown[]
}

function opening(scenario: ScenarioFile, index: Awaited<ReturnType<typeof loadContent>>): GameState {
  const start = { ...scenario.start }
  if (typeof start.date === 'string') start.day = parseDate(start.date)
  delete start.date
  const input = { ...start, seed: scenario.seed }
  return scenario.newGame
    ? newGame(input as never, index).state
    : createInitialState(input as never)
}

async function main(): Promise<void> {
  const index = await loadContent()
  const dir = join(process.cwd(), 'src', 'engine', 'scenarios')
  let migrated = 0
  let dropped = 0

  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue
    const path = join(dir, file)
    const scenario = JSON.parse(await readFile(path, 'utf8')) as ScenarioFile
    let state = opening(scenario, index)

    scenario.commands = scenario.commands.flatMap((entry) => {
      if (entry.type === 'chooseChoice') return [entry]

      if (entry.type === 'chooseDialogue' || entry.type === 'resolveEncounter') {
        const pending = state.narrative.pending
        // A few old scenarios end with extra numeric resolves after the scene has closed.
        // They were recorded as rejected no-ops, so dropping them changes nothing.
        if (!pending) {
          dropped += 1
          return []
        }
        const node = index.dialogues.get(pending.dialogue)?.nodes[pending.node]
        const choice = node?.choices[entry.choice ?? 0]
        if (!choice?.id) {
          throw new Error(
            `${scenario.id}: ${pending.dialogue}:${pending.node} choice ${String(entry.choice)} has no id`,
          )
        }
        migrated += 1
        const next = {
          type: 'chooseChoice',
          choiceId: choice.id,
          dialogue: pending.dialogue,
          node: pending.node,
        }
        const result = reduce(state, next as Command, index)
        if (!result.rejected) state = result.state
        return [next]
      }

      if (entry.kind === 'save') {
        const text = JSON.stringify(serialize(state, { savedAt: '1970-01-01T00:00:00.000Z' }))
        const loaded = deserialize(JSON.parse(text) as unknown)
        if (loaded.ok) state = loaded.state
        return [entry]
      }

      const result = reduce(state, entry as Command, index)
      if (!result.rejected) state = result.state
      return [entry]
    })

    await writeFile(path, `${JSON.stringify(scenario, null, 2)}\n`)
  }

  process.stdout.write(
    `migrate:scenarios - ${migrated} choices now addressed by id, ${dropped} no-op resolves left as-is\n`,
  )
}

void main()
