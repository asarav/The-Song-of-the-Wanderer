/**
 * Boundary contract for the `rng` module (M1-T03).
 *
 * Imports only the module's public surface, as every other module must. The milestone's
 * promises are that a stream is one plain number inside the save, that drawing is pure,
 * that the named streams never interfere, and that a stored snapshot replays exactly.
 */

import { describe, expect, it } from 'vitest'

import {
  RNG_STREAMS,
  RngCursor,
  createRngState,
  hashString,
  seedStream,
  stepUint32,
  type RngStream,
} from '@engine/rng'

describe('rng module public surface', () => {
  it('exposes seven named streams and the helpers', () => {
    expect(RNG_STREAMS).toEqual(['market', 'encounters', 'travel', 'hazard', 'flavour', 'narrative', 'tests'])
    for (const helper of [createRngState, hashString, seedStream, stepUint32]) {
      expect(typeof helper).toBe('function')
    }
    expect(typeof RngCursor).toBe('function')
  })

  it('seeds every stream to a positive 32-bit integer from the save seed', () => {
    const state = createRngState('contract-001')

    for (const stream of RNG_STREAMS) {
      expect(state[stream]).toBe(seedStream('contract-001', stream))
      expect(Number.isInteger(state[stream])).toBe(true)
      expect(state[stream]).toBeGreaterThan(0)
      expect(state[stream]).toBeLessThanOrEqual(0xffffffff)
    }
    expect(new Set(RNG_STREAMS.map((stream) => state[stream])).size).toBe(RNG_STREAMS.length)
  })

  it('stores the streams as a plain record that survives a save', () => {
    const state = createRngState('contract-001')
    const cursor = new RngCursor(state)
    cursor.nextInt('market', 1, 6)
    const snapshot = cursor.snapshot()

    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
    expect(Object.getPrototypeOf(snapshot)).toBe(Object.prototype)
  })

  it('replays a run from the stored snapshot alone', () => {
    const first = new RngCursor(createRngState('contract-001'))
    const saved = first.snapshot()
    const resumed = new RngCursor(JSON.parse(JSON.stringify(saved)) as typeof saved)

    expect(resumed.nextUint32('travel')).toBe(first.nextUint32('travel'))
    expect(resumed.snapshot()).toEqual(first.snapshot())
  })

  it('keeps the input state untouched and independent', () => {
    const state = createRngState('contract-001')
    const before = JSON.stringify(state)
    const cursor = new RngCursor(state)

    for (const stream of RNG_STREAMS) cursor.nextFloat(stream)

    expect(JSON.stringify(state)).toBe(before)
    expect(cursor.snapshot()).not.toEqual(state)
  })

  it('refuses a bad range and weightless lists without throwing or drawing', () => {
    const state = createRngState('contract-001')
    const cursor = new RngCursor(state)

    expect(() => cursor.nextInt('travel', 5, 1)).toThrow(RangeError)
    expect(cursor.pick('flavour', [])).toBeUndefined()
    expect(cursor.weightedPick('narrative', [{ value: 'x', weight: 0 }])).toBeUndefined()
    expect(cursor.snapshot()).toEqual(state)
  })

  it('draws inside the requested range and probability', () => {
    const cursor = new RngCursor(createRngState('contract-001'))

    for (let draw = 0; draw < 50; draw += 1) {
      const value = cursor.nextInt('travel', 3, 7)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(7)

      const float = cursor.nextFloat('market')
      expect(float).toBeGreaterThanOrEqual(0)
      expect(float).toBeLessThan(1)
    }
  })

  it('draws only from the stream it is asked for', () => {
    const seeded = createRngState('contract-001')
    const cursor = new RngCursor(seeded)
    cursor.nextUint32('encounters')

    const after = cursor.snapshot()
    const moved = RNG_STREAMS.filter((stream: RngStream) => after[stream] !== seeded[stream])

    expect(moved).toEqual(['encounters'])
  })
})
