import { describe, expect, it } from 'vitest'

import {
  AUDIO_MUTED_KEY,
  DEFAULT_AUDIO_MUTED,
  DEFAULT_TEXT_SIZE,
  normalizeAudioMuted,
  normalizeTextSize,
  readAudioMuted,
  readTextSize,
  TEXT_SIZE_KEY,
} from './comfort'

function storage(value: string | null) {
  return { getItem: (key: string) => (key === TEXT_SIZE_KEY ? value : null) }
}

function audioStorage(value: string | null) {
  return { getItem: (key: string) => (key === AUDIO_MUTED_KEY ? value : null) }
}

describe('text size preference', () => {
  it.each([
    ['default', 'default'],
    ['large', 'large'],
    ['larger', 'larger'],
    ['huge', 'default'],
    [null, 'default'],
    ['', 'default'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeTextSize(input)).toBe(expected)
  })

  it('reads a stored size and falls back when there is none', () => {
    expect(readTextSize(storage('large'))).toBe('large')
    expect(readTextSize(storage(null))).toBe(DEFAULT_TEXT_SIZE)
    expect(readTextSize(null)).toBe(DEFAULT_TEXT_SIZE)
  })

  it('survives a blocked storage', () => {
    expect(
      readTextSize({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toBe(DEFAULT_TEXT_SIZE)
  })
})

describe('audio mute preference', () => {
  it.each([
    ['true', true],
    ['false', false],
    ['1', false],
    [null, false],
    ['', false],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeAudioMuted(input)).toBe(expected)
  })

  it('reads a stored mute and falls back when there is none', () => {
    expect(readAudioMuted(audioStorage('true'))).toBe(true)
    expect(readAudioMuted(audioStorage('false'))).toBe(false)
    expect(readAudioMuted(audioStorage(null))).toBe(DEFAULT_AUDIO_MUTED)
    expect(readAudioMuted(null)).toBe(DEFAULT_AUDIO_MUTED)
  })

  it('survives a blocked storage', () => {
    expect(
      readAudioMuted({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toBe(DEFAULT_AUDIO_MUTED)
  })
})
