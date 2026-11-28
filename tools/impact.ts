/**
 * Reverse dependencies for an entity, flag or scene.
 *
 * Usage: `pnpm impact char.ugarit.sibtu`
 */

import { search } from './lib/search'

async function main(): Promise<void> {
  const id = process.argv[2]
  if (!id) {
    process.stderr.write('impact: name an id or flag\n')
    process.exitCode = 1
    return
  }

  const hits = await search([id])
  const groups = new Map<string, string[]>()
  for (const hit of hits) {
    const group = hit.file.startsWith('src/engine/scenarios')
      ? 'scenarios'
      : hit.file.startsWith('docs')
        ? 'docs'
        : hit.file.includes('.test.')
          ? 'tests'
          : hit.file.startsWith('src/content')
            ? 'content'
            : 'code'
    const list = groups.get(group) ?? []
    list.push(`${hit.file}:${hit.line}`)
    groups.set(group, list)
  }

  process.stdout.write(`impact ${id}\n`)
  for (const [group, places] of [...groups.entries()].sort()) {
    process.stdout.write(`  ${group} (${places.length})\n`)
    for (const place of places.slice(0, 12)) process.stdout.write(`    ${place}\n`)
    if (places.length > 12) process.stdout.write(`    … ${places.length - 12} more\n`)
  }
  if (hits.length === 0) process.stdout.write('  (no references)\n')
}

void main()
