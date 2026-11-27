/**
 * New-game construction.
 *
 * `createInitialState` is the only sanctioned way to build a fresh `GameState`. It fills
 * every partition, seeds the RNG streams, and validates its own output, so a caller
 * cannot accidentally ship a state the save format rejects.
 */

import { ENGINE_VERSION, SAVE_FORMAT_VERSION } from '../version'
import { createRngState, type RNG_STREAMS } from '../rng'
import { PROTAGONIST_NAME } from './protagonist'
import { DEFAULT_DIFFICULTY } from './difficulty'
import {
  GameStateSchema,
  STAMINA_MAX,
  type CargoEntry,
  type Difficulty,
  type GameState,
  type LanguageTier,
  type Presentation,
} from './schema'

/**
 * The protagonist's fixed in-game name: the tablet spelling of the Aegean messenger name
 * (ADR-0006). Every new game uses it; the player does not enter a name. The `selfName`
 * field remains in save v1 so existing saves still load. Technical references use
 * `PROTAGONIST_NAME.id`, never this display string.
 */
export const DEFAULT_SELF_NAME = PROTAGONIST_NAME.display

export const DEFAULT_CAPACITY = 20
export const DEFAULT_TRANSPORT = 'transport.on-foot'
export const DEFAULT_LANGUAGE: { xp: number; tier: LanguageTier } = {
  xp: 0,
  tier: 'unfamiliar',
}

export interface NewGameInput {
  seed: string
  /** Where the game opens. Must be a destination ID once content is loaded. */
  location: string
  /** The player's chosen pressure. Defaults to the measured journey. */
  difficulty?: Difficulty
  presentation?: Presentation
  background?: string[]
  money?: number
  capacity?: number
  stamina?: number
  afflictions?: { id: string; sinceDay: number; source?: string }[]
  transport?: string
  inventory?: CargoEntry[]
  languages?: Record<string, { xp: number; tier: LanguageTier }>
  /** Day 0 is 1230-01-01. */
  day?: number
  contentVersions?: Record<string, number>
  knownDestinations?: string[]
  knownRoutes?: string[]
}

/** An empty record of every RNG stream, used when building drafts. */
export function emptyRngState(): Record<(typeof RNG_STREAMS)[number], number> {
  return createRngState('empty')
}

export function createInitialState(input: NewGameInput): GameState {
  const candidate: GameState = {
    meta: {
      saveVersion: SAVE_FORMAT_VERSION,
      engineVersion: ENGINE_VERSION,
      contentVersions: input.contentVersions ?? {},
      seed: input.seed,
      difficulty: input.difficulty ?? DEFAULT_DIFFICULTY,
      eventSequence: 0,
    },
    calendar: { day: input.day ?? 0 },
    world: {
      destinationStates: {},
      routeStates: {},
      migrations: [],
      scheduled: [],
    },
    player: {
      identity: {
        selfName: DEFAULT_SELF_NAME,
        presentation: input.presentation ?? 'weathered',
        background: input.background ?? [],
        localNames: {},
      },
      location: input.location,
      money: input.money ?? 0,
      inventory: input.inventory ?? [],
      capacity: input.capacity ?? DEFAULT_CAPACITY,
      stamina: input.stamina ?? STAMINA_MAX,
      afflictions: input.afflictions ?? [],
      transport: input.transport ?? DEFAULT_TRANSPORT,
      languages: input.languages ?? {},
      deeds: [],
      reputation: {},
      obligations: [],
      flags: {},
    },
    knowledge: {
      entries: [],
      knownRoutes: input.knownRoutes ?? [],
      knownDestinations: input.knownDestinations ?? [],
      characterIndex: {},
      journalEntries: [],
    },
    narrative: {
      arcStates: {},
      characterStates: {},
      relationships: {},
      factions: {},
      pending: null,
      journey: null,
      storyletCooldowns: {},
    },
    rng: createRngState(input.seed),
  }

  // Validate the value we are about to hand back. Cheap, and it keeps the initial state
  // and the save schema from drifting apart.
  return GameStateSchema.parse(candidate)
}
