import { describe, expect, it } from 'vitest'

import { ENGINE_VERSION, SAVE_FORMAT_VERSION } from '../version'
import { DEFAULT_CAPACITY, DEFAULT_SELF_NAME, createInitialState } from './initial'
import { PROTAGONIST_NAME } from './protagonist'
import {
  DIMENSION_MAX,
  DIMENSION_MIN,
  GameStateSchema,
  RngSchema,
  type GameState,
} from './schema'
import { RNG_STREAMS } from '../rng'
import { stateIssues, validateState } from './validate'

const input = { seed: 'state-001', location: 'dest.ugarit' }

function fresh() {
  return createInitialState(input)
}

describe('createInitialState', () => {
  it('builds a valid state with every partition present', () => {
    const state = fresh()
    expect(Object.keys(state).sort()).toEqual(
      ['calendar', 'knowledge', 'meta', 'narrative', 'player', 'rng', 'world'].sort(),
    )
    expect(state.meta.saveVersion).toBe(SAVE_FORMAT_VERSION)
    expect(state.meta.engineVersion).toBe(ENGINE_VERSION)
    expect(state.calendar.day).toBe(0)
    expect(state.player.identity.selfName).toBe(DEFAULT_SELF_NAME)
    expect(state.player.capacity).toBe(DEFAULT_CAPACITY)
  })

  it('round-trips through JSON and re-validates', () => {
    const state = fresh()
    const roundTripped = JSON.parse(JSON.stringify(state))
    const result = validateState(roundTripped)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.state).toEqual(state)
  })

  it('seeds every named stream', () => {
    const state = fresh()
    expect(Object.keys(state.rng).sort()).toEqual([...RNG_STREAMS].sort())
    expect(() => RngSchema.parse(state.rng)).not.toThrow()
  })

  it('separates the tablet display form from its ASCII technical id', () => {
    expect(PROTAGONIST_NAME.display).toBe(DEFAULT_SELF_NAME)
    expect(PROTAGONIST_NAME.display.endsWith('₂')).toBe(true)
    expect(PROTAGONIST_NAME.id).toBe('name.aegean.ema-a2')
    expect(PROTAGONIST_NAME.id).toMatch(/^[a-z0-9.-]+$/)
  })

  it('honours opening inputs and defaults the rest', () => {
    const state = createInitialState({
      ...input,
      day: 90,
      money: 120,
      languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    })
    expect(state.player.identity.selfName).toBe(DEFAULT_SELF_NAME)
    expect(state.calendar.day).toBe(90)
    expect(state.player.money).toBe(120)
    expect(state.player.inventory).toEqual([])
    expect(state.narrative.pending).toBeNull()
    expect(state.world.scheduled).toEqual([])
  })

  it('refuses to build a state the save format would reject', () => {
    expect(() => createInitialState({ ...input, day: -1 })).toThrow()
    expect(() => createInitialState({ ...input, money: -5 })).toThrow()
  })
})

describe('validateState', () => {
  it('accepts a schema-valid state', () => {
    expect(validateState(fresh()).ok).toBe(true)
  })

  it('rejects an unknown top-level key and names it', () => {
    const broken = { ...fresh(), extra: true }
    const result = validateState(broken)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]?.path).toBe('(root)')
      expect(result.issues[0]?.message).toContain('extra')
    }
  })

  it('names a nested path for a bad field', () => {
    const broken = fresh()
    broken.calendar.day = -3
    const issues = stateIssues(broken)
    expect(issues.some((issue) => issue.path === 'calendar.day')).toBe(true)
  })

  it('rejects a dimension outside the authored range', () => {
    const broken = fresh()
    broken.narrative.relationships['char.x'] = {
      trust: 99,
      affection: 0,
      obligation: 0,
      fear: 0,
      respect: 0,
    }
    expect(stateIssues(broken).some((issue) => issue.path.startsWith('narrative.relationships'))).toBe(
      true,
    )
  })

  it('rejects an unknown language tier', () => {
    const broken = fresh() as unknown as { player: { languages: Record<string, unknown> } }
    broken.player.languages['lang.x'] = { xp: 1, tier: 'fluent-ish' }
    expect(stateIssues(broken).length).toBeGreaterThan(0)
  })

  it('rejects a missing RNG stream', () => {
    const broken = fresh() as unknown as { rng: Record<string, number> }
    delete broken.rng['narrative']
    expect(stateIssues(broken).some((issue) => issue.path.startsWith('rng'))).toBe(true)
  })

  it('does not throw on nonsense input', () => {
    expect(validateState(null).ok).toBe(false)
    expect(validateState('nope').ok).toBe(false)
    expect(validateState({}).ok).toBe(false)
    expect(GameStateSchema.safeParse(undefined).success).toBe(false)
  })
})

