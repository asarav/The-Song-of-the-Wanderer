import { describe, expect, it } from 'vitest'

import { beatAt, parseRuns, splitBeats } from './story'

describe('splitBeats', () => {
  const cases: [string, string[]][] = [
    ['one sentence', ['one sentence']],
    ['first beat\n\nsecond beat', ['first beat', 'second beat']],
    ['  padded  \n\n\n\n  also padded  ', ['padded', 'also padded']],
    ['single\nnewline stays', ['single\nnewline stays']],
    ['', ['']],
  ]

  it.each(cases)('splits %j', (text, expected) => {
    expect(splitBeats(text)).toEqual(expected)
  })

  it('is deterministic', () => {
    const text = 'a\n\nb\n\nc'
    expect(splitBeats(text)).toEqual(splitBeats(text))
  })
})

describe('beatAt', () => {
  const beats = ['one', 'two', 'three']
  const cases: [string, number, { current: string; index: number; total: number; done: boolean }][] = [
    ['first beat', 1, { current: 'one', index: 1, total: 3, done: false }],
    ['middle beat', 2, { current: 'two', index: 2, total: 3, done: false }],
    ['last beat', 3, { current: 'three', index: 3, total: 3, done: true }],
    ['a count past the end is clamped', 9, { current: 'three', index: 3, total: 3, done: true }],
    ['a count before the start is clamped', 0, { current: 'one', index: 1, total: 3, done: false }],
  ]

  it.each(cases)('reads %s', (_name, shown, expected) => {
    expect(beatAt(beats, shown)).toEqual(expected)
  })

  it('is finished at once for a single-beat passage', () => {
    expect(beatAt(['only'], 1)).toEqual({ current: 'only', index: 1, total: 1, done: true })
  })

  it('never returns text the passage does not hold', () => {
    expect(beatAt([], 1).current).toBe('')
  })
})

describe('parseRuns', () => {
  const cases: [string, { text: string; bold: boolean }[]][] = [
    ['plain words', [{ text: 'plain words', bold: false }]],
    [
      'the **harbor tax** is two',
      [
        { text: 'the ', bold: false },
        { text: 'harbor tax', bold: true },
        { text: ' is two', bold: false },
      ],
    ],
    ['**all bold**', [{ text: 'all bold', bold: true }]],
    [
      '**one** and **two**',
      [
        { text: 'one', bold: true },
        { text: ' and ', bold: false },
        { text: 'two', bold: true },
      ],
    ],
    ['an unpaired ** stays', [{ text: 'an unpaired ** stays', bold: false }]],
    ['starts **and ends', [{ text: 'starts **and ends', bold: false }]],
  ]

  it.each(cases)('parses %j', (text, expected) => {
    expect(parseRuns(text)).toEqual(expected)
  })

  it('never leaves a paired marker in the rendered runs', () => {
    const runs = parseRuns('a **b** c')
    expect(runs.map((run) => run.text).join('')).toBe('a b c')
  })
})

describe('name tones', () => {
  const terms = { places: ['Ugarit', 'Cyprus', 'Alashiya'], people: ['Hannu', 'Sibtu'] }

  it('tones a place and a person differently and leaves the rest alone', () => {
    const runs = parseRuns('Hannu keeps the gate at Ugarit', terms)
    expect(runs.map((run) => [run.text, run.tone])).toEqual([
      ['Hannu', 'person'],
      [' keeps the gate at ', undefined],
      ['Ugarit', 'place'],
    ])
  })

  it('does not tone a common noun that is written in lower case', () => {
    const runs = parseRuns('the market in ugarit', terms)
    expect(runs).toEqual([{ text: 'the market in ugarit', bold: false }])
  })

  it('leaves a bold name bold and has no tone inside it', () => {
    const runs = parseRuns('**Ugarit** first, then Hannu', terms)
    expect(runs).toEqual([
      { text: 'Ugarit', bold: true },
      { text: ' first, then ', bold: false },
      { text: 'Hannu', bold: false, tone: 'person' },
    ])
  })

  it('does not match a name inside a longer word', () => {
    const runs = parseRuns('the Ugaritic tablet', terms)
    expect(runs).toEqual([{ text: 'the Ugaritic tablet', bold: false }])
  })

  it('reads a possessive as the name it belongs to', () => {
    const runs = parseRuns("Sibtu's loom", terms)
    expect(runs[0]).toEqual({ text: 'Sibtu', bold: false, tone: 'person' })
  })

  it('changes nothing when no names are supplied', () => {
    expect(parseRuns('Hannu at Ugarit')).toEqual([{ text: 'Hannu at Ugarit', bold: false }])
  })

  it('rebuilds the passage exactly, tones or not', () => {
    const text = 'Hannu waits at the gate in Ugarit, and Sibtu does not.'
    expect(parseRuns(text, terms).map((run) => run.text).join('')).toBe(text)
  })
})
