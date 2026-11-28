/**
 * Everything known about one entity, in one command.
 *
 * Usage: `pnpm entity dlg.ugarit.sibtu.ask`
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { loadContent } from './simulate'

async function main(): Promise<void> {
  const id = process.argv[2]
  if (!id) {
    process.stderr.write('entity: name an id, e.g. pnpm entity char.ugarit.sibtu\n')
    process.exitCode = 1
    return
  }

  const index = await loadContent()
  const character = index.characters.get(id)
  const dialogue = index.dialogues.get(id)
  const event = index.events.get(id)
  const journal = index.journal.get(id)
  const codex = index.codex.get(id)
  const destination = index.destinations.get(id)
  const good = index.goods.get(id)

  const kind = character
    ? 'character'
    : dialogue
      ? 'dialogue'
      : event
        ? 'event'
        : journal
          ? 'journal'
          : codex
            ? 'codex'
            : destination
              ? 'destination'
              : good
                ? 'good'
                : null

  if (!kind) {
    process.stdout.write(`entity: "${id}" is not content\n`)
    process.exitCode = 1
    return
  }

  process.stdout.write(`entity ${id} (${kind})\n`)

  const definition =
    character ?? dialogue ?? event ?? journal ?? codex ?? destination ?? good
  process.stdout.write(`${JSON.stringify(definition, null, 2)}\n`)

  const files = [
    ...['characters', 'dialogues', 'events', 'journal', 'codex', 'destinations', 'goods'].map(
      (folder) => join('src', 'content', 'packs', 'slice', folder),
    ),
  ]
  let source: string | null = null
  for (const folder of files) {
    try {
      for (const file of await import('node:fs/promises').then((fs) => fs.readdir(folder))) {
        if (!file.endsWith('.json')) continue
        const text = await readFile(join(folder, file), 'utf8')
        if (text.includes(`"id": "${id}"`)) {
          source = join(folder, file).replaceAll('\\', '/')
          break
        }
      }
    } catch {
      // Folders are optional.
    }
    if (source) break
  }
  process.stdout.write(`source ${source ?? '(not found in the slice pack)'}\n`)

  if (character) {
    process.stdout.write(
      `\nwants\n${character.wants?.map((want) => `  ${typeof want === 'string' ? want : `${want.id} -> ${want.scene}`}`).join('\n') ?? '  (none)'}\n`,
    )
    process.stdout.write(
      `ties\n${character.ties?.map((tie) => `  ${tie.kind}: ${tie.character}`).join('\n') ?? '  (none)'}\n`,
    )
    const graphs = [...index.dialogues.values()].filter(
      (entry) =>
        entry.speaker === id ||
        (character.appearances ?? []).includes(entry.id) ||
        entry.entries?.some(() => false),
    )
    process.stdout.write(`scenes\n${graphs.map((entry) => `  ${entry.id}`).join('\n') || '  (none)'}\n`)
  }

  if (dialogue) {
    process.stdout.write(`\nnodes\n`)
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      process.stdout.write(`  ${nodeId}: ${node.choices.map((choice) => choice.id ?? '?').join(', ')}\n`)
    }
  }
}

void main()
