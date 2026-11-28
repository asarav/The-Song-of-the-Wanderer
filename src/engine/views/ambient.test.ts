import { describe, expect, it } from 'vitest'

import { createInitialState } from '../state'
import { testContent } from '../testing'
import { deriveAmbient } from './ambient'

const index = testContent()

function stateAt(day: number, location = 'dest.ugarit') {
  const state = createInitialState({ seed: 'ambient-view-001', location, money: 40, capacity: 20 })
  state.calendar.day = day
  return state
}

describe('deriveAmbient', () => {
  it('chooses a day observation for the cultures present', () => {
    const view = deriveAmbient(stateAt(0), index, 'day')
    expect(view?.context).toBe('day')
    expect(view?.text.length).toBeGreaterThan(0)
    expect(view?.beatArt).toHaveLength(1)
  })

  it('is deterministic for the same state and changes with the day', () => {
    const state = stateAt(3)
    expect(deriveAmbient(state, index, 'day')).toEqual(deriveAmbient(state, index, 'day'))
    const first = deriveAmbient(stateAt(3), index, 'day')?.id
    const second = deriveAmbient(stateAt(4), index, 'day')?.id
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(second).not.toBe(first)
  })

  it('avoids repeating the previous day\'s tag when another observation exists', () => {
    const first = deriveAmbient(stateAt(3), index, 'day')
    const second = deriveAmbient(stateAt(4), index, 'day')
    expect(first?.tags.some((tag) => second?.tags.includes(tag))).toBe(false)
  })

  it('returns the night copy in the night context', () => {
    expect(deriveAmbient(stateAt(0), index, 'night')?.id).toBe('ambient.test.levant.night')
  })

  it('uses the route cultures and scope while travelling', () => {
    const state = stateAt(2, 'route.ugarit-cyprus')
    expect(deriveAmbient(state, index, 'travel')?.id).toBe('ambient.test.travel')
  })

  it('returns null when conditions fail or no culture matches', () => {
    const local = testContent()
    for (const entry of local.ambient.values()) {
      if (entry.context === 'day') entry.conditions = { flag: 'ambient.never' }
    }
    expect(deriveAmbient(stateAt(0), local, 'day')).toBeNull()

    const foreign = testContent()
    const foreignEntry = foreign.ambient.get('ambient.test.travel')
    if (!foreignEntry) throw new Error('travel fixture missing')
    foreignEntry.cultures = ['culture.nowhere']
    expect(deriveAmbient(stateAt(0), foreign, 'travel')).toBeNull()
  })
})
