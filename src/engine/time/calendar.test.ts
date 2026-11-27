import { describe, expect, it } from 'vitest'

import { advanceDays } from './advance'
import {
  DAYS_PER_YEAR,
  MONTHS_PER_YEAR,
  MONTH_LENGTHS,
  dateToDay,
  dayToDate,
  daysUntilYearEnd,
  formatDate,
  formatDisplayDate,
  isGameDate,
  monthLength,
  parseDate,
  tryParseDate,
} from './calendar'
import { createInitialState } from '../state'
import type { GameState } from '../state'

describe('calendar', () => {
  it('opens on 1230-01-01', () => {
    expect(dayToDate(0)).toEqual({ year: 1230, month: 1, dayOfMonth: 1, dayOfYear: 0 })
    expect(formatDate(0)).toBe('1230-01-01')
  })

  it('uses twelve thirty-day months and five epagomenal days', () => {
    expect(MONTHS_PER_YEAR).toBe(13)
    expect(MONTH_LENGTHS.reduce((sum, length) => sum + length, 0)).toBe(DAYS_PER_YEAR)
    expect(monthLength(13)).toBe(5)
  })

  it.each([
    [0, '1230-01-01'],
    [29, '1230-01-30'],
    [30, '1230-02-01'],
    [89, '1230-03-30'],
    [90, '1230-04-01'],
    [359, '1230-12-30'],
    [360, '1230-13-01'],
    [364, '1230-13-05'],
    [365, '1229-01-01'],
    [730, '1228-01-01'],
  ])('formats day %i as %s', (day, expected) => {
    expect(formatDate(day)).toBe(expected)
  })

  it('advancing a full year lands on the same month and day, one year later', () => {
    for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
      const before = dayToDate(day)
      const after = dayToDate(day + DAYS_PER_YEAR)
      expect(after.month).toBe(before.month)
      expect(after.dayOfMonth).toBe(before.dayOfMonth)
      expect(after.year).toBe(before.year - 1)
    }
  })

  it('round-trips every date in two years', () => {
    for (let day = 0; day < DAYS_PER_YEAR * 2; day += 1) {
      const date = dayToDate(day)
      expect(dateToDay(date.year, date.month, date.dayOfMonth)).toBe(day)
    }
  })

  it('descends the display year while the day count ascends', () => {
    expect(dayToDate(0).year).toBeGreaterThan(dayToDate(DAYS_PER_YEAR).year)
  })

  it('rejects impossible dates instead of guessing', () => {
    expect(tryParseDate('1230-13-06')).toBeNull()
    expect(tryParseDate('1230-00-01')).toBeNull()
    expect(tryParseDate('1230-14-01')).toBeNull()
    expect(tryParseDate('1231-01-01')).toBeNull()
    expect(tryParseDate('not a date')).toBeNull()
    expect(tryParseDate('1230-04-01')).toBe(90)
    expect(isGameDate('1229-13-05')).toBe(true)
  })

  it('parses and formats symmetrically', () => {
    for (const value of ['1230-01-01', '1230-13-05', '1229-06-15', '1100-12-30']) {
      expect(formatDate(parseDate(value))).toBe(value)
    }
    expect(() => parseDate('1230-13-06')).toThrow(RangeError)
  })

  it('renders a locale-free display date', () => {
    expect(formatDisplayDate(90)).toBe('Year 1230 BCE · month 4 · day 1')
    expect(formatDisplayDate(360)).toBe('Year 1230 BCE · the five days · day 1')
  })

  it('counts the days left in the year', () => {
    expect(daysUntilYearEnd(0)).toBe(364)
    expect(daysUntilYearEnd(364)).toBe(0)
  })
})

