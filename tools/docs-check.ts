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
import { join } from 'node:path'

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

async function main(): Promise<void> {
  const problems: string[] = []
  const index = await loadContent()

  for (const path of REQUIRED) {
    try {
      await readFile(join(process.cwd(), path), 'utf8')
    } catch {
      problems.push(`missing required file ${path}`)
    }
  }

  for (const [path, render] of Object.entries(GENERATED)) {
    let actual: string
    try {
      actual = await readFile(join(process.cwd(), path), 'utf8')
    } catch {
      problems.push(`missing generated file ${path}`)
      continue
    }
    if (actual !== render(index)) {
      problems.push(`${path} is stale; run pnpm docs:sync`)
    }
  }

  const status = await readFile(join(process.cwd(), 'docs/STATUS.md'), 'utf8')
  if (!status.includes('M4b')) problems.push('STATUS.md does not name M4b')
  if (!status.includes('Active task')) problems.push('STATUS.md has no active task line')

  const tooling = await readFile(join(process.cwd(), 'docs/TOOLING.md'), 'utf8')
  for (const command of ['model:check', 'prose:lint', 'price:check', 'content:guard', 'task:brief']) {
    if (!tooling.includes(command)) problems.push(`docs/TOOLING.md does not document ${command}`)
  }

  for (const problem of problems) process.stdout.write(`docs:check ${problem}\n`)
  process.stdout.write(
    `docs:check - ${REQUIRED.length} required files, ${Object.keys(GENERATED).length} generated files, ${problems.length} problems\n`,
  )
  if (problems.length > 0) process.exitCode = 1
}

void main()
