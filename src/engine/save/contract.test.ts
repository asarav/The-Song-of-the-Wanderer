/**
 * Boundary contract for the `save` module (M1-T07).
 *
 * Imports only public surfaces: `@engine/save` plus `@engine/state`, `@engine/kernel` and
 * `@engine/testing` for fixtures. What the milestone promises is what this file asserts:
 * a save written by `serialize` loads back deep-equal, a corrupt or unknown-version blob
 * is refused with a typed reason, migrations chain through the registry, and nothing
 * derived is written to disk.
 */

import { describe, expect, it } from 'vitest'

import { reduce } from '@engine/kernel'
import { deserialize, inspectSave, MIGRATIONS, SaveError, serialize } from '@engine/save'
import { createInitialState, validateState, type GameState } from '@engine/state'
import { testContent } from '@engine/testing'

const index = testContent()
const savedAt = '2026-11-26T00:00:00.000Z'

function played(): GameState {
  const opening = createInitialState({
    seed: 'save-contract',
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
  })
  const bought = reduce(opening, { type: 'buy', item: 'good.grain', quantity: 2 }, index)
  if (bought.rejected) throw new Error(bought.rejected.reason)
  const opened = reduce(bought.state, { type: 'talkTo', character: 'char.ugarit.amnit' }, index)
  if (opened.rejected) throw new Error(opened.rejected.reason)
  return opened.state
}

describe('save module public surface', () => {
  it('round-trips a played state through plain JSON', () => {
    const state = played()
    const envelope = serialize(state, { savedAt })
    const text = JSON.stringify(envelope)

    const loaded = deserialize(JSON.parse(text))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.state).toEqual(state)
    expect(loaded.state.player.inventory[0]?.costBasis).toBe(8)
    expect(loaded.state.meta.eventSequence).toBe(state.meta.eventSequence)
    expect(loaded.state.narrative.pending).toEqual(state.narrative.pending)
    expect(validateState(loaded.state).ok).toBe(true)
  })

  it('writes only the partitioned state, with no derived view', () => {
    const envelope = serialize(played(), { savedAt })

    expect(Object.keys(envelope)).toEqual([
      'saveVersion',
      'engineVersion',
      'contentVersions',
      'savedAt',
      'state',
    ])
    expect(Object.keys(envelope.state).sort()).toEqual([
      'calendar',
      'knowledge',
      'meta',
      'narrative',
      'player',
      'rng',
      'world',
    ])
    expect(JSON.stringify(envelope)).not.toContain('"views"')
  })

  it('refuses a foreign blob with a typed error, not a throw', () => {
    const inputs: unknown[] = [null, 'text', {}, { saveVersion: 1 }, { saveVersion: 77 }]

    for (const input of inputs) {
      let loaded: ReturnType<typeof deserialize> | undefined
      expect(() => {
        loaded = deserialize(input)
      }).not.toThrow()
      expect(loaded?.ok).toBe(false)
      if (loaded && !loaded.ok) {
        expect(loaded.error).toBeInstanceOf(SaveError)
        expect(loaded.error.code).toMatch(/not-a-save|invalid-state|newer-save/)
        expect(loaded.error.message.length).toBeGreaterThan(0)
      }
    }
  })

  it('registers migrations by version and reaches the current format', () => {
    expect(Object.keys(MIGRATIONS)).toEqual(['0', '1', '2', '3', '4', '5'])
    expect(MIGRATIONS[0]).toMatchObject({ from: 0, to: 1 })
    expect(MIGRATIONS[1]).toMatchObject({ from: 1, to: 2 })
    expect(MIGRATIONS[2]).toMatchObject({ from: 2, to: 3 })

    const loaded = deserialize({ saveVersion: 0, seed: 'legacy', day: 10, money: 5 })
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.migratedFrom).toBe(0)
    expect(loaded.state.meta.saveVersion).toBe(6)
    expect(loaded.state.calendar.day).toBe(10)
  })

  it('prints a save a human can read', () => {
    const dump = inspectSave(played())
    expect(dump).toContain('location  dest.ugarit')
    expect(dump).toContain('good.grain x2')
    expect(dump).toContain('pending   dlg.ugarit.amnit.meeting')
  })
})
