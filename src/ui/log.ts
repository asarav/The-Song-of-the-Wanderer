/**
 * The conversation log, arranged by day and searchable.
 *
 * The log keeps everything said since the traveler came ashore, oldest first, and each
 * line already carries the date it was said. A long transcript is easier to scan with a
 * day standing over its own lines than with the date repeated beside every one, and easier
 * to search when the search is over the words rather than the day headings.
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

/** Match a line by its speaker or by any word in what was said. */
export function filterLogLines<T extends { speaker?: string | null; text: string }>(
  lines: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [...lines]

  return lines.filter(
    (line) =>
      (line.speaker ?? '').toLowerCase().includes(needle) ||
      line.text.toLowerCase().includes(needle),
  )
}

/** Every day the log holds, in the order it was first spoken. */
export function logDays(lines: readonly { date: string }[]): string[] {
  return [...new Set(lines.map((line) => line.date))]
}
