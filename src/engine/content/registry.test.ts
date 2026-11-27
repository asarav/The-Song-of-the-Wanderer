import { describe, expect, it } from 'vitest'

import { buildContentIndex, createDslContent, type RawEntityFile, type RawPack } from './registry'
import type { EntityFolder } from './schema'

const fiction = { confidence: 'fictional' as const, sources: [] }

function manifest(id: string, requires: string[] = [], ids: Record<string, string[]> = {}) {
  return { id, contentVersion: 1, requires, entities: ids }
}

function file(folder: EntityFolder, name: string, data: unknown): RawEntityFile {
  return { folder, file: `${name}.json`, data }
}

function baseEntities(): RawEntityFile[] {
  return [
    file('climates', 'levant', {
      id: 'climate.levant',
      name: 'Levantine coast',
      provenance: { confidence: 'plausible', sources: ['general Mediterranean climate'] },
    }),
    file('cultures', 'coastal', {
      id: 'culture.levant.coastal',
      name: 'Coastal Levantine',
      provenance: fiction,
    }),
    file('languages', 'akkadian', {
      id: 'lang.akkadian',
      name: 'Akkadian',
      trade: true,
      provenance: { confidence: 'documented', sources: ['RS 20.238'] },
    }),
    file('factions', 'palace', {
      id: 'faction.ugarit.palace',
      name: 'The palace at Ugarit',
      type: 'court',
      interests: ['control of the harbour'],
      provenance: fiction,
    }),
    file('regions', 'levant', {
      id: 'region.levant',
      name: 'The Levantine coast',
      climate: 'climate.levant',
      cultures: ['culture.levant.coastal'],
      languages: ['lang.akkadian'],
      provenance: fiction,
    }),
    file('goods', 'copper', {
      id: 'good.copper',
      name: 'Copper',
      art: 'art.good.copper',
      category: 'metal',
      weight: 4,
      provenance: { confidence: 'documented', sources: ['Late Bronze Age metal trade'] },
    }),
    file('goods', 'grain', {
      id: 'good.grain',
      name: 'Grain',
      art: 'art.good.grain',
      category: 'food',
      weight: 2,
      provenance: fiction,
    }),
    file('characters', 'amnit', {
      id: 'char.ugarit.amnit',
      name: 'Amnit',
      languages: ['lang.akkadian'],
      home: 'dest.ugarit',
      tier: 'recurring',
      roles: ['merchant'],
      dialogue: 'dlg.ugarit.amnit.meeting',
      provenance: fiction,
    }),
    file('destinations', 'ugarit', {
      id: 'dest.ugarit',
      name: 'Ugarit',
      kind: 'port',
      region: 'region.levant',
      intro: 'A harbour city of merchants and scribes.',
      cultures: ['culture.levant.coastal'],
      languages: ['lang.akkadian'],
      institutions: ['faction.ugarit.palace'],
      cast: ['char.ugarit.amnit'],
      places: [
        {
          id: 'act.ugarit.market',
          name: 'The market',
          kind: 'market',
          description: 'Goods on mats.',
          cast: ['char.ugarit.amnit'],
          actions: ['trade'],
        },
      ],
      market: {
        priceModifier: 1,
        goods: [
          { item: 'good.copper', basePrice: 12, stock: 4 },
          { item: 'good.grain', basePrice: 3, stock: 20 },
        ],
      },
      routes: ['route.ugarit-cyprus'],
      provenance: fiction,
    }),
    file('destinations', 'cyprus', {
      id: 'dest.cyprus',
      name: 'The Cypriot harbour',
      kind: 'port',
      region: 'region.levant',
      intro: 'A copper-working harbour.',
      cast: [],
      places: [
        {
          id: 'act.cyprus.market',
          name: 'The market',
          kind: 'market',
          description: 'Copper in ingots.',
          actions: ['trade'],
        },
      ],
      market: { priceModifier: 1.1, goods: [{ item: 'good.copper', basePrice: 9, stock: 10 }] },
      routes: ['route.ugarit-cyprus'],
      provenance: fiction,
    }),
    file('routes', 'ugarit-cyprus', {
      id: 'route.ugarit-cyprus',
      name: 'Crossing to Cyprus',
      kind: 'sea',
      from: 'dest.ugarit',
      to: 'dest.cyprus',
      modes: [
        {
          id: 'mode.coastal',
          name: 'Coastal',
          days: 5,
          baseCost: 8,
          capacity: 20,
          description: 'Close to shore.',
        },
        {
          id: 'mode.open',
          name: 'Open water',
          days: 3,
          baseCost: 14,
          capacity: 20,
          description: 'Faster.',
        },
      ],
      closedWhen: { flag: 'route.closed' },
      encounters: [{ event: 'evt.slice.storm', weight: 1 }],
      encountersPerJourney: { min: 0, max: 1 },
      provenance: fiction,
    }),
    file('events', 'storm', {
      id: 'evt.slice.storm',
      kind: 'storylet',
      title: 'A squall',
      conditions: { all: [] },
      priority: 10,
      major: false,
      effects: [],
      provenance: fiction,
    }),
    file('dialogues', 'amnit-meeting', {
      id: 'dlg.ugarit.amnit.meeting',
      speaker: 'char.ugarit.amnit',
      start: 'greet',
      nodes: {
        greet: {
          text: 'You have the look of someone who slept on a boat.',
          choices: [{ text: 'Only the last three nights.', next: null }],
        },
      },
      provenance: fiction,
    }),
  ]
}

