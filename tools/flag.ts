/**
 * Who writes a flag and who reads it.
 *
 * Usage: `pnpm flag sibtu.cloth-taken`
 */

import { flagUses } from './lib/flags'
import { loadContent } from './simulate'

async function main(): Promise<void> {
  const flag = process.argv[2]
  if (!flag) {
    process.stderr.write('flag: name a flag, e.g. pnpm flag sibtu.cloth-taken\n')
    process.exitCode = 1
    return
  }
  const index = await loadContent()
  const use = flagUses(index).get(flag)
  if (!use) {
    process.stdout.write(`flag: "${flag}" is never written or read by content\n`)
    return
  }
  process.stdout.write(`flag ${flag}\n`)
  process.stdout.write(`  written  ${use.writer.length ? [...new Set(use.writer)].join(', ') : '(nowhere)'}\n`)
  process.stdout.write(`  read     ${use.reader.length ? [...new Set(use.reader)].join(', ') : '(nowhere)'}\n`)
}

void main()
