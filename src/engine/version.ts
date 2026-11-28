/**
 * Engine version constants.
 *
 * `ENGINE_VERSION` is informational. `SAVE_FORMAT_VERSION` is load-bearing:
 * bump it and add a migration in `src/engine/save/migrations.ts` whenever the
 * persisted `GameState` shape changes.
 */
export const ENGINE_VERSION = '0.1.0'

export const SAVE_FORMAT_VERSION = 7
