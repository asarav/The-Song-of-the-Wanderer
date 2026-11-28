/**
 * Documentation and canon check.
 *
 * A claim that is not checked is decoration. This verifies the required files, that every
 * ADR is present, and that the generated cast, facts, flag, scene and price tables match
 * content byte for byte.
 *
 * Usage: `pnpm docs:check`
 */

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { GENERATED } from './lib/docs'
import { loadContent } from './simulate'

const REQUIRED = [
  'docs/STATUS.md',
  'docs/WORKLOG.md',
  'docs/PLAN.md',
  'docs/TOOLING.md',
  'docs/playtests/findings.md',
  'docs/design/cast-threads.md',
  'docs/design/dialogue-audit.md',
  'docs/milestones/M4b-slice-revision.md',
  'docs/DECISIONS/ADR-0017-gate-a-evidence-and-revision.md',
  'docs/DECISIONS/ADR-0018-character-scene-model.md',
]

export interface DocsSnapshot {
  required: string[]
  files: Map<string, string>
  /** Path → the exact text the generator currently produces. */
  generated: Map<string, string>
}

/** The predicate. The CLI and the broken-fixture test both run this function. */
export function checkDocs(snapshot: DocsSnapshot): string[] {
  const problems: string[] = []

  for (const path of snapshot.required) {
    if (!snapshot.files.has(path)) problems.push(`missing required file ${path}`)
  }
  for (const [path, expected] of snapshot.generated) {
    const actual = snapshot.files.get(path)
    if (actual === undefined) problems.push(`missing generated file ${path}`)
    else if (actual !== expected) problems.push(`${path} is stale; run pnpm docs:sync`)
  }

  const status = snapshot.files.get('docs/STATUS.md') ?? ''
  if (!status.includes('M4b')) problems.push('STATUS.md does not name M4b')
  if (!status.includes('Active task')) problems.push('STATUS.md has no active task line')

  const tooling = snapshot.files.get('docs/TOOLING.md') ?? ''
  for (const command of ['model:check', 'prose:lint', 'price:check', 'content:guard', 'task:brief']) {
    if (!tooling.includes(command)) {
      problems.push(`docs/TOOLING.md does not document ${command}`)
    }
  }

  return problems
}

async function main(): Promise<void> {
  const index = await loadContent()
  const files = new Map<string, string>()
  for (const path of REQUIRED) {
    try {
      files.set(path, await readFile(join(process.cwd(), path), 'utf8'))
    } catch {
      // Missing files are reported by the predicate; the fixture can leave them absent.
    }
  }
  const generated = new Map<string, string>()
  for (const [path, render] of Object.entries(GENERATED)) {
    generated.set(path, render(index))
    try {
      files.set(path, await readFile(join(process.cwd(), path), 'utf8'))
    } catch {
      // Reported by the predicate.
    }
  }

  const problems = checkDocs({ required: REQUIRED, files, generated })

  for (const problem of problems) process.stdout.write(`docs:check ${problem}\n`)
  process.stdout.write(
    `docs:check - ${REQUIRED.length} required files, ${Object.keys(GENERATED).length} generated files, ${problems.length} problems\n`,
  )
  if (problems.length > 0) process.exitCode = 1
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
