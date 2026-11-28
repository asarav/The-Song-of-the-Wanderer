/**
 * Finish a task only if the machine agrees.
 *
 * Runs check, build, the content gates and docs check, then prints the milestone, STATUS,
 * WORKLOG and commit checklist. It never commits or pushes.
 *
 * Usage: `pnpm task:finish`
 */

import { execFileSync } from 'node:child_process'

const STEPS: [string, string, string[]][] = [
  ['check', 'pnpm', ['check']],
  ['build', 'pnpm', ['build']],
  ['model', 'pnpm', ['model:check']],
  ['prose', 'pnpm', ['prose:lint']],
  ['price', 'pnpm', ['price:check']],
  ['guard', 'pnpm', ['content:guard']],
  ['invariants', 'pnpm', ['invariant:check']],
  ['docs', 'pnpm', ['docs:check']],
]

function main(): void {
  for (const [label, command, args] of STEPS) {
    process.stdout.write(`\n=== ${label} ===\n`)
    try {
      execFileSync(command, args, { stdio: 'inherit' })
    } catch {
      process.stderr.write(
        `\ntask:finish refused: ${label} failed. Fix it before updating STATUS/WORKLOG or committing.\n`,
      )
      process.exitCode = 1
      return
    }
  }

  process.stdout.write(`
task:finish - all gates green
Before committing:
  1. update docs/milestones/M4b-slice-revision.md (task state)
  2. rewrite docs/STATUS.md (do not append)
  3. add a docs/WORKLOG.md entry
  4. stage only this task's files, then one commit with the reason
  5. no push unless the owner asks
`)
}

main()
