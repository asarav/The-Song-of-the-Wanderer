/**
 * Cargo.
 *
 * Quantity and weight only: no item condition, no packing puzzle (spec §9.4). Capacity
 * comes from the player's transport and the current journey's mode.
 */

import type { CargoEntry, GameState } from '../state'
import type { ContentIndex } from '../content'

export function cargoQuantity(state: GameState, item: string): number {
  return state.player.inventory.find((entry) => entry.item === item)?.quantity ?? 0
}

export function cargoEntry(state: GameState, item: string): CargoEntry | undefined {
  return state.player.inventory.find((entry) => entry.item === item)
}

export function itemWeight(index: ContentIndex, item: string): number {
  return index.goods.get(item)?.weight ?? 1
}

export function cargoWeight(state: GameState, index: ContentIndex): number {
  return state.player.inventory.reduce(
    (total, entry) => total + entry.quantity * itemWeight(index, entry.item),
    0,
  )
}

export function freeCapacity(state: GameState, index: ContentIndex): number {
  return Math.max(0, state.player.capacity - cargoWeight(state, index))
}

/** How many more units fit, given each unit's weight. */
export function fits(state: GameState, index: ContentIndex, item: string, quantity: number): number {
  const weight = itemWeight(index, item)
  if (weight <= 0) return quantity
  return Math.floor(freeCapacity(state, index) / weight)
}

/** Cargo that can be sold: protected entries are personal or story items. */
export function sellableQuantity(state: GameState, item: string): number {
  const entry = cargoEntry(state, item)
  if (!entry || entry.protected) return 0
  return entry.quantity
}
