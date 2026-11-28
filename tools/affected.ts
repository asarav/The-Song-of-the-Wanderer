/**
 * Changed files → the exact checks to run.
 *
 * Usage: `pnpm affected`
 */

import { execFileSync } from 'node:child_process'

function git(args: string[]): string[] {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function main(): void {
  const changed = [
    ...git(['diff', '--name-only', 'HEAD']),
    ...git(['ls-files', '--others', '--exclude-standard']),
  ]

  const commands = new Set<string>()
  for (const file of changed) {
    if (file.startsWith('src/engine/') || file.startsWith('src/store/') || file.startsWith('src/ui/')) {
      commands.add('pnpm typecheck')
      commands.add('pnpm test')
    }
    if (file.startsWith('src/content/')) {
      commands.add('pnpm content:lint')
      commands.add('pnpm model:check')
      commands.add('pnpm prose:lint')
      commands.add('pnpm price:check')
      commands.add('pnpm content:guard')
      commands.add('pnpm invariant:check')
      commands.add('pnpm test')
    }
    if (file.startsWith('tools/')) {
      commands.add('pnpm typecheck')
      commands.add('pnpm test')
    }
    if (file.startsWith('docs/')) commands.add('pnpm docs:check')
    if (file.startsWith('src/engine/scenarios/')) commands.add('pnpm test')
  }

  process.stdout.write(`affected: ${changed.length} changed files\n`)
  for (const file of changed) process.stdout.write(`  ${file}\n`)
  process.stdout.write(`\nrun\n`)
  for (const command of [...commands].sort()) process.stdout.write(`  ${command}\n`)
  if (commands.size === 0) process.stdout.write('  (nothing changed)\n')
}

main()
