/**
 * Markets.
 *
 * Prices are authored bands with a destination modifier, plus authored local-state
 * multipliers. There is no supply and demand simulation (spec §9.5). Language changes
 * what the player understands about the price and how well they bargain, never whether
 * they can trade at all.
 */

import { tierRank } from '../culture'
import type { DestinationDef, MarketEntry } from '../content'
import type { ContentIndex } from '../content'
import { LANGUAGE_TIERS, type GameState, type LanguageTier } from '../state'
import {
  cargoEntry,
  cargoWeight,
  freeCapacity,
  itemWeight,
  sellableQuantity,
} from './inventory'

/**
 * A stall pays this share of its base price when it buys, before haggling. The 20% gap
 * keeps same-stall speculation unprofitable while leaving room for a real cross-port
 * trade when one harbour values a good well above what another asks. `fixedPrice`
 * entries are the deliberate exception: the prose price is both.
 */
export const SELL_SHARE = 0.8

/** Best haggling discount per tier. */
export const HAGGLE_DISCOUNT: Record<LanguageTier, number> = {
  unfamiliar: 0,
  basic: 0.02,
  conversational: 0.05,
  fluent: 0.08,
  deep: 0.12,
}

export interface MarketOffer {
  item: string
  name: string
  category: string
  weight: number
  /** What one unit costs to buy, after haggling. */
  unitPrice: number
  /** What one unit fetches when sold here, after haggling. */
  sellUnitPrice: number
  stock: number
  owned: number
  /** What the carried quantity cost; `null` when the save predates cost tracking. */
  costBasis: number | null
  /** Sale proceeds minus cost for the whole carried quantity. */
  profit: number | null
  /** Average sale proceeds minus average cost per unit. */
  profitPerUnit: number | null
  affordable: boolean
  fitsCapacity: boolean
}

export interface MarketView {
  destination: string
  destinationName: string
  offers: MarketOffer[]
  /** True when the player's language is too thin for exact prices. */
  estimated: boolean
  hagglingTier: LanguageTier
  hagglingDiscount: number
}

/** The best tier the player holds among the languages spoken here. */
export function hagglingTier(state: GameState, destination: DestinationDef): LanguageTier {
  let best: LanguageTier = 'unfamiliar'
  let bestRank = -1
  for (const languageId of destination.languages ?? []) {
    const tier = state.player.languages[languageId]?.tier
    if (!tier) continue
    const rank = tierRank(tier)
    if (rank > bestRank) {
      best = tier
      bestRank = rank
    }
  }
  return best
}

function stateMultiplier(state: GameState, destination: DestinationDef, category: string): number {
  const active = state.world.destinationStates[destination.id] ?? []
  let multiplier = 1
  for (const modifier of destination.stateModifiers ?? []) {
    if (!active.includes(modifier.state)) continue
    if (modifier.categories && !modifier.categories.includes(category)) continue
    multiplier *= modifier.multiplier
  }
  return multiplier
}

/** The authored price before haggling, in whole units. */
export function baseUnitPrice(
  state: GameState,
  destination: DestinationDef,
  entry: MarketEntry,
  category: string,
): number {
  const raw =
    entry.basePrice * destination.market.priceModifier * stateMultiplier(state, destination, category)
  return Math.max(1, Math.round(raw))
}

export function buyPrice(
  state: GameState,
  destination: DestinationDef,
  entry: MarketEntry,
  category: string,
): number {
  // A price the prose quotes is the price, whatever the festival or the bargaining says.
  if (entry.fixedPrice) return entry.fixedPrice
  const tier = hagglingTier(state, destination)
  const raw = baseUnitPrice(state, destination, entry, category) * (1 - HAGGLE_DISCOUNT[tier])
  return Math.max(1, Math.round(raw))
}

export function sellPrice(
  state: GameState,
  destination: DestinationDef,
  entry: MarketEntry,
  category: string,
): number {
  if (entry.fixedPrice) return entry.fixedPrice
  const tier = hagglingTier(state, destination)
  const raw =
    baseUnitPrice(state, destination, entry, category) * SELL_SHARE * (1 + HAGGLE_DISCOUNT[tier])
  return Math.max(1, Math.round(raw))
}

