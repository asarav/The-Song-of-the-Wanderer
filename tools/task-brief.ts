/**
 * Session start: the active task, its acceptance, the files it touches and the state of
 * the tree. Replaces reading everything and remembering it.
 *
 * Usage: `pnpm task:brief`
 */

import { execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function sh(command: string, args: readonly string[]): string {
  try {
    return execSync([command, ...args].join(' '), { encoding: 'utf8' }).trim()
  } catch (error) {
    return `(${command} failed: ${error instanceof Error ? error.message.split('\n')[0] : String(error)})`
  }
}

async function main(): Promise<void> {
  const status = await readFile('docs/STATUS.md', 'utf8')
  const milestone = await readFile('docs/milestones/M4b-slice-revision.md', 'utf8')
  const worklog = await readFile('docs/WORKLOG.md', 'utf8')

  const active = status.split('\n').find((line) => line.includes('Active task')) ?? 'Active task: (none)'
  const health = status.split('\n').find((line) => line.includes('Health')) ?? ''
  process.stdout.write(`# Task brief\n\n${active}\n${health}\n\n`)

  process.stdout.write(`## Acceptance (M4b)\n`)
  const done = milestone.split('\n').find((line) => line.includes('Definition of done')) ?? ''
  process.stdout.write(`${done}\n\n`)

  process.stdout.write(`## Tree\n`)
  const changed = sh('git', ['status', '--short'])
  process.stdout.write(`${changed || '(clean)'}\n\n`)

  process.stdout.write(`## Recently changed\n`)
  process.stdout.write(`${sh('git', ['diff', '--stat', 'HEAD']).split('\n').slice(-15).join('\n')}\n\n`)

  process.stdout.write(`## Last worklog entries\n`)
  process.stdout.write(`${worklog.trim().split('\n').slice(-18).join('\n')}\n\n`)

  process.stdout.write(`## Checks\n`)
  for (const [label, command, args] of [
    ['guard', PNPM, ['content:guard']],
    ['model', PNPM, ['model:check']],
    ['prose', PNPM, ['prose:lint']],
  ] as const) {
    process.stdout.write(`${label}: ${sh(command, args).split('\n').slice(-1)[0]}\n`)
  }

  process.stdout.write(`\n## Scenarios\n${sh('ls', ['src/engine/scenarios'])}\n`)
}

void main()
