/**
 * Save migrations.
 *
 * One registry entry per version step: `{ from, to, migrate }`. A migration is a pure
 * function of the raw envelope and never mutates its input. `v0` is a hypothetical
 * pre-release shape used to prove the chain works and to keep the checked-in fixture
 * honest; v1 introduced the partitioned state, v2 added the cargo cost basis, v3 the
 * reserve, v4 afflictions plus the hazard RNG stream, and v5 the chosen road.
 */

import { createInitialState, DEFAULT_DIFFICULTY, STAMINA_MAX } from '../state'
import { seedStream } from '../rng'
import type { GameState } from '../state'

export type RawSave = Record<string, unknown>

export interface Migration {
  /** The save version this entry reads. */
  from: number
  /** The save version it writes. Must be greater than `from`. */
  to: number
  /** Pure: returns a new raw envelope, never touches the input. */
  migrate: (input: RawSave) => RawSave
}

function asRecord(value: unknown): RawSave | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RawSave)
    : null
}

/**
 * v0 → v1.
 *
 * v0 was a flat object: `{ saveVersion: 0, seed, day, location, money }`. v1 introduces
 * the partitioned state. The migration keeps what the player had and defaults the rest.
 */
function migrateV0ToV1(input: RawSave): RawSave {
  const day = typeof input.day === 'number' ? input.day : 0
  const location = typeof input.location === 'string' ? input.location : 'dest.ugarit'
  const money = typeof input.money === 'number' ? input.money : 0
  const seed = typeof input.seed === 'string' ? input.seed : 'migrated'

  const state: GameState = createInitialState({ seed, location, money, day })

  return {
    saveVersion: 1,
    engineVersion: '0.1.0',
    contentVersions: state.meta.contentVersions,
    savedAt: typeof input.savedAt === 'string' ? input.savedAt : 'unknown',
    state,
  }
}

/**
 * v1 → v2.
 *
 * Cargo learned a cost basis so a sale can show gain or loss. A v1 save has no purchase
 * history to reconstruct, so its stacks are marked `null` (unknown), never zero: a zero
 * would claim the cargo was free. Migrations loaded from here on carry known values.
 */
function migrateV1ToV2(input: RawSave): RawSave {
  const state = asRecord(input.state)
  if (!state) return { ...input, saveVersion: 2 }

  const meta = asRecord(state.meta)
  const player = asRecord(state.player)
  const inventory = Array.isArray(player?.inventory) ? player.inventory : []
  const migratedInventory = inventory.map((entry) => {
    const cargo = asRecord(entry)
    if (!cargo) return entry
    return {
      ...cargo,
      costBasis: typeof cargo.costBasis === 'number' ? cargo.costBasis : null,
    }
  })

  return {
    ...input,
    saveVersion: 2,
    state: {
      ...state,
      ...(meta ? { meta: { ...meta, saveVersion: 2 } } : {}),
      ...(player ? { player: { ...player, inventory: migratedInventory } } : {}),
    },
  }
}

/**
 * v2 → v3.
 *
 * The traveller gained one light-survival track. A v2 run has no history of exertion,
 * so it opens at full stamina rather than at zero.
 */
function migrateV2ToV3(input: RawSave): RawSave {
  const state = asRecord(input.state)
  if (!state) return { ...input, saveVersion: 3 }

  const meta = asRecord(state.meta)
  const player = asRecord(state.player)

  return {
    ...input,
    saveVersion: 3,
    state: {
      ...state,
      ...(meta ? { meta: { ...meta, saveVersion: 3 } } : {}),
      ...(player ? { player: { ...player, stamina: STAMINA_MAX } } : {}),
    },
  }
}

/**
 * v3 → v4.
 *
 * Afflictions are new to the save. An older run has no authored conditions to restore,
 * so it opens clean rather than guessing that the traveller was ill.
 */
function migrateV3ToV4(input: RawSave): RawSave {
  const state = asRecord(input.state)
  if (!state) return { ...input, saveVersion: 4 }

  const meta = asRecord(state.meta)
  const player = asRecord(state.player)
  const rng = asRecord(state.rng)
  const seed = typeof meta?.seed === 'string' ? meta.seed : 'migrated'

  return {
    ...input,
    saveVersion: 4,
    state: {
      ...state,
      ...(meta ? { meta: { ...meta, saveVersion: 4 } } : {}),
      ...(player ? { player: { ...player, afflictions: [] } } : {}),
      ...(rng ? { rng: { ...rng, hazard: seedStream(seed, 'hazard') } } : {}),
    },
  }
}

/**
 * v4 → v5.
 *
 * A v4 run predates the three modes. It opens on the measured journey, which is the
 * balance every earlier save was actually played at.
 */
function migrateV4ToV5(input: RawSave): RawSave {
  const state = asRecord(input.state)
  if (!state) return { ...input, saveVersion: 5 }

  const meta = asRecord(state.meta)

  return {
    ...input,
    saveVersion: 5,
    state: {
      ...state,
      ...(meta
        ? { meta: { ...meta, saveVersion: 5, difficulty: DEFAULT_DIFFICULTY } }
        : {}),
    },
  }
}

/** Keyed by the version it reads, so a lookup is one line and a new version one entry. */
export const MIGRATIONS: Record<number, Migration> = {
  0: { from: 0, to: 1, migrate: migrateV0ToV1 },
  1: { from: 1, to: 2, migrate: migrateV1ToV2 },
  2: { from: 2, to: 3, migrate: migrateV2ToV3 },
  3: { from: 3, to: 4, migrate: migrateV3ToV4 },
  4: { from: 4, to: 5, migrate: migrateV4ToV5 },
}

/**
 * The entry that reads `fromVersion`, or `null` when the version is unknown or the entry
 * is misdeclared (a migration that does not move forward is not a migration).
 */
export function migrationFrom(fromVersion: number): Migration | null {
  const migration = MIGRATIONS[fromVersion]
  if (!migration) return null
  if (migration.from !== fromVersion || migration.to <= migration.from) return null
  return migration
}

export function migrateOnce(input: RawSave, fromVersion: number): RawSave | null {
  const migration = migrationFrom(fromVersion)
  const record = asRecord(input)
  if (!migration || !record) return null
  return migration.migrate(record)
}

export { asRecord }
