import { describe, expect, it } from 'vitest'

import { groupLogByDay } from './log'

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
