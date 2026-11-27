/**
 * Scenario runner.
 *
 * A scenario is data: an opening state, a list of entries, and assertions on the final
 * state or the events the run emitted. It is the engine's regression tool — every
 * mechanic gets one, and a failure is a typed result naming the scenario, the seed and
 * the step, with a readable trace instead of a stack trace.
 *
 * Two registries keep the vocabulary open:
 *
 * - `SCENARIO_ACTIONS` — entry kinds that are not engine commands (`save`). An entry is
 *   either a `Command` (it has a `type`) or an action (it has a `kind`).
 * - `ASSERTION_MATCHERS` — the comparison kinds (`equals`, `contains`, `length`).
 *
 * Adding either is one registry line, never a branch in the runner.
 */

import type { ContentIndex } from '../content'
import type { Command, DomainEvent } from '../kernel'
import { newGame, reduce } from '../kernel'
import { deserialize, serialize } from '../save'
import { createInitialState, type GameState, type NewGameInput } from '../state'
import { isGameDate, parseDate } from '../time'

/**
 * The timestamp every save step writes. The engine has no clock (ADR-0003), so the
 * runner injects a constant and two runs of one scenario stay byte-identical.
 */
export const SCENARIO_SAVED_AT = '1970-01-01T00:00:00.000Z'

export type ScenarioActionKind = 'save'

/** An entry that is not an engine command. */
export interface ScenarioAction {
  kind: ScenarioActionKind
}

export type ScenarioEntry = Command | ScenarioAction

export interface ScenarioStart extends Omit<NewGameInput, 'seed'> {
  /** Defaults to the scenario's seed when omitted. */
  seed?: string
  /** `1230-04-01`. Converted to a day count before the first entry. */
  date?: string
}

export type AssertionTarget = 'state' | 'events'

export interface ScenarioAssertion {
  /** Resolve against the final state (default) or the run's emitted events. */
  target?: AssertionTarget
  /** Resolve against one step's record instead of the run. */
  step?: number
  path: string
  equals?: unknown
  contains?: unknown
  length?: number
}

export interface Scenario {
  id: string
  seed: string
  start: ScenarioStart
  /** When true the run opens through `newGame`, so arrival scenes fire. */
  newGame?: boolean
  commands: ScenarioEntry[]
  assert: ScenarioAssertion[]
}

export interface ScenarioStep {
  index: number
  /** `command` for engine intents, otherwise the action kind. */
  kind: string
  command?: Command
  accepted: boolean
  reason?: string
  eventTypes: string[]
  /** The events this step emitted, for payload assertions. */
  events: DomainEvent[]
}

export interface ScenarioFailure {
  path: string
  message: string
  /** The step the assertion was scoped to, when it named one. */
  step?: number
}

export interface ScenarioResult {
  id: string
  seed: string
  ok: boolean
  steps: ScenarioStep[]
  failures: ScenarioFailure[]
  finalState: GameState
}

interface StepContext {
  state: GameState
  index: ContentIndex
}

interface StepOutcome {
  state: GameState
  events: DomainEvent[]
  rejected?: string
}

type StepRuntime = (ctx: StepContext, action: ScenarioAction) => StepOutcome

/**
 * The action registry. `save` writes the run through the save module's plain-JSON
 * envelope, reads it back, and continues from the loaded state — the round trip M1-T07
 * checks, exercised inside a scenario instead of beside it.
 */
export const SCENARIO_ACTIONS: Record<ScenarioActionKind, StepRuntime> = {
  save: ({ state }) => {
    const text = JSON.stringify(serialize(state, { savedAt: SCENARIO_SAVED_AT }))
    const loaded = deserialize(JSON.parse(text) as unknown)
    if (!loaded.ok) return { state, events: [], rejected: loaded.error.message }
    return { state: loaded.state, events: [] }
  },
}

export function isScenarioAction(entry: ScenarioEntry): entry is ScenarioAction {
  return 'kind' in entry
}

/**
 * Resolve `a.b.0.c` against a value.
 *
 * Keys may themselves contain dots (`relationships[\"char.ugarit.amnit\"]`), so at each
 * object step the longest matching key wins. Arrays use a single numeric segment.
 */
