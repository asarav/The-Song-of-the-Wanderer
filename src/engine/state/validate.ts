/**
 * State validation with readable paths.
 *
 * `validateState` never throws for bad input: it returns a list of `path: message`
 * issues so save loading, the linter, and tests can all report the same failure.
 */

import { GameStateSchema, type GameState } from './schema'

export interface ValidationIssue {
  /** Dotted path into the state, or `(root)` for problems with the object itself. */
  path: string
  message: string
}

export type ValidationResult =
  | { ok: true; state: GameState }
  | { ok: false; issues: ValidationIssue[] }

function formatPath(path: readonly (string | number | symbol)[]): string {
  if (path.length === 0) return '(root)'
  return path
    .map((segment) => (typeof segment === 'number' ? `[${segment}]` : String(segment)))
    .join('.')
    .replace(/\.\[/g, '[')
}

export function validateState(input: unknown): ValidationResult {
  const parsed = GameStateSchema.safeParse(input)
  if (parsed.success) {
    return { ok: true, state: parsed.data }
  }

  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message,
    })),
  }
}

/** Convenience for tests and the save loader: the issues, or an empty list. */
export function stateIssues(input: unknown): ValidationIssue[] {
  const result = validateState(input)
  return result.ok ? [] : result.issues
}

export function isGameState(input: unknown): input is GameState {
  return GameStateSchema.safeParse(input).success
}