function pack(
  entities: RawEntityFile[],
  overrides: Partial<{ id: string; requires: string[] }> = {},
): RawPack {
  const ids: Record<string, string[]> = {}
  for (const entity of entities) {
    const record = entity.data as { id: string }
    ids[entity.folder] = [...(ids[entity.folder] ?? []), record.id]
  }
  return {
    manifest: manifest(overrides.id ?? 'pack.levant', overrides.requires ?? [], ids),
    files: entities,
  }
}

describe('buildContentIndex', () => {
  it('loads a valid pack with no issues', () => {
    const result = buildContentIndex([pack(baseEntities())])
    expect(result.issues).toEqual([])
    expect(result.counts.entities).toBe(13)
    expect(result.index.destinations.get('dest.ugarit')?.name).toBe('Ugarit')
    expect(result.index.packs).toEqual(['pack.levant'])
  })

  it('exposes exactly the read-only view the DSL needs', () => {
    const { index } = buildContentIndex([pack(baseEntities())])
    const lookup = createDslContent(index)
    expect(lookup.hasCharacter('char.ugarit.amnit')).toBe(true)
    expect(lookup.hasCharacter('char.nowhere')).toBe(false)
    expect(lookup.characterHome('char.ugarit.amnit')).toBe('dest.ugarit')
    expect(lookup.routeExists('route.ugarit-cyprus')).toBe(true)
    expect(lookup.routeClosedWhen('route.ugarit-cyprus')).toEqual({ flag: 'route.closed' })
    expect(lookup.itemWeight('good.copper')).toBe(4)
    expect(lookup.itemWeight('good.unknown')).toBe(1)
  })

  it('rejects a dangling dialogue next node', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'dialogues'
        ? file('dialogues', 'amnit-meeting', {
            ...(entity.data as Record<string, unknown>),
            nodes: {
              greet: {
                text: 'Hello.',
                choices: [{ text: 'Leave', next: 'missing-node' }],
              },
            },
          })
        : entity,
    )
    const result = buildContentIndex([pack(entities)])
    const messages = result.issues.map((entry) => entry.message)
    expect(messages).toContain('greet choice "next" points to missing node "missing-node"')
  })

  it('rejects a place cast outside the destination cast', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'destinations'
        ? file('destinations', 'ugarit', {
            ...(entity.data as Record<string, unknown>),
            places: [
              {
                id: 'act.ugarit.market',
                name: 'The market',
                kind: 'market',
                description: 'Goods on mats.',
                cast: ['char.nowhere'],
              },
            ],
          })
        : entity,
    )
    const messages = buildContentIndex([pack(entities)]).issues.map((entry) => entry.message)
    expect(messages).toContain('cast references unknown character "char.nowhere"')
    expect(messages).toContain('cast "char.nowhere" is not in the destination\'s cast')
  })

  it('rejects one character assigned to two places', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'destinations'
        ? file('destinations', 'ugarit', {
            ...(entity.data as Record<string, unknown>),
            places: [
              {
                id: 'act.ugarit.market',
                name: 'The market',
                kind: 'market',
                description: 'Goods on mats.',
                cast: ['char.ugarit.amnit'],
              },
              {
                id: 'act.ugarit.harbour',
                name: 'The harbor',
                kind: 'harbour',
                description: 'Ships and rope.',
                cast: ['char.ugarit.amnit'],
              },
            ],
          })
        : entity,
    )
    const messages = buildContentIndex([pack(entities)]).issues.map((entry) => entry.message)
    expect(messages).toContain(
      'cast "char.ugarit.amnit" is already assigned to place "act.ugarit.market"',
    )
  })

  it('rejects a waypoint after the longest crossing', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'routes'
        ? file('routes', 'ugarit-cyprus', {
            ...(entity.data as Record<string, unknown>),
            waypoints: [
              {
                id: 'way.late',
                name: 'Too far',
                kind: 'calm',
                afterDays: 99,
                description: 'Beyond the crossing.',
              },
            ],
          })
        : entity,
    )
    const result = buildContentIndex([pack(entities)])
    expect(result.issues.map((entry) => entry.message)).toContain(
      'waypoint "way.late" falls after the longest crossing (5 days)',
    )
  })

  it('rejects duplicate waypoint ids and dangling waypoint events', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'routes'
        ? file('routes', 'ugarit-cyprus', {
            ...(entity.data as Record<string, unknown>),
            waypoints: [
              {
                id: 'way.same',
                name: 'One',
                kind: 'calm',
                afterDays: 1,
                description: 'First.',
              },
              {
                id: 'way.same',
                name: 'Two',
                kind: 'calm',
                afterDays: 2,
                description: 'Second.',
                event: 'evt.missing',
              },
            ],
          })
        : entity,
    )
    const messages = buildContentIndex([pack(entities)]).issues.map((entry) => entry.message)
    expect(messages).toContain('waypoint "way.same" is listed twice')
    expect(messages).toContain('waypoints.way.same.event references unknown event "evt.missing"')
  })

  it('rejects a route whose endpoint does not exist', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'routes'
        ? file('routes', 'ugarit-cyprus', {
            ...(entity.data as Record<string, unknown>),
            to: 'dest.atlantis',
          })
        : entity,
    )
    const result = buildContentIndex([pack(entities)])
    expect(result.issues.map((entry) => entry.message)).toContain(
      'to references unknown destination "dest.atlantis"',
    )
  })

  it('rejects a reference that points at the wrong kind of entity', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'characters'
        ? file('characters', 'amnit', {
            ...(entity.data as Record<string, unknown>),
            home: 'route.ugarit-cyprus',
          })
        : entity,
    )
    const result = buildContentIndex([pack(entities)])
    expect(result.issues.map((entry) => entry.message)).toContain(
      'home expects a destination but "route.ugarit-cyprus" is a route',
    )
  })

  it('rejects duplicate ids across packs', () => {
    const entities = baseEntities()
    const first = pack(entities, { id: 'pack.one' })
    const second = pack(entities, { id: 'pack.two' })
    const result = buildContentIndex([first, second])
    expect(
      result.issues.some((entry) => entry.message.includes('duplicate id "dest.ugarit"')),
    ).toBe(true)
  })

  it('rejects a pack requirement cycle', () => {
    const result = buildContentIndex([
      pack(baseEntities(), { id: 'pack.a', requires: ['pack.b'] }),
      { manifest: manifest('pack.b', ['pack.a']), files: [] },
    ])
    expect(result.issues.some((entry) => entry.message.includes('cycle'))).toBe(true)
  })

  it('rejects an unsourced documented claim', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'languages'
        ? file('languages', 'akkadian', {
            id: 'lang.akkadian',
            name: 'Akkadian',
            provenance: { confidence: 'documented', sources: [] },
          })
        : entity,
    )
    const result = buildContentIndex([pack(entities)])
    expect(result.issues.map((entry) => entry.message)).toContain(
      '"documented" claims need at least one source',
    )
  })

  it('rejects an effect list beyond the structural limit', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'events'
        ? file('events', 'storm', {
            ...(entity.data as Record<string, unknown>),
            effects: Array.from({ length: 120 }, () => ({ money: 1 })),
          })
        : entity,
    )
    const result = buildContentIndex([pack(entities)])
    expect(result.issues.some((entry) => entry.message.startsWith('effects:'))).toBe(true)
  })

  it('warns when content is not declared in the manifest', () => {
    const entities = baseEntities()
    const ids: Record<string, string[]> = {}
    for (const entity of entities.slice(1)) {
      const record = entity.data as { id: string }
      ids[entity.folder] = [...(ids[entity.folder] ?? []), record.id]
    }
    const result = buildContentIndex([
      { manifest: manifest('pack.levant', [], ids), files: entities },
    ])
    expect(result.issues.some((entry) => entry.level === 'warning')).toBe(true)
  })

  it('reports a malformed entity with its schema path', () => {
    const entities = baseEntities().map((entity) =>
      entity.folder === 'goods' ? file('goods', 'grain', { id: 'good.grain' }) : entity,
    )
    const result = buildContentIndex([pack(entities)])
    expect(result.issues.some((entry) => entry.path.includes('goods/grain.json'))).toBe(true)
  })
})
