/**
 * Passage → beat art ledger. Shows missing plates, stale keys, and whether the debt shrank.
 *
 * Usage: `pnpm art:ledger`
 */

import { readFile } from 'node:fs/promises'

import { splitBeats } from '../src/engine/text/beats'
import { loadContent } from './simulate'

interface Beat {
  key: string
  art?: string
}

async function main(): Promise<void> {
  const source = await readFile('src/ui/beatArtBacklog.ts', 'utf8')
  const backlog = new Set([...source.matchAll(/^\s*"([^"]+)",$/gm)].map((match) => match[1] ?? ''))

  const index = await loadContent()
  const beats: Beat[] = []
  const push = (key: string, text: string, art?: readonly string[]): void => {
    splitBeats(text).forEach((_, beat) => {
      beats.push({ key: `${key}:${beat + 1}`, art: art?.[beat] })
    })
  }

  for (const dialogue of index.dialogues.values()) {
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      const key = `dialogue:${dialogue.id}:${nodeId}`
      push(key, node.text, node.beatArt)
      for (const [language, variants] of Object.entries(node.textByLanguage ?? {})) {
        for (const [tier, text] of Object.entries(variants)) {
          push(`${key}:language:${language}:${tier}`, text, node.beatArt)
        }
      }
    }
  }
  for (const destination of index.destinations.values()) {
    push(`place:${destination.id}`, destination.intro, destination.beatArt)
    if (destination.night) {
      push(`night:${destination.id}`, destination.night.text, destination.night.beatArt)
    }
  }
  for (const entry of index.journal.values()) push(`journal:${entry.id}`, entry.text, entry.beatArt)
  for (const entry of index.codex.values()) push(`codex:${entry.id}`, entry.text, entry.beatArt)
  for (const entry of index.ambient.values()) push(`ambient:${entry.id}`, entry.text, entry.beatArt)

  const missing = beats.filter((beat) => !beat.art && !backlog.has(beat.key))
  const byKey = new Map(beats.map((beat) => [beat.key, beat]))
  const stale = [...backlog].filter((key) => !byKey.has(key) || Boolean(byKey.get(key)?.art))

  for (const beat of missing) process.stdout.write(`art:ledger missing ${beat.key}\n`)
  for (const key of stale) process.stdout.write(`art:ledger stale ${key}\n`)

  const debtByPool = new Map<string, number>()
  for (const key of backlog) {
    const pool = key.split(':')[0] ?? 'unknown'
    debtByPool.set(pool, (debtByPool.get(pool) ?? 0) + 1)
  }
  for (const [pool, count] of [...debtByPool].sort((a, b) => a[0].localeCompare(b[0]))) {
    process.stdout.write(`art:ledger debt ${pool} ${count}\n`)
  }

  // The ledger's documented ceiling; `beatArt.test.ts` enforces the same number.
  const cap = 257

  process.stdout.write(
    `art:ledger - ${beats.length} beats, ${missing.length} missing, ${stale.length} stale, debt ${backlog.size} (cap ${cap})\n`,
  )
  if (missing.length > 0 || stale.length > 0) process.exitCode = 1
}

void main()
