/**
 * The journal index.
 *
 * A long journal is a list before it is a text: the reader wants the entry about the
 * cloth, not every entry in order. Filtering is presentation over entries the engine has
 * already granted — it never decides what the traveler wrote, only what is shown.
 */

import type { JournalEntryView } from '@engine/journal'

/** Match a journal entry by its title or by a word in its text, case and padding aside. */
export function filterJournalEntries(
  entries: readonly JournalEntryView[],
  query: string,
): JournalEntryView[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [...entries]

  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(needle) || entry.text.toLowerCase().includes(needle),
  )
}
