/**
 * Paced prose beats.
 *
 * A blank line separates beats. The engine owns the rule so the content schema can reject
 * a beat-count mismatch at parse time, and the interface re-exports it for reading.
 */

export function splitBeats(text: string): string[] {
  const beats = text
    .split(/\n{2,}/)
    .map((beat) => beat.trim())
    .filter((beat) => beat.length > 0)
  return beats.length > 0 ? beats : [text]
}
