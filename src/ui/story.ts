/**
 * Story presentation helpers.
 *
 * Authored prose is a plain string. Two conventions are read here and nowhere else:
 * a blank line separates **beats** (the reader advances through them one at a time),
 * and `**double asterisks**` mark a key word to set in bold. Both are presentation
 * only — the engine never sees them, and neither is stored in a save.
 */

export type NameTone = 'place' | 'person'

export interface TextRun {
  text: string
  bold: boolean
  /** Set when the run is an authored proper name; the interface colours it. */
  tone?: NameTone
}

/** Proper names the prose is toned by, split into the two things a reader tracks. */
export interface NameTerms {
  places: readonly string[]
  people: readonly string[]
}

/**
 * Stable keys for "this passage has been read this session". A scene and the same line
 * in the conversation log share a key, so a transcript does not pace what was just read.
 */
export const passageKey = {
  place: (id: string) => `place:${id}`,
  scene: (dialogue: string, node: string) => `scene:${dialogue}:${node}`,
  journal: (id: string) => `journal:${id}`,
  codex: (id: string) => `codex:${id}`,
} as const

/** Split authored prose into the beats a reader advances through. */
export { splitBeats } from '@engine/text/beats'

/**
 * The beat a reader is on. `shown` is how many beats have been revealed; the result is
 * clamped, so a passage of one beat is finished as soon as it opens and a stale count
 * cannot point past the end.
 */
export function beatAt(
  beats: readonly string[],
  shown: number,
): { current: string; index: number; total: number; done: boolean } {
  const total = Math.max(1, beats.length)
  const index = Math.min(Math.max(1, Math.round(shown)), total)
  return {
    current: beats[index - 1] ?? '',
    index,
    total,
    done: index >= total,
  }
}

/**
 * Split a beat into plain and bold runs, and — when the caller passes the names the prose
 * uses — mark the proper names so the interface can colour places and people apart. An
 * unpaired `**` is left on screen as typed rather than swallowing the rest of the passage.
 */
export function parseRuns(text: string, terms?: NameTerms): TextRun[] {
  const runs = parseEmphasis(text)
  if (!terms) return runs
  const matcher = nameMatcher(terms)
  if (!matcher) return runs
  return runs.flatMap((run) => (run.bold ? [run] : toneRun(run, matcher)))
}

function parseEmphasis(text: string): TextRun[] {
  const parts = text.split('**')
  if (parts.length === 1) return [{ text, bold: false }]

  const runs: TextRun[] = []
  const unpaired = (parts.length - 1) % 2 === 1

  for (let index = 0; index < parts.length; index += 1) {
    const piece = parts[index] ?? ''
    if (unpaired && index === parts.length - 1) {
      const previous = runs[runs.length - 1]
      if (previous) previous.text += `**${piece}`
      else runs.push({ text: `**${piece}`, bold: false })
      break
    }
    if (piece.length === 0) continue
    runs.push({ text: piece, bold: index % 2 === 1 })
  }

  return runs.length > 0 ? runs : [{ text, bold: false }]
}

interface Matcher {
  pattern: RegExp
  tone: Map<string, NameTone>
}

function escapePattern(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * One pass over both name lists, longest first, so "Kinyras" cannot be read as a shorter
 * name and a name inside a longer word is never matched.
 */
function nameMatcher(terms: NameTerms): Matcher | null {
  const entries: { name: string; tone: NameTone }[] = [
    ...terms.places.map((name) => ({ name, tone: 'place' as NameTone })),
    ...terms.people.map((name) => ({ name, tone: 'person' as NameTone })),
  ].filter((entry) => entry.name.trim().length > 1)

  if (entries.length === 0) return null

  const ordered = [...entries].sort((a, b) => b.name.length - a.name.length)
  const tone = new Map(ordered.map((entry) => [entry.name, entry.tone]))
  const alternatives = ordered.map((entry) => escapePattern(entry.name)).join('|')

  return { pattern: new RegExp(`\\b(${alternatives})\\b`, 'gu'), tone }
}

/** Split a plain run on the names it mentions, leaving every other character as typed. */
function toneRun(run: TextRun, matcher: Matcher): TextRun[] {
  const runs: TextRun[] = []
  let cursor = 0

  matcher.pattern.lastIndex = 0
  for (let match = matcher.pattern.exec(run.text); match; match = matcher.pattern.exec(run.text)) {
    const start = match.index
    if (start > cursor) runs.push({ text: run.text.slice(cursor, start), bold: false })
    const tone = matcher.tone.get(match[0])
    runs.push(tone ? { text: match[0], bold: false, tone } : { text: match[0], bold: false })
    cursor = start + match[0].length
  }

  if (cursor < run.text.length) runs.push({ text: run.text.slice(cursor), bold: false })
  return runs.length > 0 ? runs : [run]
}
