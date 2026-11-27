import { describe, expect, it } from 'vitest'

import {
  RNG_STREAMS,
  RngCursor,
  createRngState,
  hashString,
  seedStream,
  stepUint32,
} from './streams'

/** Golden vectors. If these change, every existing save replays differently. */
const GOLDEN_SEED_STREAMS = {
  market: 2326580907,
  encounters: 3073485461,
  travel: 2579648691,
  hazard: 3623226559,
  flavour: 3019475632,
  narrative: 3262522267,
  tests: 2861073032,
}

describe('rng streams', () => {
  it('declares seven independent streams', () => {
    expect(RNG_STREAMS).toEqual([
      'market',
      'encounters',
      'travel',
      'hazard',
      'flavour',
      'narrative',
      'tests',
    ])
  })

  it('derives the same stream states from the same seed', () => {
    expect(createRngState('slice-001')).toEqual(GOLDEN_SEED_STREAMS)
  })

  it('gives different seeds different streams', () => {
    expect(createRngState('slice-002')).not.toEqual(createRngState('slice-001'))
    expect(seedStream('a', 'market')).not.toBe(seedStream('b', 'market'))
  })

  it('hashes deterministically and never returns zero', () => {
    expect(hashString('')).toBe(0x811c9dc5)
    expect(hashString('market')).toBe(hashString('market'))
    for (const stream of RNG_STREAMS) {
      expect(seedStream('seed', stream)).toBeGreaterThan(0)
    }
  })

  it('produces a fixed sequence for a fixed seed', () => {
    const cursor = new RngCursor(createRngState('slice-001'))
    expect(Array.from({ length: 5 }, () => cursor.nextUint32('market'))).toEqual([
      3171356669, 2984480064, 1502002621, 3497135747, 1733759769,
    ])

    const encounters = new RngCursor(createRngState('slice-001'))
    expect(Array.from({ length: 3 }, () => encounters.nextFloat('encounters'))).toEqual([
      0.30538004194386303, 0.9033452093135566, 0.24002311006188393,
    ])
  })

  it('keeps streams independent: drawing from one cannot move another', () => {
    const state = createRngState('slice-001')
    const untouched = new RngCursor(state)
    const firstEncounter = untouched.nextFloat('encounters')

    const noisy = new RngCursor(state)
    for (let i = 0; i < 50; i += 1) noisy.nextUint32('market')
    expect(noisy.nextFloat('encounters')).toBe(firstEncounter)
  })

  it('never mutates the state it was given', () => {
    const state = createRngState('slice-001')
    const copy = { ...state }
    const cursor = new RngCursor(state)
    cursor.nextUint32('market')
    cursor.nextUint32('travel')
    expect(state).toEqual(copy)
    expect(cursor.snapshot().market).not.toBe(copy.market)
  })

  it('draws integers inside the inclusive range', () => {
    const cursor = new RngCursor(createRngState('slice-001'))
    expect(Array.from({ length: 5 }, () => cursor.nextInt('travel', 1, 6))).toEqual([
      4, 2, 5, 2, 2,
    ])
    expect(() => cursor.nextInt('travel', 5, 1)).toThrow(RangeError)
  })

  it('picks by weight and never chooses a zero-weight entry', () => {
    const cursor = new RngCursor(createRngState('slice-001'))
    const picks = Array.from({ length: 4 }, () =>
      cursor.weightedPick('narrative', [
        { value: 'a', weight: 1 },
        { value: 'b', weight: 3 },
        { value: 'c', weight: 0 },
      ]),
    )
    expect(picks).toEqual(['b', 'b', 'a', 'b'])
    expect(picks).not.toContain('c')

    expect(cursor.weightedPick('narrative', [])).toBeUndefined()
    expect(cursor.weightedPick('narrative', [{ value: 'x', weight: 0 }])).toBeUndefined()
  })

  it('picks uniformly and handles empty lists', () => {
    const cursor = new RngCursor(createRngState('slice-001'))
    const picked = cursor.pick('flavour', ['a', 'b', 'c'])
    expect(['a', 'b', 'c']).toContain(picked)
    expect(cursor.pick('flavour', [])).toBeUndefined()
  })

  it('clamps chance probabilities', () => {
    const cursor = new RngCursor(createRngState('slice-001'))
    expect(cursor.chance('tests', 0)).toBe(false)
    expect(cursor.chance('tests', 1)).toBe(true)
  })

  it('steps a single 32-bit state without drifting outside the range', () => {
    let state = 12345
    for (let i = 0; i < 100; i += 1) {
      const stepped = stepUint32(state)
      expect(stepped.value).toBeGreaterThanOrEqual(0)
      expect(stepped.value).toBeLessThanOrEqual(0xffffffff)
      expect(stepped.state).toBeGreaterThanOrEqual(0)
      state = stepped.state
    }
  })
})

