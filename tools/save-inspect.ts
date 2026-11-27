/**
 * Print a save in human-readable form.
 *
 * Usage: `pnpm save:inspect path/to/save.json`
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { deserialize, inspectSave } from '../src/engine/save'

async function main(): Promise<void> {
  const file = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  if (!file) {
    process.stderr.write('save:inspect - give a save file path\n')
    process.exitCode = 1
    return
  }

  const raw = JSON.parse(await readFile(resolve(file), 'utf8')) as unknown
  const loaded = deserialize(raw)

  if (!loaded.ok) {
    process.stderr.write(`save:inspect - ${loaded.error.code}: ${loaded.error.message}\n`)
    for (const issue of loaded.error.issues ?? []) {
      process.stderr.write(`  ${issue.path}: ${issue.message}\n`)
    }
    process.exitCode = 1
    return
  }

  if (loaded.migratedFrom !== undefined) {
    process.stdout.write(`migrated from save version ${loaded.migratedFrom}\n`)
  }
  process.stdout.write(`${inspectSave(loaded.state)}\n`)
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
