/**
 * Named, serializable random streams.
 *
 * Each stream is one 32-bit integer inside `state.rng`. A stream advances only when it
 * is drawn from, so adding a market item cannot change which encounter is met
 * (ADR-0003). The generator is mulberry32: small, fast, and identical everywhere.
 */

export const RNG_STREAMS = [
  'market',
  'encounters',
  'travel',
  'hazard',
  'flavour',
  'narrative',
  'tests',
] as const

export type RngStream = (typeof RNG_STREAMS)[number]

export type RngState = Record<RngStream, number>

/** FNV-1a over a string. Deterministic across platforms and runs. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/**
 * Derive one stream's starting state from the save seed and the stream name. Separate
 * streams therefore start far apart and never share a sequence.
 */
export function seedStream(seed: string, stream: RngStream): number {
  const mixed = hashString(`${seed}:${stream}`)
  return mixed === 0 ? 0x9e3779b9 : mixed
}

export function createRngState(seed: string): RngState {
  const state = {} as RngState
  for (const stream of RNG_STREAMS) {
    state[stream] = seedStream(seed, stream)
  }
  return state
}

/** One mulberry32 step: returns the next internal state and a 32-bit value. */
export function stepUint32(state: number): { state: number; value: number } {
  const next = (state + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { state: next, value: (t ^ (t >>> 14)) >>> 0 }
}

/**
 * A drawing cursor over the stream record.
 *
 * Create one per command from `state.rng`, draw from it, then store `snapshot()` back.
 * The input state is never mutated, so commands stay pure (see the deep-freeze test).
 */
export class RngCursor {
  private readonly state: RngState

  constructor(state: RngState) {
    this.state = { ...state }
  }

  snapshot(): RngState {
    return { ...this.state }
  }

  nextUint32(stream: RngStream): number {
    const stepped = stepUint32(this.state[stream])
    this.state[stream] = stepped.state
    return stepped.value
  }

  /** Uniform in [0, 1). */
  nextFloat(stream: RngStream): number {
    return this.nextUint32(stream) / 0x1_0000_0000
  }

  /** Uniform integer in [min, max], inclusive on both ends. */
  nextInt(stream: RngStream, min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`nextInt needs integers with max >= min, received ${min}..${max}.`)
    }
    const span = max - min + 1
    return min + Math.floor(this.nextFloat(stream) * span)
  }

  /** True with probability `p`, clamped to [0, 1]. */
  chance(stream: RngStream, p: number): boolean {
    const clamped = Math.min(1, Math.max(0, p))
    return this.nextFloat(stream) < clamped
  }

  /** Pick one element uniformly. Returns `undefined` for an empty list. */
  pick<T>(stream: RngStream, items: readonly T[]): T | undefined {
    if (items.length === 0) return undefined
    const index = Math.floor(this.nextFloat(stream) * items.length)
    return items[index]
  }

  /** Pick one element by weight. Zero-weight entries are never chosen. */
  weightedPick<T>(stream: RngStream, items: readonly { value: T; weight: number }[]): T | undefined {
    const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0)
    if (total <= 0) return undefined

    let roll = this.nextFloat(stream) * total
    let last: T | undefined
    for (const item of items) {
      const weight = Math.max(0, item.weight)
      last = item.value
      if (roll < weight) return item.value
      roll -= weight
    }
    return last
  }
}
