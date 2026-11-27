import { describe, expect, it } from 'vitest'

import { createInitialState } from '../state'
import { SAVE_FORMAT_VERSION } from '../version'
import { deserialize, inspectSave, serialize, type SaveErrorCode } from './serialize'
import { MIGRATIONS, migrateOnce, migrationFrom } from './migrations'
import roundTripFixture from './__fixtures__/round-trip-v5.json'
import roundTripV4Fixture from './__fixtures__/round-trip-v4.json'
import roundTripV3Fixture from './__fixtures__/round-trip-v3.json'
import roundTripV1Fixture from './__fixtures__/round-trip-v1.json'
import v0Fixture from './__fixtures__/v0-pre-release.json'
import v0MigratedState from './__fixtures__/v0-migrated-state.json'

const savedAt = '2026-11-26T00:00:00.000Z'

function stateA() {
  return createInitialState({ seed: 'save-a', location: 'dest.ugarit', money: 120 })
}

function stateB() {
  const state = createInitialState({
    seed: 'save-b',
    location: 'dest.cyprus',
    money: 40,
    day: 90,
    languages: { 'lang.akkadian': { xp: 70, tier: 'conversational' } },
  })
  state.player.inventory.push({ item: 'good.copper', quantity: 2 })
  state.player.deeds.push({
    id: 'deed.a',
    kind: 'traded',
    day: 12,
    place: 'dest.ugarit',
    subject: 'good.copper',
    witnesses: [],
    knowledge: [],
  })
  state.knowledge.journalEntries.push('journal.test.letter')
  return state
}

describe('serialize / deserialize', () => {
  it('round-trips two different states exactly', () => {
    for (const state of [stateA(), stateB()]) {
      const envelope = serialize(state, { savedAt })
      const loaded = deserialize(JSON.parse(JSON.stringify(envelope)))
      expect(loaded.ok).toBe(true)
      if (loaded.ok) expect(loaded.state).toEqual(state)
    }
  })

  it('carries versions and an injected timestamp in a stable order', () => {
    const envelope = serialize(stateA(), { savedAt })
    expect(Object.keys(envelope)).toEqual([
      'saveVersion',
      'engineVersion',
      'contentVersions',
      'savedAt',
      'state',
    ])
    expect(envelope.savedAt).toBe(savedAt)
    expect(envelope.saveVersion).toBe(stateA().meta.saveVersion)
    expect(envelope.engineVersion).toBe(stateA().meta.engineVersion)
  })

  it('is deterministic: one state and timestamp give byte-identical output', () => {
    const first = JSON.stringify(serialize(stateB(), { savedAt }))
    const second = JSON.stringify(serialize(stateB(), { savedAt }))

    expect(second).toBe(first)
    expect(JSON.stringify(deserialize(JSON.parse(first)))).toBe(
      JSON.stringify(deserialize(JSON.parse(second))),
    )
  })

  it('migrates a v0 save through the chain', () => {
    const v0 = { saveVersion: 0, seed: 'old-run', day: 30, location: 'dest.cyprus', money: 55 }
    const loaded = deserialize(v0)

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.migratedFrom).toBe(0)
    expect(loaded.state.calendar.day).toBe(30)
    expect(loaded.state.player.location).toBe('dest.cyprus')
    expect(loaded.state.player.money).toBe(55)
    expect(loaded.state.meta.seed).toBe('old-run')
    expect(loaded.state.meta.saveVersion).toBe(5)
  })

  it('reports a missing migration rather than guessing', () => {
    const envelope = { saveVersion: 0, seed: 'x' }
    expect(migrateOnce(envelope, 0)).not.toBeNull()
    expect(Object.keys(MIGRATIONS)).toEqual(['0', '1', '2', '3', '4'])
    expect(migrateOnce(envelope, 42)).toBeNull()
  })

  it('opens a v3 save clean of afflictions', () => {
    const loaded = deserialize(roundTripV3Fixture)

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.migratedFrom).toBe(3)
    expect(loaded.state.meta.saveVersion).toBe(5)
    expect(loaded.state.player.afflictions).toEqual([])
  })

  it('opens a v4 save on the measured journey', () => {
    const loaded = deserialize(roundTripV4Fixture)

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.migratedFrom).toBe(4)
    expect(loaded.state.meta.saveVersion).toBe(5)
    expect(loaded.state.meta.difficulty).toBe('wanderer')
  })
})

/**
 * Every refusal the loader can produce, one row each: the input, the typed code and the
 * words the player sees. Saves never clamp — a numeric value is either in the schema or
 * the state is refused — so the clamped column of the contract does not apply here.
 */
