import { describe, expect, it } from 'vitest'

import { filterLogLines, groupLogByDay, logDays } from './log'

const line = (date: string, key: string) => ({ date, key })

describe('conversation log by day', () => {
  it('puts one heading over the lines said on the same day, in order', () => {
    expect(groupLogByDay([line('d1', 'a'), line('d1', 'b'), line('d2', 'c')])).toEqual([
      { date: 'd1', lines: [line('d1', 'a'), line('d1', 'b')] },
      { date: 'd2', lines: [line('d2', 'c')] },
    ])
  })

  it('starts a new heading when a day comes back later', () => {
    const days = groupLogByDay([line('d1', 'a'), line('d2', 'b'), line('d1', 'c')])

    expect(days.map((day) => day.date)).toEqual(['d1', 'd2', 'd1'])
  })

  it('has nothing to show for an empty log', () => {
    expect(groupLogByDay([])).toEqual([])
  })
})

describe('conversation log search', () => {
  const said = [
    { date: 'd1', speaker: 'Hannu', text: 'the market is up the hill' },
    { date: 'd2', speaker: 'Shipti', text: 'the yard is honest and the harbor is not' },
  ]

  it('keeps the transcript in order when nothing is asked', () => {
    expect(filterLogLines(said, '')).toEqual(said)
  })

  it('finds a line by its speaker', () => {
    expect(filterLogLines(said, 'shipti')).toEqual([said[1]])
  })

  it('finds a line by a word that was said', () => {
    expect(filterLogLines(said, 'harbor')).toEqual([said[1]])
  })

  it('treats a missing speaker as nobody rather than crashing', () => {
    expect(filterLogLines([{ date: 'd1', text: 'narration only' }], 'hannu')).toEqual([])
  })

  it('lists each day once, in the order it was first spoken', () => {
    expect(logDays([{ date: 'd1' }, { date: 'd2' }, { date: 'd1' }])).toEqual(['d1', 'd2'])
  })
})
