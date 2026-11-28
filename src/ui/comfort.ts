/**
 * Comfort preferences. These are UI settings, never game state: they do not enter the
 * save, the engine, or a replay.
 */

export const TEXT_SIZES = [
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
  { id: 'larger', label: 'Largest' },
] as const

export type TextSize = (typeof TEXT_SIZES)[number]['id']

export const DEFAULT_TEXT_SIZE: TextSize = 'default'
export const TEXT_SIZE_KEY = 'song-of-the-wanderer.text-size.v1'
export const AUDIO_MUTED_KEY = 'song-of-the-wanderer.audio-muted.v1'
export const DEFAULT_AUDIO_MUTED = false

/**
 * Whether proper names are coloured in prose. On by default: it is the interface's quiet
 * way of saying which words are people and which are places. A reader who would rather
 * have plain text turns it off here.
 */
export const NAME_TONE_KEY = 'song-of-the-wanderer.name-tone.v1'
export const DEFAULT_NAME_TONE = true

export function normalizeNameTone(value: unknown): boolean {
  return value === 'off' ? false : DEFAULT_NAME_TONE
}

export function readNameTone(storage?: Pick<Storage, 'getItem'> | null): boolean {
  if (!storage) return DEFAULT_NAME_TONE
  try {
    return normalizeNameTone(storage.getItem(NAME_TONE_KEY))
  } catch {
    return DEFAULT_NAME_TONE
  }
}

export function normalizeTextSize(value: unknown): TextSize {
  return TEXT_SIZES.some((size) => size.id === value)
    ? (value as TextSize)
    : DEFAULT_TEXT_SIZE
}

export function readTextSize(
  storage?: Pick<Storage, 'getItem'> | null,
): TextSize {
  if (!storage) return DEFAULT_TEXT_SIZE
  try {
    return normalizeTextSize(storage.getItem(TEXT_SIZE_KEY))
  } catch {
    return DEFAULT_TEXT_SIZE
  }
}

export function normalizeAudioMuted(value: unknown): boolean {
  return value === 'true'
}

export function readAudioMuted(
  storage?: Pick<Storage, 'getItem'> | null,
): boolean {
  if (!storage) return DEFAULT_AUDIO_MUTED
  try {
    return normalizeAudioMuted(storage.getItem(AUDIO_MUTED_KEY))
  } catch {
    return DEFAULT_AUDIO_MUTED
  }
}
