/**
 * Write a dialogue skeleton that deliberately fails the model gate until it is finished.
 *
 * Usage: `pnpm new:dialogue dlg.ugarit.example char.ugarit.amnit`
 */

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

async function main(): Promise<void> {
  const id = process.argv[2]
  const speaker = process.argv[3]
  if (!id || !speaker) {
    process.stderr.write('new:dialogue: usage: pnpm new:dialogue <dialogue-id> <character-id>\n')
    process.exitCode = 1
    return
  }

  const file = `${id.replaceAll('.', '-')}.json`
  const skeleton = {
    id,
    pack: 'pack.slice',
    contentVersion: 1,
    speaker,
    start: 'greet',
    nodes: {
      greet: {
        text: 'TODO: the scene opens on a pressure, not a greeting.',
        choices: [
          {
            text: 'TODO: an answer that does something.',
            next: null,
          },
        ],
      },
    },
    provenance: {
      confidence: 'fictional',
      sources: [],
      notes: 'TODO: why this scene exists and what it changes.',
    },
  }

  await writeFile(
    join(process.cwd(), 'src', 'content', 'packs', 'slice', 'dialogues', file),
    `${JSON.stringify(skeleton, null, 2)}\n`,
  )
  process.stdout.write(
    `new:dialogue - wrote ${file}\nFill the scene contract, choice ids and intents; pnpm model:check must pass.\n`,
  )
}

void main()
