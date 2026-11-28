/**
 * Content invariants.
 *
 * Prices, tolls and route unlocks that playtests have already corrected once. They are
 * addressed by stable choice id, so reordering answers cannot make the invariant test a
 * different answer. `content/invariants.json` is the source of truth.
 *
 * Usage: `pnpm invariant:check [--json]`
 */

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ContentIndex } from '../src/engine/content'
import { loadContent } from './simulate'

export interface Invariant {
  id: string
  description: string
  dialogue: string
  node: string
  choice: string
  money?: number
  unlockRoute?: string
  flag?: string
  journal?: string
}

export interface InvariantFailure {
  id: string
  message: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The predicate. The CLI and the broken-fixture test both run this function. */
export function checkInvariants(
  index: ContentIndex,
  invariants: Invariant[],
): InvariantFailure[] {
  const failures: InvariantFailure[] = []

  for (const invariant of invariants) {
    const dialogue = index.dialogues.get(invariant.dialogue)
    const node = dialogue?.nodes[invariant.node]
    const choice = node?.choices.find((entry) => entry.id === invariant.choice)
    if (!choice) {
      failures.push({
        id: invariant.id,
        message: `missing ${invariant.dialogue}:${invariant.node} choice "${invariant.choice}"`,
      })
      continue
    }
    const effects = (Array.isArray(choice.effects) ? choice.effects : []).filter(
      isObject,
    ) as Record<string, unknown>[]

    if (invariant.money !== undefined) {
      const paid = effects.some((effect) => effect.money === invariant.money)
      if (!paid) {
        failures.push({
          id: invariant.id,
          message: `expected money ${invariant.money} at ${invariant.node}:${invariant.choice}`,
        })
      }
    }
    if (invariant.unlockRoute) {
      const unlocked = effects.some((effect) => effect.unlockRoute === invariant.unlockRoute)
      if (!unlocked) {
        failures.push({
          id: invariant.id,
          message: `expected unlockRoute ${invariant.unlockRoute} at ${invariant.node}:${invariant.choice}`,
        })
      }
    }
    if (invariant.flag) {
      const set = effects.some(
        (effect) =>
          effect.flag === invariant.flag ||
          (isObject(effect.flag) && effect.flag.name === invariant.flag),
      )
      if (!set) {
        failures.push({
          id: invariant.id,
          message: `expected flag ${invariant.flag} at ${invariant.node}:${invariant.choice}`,
        })
      }
    }
    if (invariant.journal) {
      const written = effects.some(
        (effect) => isObject(effect.journal) && effect.journal.entry === invariant.journal,
      )
      if (!written) {
        failures.push({
          id: invariant.id,
          message: `expected journal ${invariant.journal} at ${invariant.node}:${invariant.choice}`,
        })
      }
    }
  }

  return failures
}

async function main(): Promise<void> {
  const json = process.argv.includes('--json')
  const index = await loadContent()
  const invariants = JSON.parse(
    await readFile(join(process.cwd(), 'content', 'invariants.json'), 'utf8'),
  ) as Invariant[]
  const failures = checkInvariants(index, invariants)

  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: failures.length === 0, failures }, null, 2)}\n`)
  } else {
    for (const failure of failures) {
      process.stdout.write(`invariant:check ${failure.id}: ${failure.message}\n`)
    }
    process.stdout.write(
      `invariant:check - ${invariants.length} invariants, ${failures.length} failures\n`,
    )
  }
  if (failures.length > 0) process.exitCode = 1
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
