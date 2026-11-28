import { describe, expect, it } from 'vitest'

import { loadContentIndex } from '@store/content'

import { artFor } from './art'
import { BEAT_ART_BACKLOG } from './beatArtBacklog'
import { splitBeats } from './story'

/**
 * Every paced paragraph is a beat. A beat may borrow its passage's picture only while it
 * is named in the legacy ledger; a new beat cannot enter without a plate of its own.
 */
const index = loadContentIndex()

interface Passage {
  key: string
  text: string
  beatArt?: readonly string[]
}

function passages(): Passage[] {
  const rows: Passage[] = []

  for (const dialogue of index.dialogues.values()) {
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      const key = `dialogue:${dialogue.id}:${nodeId}`
      rows.push({ key, text: node.text, beatArt: node.beatArt })
      for (const [language, variants] of Object.entries(node.textByLanguage ?? {})) {
        for (const [tier, text] of Object.entries(variants)) {
          rows.push({
            key: `${key}:language:${language}:${tier}`,
            text,
            beatArt: node.beatArt,
          })
        }
      }
    }
  }

  for (const destination of index.destinations.values()) {
    rows.push({
      key: `place:${destination.id}`,
      text: destination.intro,
      beatArt: destination.beatArt,
    })
    if (destination.night) {
      rows.push({
        key: `night:${destination.id}`,
        text: destination.night.text,
        beatArt: destination.night.beatArt,
      })
    }
  }

  for (const entry of index.journal.values()) {
    rows.push({ key: `journal:${entry.id}`, text: entry.text, beatArt: entry.beatArt })
  }
  for (const entry of index.codex.values()) {
    rows.push({ key: `codex:${entry.id}`, text: entry.text, beatArt: entry.beatArt })
  }
  for (const entry of index.ambient.values()) {
    rows.push({ key: `ambient:${entry.id}`, text: entry.text, beatArt: entry.beatArt })
  }

  return rows
}

const beats = passages().flatMap((passage) =>
  splitBeats(passage.text).map((text, beat) => ({
    key: `${passage.key}:${beat + 1}`,
    passage: passage.key,
    art: passage.beatArt?.[beat],
    text,
  })),
)

describe('beat art', () => {
  it('gives every beat a plate, except the counted legacy backlog', () => {
    const missing = beats
      .filter((beat) => !beat.art && !BEAT_ART_BACKLOG.has(beat.key))
      .map((beat) => beat.key)
    expect(missing).toEqual([])
  })

  it('never lets the legacy debt grow', () => {
    expect(BEAT_ART_BACKLOG.size).toBeLessThanOrEqual(257)
  })

  it('keeps the backlog honest: no key may be stale or illustrated', () => {
    const byKey = new Map(beats.map((beat) => [beat.key, beat]))
    const stale = [...BEAT_ART_BACKLOG].filter((key) => {
      const beat = byKey.get(key)
      return !beat || Boolean(beat.art)
    })
    expect(stale).toEqual([])
  })

  it('resolves every authored beat picture', () => {
    for (const beat of beats) {
      if (beat.art) expect(artFor(beat.art), `${beat.key} -> ${beat.art}`).not.toBeNull()
    }
  })

  it('never repeats a picture within one passage', () => {
    for (const passage of passages()) {
      if (!passage.beatArt) continue
      expect(passage.beatArt.length, `${passage.key} has the wrong number of plates`).toBe(
        splitBeats(passage.text).length,
      )
      expect(
        new Set(passage.beatArt).size,
        `${passage.key} repeats a beat picture`,
      ).toBe(passage.beatArt.length)
    }
  })

  it('illustrates both starting places beat by beat', () => {
    for (const id of ['dest.ugarit', 'dest.cyprus']) {
      const destination = index.destinations.get(id)
      expect(destination?.beatArt, `${id} has no beat plates`).toBeDefined()
      expect(destination?.beatArt?.length).toBe(splitBeats(destination?.intro ?? '').length)
      expect(new Set(destination?.beatArt).size).toBe(destination?.beatArt?.length)
    }
  })

  it('illustrates all ten beats of the opening', () => {
    const opening = beats.filter(
      (beat) =>
        beat.key.startsWith('dialogue:dlg.slice.opening:') &&
        !beat.key.includes(':language:'),
    )
    expect(opening).toHaveLength(10)
    expect(opening.every((beat) => Boolean(beat.art))).toBe(true)
    expect(new Set(opening.map((beat) => beat.art)).size).toBe(opening.length)
    expect(opening.map((beat) => beat.art)).toEqual([
      'art.opening.unloading',
      'art.opening.oil',
      'art.ugarit.high',
      'art.ugarit.yada',
      'art.ugarit.palace-gate',
      'art.ugarit.market',
      'art.ugarit.mole',
      'art.ugarit.night',
      'art.ugarit.hannu',
      'art.good.palace-seal',
    ])
  })
})
