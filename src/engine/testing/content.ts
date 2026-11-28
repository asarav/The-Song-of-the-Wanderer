/**
 * A minimal, in-memory content pack for engine tests.
 *
 * Deliberately small: two places, one crossing, one merchant, one market, a couple of
 * events. The authored slice content lives in `src/content/` and is validated by the
 * same registry.
 */

import { buildContentIndex, type ContentIndex } from '../content'
import type { RawEntityFile, RawPack } from '../content'
import type { EntityFolder } from '../content'

const fiction = { confidence: 'fictional' as const, sources: [] }
const attested = { confidence: 'documented' as const, sources: ['test citation'] }

function file(folder: EntityFolder, name: string, data: unknown): RawEntityFile {
  return { folder, file: `${name}.json`, data }
}

export function testPackEntities(): RawEntityFile[] {
  return [
    file('languages', 'akkadian', {
      id: 'lang.akkadian',
      name: 'Akkadian',
      trade: true,
      provenance: attested,
    }),
    file('languages', 'ugaritic', {
      id: 'lang.ugaritic',
      name: 'Ugaritic',
      provenance: attested,
    }),
    file('cultures', 'coastal', {
      id: 'culture.levant.coastal',
      name: 'Coastal Levantine',
      provenance: fiction,
    }),
    file('factions', 'palace', {
      id: 'faction.ugarit.palace',
      name: 'The palace',
      type: 'court',
      interests: ['the harbour'],
      provenance: fiction,
    }),
    file('regions', 'levant', {
      id: 'region.levant',
      name: 'The Levantine coast',
      cultures: ['culture.levant.coastal'],
      languages: ['lang.akkadian', 'lang.ugaritic'],
      mapPosition: { x: 72, y: 58 },
      mapRadius: 24,
      mapFeatures: [
        {
          id: 'feature.test.ridge',
          kind: 'mountains',
          points: [
            { x: 84, y: 82 },
            { x: 84, y: 34 },
          ],
        },
        {
          id: 'feature.test.river',
          kind: 'river',
          points: [
            { x: 80, y: 60 },
            { x: 62, y: 68 },
          ],
        },
      ],
      provenance: fiction,
    }),
    file('regions', 'cyprus', {
      id: 'region.cyprus',
      name: 'Cyprus',
      cultures: ['culture.levant.coastal'],
      languages: ['lang.akkadian'],
      mapPosition: { x: 26, y: 44 },
      mapRadius: 14,
      mapFeatures: [
        {
          id: 'feature.test.cyprus-ridge',
          kind: 'mountains',
          points: [
            { x: 16, y: 42 },
            { x: 36, y: 42 },
          ],
        },
      ],
      provenance: fiction,
    }),
    file('goods', 'grain', {
      id: 'good.grain',
      name: 'Grain',
      art: 'art.good.grain',
      category: 'food',
      weight: 2,
      provenance: fiction,
    }),
    file('afflictions', 'fever', {
      id: 'aff.fever',
      name: 'Fever',
      kind: 'fever',
      severity: 'grave',
      description: 'A heat behind the eyes.',
      treatments: ['rest', 'healer'],
      onset: 'The fever arrives.',
      daily: 'The fever stays.',
      recovery: 'The fever breaks.',
      provenance: fiction,
    }),
    file('afflictions', 'thirst', {
      id: 'aff.thirst',
      name: 'Dry throat',
      kind: 'thirst',
      severity: 'light',
      description: 'A dry mouth.',
      treatments: ['town', 'water'],
      onset: 'The thirst arrives.',
      daily: 'The thirst stays.',
      recovery: 'The thirst lifts.',
      provenance: fiction,
    }),
    file('afflictions', 'poison', {
      id: 'aff.poison',
      name: 'Poisoning',
      kind: 'poison',
      severity: 'grave',
      description: 'A slow poison.',
      treatments: ['antidote', 'healer'],
      onset: 'The poison arrives.',
      daily: 'The poison stays.',
      recovery: 'The poison lifts.',
      provenance: fiction,
    }),
    file('goods', 'copper', {
      id: 'good.copper',
      name: 'Copper',
      art: 'art.good.copper',
      category: 'metal',
      weight: 4,
      provenance: fiction,
    }),
    file('goods', 'oil', {
      id: 'good.oil',
      name: 'Olive oil',
      art: 'art.good.olive-oil',
      category: 'food',
      weight: 3,
      provenance: fiction,
    }),
    file('characters', 'amnit', {
      id: 'char.ugarit.amnit',
      name: 'Amnit',
      languages: ['lang.akkadian', 'lang.ugaritic'],
      home: 'dest.ugarit',
      tier: 'recurring',
      roles: ['merchant'],
      dialogue: 'dlg.ugarit.amnit.meeting',
      presence: ['dest.ugarit'],
      provenance: fiction,
    }),
    file('characters', 'kinyras', {
      id: 'char.cyprus.kinyras',
      name: 'Kinyras',
      languages: ['lang.akkadian'],
      home: 'dest.cyprus',
      tier: 'recurring',
      roles: ['copper broker'],
      dialogue: 'dlg.cyprus.kinyras.meeting',
      presence: ['dest.cyprus'],
      provenance: fiction,
    }),
    file('destinations', 'ugarit', {
      id: 'dest.ugarit',
      name: 'Ugarit',
      kind: 'port',
      region: 'region.levant',
      intro: 'A harbour of merchants and scribes.',
      cultures: ['culture.levant.coastal'],
      languages: ['lang.akkadian', 'lang.ugaritic'],
      institutions: ['faction.ugarit.palace'],
      cast: ['char.ugarit.amnit'],
      places: [
        {
          id: 'act.ugarit.market',
          name: 'The market',
          kind: 'market',
          description: 'Goods on mats.',
          art: 'art.ugarit.market',
          cast: ['char.ugarit.amnit'],
          actions: ['trade'],
        },
        {
          id: 'act.ugarit.harbour',
          name: 'The harbour',
          kind: 'harbour',
          description: 'Ships at anchor.',
          actions: ['passage'],
        },
      ],
      market: {
        priceModifier: 1,
        goods: [
          { item: 'good.grain', basePrice: 4, stock: 20 },
          { item: 'good.oil', basePrice: 7, stock: 8 },
          { item: 'good.copper', basePrice: 15, stock: 3 },
        ],
      },
      onArrival: 'evt.test.arrival',
      night: {
        text: 'Lamps on the quay and no one at the stalls.',
        events: [{ event: 'evt.test.night', weight: 1 }],
      },
      states: ['tense'],
      stateModifiers: [{ state: 'tense', multiplier: 1.25, categories: ['food'] }],
      routes: ['route.ugarit-cyprus', 'route.ugarit-inland'],
      provenance: fiction,
    }),
    file('destinations', 'cyprus', {
      id: 'dest.cyprus',
      name: 'The Cypriot harbour',
      kind: 'port',
      region: 'region.cyprus',
      intro: 'Copper in the yard, gulls on the roof.',
      cultures: ['culture.levant.coastal'],
      languages: ['lang.akkadian'],
      cast: ['char.cyprus.kinyras'],
      places: [
        {
          id: 'act.cyprus.market',
          name: 'The copper yard',
          kind: 'market',
          description: 'Ingots stacked.',
          cast: ['char.cyprus.kinyras'],
          actions: ['trade'],
        },
      ],
      market: {
        priceModifier: 1.1,
        goods: [
          { item: 'good.copper', basePrice: 9, stock: 10 },
          { item: 'good.grain', basePrice: 6, stock: 5 },
        ],
      },
      routes: ['route.ugarit-cyprus'],
      provenance: fiction,
    }),
    file('routes', 'ugarit-cyprus', {
      id: 'route.ugarit-cyprus',
      name: 'Crossing to Cyprus',
      kind: 'sea',
      from: 'dest.ugarit',
      to: 'dest.cyprus',
      risk: 'moderate',
      segments: [
        { id: 'leg.coast', name: 'The coast', kind: 'coast', days: 2 },
        { id: 'leg.open', name: 'Open water', kind: 'open-water', days: 1 },
      ],
      waypoints: [
        {
          id: 'way.calm-bay',
          name: 'A calm bay',
          kind: 'calm',
          afterDays: 1,
          description: 'A bay where the boat waits out the dark.',
          event: 'evt.squall',
        },
      ],
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
      encounters: [
        { event: 'evt.squall', weight: 3 },
        { event: 'evt.fellow-traveller', weight: 1 },
      ],
      encountersPerJourney: { min: 1, max: 2 },
      requirementsNote: 'A captain must vouch for you.',
      closureNote: 'The harbour is closed to departures.',
      provenance: fiction,
    }),
    file('routes', 'ugarit-inland', {
      id: 'route.ugarit-inland',
      name: 'The inland road',
      kind: 'road',
      from: 'dest.ugarit',
      to: 'dest.cyprus',
      modes: [
        {
          id: 'mode.walking',
          name: 'On foot',
          days: 9,
          baseCost: 0,
          capacity: 10,
          description: 'Slow.',
        },
      ],
      requirements: { flag: 'has-pass' },
      encounters: [],
      encountersPerJourney: { min: 0, max: 0 },
      requirementsNote: 'A pass is needed on this road.',
      provenance: fiction,
    }),
    file('events', 'arrival', {
      id: 'evt.test.arrival',
      kind: 'local',
      title: 'Arrival',
      scope: { destinations: ['dest.ugarit'] },
      conditions: { all: [] },
      priority: 100,
      major: true,
      once: true,
      scene: 'dlg.test.arrival',
      effects: [],
      provenance: fiction,
    }),
    file('events', 'squall', {
      id: 'evt.squall',
      kind: 'storylet',
      title: 'A squall',
      conditions: { all: [] },
      priority: 10,
      major: false,
      effects: [
        { languageXp: { language: 'lang.akkadian', amount: 2 } },
        { journal: { entry: 'journal.test.squall' } },
      ],
      provenance: fiction,
    }),
    file('events', 'fellow-traveller', {
      id: 'evt.fellow-traveller',
      kind: 'storylet',
      title: 'A fellow traveller',
      conditions: { all: [] },
      priority: 5,
      major: false,
      scene: 'dlg.test.fellow-traveller',
      effects: [],
      provenance: fiction,
    }),
    file('events', 'night', {
      id: 'evt.test.night',
      kind: 'storylet',
      title: 'A light at the stall',
      scope: { destinations: ['dest.ugarit'] },
      conditions: { flag: 'test.night' },
      priority: 5,
      major: false,
      cooldownDays: 2,
      effects: [{ journal: { entry: 'journal.test.night' } }],
      provenance: fiction,
    }),
    file('events', 'letter', {
      id: 'evt.test.letter',
      kind: 'local',
      title: 'A letter arrives',
      scope: { destinations: ['dest.ugarit'] },
      conditions: { all: [] },
      priority: 20,
      major: true,
      once: true,
      effects: [{ journal: { entry: 'journal.test.letter' } }],
      provenance: fiction,
    }),
    file('dialogues', 'arrival', {
      id: 'dlg.test.arrival',
      speaker: 'char.ugarit.amnit',
      start: 'gate',
      nodes: {
        gate: {
          text: 'Name, and what you carry.',
          choices: [
            { id: 'both', text: 'Both, if you have the time.', next: null },
            {
              id: 'declare',
              text: 'Two jars of oil, and a count the palace can check.',
              effects: [
                {
                  relationship: {
                    character: 'char.ugarit.amnit',
                    dimension: 'respect',
                    delta: 2,
                  },
                },
                {
                  deed: {
                    id: 'deed.test.declared-load',
                    kind: 'traded',
                    subject: 'good.olive-oil',
                    witnesses: ['char.ugarit.amnit'],
                  },
                },
                { knowledge: { fact: 'ugarit.gate-count', source: 'witnessed', reliability: 0.8 } },
              ],
              next: null,
            },
            {
              id: 'ask',
              text: 'Then ask what the palace is counting.',
              // Deliberately larger than the dimension cap, so the runner has a real clamp
              // to record: the effect clamps and emits `EffectClamped`.
              effects: [
                {
                  relationship: {
                    character: 'char.ugarit.amnit',
                    dimension: 'respect',
                    delta: 10,
                  },
                },
              ],
              next: null,
            },
          ],
        },
      },
      provenance: fiction,
    }),
    file('dialogues', 'amnit-meeting', {
      id: 'dlg.ugarit.amnit.meeting',
      speaker: 'char.ugarit.amnit',
      start: 'greet',
      nodes: {
        greet: {
          text: 'You have the look of someone who slept on a boat.',
          choices: [
            {
              text: 'Only the last three nights.',
              effects: [{ relationship: { character: 'char.ugarit.amnit', delta: 1 } }],
              next: 'laughs',
            },
            { text: '(Say nothing.)', next: null },
          ],
        },
        laughs: {
          text: 'Then you will want the good end of the table.',
          textByLanguage: {
            'lang.akkadian': {
              basic: 'Then sit where the light is.',
              conversational: 'Then you will want the good end of the table.',
            },
          },
          choices: [
            {
              text: 'I have copper to sell.',
              conditions: { itemAtLeast: { item: 'good.copper', quantity: 1 } },
              next: null,
            },
            { text: 'Another time.', next: null },
          ],
        },
      },
      provenance: fiction,
    }),
    file('dialogues', 'memory', {
      id: 'dlg.test.memory',
      speaker: 'char.ugarit.amnit',
      start: 'first',
      entries: [{ when: { flag: 'test.remember' }, node: 'again' }],
      nodes: {
        first: {
          text: 'A first meeting.',
          choices: [
            {
              text: 'Buy the lesson.',
              conditions: { moneyAtLeast: 5 },
              unavailableNote: 'You cannot afford the lesson.',
              effects: [{ money: -5 }],
              next: null,
            },
            { text: 'Go on.', next: null },
          ],
        },
        again: {
          text: 'You have been here before.',
          choices: [{ text: 'Yes.', next: null }],
        },
      },
      provenance: fiction,
    }),
    file('dialogues', 'kinyras-meeting', {
      id: 'dlg.cyprus.kinyras.meeting',
      speaker: 'char.cyprus.kinyras',
      start: 'greet',
      nodes: {
        greet: {
          text: 'You came over the water, then.',
          choices: [{ text: 'In a small boat.', next: null }],
        },
      },
      provenance: fiction,
    }),
    file('dialogues', 'fellow-traveller', {
      id: 'dlg.test.fellow-traveller',
      speaker: 'char.ugarit.amnit',
      start: 'greet',
      nodes: {
        greet: {
          text: 'A woman shares her bread and asks where you are bound.',
          choices: [{ text: 'Cyprus.', next: null }],
        },
      },
      provenance: fiction,
    }),
    file('journal', 'letter', {
      id: 'journal.test.letter',
      title: 'A letter',
      text: 'A sealed letter waits at the harbour office.',
      provenance: fiction,
    }),
    file('journal', 'squall', {
      id: 'journal.test.squall',
      title: 'Weather',
      text: 'The wind turned before dawn.',
      provenance: fiction,
    }),
    file('codex', 'ugarit', {
      id: 'codex.test.ugarit',
      title: 'Ugarit',
      text: 'A port city on the Levantine coast.',
      category: 'place',
      provenance: fiction,
    }),
  ]
}

export function testPack(): RawPack {
  const entities = testPackEntities()
  const ids: Record<string, string[]> = {}
  for (const entity of entities) {
    const record = entity.data as { id: string }
    ids[entity.folder] = [...(ids[entity.folder] ?? []), record.id]
  }
  return {
    manifest: { id: 'pack.test', contentVersion: 1, requires: [], entities: ids },
    files: entities,
  }
}

/** A validated test index. Throws if the fixture itself is invalid. */
export function testContent(): ContentIndex {
  const built = buildContentIndex([testPack()])
  const errors = built.issues.filter((entry) => entry.level === 'error')
  if (errors.length > 0) {
    throw new Error(
      `test content is invalid:\n${errors.map((e) => `${e.path}: ${e.message}`).join('\n')}`,
    )
  }
  return built.index
}
