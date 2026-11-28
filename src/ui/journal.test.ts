import { describe, expect, it } from 'vitest'

import { filterJournalEntries } from './journal'

const entry = (id: string, title: string, text: string) => ({ id, title, text })

const entries = [
  entry('journal.a', 'A price agreed', 'Kinyras buys grain at the yard price and sells copper.'),
  entry('journal.b', "Sibtu's household", 'She weaves and has three more pairs of hands.'),
  entry('journal.c', 'The gate’s errand', 'The palace wants a seal carried to Cyprus.'),
]

describe('journal index filter', () => {
  it('keeps every entry in order when nothing is asked', () => {
    expect(filterJournalEntries(entries, '')).toEqual(entries)
    expect(filterJournalEntries(entries, '   ')).toEqual(entries)
  })

  it('finds an entry by its title', () => {
    expect(filterJournalEntries(entries, 'price').map((item) => item.id)).toEqual(['journal.a'])
  })

  it('finds an entry by a word inside it', () => {
    expect(filterJournalEntries(entries, 'hands').map((item) => item.id)).toEqual(['journal.b'])
  })

  it('ignores case and padding', () => {
    expect(filterJournalEntries(entries, '  CYPRUS ').map((item) => item.id)).toEqual(['journal.c'])
  })

  it('keeps the newest-first order the engine gave', () => {
    expect(filterJournalEntries(entries, 'e').map((item) => item.id)).toEqual([
      'journal.a',
      'journal.b',
      'journal.c',
    ])
  })

  it('has nothing to show when nothing matches', () => {
    expect(filterJournalEntries(entries, 'elephant')).toEqual([])
  })
})
