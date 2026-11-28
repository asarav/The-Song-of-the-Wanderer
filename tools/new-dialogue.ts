/**
 * Write a dialogue skeleton that deliberately fails the model gate until it is finished.
 *
 * This is a compatibility wrapper around `factory new dialogue`; there is one scaffolder.
 * Usage: `pnpm new:dialogue dlg.ugarit.example char.ugarit.amnit`
 */

import { writeScaffold } from './factory'

async function main(): Promise<void> {
  const id = process.argv[2]
  const speaker = process.argv[3]
  if (!id || !speaker) {
    process.stderr.write('new:dialogue: usage: pnpm new:dialogue <dialogue-id> <character-id>\n')
    process.exitCode = 1
    return
  }

  try {
    const result = await writeScaffold('dialogue', id, { speaker, write: true })
    process.stdout.write(
      `new:dialogue - wrote ${result.path}\nFill the scene contract, choice ids and intents; pnpm model:check must pass.\n`,
    )
  } catch (error) {
    process.stderr.write(`new:dialogue: ${(error as Error).message}\n`)
    process.exitCode = 1
  }
}

void main()