describe('advanceDays', () => {
  const base: GameState = createInitialState({ seed: 'clock', location: 'dest.ugarit' })

  it('moves the calendar forward and leaves the input untouched', () => {
    const next = advanceDays(base, 7)
    expect(next.calendar.day).toBe(7)
    expect(base.calendar.day).toBe(0)
    expect(next).not.toBe(base)
  })

  it('returns the same state for zero days', () => {
    expect(advanceDays(base, 0)).toBe(base)
  })

  it('refuses to run time backwards', () => {
    expect(() => advanceDays(base, -1)).toThrow(RangeError)
    expect(() => advanceDays(base, 1.5)).toThrow(RangeError)
  })

  const dated = createInitialState({ seed: 'clock', location: 'dest.ugarit', day: 90 })

  it('advances a year from any date to the same month and day', () => {
    const later = advanceDays(dated, DAYS_PER_YEAR)
    expect(later.calendar.day).toBe(90 + DAYS_PER_YEAR)
    expect(formatDate(later.calendar.day)).toBe('1229-04-01')
  })

  it('is associative: one long step equals several short ones', () => {
    const oneStep = advanceDays(dated, DAYS_PER_YEAR)
    const manySteps = advanceDays(advanceDays(advanceDays(dated, 100), 200), 65)
    expect(JSON.stringify(manySteps)).toBe(JSON.stringify(oneStep))
  })

  it('does not touch the state it was given', () => {
    const before = JSON.stringify(dated)
    advanceDays(dated, 30)
    expect(JSON.stringify(dated)).toBe(before)
  })
})

/**
 * Table-driven rejections: the calendar refuses days and dates that never existed instead
 * of guessing a near neighbour, and every refusal is a `RangeError` with a reason.
 */
describe('calendar rejections', () => {
  const rejections: { name: string; run: () => unknown }[] = [
    { name: 'a negative day count', run: () => dayToDate(-1) },
    { name: 'a fractional day count', run: () => dayToDate(1.5) },
    { name: 'a day count that is not a number', run: () => dayToDate(Number.NaN) },
    { name: 'month zero', run: () => monthLength(0) },
    { name: 'a fourteenth month', run: () => monthLength(MONTHS_PER_YEAR + 1) },
    { name: 'a year before the opening year', run: () => dateToDay(1231, 1, 1) },
    { name: 'a fractional year', run: () => dateToDay(1230.5, 1, 1) },
    { name: 'month zero in a date', run: () => dateToDay(1230, 0, 1) },
    { name: 'a day past the end of the month', run: () => dateToDay(1230, 2, 31) },
    { name: 'a sixth epagomenal day', run: () => dateToDay(1230, 13, 6) },
    { name: 'day zero of a month', run: () => dateToDay(1230, 1, 0) },
    { name: 'a malformed date string', run: () => parseDate('1230-4') },
    { name: 'an impossible date string', run: () => parseDate('1230-13-06') },
  ]

  function capture(run: () => unknown): unknown {
    try {
      run()
    } catch (error) {
      return error
    }
    return null
  }

  it.each(rejections)('rejects $name with a reason', ({ run }) => {
    const error = capture(run)
    expect(error).toBeInstanceOf(RangeError)
    expect((error as Error).message.trim()).not.toBe('')
  })

  it.each(['', '   ', '1230-4', '1230-02-31', '1231-01-01', '1230-13-06', 'yesterday'])(
    'returns null, without throwing, for %j',
    (value) => {
      expect(tryParseDate(value)).toBeNull()
      expect(isGameDate(value)).toBe(false)
    },
  )
})

/**
 * The year boundary as a golden vector (plan: "calendar year boundary"). Format, display
 * text and remaining days are pinned together, so a table edit that shifts one cannot
 * leave the other two silently wrong.
 */
describe('the year boundary (golden vector)', () => {
  const golden: [number, string, string, number][] = [
    [358, '1230-12-29', 'Year 1230 BCE · month 12 · day 29', 6],
    [359, '1230-12-30', 'Year 1230 BCE · month 12 · day 30', 5],
    [360, '1230-13-01', 'Year 1230 BCE · the five days · day 1', 4],
    [363, '1230-13-04', 'Year 1230 BCE · the five days · day 4', 1],
    [364, '1230-13-05', 'Year 1230 BCE · the five days · day 5', 0],
    [365, '1229-01-01', 'Year 1229 BCE · month 1 · day 1', 364],
    [366, '1229-01-02', 'Year 1229 BCE · month 1 · day 2', 363],
    [730, '1228-01-01', 'Year 1228 BCE · month 1 · day 1', 364],
    [3650, '1220-01-01', 'Year 1220 BCE · month 1 · day 1', 364],
  ]

  it.each(golden)('day %i is %s', (day, expected, display, remaining) => {
    expect(formatDate(day)).toBe(expected)
    expect(formatDisplayDate(day)).toBe(display)
    expect(daysUntilYearEnd(day)).toBe(remaining)
    expect(parseDate(expected)).toBe(day)
  })
})
