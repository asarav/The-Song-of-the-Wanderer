/**
 * Price check.
 *
 * A node that names a price must charge, pay or exchange that amount in the same node.
 * This is how "says five, charges four" becomes a failed check instead of a playtest
 * finding. Deliberate exceptions live in `tools/price-allowlist.json` with a reason.
 *
 * Usage: `pnpm price:check [--json]`
 */

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ContentIndex } from '../src/engine/content'
import { loadContent } from './simulate'

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
}

export interface PriceAllowance {
  place: string
  reason: string
}

export interface PriceFinding {
  entity: string
  node: string
  message: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function amountsIn(text: string): { value: number; written: string }[] {
  const found: { value: number; written: string }[] = []
  for (const match of text.matchAll(/\b(\d+|[a-z]+)\s+shekels?\b/gi)) {
    const raw = (match[1] ?? '').toLowerCase()
    const value = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw]
    if (value !== undefined) found.push({ value, written: match[0] })
  }
  return found
}

function moneyIn(effects: unknown): number[] {
  if (!Array.isArray(effects)) return []
  return effects.flatMap((effect) =>
    isObject(effect) && typeof effect.money === 'number' ? [effect.money] : [],
  )
}

/** The predicate. The CLI and the broken-fixture test both run this function. */
export function checkPrices(index: ContentIndex, allowances: PriceAllowance[]): PriceFinding[] {
  const allowed = new Map(allowances.map((entry) => [entry.place, entry.reason]))
  const findings: PriceFinding[] = []

  for (const dialogue of index.dialogues.values()) {
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      const place = `${dialogue.id}:${nodeId}`
      const texts = [
        node.text,
        ...Object.values(node.textByLanguage ?? {}).flatMap((variants) =>
          Object.values(variants),
        ),
        ...node.choices.map((choice) => choice.text),
      ]
      const prices = texts.flatMap(amountsIn)
      if (prices.length === 0) continue
      if (allowed.has(place)) continue

      const money = node.choices.flatMap((choice) => moneyIn(choice.effects))
      // A unit price is honest if the node moves a whole multiple of it (six jars at
      // four shekels moves twenty-four). A price with no multiple is the bug.
      const unmatched = prices.filter(
        (price) =>
          !money.some(
            (amount) => Math.abs(amount) === price.value || Math.abs(amount) % price.value === 0,
          ),
      )
      if (unmatched.length > 0) {
        const named = [...new Set(unmatched.map((price) => price.written))].join(', ')
        findings.push({
          entity: dialogue.id,
          node: nodeId,
          message: `names ${named} but the node moves ${money.length > 0 ? money.join(', ') : 'no money'}`,
        })
      }
    }
  }

  return findings
}

async function main(): Promise<void> {
  const json = process.argv.includes('--json')
  const index = await loadContent()
  const allowances = JSON.parse(
    await readFile(join(process.cwd(), 'tools', 'price-allowlist.json'), 'utf8'),
  ) as PriceAllowance[]
  const findings = checkPrices(index, allowances)

  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: findings.length === 0, findings }, null, 2)}\n`)
  } else {
    for (const finding of findings) {
      process.stdout.write(`price:check ${finding.entity}:${finding.node}: ${finding.message}\n`)
    }
    process.stdout.write(
      `price:check - ${findings.length} errors, ${allowances.length} allowlisted\n`,
    )
  }
  if (findings.length > 0) process.exitCode = 1
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
