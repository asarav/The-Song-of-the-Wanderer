/**
 * Run the quality gates with bounded parallelism.
 *
 * The gates are read-only and independent, so running them together shortens the
 * feedback loop without changing what is checked. `--sequential` keeps the old shape for
 * debugging, and `CHECK_CONCURRENCY` controls how many run at once.
 *
 * Usage:
 *   pnpm check
 *   pnpm check -- --sequential
 *   pnpm check -- --json
 */

import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'

const TASKS = [
  'typecheck',
  'lint',
  'test',
  'content:lint',
  'model:check',
  'ambient:check',
  'factory:check',
  'prose:lint',
  'price:check',
  'content:guard',
  'invariant:check',
  'docs:check',
  'audio:check',
  'skills:check',
]

const args = process.argv.slice(2)
const json = args.includes('--json')
const sequential = args.includes('--sequential')
const requested = Number(process.env.CHECK_CONCURRENCY ?? '')
const concurrency = sequential
  ? 1
  : Number.isInteger(requested) && requested > 0
    ? Math.min(requested, TASKS.length)
    : Math.min(4, Math.max(1, availableParallelism()))

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const started = Date.now()

function stripAnsi(value) {
  // The child is asked not to colour, but a wrapper may still emit control codes.
  const escape = String.fromCharCode(27)
  let out = ''
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== escape) {
      out += value[index]
      continue
    }
    index += 1
    while (index < value.length && !/[A-Za-z]/.test(value[index] ?? '')) index += 1
  }
  return out
}

function runTask(task) {
  return new Promise((resolve) => {
    const at = Date.now()
    // Task names are fixed above; the command string avoids Node's shell+args warning.
    const child = spawn(`${pnpm} run ${task}`, {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      shell: true,
      windowsHide: true,
    })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.on('error', (error) => {
      resolve({
        task,
        ok: false,
        seconds: (Date.now() - at) / 1000,
        output: `${output}\n${error.message}`.trim(),
      })
    })
    child.on('close', (code) => {
      resolve({
        task,
        ok: code === 0,
        code: code ?? -1,
        seconds: (Date.now() - at) / 1000,
        output: stripAnsi(output).trim(),
      })
    })
  })
}

const results = new Array(TASKS.length)
let next = 0
let failed = false

async function worker() {
  for (;;) {
    const index = next
    next += 1
    if (index >= TASKS.length) return

    const result = await runTask(TASKS[index])
    results[index] = result
    if (result.ok) {
      if (!json) process.stdout.write(`  ok  ${result.task} (${result.seconds.toFixed(1)}s)\n`)
    } else {
      failed = true
      if (!json) process.stdout.write(`  FAIL ${result.task} (${result.seconds.toFixed(1)}s)\n`)
    }
  }
}

if (!json) {
  process.stdout.write(
    `check - ${TASKS.length} gates, concurrency ${concurrency}${
      sequential ? ' (sequential)' : ''
    }\n`,
  )
}

await Promise.all(Array.from({ length: concurrency }, () => worker()))

const elapsed = (Date.now() - started) / 1000
const failures = results.filter((result) => !result.ok)

if (json) {
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: failures.length === 0,
        concurrency,
        seconds: Number(elapsed.toFixed(3)),
        tasks: results.map((result) => ({
          task: result.task,
          ok: result.ok,
          seconds: Number(result.seconds.toFixed(3)),
          ...(result.ok ? {} : { output: result.output }),
        })),
      },
      null,
      2,
    )}\n`,
  )
} else {
  if (failures.length > 0) {
    process.stdout.write('\n')
    for (const failure of failures) {
      process.stdout.write(`--- ${failure.task} ---\n${failure.output}\n\n`)
    }
  }
  process.stdout.write(
    `check - ${results.length - failures.length}/${results.length} gates passed in ${elapsed.toFixed(
      1,
    )}s\n`,
  )
}

if (failed) process.exitCode = 1
