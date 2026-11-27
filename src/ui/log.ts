/**
 * The conversation log, arranged by day.
 *
 * The log keeps everything said since the traveler came ashore, oldest first, and each
 * line already carries the date it was said. A long transcript is easier to scan with a
 * day standing over its own lines than with the date repeated beside every one.
 */

export interface LogDay<T> {
  date: string
  lines: T[]
}

/**
 * Split the log into its days, keeping the order. Only neighboring lines share a heading:
 * a day that comes back later starts a new one rather than pulling lines across the gap.
 */
export function groupLogByDay<T extends { date: string }>(lines: readonly T[]): LogDay<T>[] {
  const days: LogDay<T>[] = []

  for (const line of lines) {
    const last = days[days.length - 1]
    if (last && last.date === line.date) last.lines.push(line)
    else days.push({ date: line.date, lines: [line] })
  }

  return days
}
