import { describe, expect, it } from 'vitest'

import { reduce } from '../src/engine/kernel'
import { createInitialState } from '../src/engine/state'
import { loadContent, loadScenario, reportScenario } from './simulate'
import { formatTrace, runScenario } from '../src/engine/testing'

const scenarios = [
  'slice-ada-tin',
  'slice-cargo-hold',
  'slice-crossing',
  'slice-cyprus-counter',
  'slice-cyprus-return',
  'slice-day-save',
  'slice-palace-errand',
  'slice-palace-seal',
  'slice-recurring',
  'slice-refugee',
  'slice-sibtu-kept',
  'slice-sibtu-news',
  'slice-sibtu-paid',
  'slice-ugarit-day',
]

describe('authored scenarios', () => {
  it.each(scenarios)('%s passes against the authored content', async (id) => {
    const index = await loadContent()
    const scenario = await loadScenario(id)
    const result = runScenario(scenario, index)

    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('crosses to Cyprus and lands mid-slice', async () => {
    const index = await loadContent()
    const result = runScenario(await loadScenario('slice-crossing'), index)

    expect(result.finalState.player.location).toBe('dest.cyprus')
    expect(result.finalState.knowledge.knownDestinations).toContain('dest.cyprus')
  })

  it('prints a trace that names every command', async () => {
    const index = await loadContent()
    const trace = formatTrace(runScenario(await loadScenario('slice-crossing'), index))

    expect(trace).toContain('scenario scenario.slice.crossing (seed "slice-001") — ok')
    expect(trace).toContain('travel')
  })
})

describe('the day-and-save fixture scenario', () => {
  it('covers time, a trade, a save step and a travel start in one file', async () => {
    const index = await loadContent()
    const scenario = await loadScenario('slice-day-save')
    const result = runScenario(scenario, index)

    expect(scenario.id).toBe('scenario.slice.day-and-save')
    expect(result.ok).toBe(true)
    expect(result.steps.map((step) => step.kind)).toEqual([
      'command',
      'command',
      'command',
      'command',
      'command',
      'save',
      'command',
    ])
    const commands = result.steps.map((step) => step.command?.type ?? step.kind)
    expect(commands).toEqual([
      'chooseChoice',
      'chooseChoice',
      'chooseChoice',
      'advanceTime',
      'buy',
      'save',
      'travel',
    ])
    expect(result.steps.every((step) => step.accepted)).toBe(true)
    expect(result.steps[6]?.eventTypes).toContain('JourneyStarted')
  })

  it('prints the whole run, one line per step', async () => {
    const index = await loadContent()
    const result = runScenario(await loadScenario('slice-day-save'), index)
    const lines = formatTrace(result).split('\n')

    expect(lines).toHaveLength(result.steps.length + 1)
    for (const step of result.steps) {
      expect(lines.some((line) => line.includes(`${step.index}. `))).toBe(true)
    }
  })

  it('moves a help answer to the acknowledgement the player reads', async () => {
    const index = await loadContent()
    const cases = [
      {
        dialogue: 'dlg.cyprus.tiro',
        choiceId: 'ask-what-he-needs',
        location: 'dest.cyprus',
        acknowledgement: 'That is the favor.',
      },
      {
        dialogue: 'dlg.ugarit.yada.archive',
        choiceId: 'take-the-other-handle',
        location: 'dest.ugarit',
        acknowledgement: 'That is the whole of the test.',
      },
    ]

    for (const entry of cases) {
      const state = createInitialState({ seed: `ack-${entry.dialogue}`, location: entry.location })
      state.narrative.pending = { kind: 'dialogue', dialogue: entry.dialogue, node: 'greet' }

      const result = reduce(
        state,
        {
          type: 'chooseChoice',
          choiceId: entry.choiceId,
          dialogue: entry.dialogue,
          node: 'greet',
        },
        index,
      )

      expect(result.rejected).toBeUndefined()
      expect(result.state.narrative.pending?.node).toBe('thanks')
      expect(
        result.events.some(
          ({ event }) =>
            event.type === 'DialoguePresented' &&
            event.dialogue === entry.dialogue &&
            event.node === 'thanks',
        ),
      ).toBe(true)
      expect(index.dialogues.get(entry.dialogue)?.nodes.thanks?.text).toContain(
        entry.acknowledgement,
      )
    }
  })

  it('prints the same record as JSON for tooling', async () => {
    const index = await loadContent()
    const result = runScenario(await loadScenario('slice-day-save'), index)
    const record = JSON.parse(reportScenario(result, true)) as {
      id: string
      ok: boolean
      steps: { kind: string }[]
      failures: unknown[]
    }

    expect(record.id).toBe('scenario.slice.day-and-save')
    expect(record.ok).toBe(true)
    expect(record.failures).toEqual([])
    expect(record.steps.map((step) => step.kind)).toContain('save')
  })
})
