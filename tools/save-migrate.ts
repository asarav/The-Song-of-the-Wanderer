/**
 * Migrate a save to the current format and print it.
 *
 * Usage: `pnpm save:migrate path/to/save.json > migrated.json`
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { deserialize, serialize } from '../src/engine/save'

async function main(): Promise<void> {
  const file = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  if (!file) {
    process.stderr.write('save:migrate - give a save file path\n')
    process.exitCode = 1
    return
  }

  const raw = JSON.parse(await readFile(resolve(file), 'utf8')) as unknown
  const loaded = deserialize(raw)

  if (!loaded.ok) {
    process.stderr.write(`save:migrate - ${loaded.error.code}: ${loaded.error.message}\n`)
    for (const issue of loaded.error.issues ?? []) {
      process.stderr.write(`  ${issue.path}: ${issue.message}\n`)
    }
    process.exitCode = 1
    return
  }

  const envelope = serialize(loaded.state, { savedAt: new Date().toISOString() })
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`)
  process.stderr.write(
    `save:migrate - wrote save version ${envelope.saveVersion}${
      loaded.migratedFrom !== undefined ? ` (from ${loaded.migratedFrom})` : ''
    }\n`,
  )
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
