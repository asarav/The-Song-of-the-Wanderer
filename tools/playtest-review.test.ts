import { describe, expect, it } from 'vitest'

import { createInitialState } from '../src/engine/state'
import type { ScenarioResult, ScenarioStep } from '../src/engine/testing'
import { testContent } from '../src/engine/testing'
import { analyseRun, contentFindings, toneOf } from './playtest-review'

function step(
  overrides: Partial<ScenarioStep> & Pick<ScenarioStep, 'index' | 'kind'>,
): ScenarioStep {
  return {
    accepted: true,
    eventTypes: [],
    events: [],
    ...overrides,
  }
}

describe('automated playtest review', () => {
  it('counts tone markers without claiming a verdict', () => {
    expect(toneOf('A warm hand, salt wind, and a sharp silence.').warm).toBe(2)
    expect(toneOf('A warm hand, salt wind, and a sharp silence.').tense).toBe(2)
    expect(toneOf('A warm hand, salt wind, and a sharp silence.').sensory).toBe(2)
  })

  it('finds repeated scenes, records quiet regard as accepted, and surfaces real failures', () => {
    const index = testContent()
    const state = createInitialState({ seed: 'review-001', location: 'dest.ugarit' })
    const finalState = {
      ...state,
      narrative: {
        ...state.narrative,
        promises: [
          {
            id: 'promise.review',
            character: 'char.ugarit.amnit',
            kind: 'promise' as const,
            owedBy: 'player' as const,
            text: 'Bring the cloth back.',
            openedDay: 1,
            status: 'open' as const,
          },
        ],
      },
    }

    const presented = {
      type: 'DialoguePresented' as const,
      dialogue: 'dlg.ugarit.amnit.meeting',
      node: 'greet',
    }
    const result: ScenarioResult = {
      id: 'scenario.review',
      seed: 'review-001',
      ok: false,
      failures: [{ path: 'player.money', message: 'expected 9, found 10' }],
      steps: [
        step({
          index: 0,
          kind: 'command',
          command: {
            type: 'chooseChoice',
            choiceId: 'declare',
            dialogue: 'dlg.test.arrival',
            node: 'gate',
          },
          events: [
            presented,
            {
              type: 'RelationshipChanged',
              character: 'char.ugarit.amnit',
              dimension: 'trust',
              delta: 1,
              value: 1,
            },
          ],
          eventTypes: ['DialoguePresented', 'RelationshipChanged'],
        }),
        step({
          index: 1,
          kind: 'command',
          command: { type: 'talkTo', character: 'char.ugarit.amnit' },
          accepted: false,
          reason: 'A scene is already open.',
        }),
        step({
          index: 2,
          kind: 'command',
          command: { type: 'talkTo', character: 'char.ugarit.amnit' },
          events: [presented],
          eventTypes: ['DialoguePresented'],
        }),
      ],
      finalState,
    }

    const review = analyseRun(result, index)
    expect(review.rejected).toHaveLength(1)
    expect(review.repeatedScenes).toContainEqual({
      key: 'dlg.ugarit.amnit.meeting:greet',
      count: 2,
    })
    expect(review.findings.some((finding) => finding.title === 'Scenario assertion failed')).toBe(
      true,
    )
    expect(
      review.acceptedObservations.some(
        (observation) => observation.title === 'Below-band regard moves are intentionally quiet',
      ),
    ).toBe(true)
    expect(
      review.findings.some(
        (finding) => finding.title === 'Relationship moved without a regard-band change',
      ),
    ).toBe(false)
    expect(
      review.acceptedObservations.some(
        (observation) => observation.title === 'Open promise is a live thread, not a defect',
      ),
    ).toBe(true)
    expect(review.findings.some((finding) => finding.title === 'Action rejected')).toBe(true)
  })

  it('flags a conditional answer without an unavailable note', () => {
    const findings = contentFindings(testContent())
    expect(
      findings.some(
        (finding) =>
          finding.title === 'Unavailable answer has no player-facing reason' &&
          finding.where.includes('dlg.ugarit.amnit.meeting:laughs'),
      ),
    ).toBe(true)
  })
})
