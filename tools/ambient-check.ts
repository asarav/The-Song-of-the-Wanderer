/**
 * Ambient time gate.
 *
 * Proves that every culture has enough day and night copy, every route has travel copy,
 * and the pure selector is deterministic without running the same observation twice on
 * consecutive days. It reads content through the same registry the game uses.
 *
 * Usage: `pnpm ambient:check [--json]`
 */

import { newGame } from '../src/engine/kernel'
import type { GameState } from '../src/engine/state'
import { deriveAmbient } from '../src/engine/views'
import { loadContent } from './simulate'

interface CheckResult {
  ok: boolean
  problems: string[]
  counts: { destinations: number; routes: number; observations: number }
}

function matchesScope(
  entry: { scope?: { destinations?: string[]; routes?: string[] } },
  kind: 'destination' | 'route',
  id: string,
): boolean {
  const list = kind === 'destination' ? entry.scope?.destinations : entry.scope?.routes
  return !list || list.includes(id)
}

function stateAt(day: number, location: string, base: GameState): GameState {
  return {
    ...base,
    calendar: { ...base.calendar, day },
    player: { ...base.player, location },
    narrative: { ...base.narrative, pending: null, journey: null },
  }
}

export async function checkAmbient(): Promise<CheckResult> {
  const index = await loadContent()
  const started = newGame(
    {
      seed: 'ambient-check',
      location: 'dest.ugarit',
      capacity: 20,
      languages: {},
      inventory: [],
      knownDestinations: [],
      knownRoutes: [],
      contentVersions: {},
    },
    index,
  ).state
  const problems: string[] = []

  let destinations = 0
  for (const destination of index.destinations.values()) {
    for (const culture of destination.cultures ?? []) {
      destinations += 1
      const day = [...index.ambient.values()].filter(
        (entry) =>
          entry.context === 'day' &&
          entry.cultures.includes(culture) &&
          matchesScope(entry, 'destination', destination.id),
      )
      const night = [...index.ambient.values()].filter(
        (entry) =>
          entry.context === 'night' &&
          entry.cultures.includes(culture) &&
          matchesScope(entry, 'destination', destination.id),
      )
      if (day.length < 4) {
        problems.push(`${destination.id} (${culture}) has ${day.length} day observations; 4 required`)
      }
      if (night.length < 4) {
        problems.push(`${destination.id} (${culture}) has ${night.length} night observations; 4 required`)
      }
      if ((destination.day?.events.length ?? 0) < 2) {
        problems.push(`${destination.id} has fewer than 2 daytime events`)
      }
      if ((destination.night?.events.length ?? 0) < 1) {
        problems.push(`${destination.id} has no night event`)
      }

      for (const context of ['day', 'night'] as const) {
        let previous: string | null = null
        for (let dayNumber = 0; dayNumber < 30; dayNumber += 1) {
          const state = stateAt(dayNumber, destination.id, started)
          const first = deriveAmbient(state, index, context)
          const second = deriveAmbient(state, index, context)
          if (first?.id !== second?.id) {
            problems.push(`${destination.id} ${context} selection is not deterministic`)
            break
          }
          if (!first) {
            problems.push(`${destination.id} ${context} has no eligible observation on day ${dayNumber}`)
            break
          }
          if (previous === first.id) {
            problems.push(`${destination.id} ${context} repeats ${first.id} on consecutive days`)
          }
          previous = first.id
        }
      }
    }
  }

  let routes = 0
  for (const route of index.routes.values()) {
    routes += 1
    const travel = [...index.ambient.values()].filter(
      (entry) => entry.context === 'travel' && matchesScope(entry, 'route', route.id),
    )
    if (travel.length < 6) {
      problems.push(`${route.id} has ${travel.length} travel observations; 6 required`)
    }
    let previous: string | null = null
    for (let dayNumber = 0; dayNumber < 30; dayNumber += 1) {
      const state = stateAt(dayNumber, route.id, started)
      const first = deriveAmbient(state, index, 'travel')
      if (!first) {
        problems.push(`${route.id} has no eligible travel observation on day ${dayNumber}`)
        break
      }
      if (previous === first.id) {
        problems.push(`${route.id} repeats ${first.id} on consecutive days`)
      }
      previous = first.id
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    counts: { destinations, routes, observations: index.ambient.size },
  }
}

async function main(): Promise<void> {
  const json = process.argv.includes('--json')
  try {
    const result = await checkAmbient()
    if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    else {
      for (const problem of result.problems) process.stdout.write(`ambient:check ${problem}\n`)
      process.stdout.write(
        `ambient:check - ${result.counts.observations} observations, ${result.counts.destinations} destination cultures, ${result.counts.routes} routes, ${result.problems.length} problems\n`,
      )
    }
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    process.stderr.write(`ambient:check: ${(error as Error).message}\n`)
    process.exitCode = 1
  }
}

void main()
