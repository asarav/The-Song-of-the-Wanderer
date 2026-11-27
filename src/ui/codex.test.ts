import { describe, expect, it } from 'vitest'

import { deriveCodex, type CodexEntryView } from '@engine/journal'
import { createInitialState } from '@engine/state'
import { loadContentIndex } from '@store/content'
import { CODEX_SHELVES, groupCodex } from './codex'

const index = loadContentIndex()

function state() {
  return createInitialState({
    seed: 'codex-001',
    location: 'dest.ugarit',
    money: 20,
    capacity: 20,
    knownDestinations: ['dest.ugarit'],
    knownRoutes: [],
  })
}

function entry(id: string, category: string): CodexEntryView {
  return { id, title: id, text: '', category } as unknown as CodexEntryView
}

describe('codex shelves', () => {
  it('reads the shelves in order and shows only the ones that hold something', () => {
    const groups = groupCodex([entry('b', 'measure'), entry('a', 'place')])

    expect(groups.map((group) => group.id)).toEqual(['place', 'measure'])
    expect(groups[0]?.entries.map((item) => item.id)).toEqual(['a'])
  })

  it('keeps an entry on a shelf the reader does not know', () => {
    const groups = groupCodex([entry('x', 'weather')])

    expect(groups.map((group) => group.label)).toEqual(['Other'])
    expect(groups[0]?.entries.map((item) => item.id)).toEqual(['x'])
  })

  it('puts every authored entry on a named shelf', () => {
    const shelves = new Set(CODEX_SHELVES.map((shelf) => shelf.id))
    const entries = deriveCodex(state(), index)

    expect(entries.length).toBeGreaterThan(0)
    for (const item of entries) expect(shelves.has(item.category), item.id).toBe(true)
  })

  it('has something to read on the shelf of measures', () => {
    const groups = groupCodex(deriveCodex(state(), index))
    const measures = groups.find((group) => group.id === 'measure')

    expect(measures?.entries.length).toBeGreaterThan(0)
  })

  it('glosses silver, weight and the year in measures a reader knows', () => {
    const entries = deriveCodex(state(), index)
    const text = (id: string) => entries.find((item) => item.id === id)?.text ?? ''

    expect(text('codex.shekel')).toMatch(/gram/)
    expect(text('codex.mina')).toMatch(/kilogram/)
    expect(text('codex.year')).toMatch(/365 days/)
  })
})
