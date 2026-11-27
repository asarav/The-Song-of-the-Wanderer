/**
 * Story presentation helpers.
 *
 * Authored prose is a plain string. Two conventions are read here and nowhere else:
 * a blank line separates **beats** (the reader advances through them one at a time),
 * and `**double asterisks**` mark a key word to set in bold. Both are presentation
 * only — the engine never sees them, and neither is stored in a save.
 */

export interface TextRun {
  text: string
  bold: boolean
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
export function splitBeats(text: string): string[] {
  const beats = text
    .split(/\n{2,}/)
    .map((beat) => beat.trim())
    .filter((beat) => beat.length > 0)
  return beats.length > 0 ? beats : [text]
}

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
 * Split a beat into plain and bold runs. An unpaired `**` is left on screen as typed
 * rather than swallowing the rest of the passage.
 */
export function parseRuns(text: string): TextRun[] {
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
