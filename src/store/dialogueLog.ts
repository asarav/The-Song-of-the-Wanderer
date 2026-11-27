/**
 * The session's dialogue log.
 *
 * Comfort feature, not simulation: it records what was actually shown on screen so a
 * reader can look back at a line they clicked past. It is deliberately ephemeral — a
 * reload starts a fresh log, and nothing here enters the save format.
 */

export interface DialogueLogEntry {
  /** `dialogue:node`, used to ignore React's repeated render of the same node. */
  key: string
  dialogue: string
  node: string
  speaker: string | null
  text: string
  day: number
  date: string
}

export const DIALOGUE_LOG_LIMIT = 80

export function appendDialogueLog(
  log: DialogueLogEntry[],
  entry: DialogueLogEntry,
  limit = DIALOGUE_LOG_LIMIT,
): DialogueLogEntry[] {
  if (log[log.length - 1]?.key === entry.key) return log
  const kept = log.length >= limit ? log.slice(log.length - limit + 1) : log
  return [...kept, entry]
}
