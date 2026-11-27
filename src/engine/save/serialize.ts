/**
 * Save format.
 *
 * The envelope carries versions and an informational timestamp; the state is the only
 * payload. `serialize` takes `savedAt` as an argument because the engine has no clock
 * (ADR-0003). Loading migrates first, then validates, and reports a typed error rather
 * than crashing.
 */

import { ENGINE_VERSION, SAVE_FORMAT_VERSION } from '../version'
import { validateState, type ValidationIssue } from '../state'
import type { GameState } from '../state'
import { asRecord, migrateOnce, migrationFrom } from './migrations'

export type SaveErrorCode =
  | 'not-a-save'
  | 'newer-save'
  | 'migration-failed'
  | 'invalid-state'

export interface SaveEnvelope {
  saveVersion: number
  engineVersion: string
  contentVersions: Record<string, number>
  /** Informational only. Injected by the caller; never read by the engine. */
  savedAt: string
  state: GameState
}

export class SaveError extends Error {
  readonly code: SaveErrorCode
  readonly issues?: ValidationIssue[]

  constructor(code: SaveErrorCode, message: string, issues?: ValidationIssue[]) {
    super(message)
    this.name = 'SaveError'
    this.code = code
    this.issues = issues
  }
}

export function serialize(state: GameState, options: { savedAt: string }): SaveEnvelope {
  return {
    saveVersion: SAVE_FORMAT_VERSION,
    engineVersion: ENGINE_VERSION,
    contentVersions: state.meta.contentVersions,
    savedAt: options.savedAt,
    state,
  }
}

export type LoadResult =
  | { ok: true; state: GameState; migratedFrom?: number }
  | { ok: false; error: SaveError }

export function deserialize(input: unknown): LoadResult {
  const envelope = asRecord(input)
  if (!envelope) {
    return { ok: false, error: new SaveError('not-a-save', 'That file is not a save.') }
  }

  const version = envelope.saveVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    return {
      ok: false,
      error: new SaveError('not-a-save', 'That file has no readable save version.'),
    }
  }

  if (version > SAVE_FORMAT_VERSION) {
    return {
      ok: false,
      error: new SaveError(
        'newer-save',
        `This save was written by a newer build (v${version}; this build reads v${SAVE_FORMAT_VERSION}).`,
      ),
    }
  }

  const migratedFrom = version < SAVE_FORMAT_VERSION ? version : undefined
  let current = envelope
  let currentVersion = version

  while (currentVersion < SAVE_FORMAT_VERSION) {
    const migration = migrationFrom(currentVersion)
    const migrated = migrateOnce(current, currentVersion)
    if (!migration) {
      return {
        ok: false,
        error: new SaveError(
          'migration-failed',
          `No migration from save version ${currentVersion}.`,
        ),
      }
    }
    if (!migrated) {
      return {
        ok: false,
        error: new SaveError('migration-failed', 'That save could not be migrated.'),
      }
    }
    if (migrated.saveVersion !== migration.to || migration.to > SAVE_FORMAT_VERSION) {
      return {
        ok: false,
        error: new SaveError('migration-failed', 'A migration did not advance the save version.'),
      }
    }
    current = migrated
    currentVersion = migration.to
  }

  const validated = validateState(current.state)
  if (!validated.ok) {
    return {
      ok: false,
      error: new SaveError(
        'invalid-state',
        `That save does not match the current state format (${validated.issues.length} problems).`,
        validated.issues,
      ),
    }
  }

  // The envelope's version is authoritative; a hand-edited inner `saveVersion` must not
  // leave the loaded state claiming a format this build does not write.
  const state: GameState =
    validated.state.meta.saveVersion === SAVE_FORMAT_VERSION
      ? validated.state
      : {
          ...validated.state,
          meta: { ...validated.state.meta, saveVersion: SAVE_FORMAT_VERSION },
        }

  return { ok: true, state, migratedFrom }
}

/** A readable dump for `pnpm save:inspect`. */
export function inspectSave(state: GameState): string {
  const lines: string[] = [
    `save      v${state.meta.saveVersion} · engine ${state.meta.engineVersion} · seed "${state.meta.seed}"`,
    `road      ${state.meta.difficulty}`,
    `day       ${state.calendar.day}`,
    `location  ${state.player.location}`,
    `money     ${state.player.money}`,
    `capacity  ${state.player.capacity} · transport ${state.player.transport}`,
    `cargo     ${state.player.inventory.map((entry) => `${entry.item} x${entry.quantity}`).join(', ') || '(empty)'}`,
    `languages ${Object.entries(state.player.languages)
      .map(([id, entry]) => `${id} ${entry.tier} (${entry.xp})`)
      .join(', ') || '(none)'}`,
    `journal   ${state.knowledge.journalEntries.length} entries`,
    `knowledge ${state.knowledge.entries.length} facts`,
    `deeds     ${state.player.deeds.length}`,
    `scheduled ${state.world.scheduled.map((entry) => `${entry.event}@${entry.dueDay}`).join(', ') || '(none)'}`,
    `pending   ${state.narrative.pending ? state.narrative.pending.dialogue : '(none)'}`,
    `journey   ${state.narrative.journey ? `${state.narrative.journey.route} -> ${state.narrative.journey.destination}` : '(none)'}`,
  ]
  return lines.join('\n')
}