/**
 * The seed hash as a golden vector: changing it silently re-rolls every existing save, so
 * the values are pinned here rather than trusted to stay put.
 */
describe('the seed hash (golden vector)', () => {
  const golden: [string, number][] = [
    ['', 2166136261],
    ['seed', 1346747564],
    ['name.aegean.ema-a2', 3299220794],
    ['wanderer-1', 3016647041],
  ]

  it.each(golden)('hashes %j to %i', (value, expected) => {
    expect(hashString(value)).toBe(expected)
  })
})

/** Table-driven rejections: a bad range is refused before anything is drawn. */
describe('rng rejections', () => {
  const rejections: { name: string; run: (cursor: RngCursor) => unknown }[] = [
    { name: 'an upper bound below the lower', run: (cursor) => cursor.nextInt('travel', 5, 1) },
    { name: 'a fractional lower bound', run: (cursor) => cursor.nextInt('travel', 1.5, 5) },
    { name: 'a fractional upper bound', run: (cursor) => cursor.nextInt('travel', 1, 5.5) },
    { name: 'a NaN bound', run: (cursor) => cursor.nextInt('travel', Number.NaN, 5) },
  ]

  it.each(rejections)('rejects $name without drawing', ({ run }) => {
    const state = createRngState('slice-001')
    const cursor = new RngCursor(state)

    expect(() => run(cursor)).toThrow(RangeError)
    expect(cursor.snapshot()).toEqual(state)
  })
})

/** The clamped edges: probabilities and weights are bounded, never trusted. */
describe('rng edges and clamping', () => {
  const draws = (): RngCursor => new RngCursor(createRngState('slice-001'))

  it.each([
    [-5, false],
    [0, false],
    [1, true],
    [7, true],
  ])('chance(%d) clamps to %s', (probability, expected) => {
    expect(draws().chance('tests', probability)).toBe(expected)
  })

  it('treats a one-value integer range as that value', () => {
    const cursor = draws()
    expect(Array.from({ length: 3 }, () => cursor.nextInt('travel', 4, 4))).toEqual([4, 4, 4])
  })

  it('never chooses a negative-weight entry', () => {
    const cursor = draws()
    const picks = Array.from({ length: 5 }, () =>
      cursor.weightedPick('narrative', [
        { value: 'a', weight: -2 },
        { value: 'b', weight: 1 },
      ]),
    )
    expect(picks).toEqual(['b', 'b', 'b', 'b', 'b'])
  })

  it('picks the only element of a one-item list', () => {
    expect(draws().pick('flavour', ['only'])).toBe('only')
  })
})

/** Determinism: the same stored stream state reproduces the same run, draw for draw. */
describe('rng determinism', () => {
  const drawAll = () => {
    const cursor = new RngCursor(createRngState('slice-001'))
    return [
      cursor.nextUint32('market'),
      cursor.nextFloat('encounters'),
      cursor.nextInt('travel', 1, 6),
      cursor.pick('flavour', ['a', 'b', 'c']),
      cursor.weightedPick('narrative', [
        { value: 'x', weight: 1 },
        { value: 'y', weight: 2 },
      ]),
      cursor.chance('tests', 0.5),
      cursor.snapshot(),
    ]
  }

  it('draws the same values from the same stream state', () => {
    expect(JSON.stringify(drawAll())).toBe(JSON.stringify(drawAll()))
  })

  it('resumes exactly from a stored snapshot', () => {
    const cursor = new RngCursor(createRngState('slice-001'))
    cursor.nextUint32('market')
    const resumed = new RngCursor(cursor.snapshot())

    expect(resumed.nextUint32('market')).toBe(cursor.nextUint32('market'))
  })

  it('leaves every other stream untouched, whichever one is drawn', () => {
    const seeded = createRngState('slice-001')

    for (const stream of RNG_STREAMS) {
      const cursor = new RngCursor(seeded)
      for (let draw = 0; draw < 20; draw += 1) cursor.nextUint32(stream)
      const after = cursor.snapshot()

      for (const other of RNG_STREAMS) {
        if (other === stream) expect(after[other]).not.toBe(seeded[other])
        else expect(after[other]).toBe(seeded[other])
      }
    }
  })
})
