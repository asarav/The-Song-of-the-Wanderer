import { describe, expect, it } from 'vitest'

import { appendDialogueLog, DIALOGUE_LOG_LIMIT, type DialogueLogEntry } from './dialogueLog'

function line(key: string): DialogueLogEntry {
  return {
    key,
    dialogue: 'dlg.test',
    node: key,
    speaker: 'Tiro',
    text: `Line ${key}`,
    day: 0,
    date: 'Year 1230 BCE · month 1 · day 1',
  }
}

describe('appendDialogueLog', () => {
  it('appends a first line', () => {
    expect(appendDialogueLog([], line('a'))).toEqual([line('a')])
  })

  it('ignores a repeated render of the same node', () => {
    const once = appendDialogueLog([], line('a'))
    expect(appendDialogueLog(once, line('a'))).toBe(once)
  })

  it('keeps a later return to an earlier node', () => {
    const log = appendDialogueLog(appendDialogueLog([], line('a')), line('b'))
    expect(appendDialogueLog(log, line('a')).map((entry) => entry.key)).toEqual(['a', 'b', 'a'])
  })

  it('caps the log at the oldest-removed limit', () => {
    let log: DialogueLogEntry[] = []
    for (let index = 0; index < DIALOGUE_LOG_LIMIT + 3; index += 1) {
      log = appendDialogueLog(log, line(`n${index}`))
    }
    expect(log).toHaveLength(DIALOGUE_LOG_LIMIT)
    expect(log[0]?.key).toBe('n3')
    expect(log[log.length - 1]?.key).toBe(`n${DIALOGUE_LOG_LIMIT + 2}`)
  })

  it('is deterministic for the same sequence', () => {
    const run = () => appendDialogueLog(appendDialogueLog([], line('a')), line('b'))
    expect(run()).toEqual(run())
  })
})
