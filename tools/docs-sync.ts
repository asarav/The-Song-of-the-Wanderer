/**
 * Regenerate the canon and the tables derived from content.
 *
 * Usage: `pnpm docs:sync`
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { GENERATED } from './lib/docs'
import { loadContent } from './simulate'

async function main(): Promise<void> {
  const index = await loadContent()
  for (const [path, render] of Object.entries(GENERATED)) {
    await mkdir(dirname(join(process.cwd(), path)), { recursive: true })
    await writeFile(join(process.cwd(), path), render(index))
  }
  process.stdout.write(`docs:sync - ${Object.keys(GENERATED).length} files regenerated\n`)
}

void main()