export function resolvePath(value: unknown, path: string): unknown {
  if (path === '') return value
  const segments = path.split('.')
  let current: unknown = value
  let index = 0

  while (index < segments.length) {
    if (current === null || current === undefined) return undefined

    if (Array.isArray(current)) {
      const arrayIndex = Number(segments[index])
      if (!Number.isInteger(arrayIndex)) return undefined
      current = current[arrayIndex]
      index += 1
      continue
    }

    if (typeof current !== 'object') return undefined
    const record = current as Record<string, unknown>

    let matched = false
    for (let end = segments.length; end > index; end -= 1) {
      const key = segments.slice(index, end).join('.')
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        current = record[key]
        index = end
        matched = true
        break
      }
    }
    if (!matched) return undefined
  }

  return current
}

export type AssertionKind = 'equals' | 'contains' | 'length'

interface AssertionMatcher {
  /** `null` when the assertion holds, otherwise the readable reason it does not. */
  check: (actual: unknown, assertion: ScenarioAssertion) => string | null
}

const show = (value: unknown): string => JSON.stringify(value) ?? String(value)

/** The matcher registry. Checked in a fixed order so a failure message is stable. */
export const ASSERTION_MATCHERS: Record<AssertionKind, AssertionMatcher> = {
  equals: {
    check: (actual, assertion) =>
      show(actual) === show(assertion.equals)
        ? null
        : `expected ${show(assertion.equals)}, found ${show(actual)}`,
  },
  contains: {
    check: (actual, assertion) => {
      const expected = assertion.contains
      const holds = Array.isArray(actual)
        ? actual.some((item) => show(item) === show(expected))
        : typeof actual === 'string' && typeof expected === 'string'
          ? actual.includes(expected)
          : false
      return holds ? null : `expected to contain ${show(expected)}, found ${show(actual)}`
    },
  },
  length: {
    check: (actual, assertion) => {
      const actualLength =
        Array.isArray(actual) || typeof actual === 'string' ? actual.length : undefined
      return actualLength === assertion.length
        ? null
        : `expected length ${String(assertion.length)}, found ${String(actualLength)}`
    },
  },
}

const ASSERTION_ORDER: AssertionKind[] = ['equals', 'contains', 'length']

function scopeOf(
  state: GameState,
  steps: ScenarioStep[],
  events: DomainEvent[],
  assertion: ScenarioAssertion,
): { value: unknown } | { failure: ScenarioFailure } {
  if (assertion.step !== undefined) {
    const step = steps[assertion.step]
    if (!step) {
      return {
        failure: {
          path: assertion.path,
          step: assertion.step,
          message: `step ${assertion.step} does not exist in this run`,
        },
      }
    }
    return {
      value: {
        kind: step.kind,
        command: step.command,
        accepted: step.accepted,
        reason: step.reason,
        eventTypes: step.eventTypes,
        events: step.events,
      },
    }
  }

  if (assertion.target === 'events') {
    return { value: { types: events.map((event) => event.type), events } }
  }

  return { value: state }
}

function checkAssertion(
  state: GameState,
  steps: ScenarioStep[],
  events: DomainEvent[],
  assertion: ScenarioAssertion,
): ScenarioFailure | null {
  const scope = scopeOf(state, steps, events, assertion)
  if ('failure' in scope) return scope.failure

  const actual = resolvePath(scope.value, assertion.path)

  for (const kind of ASSERTION_ORDER) {
    if (!(kind in assertion)) continue
    const message = ASSERTION_MATCHERS[kind].check(actual, assertion)
    if (message) {
      return { path: assertion.path, message, ...(assertion.step === undefined ? {} : { step: assertion.step }) }
    }
  }

  return null
}

function reasonOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.split('\n')[0] ?? 'the scenario could not be run'
}

/**
 * Build the opening state, or say why it cannot be built.
 *
 * A scenario file is authored data, so a bad date or an override the state schema refuses
 * must come back as a failure naming the field — never as a thrown `RangeError`/ZodError.
 */
