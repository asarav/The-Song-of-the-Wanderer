/**
 * The daily condition report: what the player's body is doing as the calendar moves.
 *
 * This is a derived view, not a new clock or a hidden meter. It compares the afflictions
 * before and after a command and says what is new, what is still there and what has lifted.
 * The same condition never changes severity on its own; "worse" means a condition arrived,
 * not that an untreated one silently ticked down.
 */

import type { ContentIndex } from '../content'
import type { GameState } from '../state'

export type DayConditionTrend = 'new' | 'lingering' | 'lifted'
export type DayReportTrend = 'better' | 'worse' | 'mixed' | 'same'

export interface DayConditionLine {
  id: string
  name: string
  severity: 'light' | 'grave'
  trend: DayConditionTrend
  text: string
}

export interface DayReport {
  trend: DayReportTrend
  headline: string
  conditions: DayConditionLine[]
}

const HEADLINES: Record<DayReportTrend, string> = {
  better: 'The worst of it has eased.',
  worse: 'Something new has taken hold.',
  mixed: 'The day is a mix of ease and trouble.',
  same: 'You are no better and no worse.',
}

export function deriveDayReport(
  before: GameState,
  after: GameState,
  index: ContentIndex,
): DayReport | null {
  if (after.calendar.day <= before.calendar.day) return null

  const was = new Map(before.player.afflictions.map((entry) => [entry.id, entry]))
  const is = new Map(after.player.afflictions.map((entry) => [entry.id, entry]))
  const conditions: DayConditionLine[] = []

  for (const entry of after.player.afflictions) {
    const definition = index.afflictions.get(entry.id)
    const name = definition?.name ?? entry.id
    const trend: DayConditionTrend = was.has(entry.id) ? 'lingering' : 'new'
    conditions.push({
      id: entry.id,
      name,
      severity: definition?.severity ?? 'light',
      trend,
      text:
        trend === 'new'
          ? (definition?.onset ?? `${name} has taken hold.`)
          : (definition?.daily ?? `${name} is still with you.`),
    })
  }

  for (const entry of before.player.afflictions) {
    if (is.has(entry.id)) continue
    const definition = index.afflictions.get(entry.id)
    const name = definition?.name ?? entry.id
    conditions.push({
      id: entry.id,
      name,
      severity: definition?.severity ?? 'light',
      trend: 'lifted',
      text: definition?.recovery ?? `${name} has lifted.`,
    })
  }

  if (conditions.length === 0) return null

  const arrived = conditions.some((line) => line.trend === 'new')
  const lifted = conditions.some((line) => line.trend === 'lifted')
  const trend: DayReportTrend =
    arrived && lifted ? 'mixed' : arrived ? 'worse' : lifted ? 'better' : 'same'

  return { trend, headline: HEADLINES[trend], conditions }
}
