import { describe, expect, it } from 'vitest'

import { cloneState, createInitialState } from '../state'
import { testContent } from '../testing'
import { deriveDayReport } from './day'

const index = testContent()

function game() {
  return createInitialState({
    seed: 'day-report-001',
    location: 'dest.ugarit',
    money: 40,
    capacity: 20,
  })
}

function nextDay(state: ReturnType<typeof game>) {
  return { ...cloneState(state), calendar: { ...state.calendar, day: state.calendar.day + 1 } }
}

describe('deriveDayReport', () => {
  it('says nothing when no days pass or the body is clear', () => {
    const before = game()
    expect(deriveDayReport(before, before, index)).toBeNull()
    expect(deriveDayReport(before, nextDay(before), index)).toBeNull()
  })

  it('carries a lingering condition into the next day', () => {
    const before = game()
    before.player.afflictions = [{ id: 'aff.fever', sinceDay: 2 }]

    const report = deriveDayReport(before, nextDay(before), index)

    expect(report).toEqual({
      trend: 'same',
      headline: 'You are no better and no worse.',
      conditions: [
        {
          id: 'aff.fever',
          name: 'Fever',
          severity: 'grave',
          trend: 'lingering',
          text: 'The fever stays.',
        },
      ],
    })
  })

  it('marks a new condition as worse and a treated one as better', () => {
    const before = game()
    before.player.afflictions = [{ id: 'aff.thirst', sinceDay: 1 }]

    const cleared = nextDay(before)
    cleared.player.afflictions = []
    expect(deriveDayReport(before, cleared, index)).toMatchObject({
      trend: 'better',
      conditions: [{ id: 'aff.thirst', trend: 'lifted', text: 'The thirst lifts.' }],
    })

    const worsened = nextDay(before)
    worsened.player.afflictions = [
      { id: 'aff.thirst', sinceDay: 1 },
      { id: 'aff.poison', sinceDay: 3 },
    ]
    expect(deriveDayReport(before, worsened, index)).toMatchObject({
      trend: 'worse',
      conditions: [
        { id: 'aff.thirst', trend: 'lingering' },
        { id: 'aff.poison', trend: 'new', text: 'The poison arrives.' },
      ],
    })
  })

  it('reports a mixed day when one condition lifts and another arrives', () => {
    const before = game()
    before.player.afflictions = [{ id: 'aff.thirst', sinceDay: 1 }]
    const after = nextDay(before)
    after.player.afflictions = [{ id: 'aff.wound', sinceDay: 4 }]

    expect(deriveDayReport(before, after, index)).toMatchObject({
      trend: 'mixed',
      conditions: [
        { id: 'aff.wound', trend: 'new' },
        { id: 'aff.thirst', trend: 'lifted' },
      ],
    })
  })
})
