/**
 * The codex index, arranged by shelf.
 *
 * Content decides which shelf an entry sits on (`category` in the entry schema); this
 * table decides the order a reader meets the shelves in and what each one is called.
 * Presentation only: no entry is hidden or reordered by knowledge here — the engine has
 * already decided which entries the traveler has.
 */

import type { CodexEntryView } from '@engine/journal'

export interface CodexShelf {
  id: string
  label: string
}

/** Reading order. A shelf with no entries is not shown. */
export const CODEX_SHELVES: readonly CodexShelf[] = [
  { id: 'place', label: 'Places' },
  { id: 'people', label: 'Peoples and names' },
  { id: 'language', label: 'Languages' },
  { id: 'road', label: 'Roads and the sea' },
  { id: 'measure', label: 'Money and measure' },
] as const

export interface CodexGroup extends CodexShelf {
  entries: CodexEntryView[]
}

/**
 * Group the index by shelf. An entry on a shelf this table does not name is kept, under
 * `Other`, so a new category in content can never make an entry disappear from the
 * reader's index.
 */
export function groupCodex(entries: readonly CodexEntryView[]): CodexGroup[] {
  const groups: CodexGroup[] = CODEX_SHELVES.map((shelf) => ({
    ...shelf,
    entries: entries.filter((entry) => entry.category === shelf.id),
  })).filter((group) => group.entries.length > 0)

  const named = new Set<string>(CODEX_SHELVES.map((shelf) => shelf.id))
  const rest = entries.filter((entry) => !named.has(entry.category))
  if (rest.length > 0) groups.push({ id: 'other', label: 'Other', entries: rest })

  return groups
}