/**
 * Table-driven rejections. Each row breaks one rule in one partition and names the path a
 * save loader must report; the point is that no partition fails silently or vaguely.
 */
describe('validateState rejections', () => {
  type Rejection = { name: string; mutate: (state: GameState) => void; path: string }

  const rejections: Rejection[] = [
    {
      name: 'an unknown top-level key',
      mutate: (state) => {
        ;(state as unknown as Record<string, unknown>).era = 'late-bronze'
      },
      path: '(root)',
    },
    {
      name: 'an unknown key inside a partition',
      mutate: (state) => {
        ;(state.calendar as unknown as Record<string, unknown>).month = 'nisannu'
      },
      path: 'calendar',
    },
    {
      name: 'a day before the epoch',
      mutate: (state) => {
        state.calendar.day = -1
      },
      path: 'calendar.day',
    },
    {
      name: 'a fractional purse',
      mutate: (state) => {
        state.player.money = 1.5
      },
      path: 'player.money',
    },
    {
      name: 'a capacity below one',
      mutate: (state) => {
        state.player.capacity = 0
      },
      path: 'player.capacity',
    },
    {
      name: 'an unknown presentation',
      mutate: (state) => {
        state.player.identity.presentation = 'sumptuous' as unknown as 'formal'
      },
      path: 'player.identity.presentation',
    },
    {
      name: 'an unknown language tier',
      mutate: (state) => {
        state.player.languages['lang.x'] = { xp: 1, tier: 'fluent-ish' as unknown as 'fluent' }
      },
      path: 'player.languages.lang.x.tier',
    },
    {
      name: 'cargo of zero',
      mutate: (state) => {
        state.player.inventory.push({ item: 'good.grain', quantity: 0 })
      },
      path: 'player.inventory[0].quantity',
    },
    {
      name: 'a flag of an unsupported type',
      mutate: (state) => {
        ;(state.player.flags as Record<string, unknown>).odd = 1.5
      },
      path: 'player.flags.odd',
    },
    {
      name: 'a dimension past its ceiling',
      mutate: (state) => {
        state.narrative.relationships['char.x'] = {
          trust: DIMENSION_MAX + 1,
          affection: 0,
          obligation: 0,
          fear: 0,
          respect: 0,
        }
      },
      path: 'narrative.relationships.char.x.trust',
    },
    {
      name: 'an unknown knowledge source',
      mutate: (state) => {
        state.knowledge.entries.push({
          fact: 'fact.x',
          learnedAt: 0,
          source: 'gossip' as unknown as 'told',
          reliability: 0.5,
          belief: 'believed',
        })
      },
      path: 'knowledge.entries[0].source',
    },
    {
      name: 'certainty above one',
      mutate: (state) => {
        state.knowledge.entries.push({
          fact: 'fact.x',
          learnedAt: 0,
          source: 'told',
          reliability: 1.5,
          belief: 'believed',
        })
      },
      path: 'knowledge.entries[0].reliability',
    },
    {
      name: 'a journey slot on a negative day',
      mutate: (state) => {
        state.narrative.journey = {
          route: 'route.x',
          mode: 'mode.x',
          origin: 'dest.a',
          destination: 'dest.b',
          departedAt: 0,
          arrivesAt: 3,
          slots: [{ atDay: -1, event: 'evt.x' }],
          nextSlot: 0,
        }
      },
      path: 'narrative.journey.slots[0].atDay',
    },
    {
      name: 'a pending scene that is not a dialogue',
      mutate: (state) => {
        state.narrative.pending = {
          kind: 'encounter',
          dialogue: 'dlg.x',
          node: 'start',
        } as unknown as GameState['narrative']['pending']
      },
      path: 'narrative.pending.kind',
    },
    {
      name: 'an unseeded stream',
      mutate: (state) => {
        delete (state.rng as unknown as Record<string, number>).narrative
      },
      path: 'rng.narrative',
    },
  ]

  it.each(rejections)('rejects $name at $path', ({ mutate, path }) => {
    const broken = fresh()
    mutate(broken)
    const result = validateState(broken)
    expect(result.ok).toBe(false)
    if (result.ok) return

    const paths = result.issues.map((issue) => issue.path)
    expect(paths).toContain(path)
    for (const issue of result.issues) {
      expect(issue.message.length).toBeGreaterThan(0)
    }
  })
})

