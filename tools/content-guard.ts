/**
 * Mechanics guard.
 *
 * Prose edits are free. Mechanics are not: choice order and ids, effects, conditions,
 * entries and flags are fingerprinted, so an edit that removes the gate tax or reorders
 * Yada's answers fails until someone records why it changed.
 *
 * Usage:
 *   pnpm content:guard
 *   pnpm content:guard --update --reason "Sibtu now asks for the cloth before the money"
 */

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ContentIndex, DialogueDef } from '../src/engine/content'
import { loadContent } from './simulate'

const LOCK = join(process.cwd(), 'content', 'mechanics.lock.json')

interface LockEntry {
  hash: string
  reason: string
  updatedAt: string
}

export interface LockFile {
  version: number
  dialogues: Record<string, LockEntry>
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stable(entry)]),
    )
  }
  return value
}

function mechanics(dialogue: DialogueDef): unknown {
  return {
    scene: dialogue.scene ?? null,
    entries: dialogue.entries ?? [],
    nodes: Object.fromEntries(
      Object.entries(dialogue.nodes).map(([id, node]) => [
        id,
        {
          nextDialogue: node.nextDialogue ?? null,
          choices: node.choices.map((choice) => ({
            id: choice.id ?? null,
            intent: choice.intent ?? null,
            conditions: choice.conditions ?? null,
            effects: choice.effects ?? [],
            next: choice.next ?? null,
            journal: choice.journal ?? null,
          })),
        },
      ]),
    ),
  }
}

function fingerprint(dialogue: DialogueDef): string {
  return createHash('sha256')
    .update(JSON.stringify(stable(mechanics(dialogue))))
    .digest('hex')
    .slice(0, 16)
}

/** Stable hashes for every graph, independent of prose. */
export function fingerprintAll(index: ContentIndex): Record<string, string> {
  const current: Record<string, string> = {}
  for (const dialogue of index.dialogues.values()) current[dialogue.id] = fingerprint(dialogue)
  return current
}

/** The predicate. The CLI and the broken-fixture test both run this function. */
export function guardProblems(
  current: Record<string, string>,
  lock: LockFile,
): string[] {
  const added = Object.keys(current).filter((id) => !lock.dialogues[id])
  const removed = Object.keys(lock.dialogues).filter((id) => !current[id])
  const changed = Object.keys(current).filter(
    (id) => lock.dialogues[id] && lock.dialogues[id].hash !== current[id],
  )

  const problems: string[] = []
  for (const id of added) problems.push(`${id}: no locked mechanics (new graph)`)
  for (const id of removed) problems.push(`${id}: locked graph is gone`)
  for (const id of changed) {
    const previous = lock.dialogues[id]
    problems.push(`${id}: mechanics changed since "${previous?.reason ?? 'unknown'}"`)
  }
  return problems
}

async function main(): Promise<void> {
  const update = process.argv.includes('--update')
  const reasonIndex = process.argv.indexOf('--reason')
  const reason = reasonIndex >= 0 ? process.argv[reasonIndex + 1] : undefined

  const index = await loadContent()
  const current = fingerprintAll(index)

  let lock: LockFile
  try {
    lock = JSON.parse(await readFile(LOCK, 'utf8')) as LockFile
  } catch {
    lock = { version: 1, dialogues: {} }
  }

  const added = Object.keys(current).filter((id) => !lock.dialogues[id])
  const removed = Object.keys(lock.dialogues).filter((id) => !current[id])
  const changed = Object.keys(current).filter(
    (id) => lock.dialogues[id] && lock.dialogues[id].hash !== current[id],
  )

  if (update) {
    if (!reason) {
      process.stderr.write('content:guard: --update needs --reason "why mechanics changed"\n')
      process.exitCode = 1
      return
    }
    const now = new Date().toISOString()
    const note = reason ?? 'unspecified'
    for (const id of Object.keys(current)) {
      if (!lock.dialogues[id] || lock.dialogues[id].hash !== current[id]) {
        lock.dialogues[id] = { hash: current[id] ?? '', reason: note, updatedAt: now }
      }
    }
    for (const id of removed) delete lock.dialogues[id]
    await writeFile(LOCK, `${JSON.stringify(lock, null, 2)}\n`)
    process.stdout.write(
      `content:guard - locked ${added.length} new, ${changed.length} changed, ${removed.length} removed (${reason})\n`,
    )
    return
  }

  const problems = guardProblems(current, lock)

  if (problems.length > 0) {
    for (const problem of problems) process.stdout.write(`content:guard ${problem}\n`)
    process.stdout.write(
      'content:guard - mechanics are frozen; update with --update --reason "<why>"\n',
    )
    process.exitCode = 1
    return
  }
  process.stdout.write(`content:guard - ${Object.keys(current).length} dialogues unchanged\n`)
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
