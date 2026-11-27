import { describe, expect, it } from 'vitest'

import { testContent } from '../testing'
import { newGame } from './newGame'

const index = testContent()

const base = {
  seed: 'new-game-001',
  location: 'dest.ugarit',
  money: 40,
  languages: { 'lang.akkadian': { xp: 25, tier: 'basic' as const } },
}

describe('newGame', () => {
  it('opens on the starting destination, not on a scene-less map', () => {
    const result = newGame(base, index)
    expect(result.state.narrative.pending).toMatchObject({
      kind: 'dialogue',
      dialogue: 'dlg.test.arrival',
    })
    expect(result.events.map((entry) => entry.event.type)).toContain('DialoguePresented')
    expect(result.state.player.location).toBe('dest.ugarit')
  })

  it('numbers its events and leaves the sequence counter consistent', () => {
    const result = newGame(base, index)
    expect(result.events[0]?.sequence).toBe(1)
    expect(result.state.meta.eventSequence).toBe(result.events.length)
  })

  it('is deterministic for the same input', () => {
    expect(JSON.stringify(newGame(base, index).state)).toBe(
      JSON.stringify(newGame(base, index).state),
    )
  })

  it('does nothing extra when the destination has no arrival event', () => {
    const result = newGame({ ...base, location: 'dest.cyprus' }, index)
    expect(result.state.narrative.pending).toBeNull()
    expect(result.events).toEqual([])
  })

  it('stores the chosen road and defaults to the measured journey', () => {
    expect(newGame(base, index).state.meta.difficulty).toBe('wanderer')
    expect(newGame({ ...base, difficulty: 'gentle' }, index).state.meta.difficulty).toBe(
      'gentle',
    )
  })

  it('applies the road starting purse and reserve when none are supplied', () => {
    const gentle = newGame(
      { seed: 'new-game-gentle', location: 'dest.ugarit', difficulty: 'gentle' },
      index,
    )
    const perilous = newGame(
      { seed: 'new-game-perilous', location: 'dest.ugarit', difficulty: 'perilous' },
      index,
    )

    expect([gentle.state.player.money, gentle.state.player.stamina]).toEqual([60, 8])
    expect([perilous.state.player.money, perilous.state.player.stamina]).toEqual([24, 6])
  })
})