function openingOf(
  scenario: Scenario,
  index: ContentIndex,
): { state: GameState } | { failure: ScenarioFailure } {
  const start = { ...scenario.start }
  if (start.date) {
    if (!isGameDate(start.date)) {
      return {
        failure: {
          path: 'start.date',
          message: `"${start.date}" is not a valid game date (expected YYYY-MM-DD)`,
        },
      }
    }
    start.day = parseDate(start.date)
    delete start.date
  }

  try {
    const state = scenario.newGame
      ? newGame({ ...start, seed: scenario.seed }, index).state
      : createInitialState({ ...start, seed: scenario.seed })
    return { state }
  } catch (error) {
    return { failure: { path: 'start', message: `The opening state was refused: ${reasonOf(error)}` } }
  }
}

export function runScenario(scenario: Scenario, index: ContentIndex): ScenarioResult {
  const opening = openingOf(scenario, index)

  if ('failure' in opening) {
    // Nothing ran, so nothing can be asserted. The result still carries a buildable opening
    // for the scenario's seed so `finalState` stays a state; `ok` is false and the single
    // failure names the field to fix.
    return {
      id: scenario.id,
      seed: scenario.seed,
      ok: false,
      steps: [],
      failures: [opening.failure],
      finalState: createInitialState({ seed: scenario.seed, location: 'dest.ugarit' }),
    }
  }

  let state = opening.state
  const steps: ScenarioStep[] = []
  const events: DomainEvent[] = []

  scenario.commands.forEach((entry, stepIndex) => {
    const failed = (reason: string, kind: string, command?: Command): void => {
      steps.push({ index: stepIndex, kind, command, accepted: false, reason, eventTypes: [], events: [] })
    }

    try {
      if (isScenarioAction(entry)) {
        const runtime = SCENARIO_ACTIONS[entry.kind as ScenarioActionKind]
        if (!runtime) {
          failed(`Unknown scenario action "${String(entry.kind)}".`, String(entry.kind))
          return
        }

        const outcome = runtime({ state, index }, entry)
        steps.push({
          index: stepIndex,
          kind: entry.kind,
          accepted: !outcome.rejected,
          reason: outcome.rejected,
          eventTypes: outcome.events.map((event) => event.type),
          events: outcome.events,
        })
        events.push(...outcome.events)
        if (!outcome.rejected) state = outcome.state
        return
      }

      const result = reduce(state, entry, index)
      const emitted = result.events.map((sequenced) => sequenced.event)
      steps.push({
        index: stepIndex,
        kind: 'command',
        command: entry,
        accepted: !result.rejected,
        reason: result.rejected?.reason,
        eventTypes: emitted.map((event) => event.type),
        events: emitted,
      })
      events.push(...emitted)
      if (!result.rejected) state = result.state
    } catch (error) {
      // A handler that throws is a bug, not an expected refusal; the run still ends with a
      // typed step failure naming the step instead of unwinding out of the runner.
      failed(
        `The runner could not run this step: ${reasonOf(error)}`,
        isScenarioAction(entry) ? String(entry.kind) : 'command',
        isScenarioAction(entry) ? undefined : entry,
      )
    }
  })

  const failures = scenario.assert
    .map((assertion) => checkAssertion(state, steps, events, assertion))
    .filter((failure): failure is ScenarioFailure => failure !== null)

  return { id: scenario.id, seed: scenario.seed, ok: failures.length === 0, steps, failures, finalState: state }
}

export function formatTrace(result: ScenarioResult): string {
  const lines: string[] = [
    `scenario ${result.id} (seed "${result.seed}") — ${result.ok ? 'ok' : 'FAILED'}`,
  ]

  for (const step of result.steps) {
    const marker = step.accepted ? '  ' : 'x '
    const what = step.command ? step.command.type : step.kind
    lines.push(
      `${marker}${step.index}. ${what}${
        step.reason ? ` (rejected: ${step.reason})` : ''
      }${step.eventTypes.length ? ` [${step.eventTypes.join(', ')}]` : ''}`,
    )
  }

  for (const failure of result.failures) {
    lines.push(`${failure.step === undefined ? '!' : `! step ${failure.step} ·`} ${failure.path}: ${failure.message}`)
  }

  return lines.join('\n')
}