const refusals: { name: string; input: unknown; code: SaveErrorCode; message: string }[] = [
  { name: 'null', input: null, code: 'not-a-save', message: 'That file is not a save.' },
  { name: 'plain text', input: 'text', code: 'not-a-save', message: 'That file is not a save.' },
  { name: 'a number', input: 42, code: 'not-a-save', message: 'That file is not a save.' },
  { name: 'an array', input: [], code: 'not-a-save', message: 'That file is not a save.' },
  {
    name: 'a truncated payload',
    input: '{"saveVersion":1,"state":',
    code: 'not-a-save',
    message: 'That file is not a save.',
  },
  {
    name: 'no version',
    input: {},
    code: 'not-a-save',
    message: 'That file has no readable save version.',
  },
  {
    name: 'a string version',
    input: { saveVersion: 'one' },
    code: 'not-a-save',
    message: 'That file has no readable save version.',
  },
  {
    name: 'a fractional version',
    input: { saveVersion: 1.5 },
    code: 'not-a-save',
    message: 'That file has no readable save version.',
  },
  {
    name: 'a negative version',
    input: { saveVersion: -1 },
    code: 'not-a-save',
    message: 'That file has no readable save version.',
  },
  {
    name: 'a save from a newer build',
    input: { saveVersion: 99 },
    code: 'newer-save',
    message: `This save was written by a newer build (v99; this build reads v${SAVE_FORMAT_VERSION}).`,
  },
  {
    name: 'a foreign file that claims the version',
    input: { saveVersion: 1, state: { player: {} } },
    code: 'invalid-state',
    message: 'That save does not match the current state format (',
  },
]

describe('deserialize refusals', () => {
  it.each(refusals)('refuses $name with $code', ({ input, code, message }) => {
    const loaded = deserialize(input)

    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.error).toBeInstanceOf(Error)
    expect(loaded.error.name).toBe('SaveError')
    expect(loaded.error.code).toBe(code)
    expect(loaded.error.message).toContain(message)
  })

  it('reports a corrupt state with typed issues instead of crashing', () => {
    const envelope = serialize(stateA(), { savedAt })
    const broken = JSON.parse(JSON.stringify(envelope)) as { state: { calendar: { day: number } } }
    broken.state.calendar.day = -5

    const loaded = deserialize(broken)
    expect(loaded.ok).toBe(false)
    if (!loaded.ok) {
      expect(loaded.error.code).toBe('invalid-state')
      expect(loaded.error.issues?.some((issue) => issue.path === 'calendar.day')).toBe(true)
    }
  })

  it('trusts the envelope version over a stale inner one', () => {
    const envelope = serialize(stateA(), { savedAt })
    const handEdited = JSON.parse(JSON.stringify(envelope)) as typeof envelope
    handEdited.state.meta.saveVersion = SAVE_FORMAT_VERSION + 1

    const loaded = deserialize(handEdited)
    expect(loaded.ok).toBe(true)
    if (loaded.ok) {
      expect(loaded.state.meta.saveVersion).toBe(SAVE_FORMAT_VERSION)
      expect(handEdited.state.meta.saveVersion).toBe(SAVE_FORMAT_VERSION + 1)
    }
  })
})

describe('migration registry', () => {
  it('covers every version between zero and the current format', () => {
    for (let version = 0; version < SAVE_FORMAT_VERSION; version += 1) {
      const migration = migrationFrom(version)
      expect(migration, `no migration from v${version}`).not.toBeNull()
      expect(migration?.from).toBe(version)
      expect(migration?.to).toBeGreaterThan(version)
    }

    expect(migrationFrom(SAVE_FORMAT_VERSION)).toBeNull()
    expect(migrationFrom(42)).toBeNull()
  })

  it('has every entry write the version it declares', () => {
    for (const migration of Object.values(MIGRATIONS)) {
      const migrated = migration.migrate({ saveVersion: migration.from })
      expect(migrated.saveVersion).toBe(migration.to)
    }
  })
})

describe('checked-in fixtures', () => {
  it('migrates the real v0 save to the expected state', () => {
    const loaded = deserialize(v0Fixture)

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.migratedFrom).toBe(0)
    expect(loaded.state).toEqual(v0MigratedState)
    expect(loaded.state.meta.saveVersion).toBe(SAVE_FORMAT_VERSION)
    expect(loaded.state.calendar.day).toBe(45)
    expect(loaded.state.player.location).toBe('dest.cyprus')
    expect(loaded.state.player.money).toBe(63)
    expect(loaded.state.meta.seed).toBe('v0-golden')
  })

  it('migrates the v1 save and marks its cargo cost as unknown', () => {
    const loaded = deserialize(roundTripV1Fixture)

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.migratedFrom).toBe(1)
    expect(loaded.state.meta.saveVersion).toBe(SAVE_FORMAT_VERSION)
    expect(loaded.state.player.inventory[0]?.costBasis).toBeNull()
  })

  it('restores the real round-trip save deep-equal, counter and calendar included', () => {
    const loaded = deserialize(roundTripFixture)

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.migratedFrom).toBeUndefined()
    expect(loaded.state).toEqual(roundTripFixture.state)
    expect(loaded.state.calendar.day).toBe(93)
    expect(loaded.state.meta.eventSequence).toBe(21)
    expect(loaded.state.player.location).toBe('dest.cyprus')
    expect(loaded.state.meta.seed).toBe('scenario-001')
  })

  it('serialises the restored fixture back to the same bytes', () => {
    const loaded = deserialize(roundTripFixture)
    if (!loaded.ok) throw new Error(loaded.error.message)

    const again = serialize(loaded.state, { savedAt: roundTripFixture.savedAt })
    expect(again).toEqual(roundTripFixture)
    expect(JSON.stringify(again)).toBe(JSON.stringify(roundTripFixture))
  })
})

describe('inspectSave', () => {
  it('prints the parts of a save a human needs', () => {
    const dump = inspectSave(stateB())
    expect(dump).toContain('save      v5')
    expect(dump).toContain('road      wanderer')
    expect(dump).toContain('location  dest.cyprus')
    expect(dump).toContain('good.copper x2')
    expect(dump).toContain('journal   1 entries')
  })
})
