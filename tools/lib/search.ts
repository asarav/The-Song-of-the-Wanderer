/** Shared file search for the retrieval tools. No dependencies. */

import type { Dirent } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const TEXT_ROOTS = ['src/content', 'docs', 'src/engine/scenarios', 'content']
const SKIP = new Set(['node_modules', '.git', 'dist', 'coverage'])

export interface Hit {
  file: string
  line: number
  text: string
}

async function filesUnder(root: string): Promise<string[]> {
  const out: string[] = []
  let entries: Dirent<string>[]
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue
    const path = join(root, entry.name)
    if (entry.isDirectory()) out.push(...(await filesUnder(path)))
    else if (/\.(json|md|ts|css)$/.test(entry.name)) out.push(path)
  }
  return out
}

export async function corpus(root = process.cwd()): Promise<{ file: string; text: string }[]> {
  const files = (await Promise.all(TEXT_ROOTS.map((dir) => filesUnder(join(root, dir))))).flat()
  const rows: { file: string; text: string }[] = []
  for (const file of files) {
    try {
      rows.push({ file: relative(root, file).replaceAll('\\', '/'), text: await readFile(file, 'utf8') })
    } catch {
      // A file can disappear between listing and reading; the search simply skips it.
    }
  }
  return rows
}

/** Case-insensitive literal search. Every term must appear on the same line. */
export async function search(terms: string[], root = process.cwd()): Promise<Hit[]> {
  const needles = terms.map((term) => term.toLowerCase()).filter(Boolean)
  if (needles.length === 0) return []
  const hits: Hit[] = []
  for (const { file, text } of await corpus(root)) {
    text.split('\n').forEach((line, index) => {
      const lower = line.toLowerCase()
      if (needles.every((needle) => lower.includes(needle))) {
        hits.push({ file, line: index + 1, text: line.trim().slice(0, 240) })
      }
    })
  }
  return hits
}

export function formatHits(hits: Hit[], limit = 80): string {
  return hits
    .slice(0, limit)
    .map((hit) => `${hit.file}:${hit.line}: ${hit.text}`)
    .join('\n')
}
