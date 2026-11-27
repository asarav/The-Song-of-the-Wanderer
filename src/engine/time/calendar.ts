/**
 * The day-count calendar.
 *
 * Day 0 is 1230-01-01 (`docs/design/00-timeline.md`). One year is 365 days: twelve
 * thirty-day months plus five epagomenal days, the Egyptian civil pattern. There is no
 * leap day and no `Date` anywhere — a save is replayed by counting days.
 *
 * The display year **descends** while the day count ascends: day 365 is 1229-01-01.
 * Every comparison in the DSL uses the day count, never the display year.
 */

import type { Day } from '../kernel'

/** The calendar's opening year. Game time moves forward as this number decreases. */
export const START_YEAR_BCE = 1230

export const DAYS_PER_YEAR = 365

/**
 * Twelve thirty-day months followed by the five epagomenal days, which the calendar
 * treats as a short thirteenth month. Index 0 is month 1.
 */
export const MONTH_LENGTHS = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5] as const

export const MONTHS_PER_YEAR = MONTH_LENGTHS.length

export interface GameDate {
  /** Display year in BCE. Descends as game time advances. */
  readonly year: number
  /** 1-based month, 1..13. Month 13 holds the five epagomenal days. */
  readonly month: number
  /** 1-based day within the month. */
  readonly dayOfMonth: number
  /** 0-based day within the year, 0..364. */
  readonly dayOfYear: number
}

/** Cumulative day offset of each month within a year. */
const MONTH_OFFSETS: readonly number[] = MONTH_LENGTHS.reduce<number[]>((acc, _length, i) => {
  acc.push(i === 0 ? 0 : (acc[i - 1] as number) + (MONTH_LENGTHS[i - 1] as number))
  return acc
}, [])

export function monthLength(month: number): number {
  const length = MONTH_LENGTHS[month - 1]
  if (length === undefined) {
    throw new RangeError(`Month ${month} does not exist; months are 1..${MONTHS_PER_YEAR}.`)
  }
  return length
}

function assertDayNumber(day: number): void {
  if (!Number.isInteger(day) || day < 0) {
    throw new RangeError(`Day must be a non-negative integer, received ${String(day)}.`)
  }
}

/** Convert a day count into a readable date. Pure arithmetic. */
export function dayToDate(day: number): GameDate {
  assertDayNumber(day)
  const yearOffset = Math.floor(day / DAYS_PER_YEAR)
  const dayOfYear = day % DAYS_PER_YEAR

  let month = 1
  let remaining = dayOfYear
  while (month < MONTHS_PER_YEAR && remaining >= monthLength(month)) {
    remaining -= monthLength(month)
    month += 1
  }

  return {
    year: START_YEAR_BCE - yearOffset,
    month,
    dayOfMonth: remaining + 1,
    dayOfYear,
  }
}

/**
 * Convert a date to a day count. Years later than the opening year are rejected: the
 * game never runs before 1230 BCE.
 */
export function dateToDay(year: number, month: number, dayOfMonth: number): number {
  if (!Number.isInteger(year) || year > START_YEAR_BCE) {
    throw new RangeError(`Year ${String(year)} is before the game's start (${START_YEAR_BCE} BCE).`)
  }
  if (!Number.isInteger(month) || month < 1 || month > MONTHS_PER_YEAR) {
    throw new RangeError(`Month must be an integer in 1..${MONTHS_PER_YEAR}.`)
  }
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > monthLength(month)) {
    throw new RangeError(`Day ${String(dayOfMonth)} does not exist in month ${month}.`)
  }

  const yearOffset = START_YEAR_BCE - year
  return yearOffset * DAYS_PER_YEAR + (MONTH_OFFSETS[month - 1] as number) + (dayOfMonth - 1)
}

const DATE_PATTERN = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/

/** Parse `1230-04-01`. Returns `null` for anything that is not a real game date. */
export function tryParseDate(value: string): number | null {
  const match = DATE_PATTERN.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const dayOfMonth = Number(match[3])
  try {
    return dateToDay(year, month, dayOfMonth)
  } catch {
    return null
  }
}

export function parseDate(value: string): number {
  const day = tryParseDate(value)
  if (day === null) {
    throw new RangeError(`"${value}" is not a valid game date (expected YYYY-MM-DD).`)
  }
  return day
}

export function isGameDate(value: string): boolean {
  return tryParseDate(value) !== null
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** Stable machine format, `1230-04-01`. Used in saves, scenarios, and tests. */
export function formatDate(day: number): string {
  const date = dayToDate(day)
  return `${String(date.year).padStart(4, '0')}-${pad2(date.month)}-${pad2(date.dayOfMonth)}`
}

/** Human-readable date for the interface. Locale-free by design. */
export function formatDisplayDate(day: number): string {
  const date = dayToDate(day)
  const monthLabel = date.month === MONTHS_PER_YEAR ? 'the five days' : `month ${date.month}`
  return `Year ${date.year} BCE · ${monthLabel} · day ${date.dayOfMonth}`
}

/** Days remaining in the current year after today, used to describe seasonal rules. */
export function daysUntilYearEnd(day: number): number {
  const { dayOfYear } = dayToDate(day)
  return DAYS_PER_YEAR - 1 - dayOfYear
}

/** A calendar day count expressed as the engine's branded `Day`. */
export function asCalendarDay(day: number): Day {
  return day as Day
}
