/**
 * State cloning.
 *
 * The reducer gives every command its own draft, so effects may write freely and the
 * caller's state is never touched. `JSON.parse(JSON.stringify(...))` is deliberate: it
 * also proves the state stays JSON-serialisable, which is an invariant of the save
 * format. A `structuredClone` would hide a `Map` or `Date` until the first save.
 */

export function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Recursively freeze a value, for the "no command mutates its input" test. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.getOwnPropertyNames(value)) {
      deepFreeze((value as Record<string, unknown>)[key])
    }
  }
  return value
}
