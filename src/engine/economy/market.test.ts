import { describe, expect, it } from 'vitest'

import { createInitialState, type GameState } from '../state'
import { testContent } from '../testing'
import { buyPrice, deriveMarket, quoteBuy, quoteSell, sellPrice } from './market'

const index = testContent()
const ugarit = index.destinations.get('dest.ugarit')
if (!ugarit) throw new Error('test destination missing')

function state(overrides: Partial<Parameters<typeof createInitialState>[0]> = {}): GameState {
  return createInitialState({
    seed: 'market-001',
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    ...overrides,
  })
}

describe('deriveMarket', () => {
  it('applies a local event state to the affected category only', () => {
    const calm = deriveMarket(state(), 'dest.ugarit', index)
    const tense = state()
    tense.world.destinationStates['dest.ugarit'] = ['tense']
    const pressed = deriveMarket(tense, 'dest.ugarit', index)

    const calmGrain = calm?.offers.find((offer) => offer.item === 'good.grain')
    const tenseGrain = pressed?.offers.find((offer) => offer.item === 'good.grain')
    const calmCopper = calm?.offers.find((offer) => offer.item === 'good.copper')
    const tenseCopper = pressed?.offers.find((offer) => offer.item === 'good.copper')

    expect(tenseGrain?.unitPrice).toBeGreaterThan(calmGrain?.unitPrice ?? 0)
    expect(tenseCopper?.unitPrice).toBe(calmCopper?.unitPrice)
  })

  it('clamps an authored price at one silver rather than zero', () => {
    const cheap = {
      ...ugarit,
      market: { ...ugarit.market, priceModifier: 0.1 },
    }
    expect(buyPrice(state(), cheap, ugarit.market.goods[0]!, 'food')).toBe(1)
  })

  it('keeps a price the prose quotes fixed through a festival and fluent haggling', () => {
    const cloth = { item: 'good.sibtu-cloth', basePrice: 8, stock: 0, fixedPrice: 5 }
    const market = {
      ...ugarit,
      languages: ['lang.akkadian'],
      stateModifiers: [{ state: 'festival', multiplier: 1.1 }],
    }
    const festival = state({ languages: { 'lang.akkadian': { xp: 100, tier: 'fluent' } } })
    festival.world.destinationStates['dest.ugarit'] = ['festival']

    // Untouched, the festival and fluent bargaining pay eight at the yard for this cloth.
    expect(sellPrice(festival, market, { item: cloth.item, basePrice: 8, stock: 0 }, 'textile')).toBe(8)
    expect(sellPrice(festival, market, cloth, 'textile')).toBe(5)
    expect(buyPrice(festival, market, cloth, 'textile')).toBe(5)
  })

  it('shows a buying price above the selling price at the same stall', () => {
    const view = deriveMarket(state(), 'dest.ugarit', index)
    const grain = view?.offers.find((offer) => offer.item === 'good.grain')

    expect(grain?.unitPrice).toBeGreaterThan(grain?.sellUnitPrice ?? 0)
  })

  it('leaves room to profit by carrying copper from the yard to Ugarit', () => {
    const cyprus = index.destinations.get('dest.cyprus')
    const cyprusCopper = cyprus?.market.goods.find((entry) => entry.item === 'good.copper')
    const ugaritCopper = ugarit.market.goods.find((entry) => entry.item === 'good.copper')
    if (!cyprus || !cyprusCopper || !ugaritCopper) throw new Error('copper fixture missing')

    // Ten to buy on Cyprus, twelve to sell at Ugarit: a real route, not a guaranteed loss.
    expect(buyPrice(state(), cyprus, cyprusCopper, 'metal')).toBe(10)
    expect(sellPrice(state(), ugarit, ugaritCopper, 'metal')).toBe(12)
  })

  it('says how much one trade can move, from the purse, the stock and the hold', () => {
    const view = deriveMarket(state({ money: 20 }), 'dest.ugarit', index)
    const grain = view?.offers.find((offer) => offer.item === 'good.grain')
    if (!grain) throw new Error('grain fixture missing')

    expect(grain.maxBuy).toBe(
      Math.min(grain.stock, Math.floor(20 / grain.weight), Math.floor(20 / grain.unitPrice)),
    )
    expect(grain.maxSell).toBe(0)

    const carrying = state({ inventory: [{ item: 'good.grain', quantity: 2 }] })
    const carried = deriveMarket(carrying, 'dest.ugarit', index)?.offers.find(
      (offer) => offer.item === 'good.grain',
    )
    expect(carried?.maxSell).toBe(2)
  })

  it('shows a harbour-specific picture for a good when one is authored', () => {
    const market = ugarit.market as { art?: Record<string, string> }
    market.art = { 'good.grain': 'art.ugarit.market' }
    try {
      const grain = deriveMarket(state(), 'dest.ugarit', index)?.offers.find(
        (offer) => offer.item === 'good.grain',
      )
      expect(grain?.art).toBe('art.ugarit.market')
    } finally {
      delete market.art
    }
  })

  it('is deterministic for the same state', () => {
    expect(deriveMarket(state(), 'dest.ugarit', index)).toEqual(
      deriveMarket(state(), 'dest.ugarit', index),
    )
  })

  it('shows the gain or loss against what the carried cargo cost', () => {
    const carried = state({
      inventory: [{ item: 'good.grain', quantity: 2, costBasis: 8 }],
    })
    const grain = deriveMarket(carried, 'dest.ugarit', index)?.offers.find(
      (offer) => offer.item === 'good.grain',
    )

    expect(grain?.sellUnitPrice).toBe(3)
    expect(grain?.costBasis).toBe(8)
    expect(grain?.profit).toBe(-2)
    expect(grain?.profitPerUnit).toBe(-1)
  })

  it('treats free cargo as zero cost and a legacy stack as unknown', () => {
    const free = state({ inventory: [{ item: 'good.grain', quantity: 2 }] })
    const legacy = state({
      inventory: [{ item: 'good.grain', quantity: 2, costBasis: null }],
    })

    const freeGrain = deriveMarket(free, 'dest.ugarit', index)?.offers.find(
      (offer) => offer.item === 'good.grain',
    )
    const legacyGrain = deriveMarket(legacy, 'dest.ugarit', index)?.offers.find(
      (offer) => offer.item === 'good.grain',
    )

    expect(freeGrain?.profit).toBe(6)
    expect(legacyGrain?.costBasis).toBeNull()
    expect(legacyGrain?.profit).toBeNull()
  })
})

