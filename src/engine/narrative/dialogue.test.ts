import { describe, expect, it } from 'vitest'

import { createDslContent } from '../content'
import type { KernelContext } from '../kernel'
import { RngCursor } from '../rng'
import { createInitialState } from '../state'
import { testContent } from '../testing'
import { cargoPhrase, choiceCost, deriveScene, renderCargoText, startDialogue } from './dialogue'

const index = testContent()

function context(input: { flags?: Record<string, boolean>; money?: number } = {}): KernelContext {
  const state = createInitialState({
    seed: 'dialogue-001',
    location: 'dest.ugarit',
    money: input.money ?? 10,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownDestinations: ['dest.ugarit'],
    knownRoutes: [],
  })
  state.player.flags = { ...(input.flags ?? {}) }

  return {
    state,
    index,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
    events: [],
  }
}

function carry(items: { item: string; quantity: number }[]) {
  return createInitialState({
    seed: 'dialogue-cargo',
    location: 'dest.ugarit',
    capacity: 20,
    inventory: items,
  })
}

describe('cargo in scene text', () => {
  it('names what the trader is carrying, not an authored good', () => {
    expect(cargoPhrase(carry([{ item: 'good.grain', quantity: 2 }]), index)).toBe('the grain')
    expect(cargoPhrase(carry([{ item: 'good.copper', quantity: 1 }]), index)).toBe('the copper')
    expect(cargoPhrase(carry([{ item: 'good.oil', quantity: 2 }]), index)).toBe('the olive oil')
  })

  it('picks the largest stack so text and loss agree', () => {
    const state = carry([
      { item: 'good.copper', quantity: 1 },
      { item: 'good.grain', quantity: 3 },
    ])
    expect(cargoPhrase(state, index)).toBe('the grain')
  })

  it('falls back to the ship when the hold is empty', () => {
    expect(cargoPhrase(carry([]), index)).toBe("a coil of the ship's rope")
  })

  it('fills the token and leaves no braces on screen', () => {
    const rendered = renderCargoText('{cargo} has gone into the water.', carry([{ item: 'good.copper', quantity: 1 }]), index)
    expect(rendered).toBe('the copper has gone into the water.')
    expect(rendered).not.toContain('{')
  })
})

describe('dialogue openings', () => {
  it('uses the authored start until a conditional entry matches', () => {
    const first = context()
    expect(startDialogue(first, 'dlg.test.memory')).toBeNull()
    expect(first.state.narrative.pending?.node).toBe('first')

    const returning = context({ flags: { 'test.remember': true } })
    expect(startDialogue(returning, 'dlg.test.memory')).toBeNull()
    expect(returning.state.narrative.pending?.node).toBe('again')
    expect(returning.events).toContainEqual({
      type: 'DialoguePresented',
      dialogue: 'dlg.test.memory',
      node: 'again',
    })
  })

  it('rejects an unknown conversation', () => {
    expect(startDialogue(context(), 'dlg.test.nothing')).toBe(
      'There is no conversation "dlg.test.nothing".',
    )
  })

  it('shows the authored reason for a locked answer', () => {
    const ctx = context({ money: 1 })
    startDialogue(ctx, 'dlg.test.memory')

    const scene = deriveScene(ctx.state, index, ctx.content)
    expect(scene?.choices[0]).toMatchObject({
      available: false,
      reason: 'You cannot afford the lesson.',
    })
  })
})

describe('choice costs', () => {
  it('reads silver, goods, cargo and days out of effects', () => {
    expect(
      choiceCost(
        [
          { money: -12 },
          { items: { item: 'good.oil', quantity: -2 } },
          { loseCargo: { quantity: 1 } },
          { advanceTime: { days: 2 } },
        ],
        index,
      ),
    ).toEqual({
      money: 12,
      items: [{ id: 'good.oil', name: 'Olive oil', quantity: 2 }],
      cargo: 1,
      days: 2,
    })
  })

  it('names a good the index does not know by its id rather than dropping it', () => {
    expect(choiceCost([{ items: { item: 'good.mystery', quantity: -1 } }], index)).toEqual({
      items: [{ id: 'good.mystery', name: 'good.mystery', quantity: 1 }],
    })
  })

  it('adds up what several effects take', () => {
    expect(choiceCost([{ money: -3 }, { money: -4 }], index)).toEqual({ money: 7 })
  })

  it('does not call silver received or goods gained a cost', () => {
    expect(
      choiceCost(
        [
          { money: 16 },
          { items: { item: 'good.grain', quantity: 2 } },
          { loseCargo: { quantity: 0 } },
          { advanceTime: { days: 0 } },
          { flag: 'paid' },
        ],
        index,
      ),
    ).toBeUndefined()
  })

  it('is absent when an answer asks for nothing', () => {
    expect(choiceCost(undefined, index)).toBeUndefined()
    expect(choiceCost([], index)).toBeUndefined()
  })

  it('travels on the scene choice the reader sees, available or not', () => {
    const ctx = context({ money: 1 })
    startDialogue(ctx, 'dlg.test.memory')

    const scene = deriveScene(ctx.state, index, ctx.content)
    expect(scene?.choices[0]?.cost).toEqual({ money: 5 })
    expect(scene?.choices[1]?.cost).toBeUndefined()
  })
})
