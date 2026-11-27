/**
 * Boundary contract for the `time` module (M1-T02).
 *
 * Imports only the module's public surface, as every other module must. The point is the
 * milestone's promises, not the internal arithmetic: one year is 365 days, converting a
 * date to a day count and back is exact, nothing outside the calendar can make time run
 * backwards, and every refusal is a `RangeError` rather than a wrong date.
 */

import { describe, expect, it } from 'vitest'

import { createInitialState, deepFreeze } from '@engine/state'
import {
  DAYS_PER_YEAR,
  MONTHS_PER_YEAR,
  MONTH_LENGTHS,
  START_YEAR_BCE,
  advanceDays,
  asCalendarDay,
  dateToDay,
  dayToDate,
  daysUntilYearEnd,
  formatDate,
  formatDisplayDate,
  isGameDate,
  monthLength,
  parseDate,
  tryParseDate,
} from '@engine/time'

const state = () => createInitialState({ seed: 'contract-clock', location: 'dest.ugarit' })

describe('time module public surface', () => {
  it('exposes the calendar functions', () => {
    for (const fn of [
      advanceDays,
      asCalendarDay,
      dateToDay,
      dayToDate,
      daysUntilYearEnd,
      formatDate,
      formatDisplayDate,
      isGameDate,
      monthLength,
      parseDate,
      tryParseDate,
    ]) {
      expect(typeof fn).toBe('function')
    }
  })

  it('fixes the year in one table', () => {
    expect(START_YEAR_BCE).toBe(1230)
    expect(DAYS_PER_YEAR).toBe(365)
    expect(MONTHS_PER_YEAR).toBe(MONTH_LENGTHS.length)
    expect(MONTH_LENGTHS.reduce((sum, length) => sum + length, 0)).toBe(DAYS_PER_YEAR)
    expect(monthLength(MONTHS_PER_YEAR)).toBe(DAYS_PER_YEAR - 30 * (MONTHS_PER_YEAR - 1))
  })

  it('opens on 1230-01-01 and lands a year later on the same month and day', () => {
    expect(formatDate(0)).toBe('1230-01-01')

    for (const day of [0, 1, 90, 180, 359, 360, 364]) {
      const before = dayToDate(day)
      const after = dayToDate(day + DAYS_PER_YEAR)
      expect([after.month, after.dayOfMonth]).toEqual([before.month, before.dayOfMonth])
      expect(after.year).toBe(before.year - 1)
    }
  })

  it('round-trips dates through the display and machine formats', () => {
    for (const value of ['1230-01-01', '1230-06-15', '1230-13-05', '1229-01-01', '1200-12-30']) {
      expect(parseDate(value)).toBe(dateToDay(...toTriple(value)))
      expect(formatDate(parseDate(value))).toBe(value)
      expect(isGameDate(value)).toBe(true)
    }
  })

  it('refuses junk with a RangeError instead of a wrong day', () => {
    for (const run of [
      () => dayToDate(-1),
      () => monthLength(0),
      () => dateToDay(1231, 1, 1),
      () => dateToDay(1230, 2, 31),
      () => parseDate('1230-13-06'),
    ]) {
      expect(run).toThrow(RangeError)
    }
    expect(tryParseDate('1230-13-06')).toBeNull()
  })

  it('moves time only forward, and never mutates the state it is given', () => {
    const frozen = deepFreeze(state())
    const later = advanceDays(frozen, 30)

    expect(later.calendar.day).toBe(30)
    expect(frozen.calendar.day).toBe(0)
    expect(formatDate(later.calendar.day)).toBe('1230-02-01')
    expect(() => advanceDays(frozen, -1)).toThrow(RangeError)
  })

  it('keeps the state valid after a year of commanded time', () => {
    const yearLater = advanceDays(state(), DAYS_PER_YEAR)
    expect(dayToDate(yearLater.calendar.day).dayOfYear).toBe(0)
    expect(daysUntilYearEnd(yearLater.calendar.day)).toBe(DAYS_PER_YEAR - 1)
    expect(formatDisplayDate(yearLater.calendar.day)).toBe('Year 1229 BCE · month 1 · day 1')
  })

  it('brands a plain day count for kernel callers', () => {
    expect(asCalendarDay(90)).toBe(90)
  })
})

/** Split `1230-04-01` back into the numbers `dateToDay` takes. */
function toTriple(value: string): [number, number, number] {
  const [year, month, dayOfMonth] = value.split('-').map(Number)
  return [year as number, month as number, dayOfMonth as number]
}