describe('trade quotes', () => {
  const cases: {
    name: string
    money: number
    capacity: number
    inventory?: { item: string; quantity: number }[]
    item: string
    quantity: number
    reason?: string
  }[] = [
    { name: 'accepts an affordable, light purchase', money: 100, capacity: 20, item: 'good.grain', quantity: 2 },
    { name: 'rejects a purchase with too little silver', money: 1, capacity: 20, item: 'good.grain', quantity: 1, reason: 'You cannot afford that.' },
    { name: 'rejects more stock than the market holds', money: 100, capacity: 20, item: 'good.grain', quantity: 999, reason: 'There is not that much on offer.' },
    { name: 'rejects a good nobody sells', money: 100, capacity: 20, item: 'good.nothing', quantity: 1, reason: 'This market does not sell that.' },
    { name: 'rejects a purchase that will not fit', money: 100, capacity: 2, item: 'good.copper', quantity: 1, reason: 'Your cargo cannot hold that much (0 of 2 used).' },
    { name: 'rejects a fractional quantity', money: 100, capacity: 20, item: 'good.grain', quantity: 0, reason: 'Choose a whole number of goods to buy.' },
  ]

  it.each(cases)('$name', ({ money, capacity, item, quantity, reason }) => {
    const quote = quoteBuy(state({ money, capacity }), ugarit, index, item, quantity)
    expect(quote.ok).toBe(reason === undefined)
    if (reason) expect(quote.reason).toBe(reason)
  })

  it('rejects selling protected cargo and accepts sellable cargo', () => {
    const protectedState = state({ inventory: [{ item: 'good.grain', quantity: 1, protected: true }] })
    const sellableState = state({ inventory: [{ item: 'good.grain', quantity: 1 }] })

    expect(quoteSell(protectedState, ugarit, index, 'good.grain', 1).reason).toBe(
      'You are not carrying that much.',
    )
    expect(quoteSell(sellableState, ugarit, index, 'good.grain', 1).ok).toBe(true)
  })
})
