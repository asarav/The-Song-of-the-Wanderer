import { describe, expect, it } from 'vitest'

import { ENTITY_SCHEMAS, RouteSchema, type EntityFolder } from './schema'

const provenance = { confidence: 'fictional' as const, sources: [] }

const validRoute = {
  id: 'route.test',
  name: 'A test crossing',
  kind: 'sea',
  from: 'dest.a',
  to: 'dest.b',
  risk: 'moderate',
  segments: [{ id: 'leg.one', name: 'The coast', kind: 'coast', days: 2 }],
  waypoints: [
    {
      id: 'way.one',
      name: 'A calm bay',
      kind: 'calm',
      afterDays: 1,
      description: 'A place to wait out the dark.',
    },
  ],
  modes: [
    {
      id: 'mode.one',
      name: 'Coastal',
      days: 3,
      baseCost: 4,
      capacity: 10,
      description: 'Close to shore.',
    },
  ],
  encounters: [],
  encountersPerJourney: { min: 0, max: 0 },
  provenance,
}

const cases: { name: string; route: unknown; ok: boolean }[] = [
  { name: 'accepts segments, waypoints and risk', route: validRoute, ok: true },
  {
    name: 'rejects an empty segment list',
    route: { ...validRoute, segments: [] },
    ok: false,
  },
  {
    name: 'rejects a segment without a name',
    route: { ...validRoute, segments: [{ id: 'leg.one', kind: 'coast' }] },
    ok: false,
  },
  {
    name: 'rejects a waypoint on day zero',
    route: {
      ...validRoute,
      waypoints: [{ ...validRoute.waypoints[0], afterDays: 0 }],
    },
    ok: false,
  },
  {
    name: 'rejects an unknown risk band',
    route: { ...validRoute, risk: 'extreme' },
    ok: false,
  },
  {
    name: 'rejects an unknown field',
    route: { ...validRoute, waypoint: 'not-a-field' },
    ok: false,
  },
]

describe('RouteSchema', () => {
  it.each(cases)('$name', ({ route, ok }) => {
    expect(RouteSchema.safeParse(route).success).toBe(ok)
  })

  it('parses the same route to the same value', () => {
    expect(RouteSchema.parse(validRoute)).toEqual(RouteSchema.parse(validRoute))
  })
})

/**
 * One minimal entity per folder. The `Record<EntityFolder, …>` type makes the table
 * exhaustive: adding a folder to `ENTITY_SCHEMAS` fails to compile until a sample exists.
 */
const samples: Record<EntityFolder, Record<string, unknown>> = {
  climates: { id: 'climate.test', name: 'Coastal Levant', provenance },
  cultures: { id: 'culture.test', name: 'Coastal Levantine', provenance },
  languages: { id: 'lang.test', name: 'A trade tongue', trade: true, provenance },
  factions: {
    id: 'faction.test',
    name: 'A house at the harbour',
    type: 'court',
    interests: ['control of the harbour'],
    provenance,
  },
  regions: {
    id: 'region.test',
    name: 'The test coast',
    climate: 'climate.test',
    cultures: ['culture.test'],
    languages: ['lang.test'],
    provenance,
  },
  destinations: {
    id: 'dest.test',
    name: 'A test port',
    kind: 'port',
    region: 'region.test',
    intro: 'A harbour of merchants and scribes.',
    cast: [],
    places: [],
    market: { priceModifier: 1, goods: [] },
    routes: [],
    provenance,
  },
  routes: validRoute,
  goods: {
    id: 'good.test',
    name: 'Copper',
    art: 'art.good.copper',
    category: 'metal',
    weight: 4,
    provenance,
  },
  afflictions: {
    id: 'aff.test',
    name: 'A fever',
    kind: 'fever',
    severity: 'grave',
    description: 'A heat behind the eyes.',
    treatments: ['rest', 'healer'],
    provenance,
  },
  characters: {
    id: 'char.test',
    name: 'A merchant',
    languages: ['lang.test'],
    home: 'dest.test',
    tier: 'recurring',
    roles: ['merchant'],
    provenance,
  },
  events: {
    id: 'evt.test',
    kind: 'local',
    title: 'An event',
    conditions: { all: [] },
    priority: 1,
    major: false,
    effects: [],
    provenance,
  },
  dialogues: {
    id: 'dlg.test',
    speaker: 'char.test',
    start: 'only',
    nodes: { only: { text: 'A line.', choices: [{ text: 'Leave', next: null }] } },
    provenance,
  },
  journal: { id: 'journal.test', title: 'A title', text: 'A paragraph.', provenance },
  codex: {
    id: 'codex.test',
    title: 'A title',
    text: 'A paragraph.',
    category: 'place',
    provenance,
  },
}

const folders = Object.keys(ENTITY_SCHEMAS) as EntityFolder[]

describe('entity schemas', () => {
  it('registers exactly the fourteen folders the milestone names', () => {
    expect(folders.sort()).toEqual(Object.keys(samples).sort())
    expect(folders).toHaveLength(14)
  })

  it.each(folders)('accepts a minimal %s entity', (folder) => {
    const parsed = ENTITY_SCHEMAS[folder].safeParse(samples[folder])
    expect(parsed.success).toBe(true)
  })

  it.each(folders)('refuses a %s entity that is only an id, with a reason', (folder) => {
    const parsed = ENTITY_SCHEMAS[folder].safeParse({ id: samples[folder]['id'] })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.length).toBeGreaterThan(0)
      expect(parsed.error.issues[0]?.message.length).toBeGreaterThan(0)
    }
  })

  it.each(folders)('refuses an unknown key on a %s entity', (folder) => {
    const parsed = ENTITY_SCHEMAS[folder].safeParse({ ...samples[folder], invented: true })
    expect(parsed.success).toBe(false)
  })

  it.each(folders)('parses %s deterministically', (folder) => {
    const once = ENTITY_SCHEMAS[folder].parse(samples[folder])
    expect(ENTITY_SCHEMAS[folder].parse(samples[folder])).toEqual(once)
  })

  it('refuses a codex entry with no shelf', () => {
    const { category, ...shelf } = samples.codex
    expect(category).toBe('place')
    expect(ENTITY_SCHEMAS.codex.safeParse(shelf).success).toBe(false)
  })

  it('refuses a codex entry on a shelf that does not exist', () => {
    const parsed = ENTITY_SCHEMAS.codex.safeParse({ ...samples.codex, category: 'weather' })
    expect(parsed.success).toBe(false)
  })
})