/**
 * Boundary values the schema must accept. The effects layer clamps toward these limits;
 * the schema is the last line that rejects anything outside them.
 */
describe('validateState boundaries', () => {
  const accepted: { name: string; state: () => GameState }[] = [
    { name: 'the epoch itself', state: () => fresh() },
    {
      name: 'a purse of exactly zero',
      state: () => {
        const state = fresh()
        state.player.money = 0
        return state
      },
    },
    {
      name: 'a capacity of exactly one',
      state: () => {
        const state = fresh()
        state.player.capacity = 1
        return state
      },
    },
    {
      name: 'a dimension at its floor',
      state: () => {
        const state = fresh()
        state.narrative.relationships['char.x'] = {
          trust: DIMENSION_MIN,
          affection: DIMENSION_MIN,
          obligation: DIMENSION_MIN,
          fear: DIMENSION_MIN,
          respect: DIMENSION_MIN,
        }
        return state
      },
    },
    {
      name: 'a dimension at its ceiling',
      state: () => {
        const state = fresh()
        state.narrative.factions['faction.x'] = {
          trust: DIMENSION_MAX,
          favour: DIMENSION_MAX,
          obligation: DIMENSION_MAX,
          standing: DIMENSION_MAX,
          suspicion: DIMENSION_MAX,
        }
        return state
      },
    },
    {
      name: 'certainty of zero and one',
      state: () => {
        const state = fresh()
        state.knowledge.entries.push(
          { fact: 'fact.zero', learnedAt: 0, source: 'told', reliability: 0, belief: 'doubted' },
          { fact: 'fact.one', learnedAt: 0, source: 'witnessed', reliability: 1, belief: 'believed' },
        )
        return state
      },
    },
    {
      name: 'the first cargo carried',
      state: () => {
        const state = fresh()
        state.player.inventory.push({ item: 'good.oil', quantity: 1 })
        return state
      },
    },
  ]

  it.each(accepted)('accepts $name', ({ state }) => {
    expect(validateState(state()).ok).toBe(true)
  })
})

/**
 * A golden vector for the default opening state. If a default moves, the diff names the
 * field; the seeded stream values are the RNG's own golden, carried here so the state and
 * its seeding cannot drift apart.
 */
