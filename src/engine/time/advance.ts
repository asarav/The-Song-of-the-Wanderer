/**
 * Time moves only through this module.
 *
 * `advanceDays` is the single mutation point for `calendar.day`. It is pure: the caller
 * passes a state and receives a new one. Nothing else in the engine writes the calendar.
 */

import type { GameState } from '../state'

export function advanceDays(state: GameState, days: number): GameState {
  if (!Number.isInteger(days) || days < 0) {
    throw new RangeError(`Cannot advance time by ${String(days)} days.`)
  }
  if (days === 0) return state

  return {
    ...state,
    calendar: { day: state.calendar.day + days },
  }
}