export function deriveMarket(
  state: GameState,
  destinationId: string,
  index: ContentIndex,
): MarketView | null {
  const destination = index.destinations.get(destinationId)
  if (!destination) return null

  const tier = hagglingTier(state, destination)
  const free = freeCapacity(state, index)

  const offers: MarketOffer[] = destination.market.goods.map((entry) => {
    const good = index.goods.get(entry.item)
    const category = good?.category ?? 'food'
    const price = buyPrice(state, destination, entry, category)
    const sale = sellPrice(state, destination, entry, category)
    const weight = itemWeight(index, entry.item)
    const owned = sellableQuantity(state, entry.item)
    const cargo = cargoEntry(state, entry.item)
    const costBasis =
      owned > 0 && cargo
        ? cargo.costBasis === null
          ? null
          : (cargo.costBasis ?? 0)
        : null
    const profit = costBasis === null ? null : sale * owned - costBasis

    return {
      item: entry.item,
      name: good?.name ?? entry.item,
      category,
      weight,
      unitPrice: price,
      sellUnitPrice: sale,
      stock: entry.stock,
      owned,
      costBasis,
      profit,
      profitPerUnit: profit === null ? null : profit / owned,
      affordable: price <= state.player.money,
      fitsCapacity: weight <= free,
    }
  })

  return {
    destination: destination.id,
    destinationName: destination.name,
    offers,
    estimated: tierRank(tier) < tierRank('conversational'),
    hagglingTier: tier,
    hagglingDiscount: HAGGLE_DISCOUNT[tier],
  }
}

export interface TradeQuote {
  ok: boolean
  reason?: string
  total?: number
  quantity?: number
}

export function quoteBuy(
  state: GameState,
  destination: DestinationDef,
  index: ContentIndex,
  item: string,
  quantity: number,
): TradeQuote {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, reason: 'Choose a whole number of goods to buy.' }
  }

  const entry = destination.market.goods.find((candidate) => candidate.item === item)
  if (!entry) return { ok: false, reason: 'This market does not sell that.' }
  if (quantity > entry.stock) return { ok: false, reason: 'There is not that much on offer.' }

  const good = index.goods.get(item)
  const unit = buyPrice(state, destination, entry, good?.category ?? 'food')
  const total = unit * quantity
  if (total > state.player.money) return { ok: false, reason: 'You cannot afford that.' }

  const fitsQty = Math.floor(freeCapacity(state, index) / Math.max(1, itemWeight(index, item)))
  if (quantity > fitsQty) {
    return {
      ok: false,
      reason: `Your cargo cannot hold that much (${cargoWeight(state, index)} of ${state.player.capacity} used).`,
    }
  }

  return { ok: true, total, quantity }
}

export function quoteSell(
  state: GameState,
  destination: DestinationDef,
  index: ContentIndex,
  item: string,
  quantity: number,
): TradeQuote {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, reason: 'Choose a whole number of goods to sell.' }
  }

  const ownable = sellableQuantity(state, item)
  if (ownable < quantity) return { ok: false, reason: 'You are not carrying that much.' }

  const entry = destination.market.goods.find((candidate) => candidate.item === item)
  if (!entry) return { ok: false, reason: 'Nobody here is buying that.' }

  const good = index.goods.get(item)
  const unit = sellPrice(state, destination, entry, good?.category ?? 'food')
  return { ok: true, total: unit * quantity, quantity }
}

/** How many tiers the player is short of exact prices, for the interface note. */
export function priceConfidence(state: GameState, destination: DestinationDef): string {
  const tier = hagglingTier(state, destination)
  if (tierRank(tier) >= tierRank('conversational')) return 'You can follow the bargaining.'
  const next = LANGUAGE_TIERS[tierRank(tier) + 1]
  return next
    ? 'You can ask a price, but more of the language would help you judge it.'
    : 'You can read the price, but not judge it.'
}