describe('the persisted shape', () => {
  function projection(state: GameState) {
    return {
      partitions: Object.keys(state).sort(),
      meta: state.meta,
      calendar: state.calendar,
      identity: state.player.identity,
      player: {
        location: state.player.location,
        money: state.player.money,
        capacity: state.player.capacity,
        stamina: state.player.stamina,
        afflictions: state.player.afflictions,
        transport: state.player.transport,
        inventory: state.player.inventory,
        languages: state.player.languages,
        deeds: state.player.deeds,
        reputation: state.player.reputation,
        obligations: state.player.obligations,
        flags: state.player.flags,
      },
      knowledge: state.knowledge,
      narrative: state.narrative,
      world: state.world,
      rng: state.rng,
    }
  }

  it('matches the golden opening state for a fixed seed', () => {
    const state = createInitialState({ seed: 'golden-state-1', location: 'dest.ugarit' })

    expect(projection(state)).toEqual({
      partitions: ['calendar', 'knowledge', 'meta', 'narrative', 'player', 'rng', 'world'],
      meta: {
        saveVersion: SAVE_FORMAT_VERSION,
        engineVersion: ENGINE_VERSION,
        contentVersions: {},
        seed: 'golden-state-1',
        difficulty: 'wanderer',
        eventSequence: 0,
      },
      calendar: { day: 0 },
      identity: {
        selfName: 'e-ma-a₂',
        presentation: 'weathered',
        background: [],
        localNames: {},
      },
      player: {
        location: 'dest.ugarit',
        money: 0,
        capacity: 20,
        stamina: 8,
        afflictions: [],
        transport: 'transport.on-foot',
        inventory: [],
        languages: {},
        deeds: [],
        reputation: {},
        obligations: [],
        flags: {},
      },
      knowledge: {
        entries: [],
        knownRoutes: [],
        knownDestinations: [],
        characterIndex: {},
        journalEntries: [],
      },
      narrative: {
        arcStates: {},
        characterStates: {},
        relationships: {},
        factions: {},
        pending: null,
        journey: null,
        promises: [],
        storyletCooldowns: {},
      },
      world: { destinationStates: {}, routeStates: {}, migrations: [], scheduled: [] },
      rng: {
        market: 1282736804,
        encounters: 2383210014,
        travel: 1635794344,
        hazard: 1090369540,
        flavour: 2007333277,
        narrative: 3647053702,
        tests: 1554475321,
      },
    })
  })

  /** Every persisted value must survive `JSON.stringify` unchanged: no Map, Set, Date. */
  function nonJsonValues(value: unknown, path = '(root)'): string[] {
    if (value === null) return []
    if (typeof value === 'string' || typeof value === 'boolean') return []
    if (typeof value === 'number') return Number.isFinite(value) ? [] : [`${path}: ${value}`]
    if (typeof value !== 'object') return [`${path}: ${typeof value}`]
    if (Array.isArray(value)) {
      return value.flatMap((item, index) => nonJsonValues(item, `${path}[${index}]`))
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      return [`${path}: ${String(prototype)}`]
    }
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      nonJsonValues(item, `${path}.${key}`),
    )
  }

  it('stores only plain JSON data, before and after play', () => {
    const state = fresh()
    state.player.inventory.push({ item: 'good.oil', quantity: 2 })
    state.player.deeds.push({
      id: 'deed.a',
      kind: 'traded',
      day: 3,
      place: 'dest.ugarit',
      subject: 'good.oil',
      witnesses: [],
      knowledge: [{ fact: 'fact.a', spread: 'local' }],
    })
    state.knowledge.entries.push({
      fact: 'fact.a',
      learnedAt: 3,
      source: 'told',
      reliability: 0.6,
      belief: 'doubted',
    })
    state.narrative.journey = {
      route: 'route.x',
      mode: 'mode.x',
      origin: 'dest.a',
      destination: 'dest.b',
      departedAt: 0,
      arrivesAt: 3,
      slots: [{ atDay: 1, event: 'evt.x' }],
      nextSlot: 0,
    }

    expect(nonJsonValues(state)).toEqual([])
    expect(JSON.parse(JSON.stringify(state))).toEqual(state)
  })

  it('is deterministic for one input and seed', () => {
    expect(JSON.stringify(fresh())).toBe(JSON.stringify(fresh()))
  })

  it('changes only the seeded streams when the seed changes', () => {
    const one = fresh()
    const two = createInitialState({ ...input, seed: 'state-002' })

    expect(one.rng).not.toEqual(two.rng)
    expect({ ...one, rng: null, meta: null }).toEqual({ ...two, rng: null, meta: null })
  })
})
