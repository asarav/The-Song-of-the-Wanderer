/**
 * Which nodes and answers the checked-in scenarios never touch.
 *
 * Usage: `pnpm coverage:choices`
 */

import { readdir, readFile } from 'node:fs/promises'

import { runScenario } from '../src/engine/testing/scenario'
import { loadContent, SCENARIO_ROOT } from './simulate'

async function main(): Promise<void> {
  const index = await loadContent()
  const scenarios = (await readdir(SCENARIO_ROOT)).filter((file) => file.endsWith('.json'))

  const visited = new Set<string>()
  const taken = new Set<string>()

  for (const file of scenarios) {
    const scenario = JSON.parse(
      await readFile(`${SCENARIO_ROOT}/${file}`, 'utf8'),
    ) as Parameters<typeof runScenario>[0]
    for (const command of scenario.commands) {
      if ('type' in command && command.type === 'chooseChoice') {
        taken.add(`${command.dialogue ?? ''}:${command.node ?? ''}:${command.choiceId}`)
      }
    }
    const result = runScenario(scenario, index)
    for (const step of result.steps) {
      for (const event of step.events) {
        if (event.type === 'DialoguePresented') visited.add(`${event.dialogue}:${event.node}`)
      }
    }
  }

  let untouchedNodes = 0
  let untouchedChoices = 0
  for (const dialogue of index.dialogues.values()) {
    const rows: string[] = []
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      if (!visited.has(`${dialogue.id}:${nodeId}`)) {
        rows.push(`  node ${nodeId}`)
        untouchedNodes += 1
      }
      for (const choice of node.choices) {
        if (!choice.id) continue
        const key = `${dialogue.id}:${nodeId}:${choice.id}`
        if (!taken.has(key)) {
          rows.push(`  choice ${nodeId}/${choice.id}`)
          untouchedChoices += 1
        }
      }
    }
    if (rows.length > 0) {
      process.stdout.write(`${dialogue.id}\n${rows.slice(0, 12).join('\n')}\n`)
      if (rows.length > 12) process.stdout.write(`  … ${rows.length - 12} more\n`)
    }
  }

  process.stdout.write(
    `coverage:choices - ${scenarios.length} scenarios, ${untouchedNodes} unvisited nodes, ${untouchedChoices} untried answers\n`,
  )
}

void main()
