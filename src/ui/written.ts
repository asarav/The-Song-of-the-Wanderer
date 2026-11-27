/**
 * Words the interface shows in their own script, with the reading a player can pronounce.
 *
 * Presentation only: the engine stores transliterations, and nothing here is a
 * reconstruction. A word appears only when its spelling in that script is attested; an
 * invented name stays transliterated, because a guessed spelling would be a historical
 * claim the game cannot support. Sources live in the matching codex entry's provenance.
 */

export interface WrittenWord {
  /** The word as it is written in its own script. */
  script: string
  /** The letters the rest of the interface uses for the same word. */
  reading: string
}

export const WRITTEN_WORDS = {
  /** Linear B e-ma-a₂, on PY Tn 316. */
  'name.aegean.ema-a2': { script: '𐀁𐀔𐀀', reading: 'e-ma-a₂' },
  /** The city's name in Ugaritic alphabetic cuneiform, ugrt. */
  'dest.ugarit': { script: '𐎜𐎂𐎗𐎚', reading: 'ugrt' },
} as const satisfies Record<string, WrittenWord>

export function writtenFor(id: string | undefined): WrittenWord | undefined {
  if (!id) return undefined
  return (WRITTEN_WORDS as Record<string, WrittenWord>)[id]
}

/** The protagonist's name reaches the interface as a display string, so look it up by that. */
export function writtenForDisplay(display: string): WrittenWord | undefined {
  return display === WRITTEN_WORDS['name.aegean.ema-a2'].reading
    ? WRITTEN_WORDS['name.aegean.ema-a2']
    : undefined
}
