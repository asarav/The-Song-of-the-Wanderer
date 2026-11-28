/**
 * The rewrite loop in one command: mechanics, ids, flags, scenarios, art debt and a
 * prose-lint pass for one graph.
 *
 * Usage: `pnpm content:workbench dlg.ugarit.sibtu.ask`
 */

import { execSync } from 'node:child_process'

import { flagUses } from './lib/flags'
import { search } from './lib/search'
import { lintProse } from './prose-lint'
import { loadContent } from './simulate'

async function main(): Promise<void> {
  const id = process.argv[2]
  if (!id) {
    process.stderr.write('content:workbench: name a dialogue, e.g. dlg.ugarit.sibtu.ask\n')
    process.exitCode = 1
    return
  }

  const index = await loadContent()
  const dialogue = index.dialogues.get(id)
  if (!dialogue) {
    process.stderr.write(`content:workbench: no dialogue "${id}"\n`)
    process.exitCode = 1
    return
  }

  const speaker = dialogue.speaker ? index.characters.get(dialogue.speaker) : undefined
  process.stdout.write(`# ${id}\n`)
  process.stdout.write(`speaker  ${speaker?.name ?? '(none)'} (${dialogue.speaker ?? '-'})\n`)
  process.stdout.write(`start    ${dialogue.start}\n`)
  process.stdout.write(`entries  ${(dialogue.entries ?? []).length}\n`)
  process.stdout.write(`scene    ${dialogue.scene ? JSON.stringify(dialogue.scene) : '(missing)'}\n\n`)

  for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
    process.stdout.write(`## ${nodeId}\n`)
    for (const choice of node.choices) {
      process.stdout.write(
        `  [${choice.id ?? 'NO-ID'}] ${choice.intent ?? 'NO-INTENT'} -> ${choice.next ?? '(end)'}  ${choice.text}\n`,
      )
      if (choice.effects) process.stdout.write(`    effects: ${JSON.stringify(choice.effects)}\n`)
      if (choice.conditions) process.stdout.write(`    when:    ${JSON.stringify(choice.conditions)}\n`)
    }
  }

  const uses = flagUses(index)
  const touched = [...uses.values()].filter(
    (use) =>
      use.writer.some((place) => place.startsWith(id)) ||
      use.reader.some((place) => place.startsWith(id)),
  )
  process.stdout.write(`\n## flags\n`)
  if (touched.length === 0) process.stdout.write('  (none)\n')
  for (const use of touched) {
    process.stdout.write(
      `  ${use.flag}: writes ${use.writer.filter((place) => place.startsWith(id)).length}, reads ${use.reader.filter((place) => place.startsWith(id)).length}\n`,
    )
  }

  const scenarioHits = await search([id], process.cwd())
  process.stdout.write(`\n## references\n`)
  for (const hit of scenarioHits.filter((entry) => entry.file.includes('scenarios'))) {
    process.stdout.write(`  ${hit.file}:${hit.line}\n`)
  }

  const lint = lintProse(index).filter((issue) => issue.entity === id)
  process.stdout.write(`\n## prose\n`)
  if (lint.length === 0) process.stdout.write('  clean\n')
  for (const issue of lint) {
    process.stdout.write(
      `  ${issue.level} ${issue.node ?? '-'}: ${issue.message}\n`,
    )
  }

  process.stdout.write(`\n## guard\n`)
  try {
    const output = execSync('pnpm content:guard', { encoding: 'utf8' })
    process.stdout.write(`${output.trim().split('\n').slice(-1)[0]}\n`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stdout.write(`  FAILED: ${message.split('\n')[0]}\n`)
  }
}

void main()
