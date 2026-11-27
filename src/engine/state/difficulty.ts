/**
 * Chosen pressure for a run.
 *
 * Difficulty is one run-wide setting, not a second hazard system. It changes the starting
 * purse and reserve and shifts the derived road hazard; language, knowledge, ties, health
 * and world pressures keep working exactly as they do in every mode.
 */

import type { Difficulty } from './schema'

export const DEFAULT_DIFFICULTY: Difficulty = 'wanderer'

export interface DifficultyConfig {
  id: Difficulty
  name: string
  /** Player-facing description of what the mode changes. */
  note: string
  startingMoney: number
  startingStamina: number
  /** Percentage points added to every authored road hazard. */
  hazardShift: number
  /** Reads in the route risk factors when the shift is not zero. */
  hazardLabel: string
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  gentle: {
    id: 'gentle',
    name: 'Gentle',
    note: 'More silver, a full reserve, and a kinder road. The same story, with more room to recover.',
    startingMoney: 60,
    startingStamina: 8,
    hazardShift: -8,
    hazardLabel: 'A gentler road',
  },
  wanderer: {
    id: 'wanderer',
    name: 'Wanderer',
    note: "The measured journey: forty shekels, a full reserve, and the road's own odds.",
    startingMoney: 40,
    startingStamina: 8,
    hazardShift: 0,
    hazardLabel: 'The measured road',
  },
  perilous: {
    id: 'perilous',
    name: 'Perilous',
    note: 'A thin purse, six reserve, and a harder road. Learning the world matters more.',
    startingMoney: 24,
    startingStamina: 6,
    hazardShift: 10,
    hazardLabel: 'A harder road',
  },
}

export function difficultyConfig(id: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIG[id] ?? DIFFICULTY_CONFIG[DEFAULT_DIFFICULTY]
}
