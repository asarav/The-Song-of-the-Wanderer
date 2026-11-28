/**
 * Full-text search over content, scenarios and docs, with file:line.
 *
 * Usage: `pnpm ask "sibtu cloth"`
 */

import { formatHits, search } from './lib/search'

async function main(): Promise<void> {
  const terms = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  if (terms.length === 0) {
    process.stderr.write('ask: give at least one word, e.g. pnpm ask "gate tax"\n')
    process.exitCode = 1
    return
  }
  const hits = await search(terms)
  process.stdout.write(
    hits.length === 0
      ? `ask: nothing for "${terms.join(' ')}"\n`
      : `${formatHits(hits)}\nask: ${hits.length} hits\n`,
  )
}

void main()
