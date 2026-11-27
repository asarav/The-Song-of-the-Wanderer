/**
 * Journeys.
 *
 * A journey is a corridor with authored slots. Slots are generated once, at departure,
 * from the seeded streams and then stored in the save, so a reload mid-crossing resumes
 * exactly (M2-T04).
 *
 * The player's `location` is the route ID while travelling. Arrival is the only place
 * that sets it back to a destination.
 */

import { advanceDays } from '../time'
import { applyEffects } from '../dsl'
import type { RouteDef } from '../content'
import type { Journey, JourneySlot } from '../state'
import type { KernelContext } from '../kernel'
import { applyEvent, isEligible, selectEncounter } from './scheduler'
import { assessHazard } from '../world'

/** How many slots a crossing gets, and on which days, both authored per route. */
export function generateSlots(
  ctx: KernelContext,
  route: RouteDef,
  days: number,
  departDay: number,
): JourneySlot[] {
  const { min, max } = route.encountersPerJourney
  const count = ctx.rng.nextInt('encounters', Math.min(min, max), Math.max(min, max))
  if (count === 0) return []

  const slots: JourneySlot[] = []
  const scheduled = new Set<string>()
  const add = (atDay: number, event: string): void => {
    // A fixed stop and a random draw may name the same event. One crossing should not
    // show the same scene twice; keep the first scheduled occurrence.
    if (scheduled.has(event)) return
    scheduled.add(event)
    slots.push({ atDay, event })
  }

  // Authored waypoints are the corridor's fixed stops. A stop whose event is no longer
  // eligible is skipped by `continueJourney`, not drawn again.
  for (const waypoint of route.waypoints ?? []) {
    if (!waypoint.event || waypoint.afterDays > days) continue
    add(departDay + waypoint.afterDays, waypoint.event)
  }

  for (let i = 0; i < count; i += 1) {
    const offset = ctx.rng.nextInt('travel', 1, Math.max(1, days))
    const picked = ctx.rng.weightedPick(
      'encounters',
      route.encounters.map((entry) => ({ value: entry.event, weight: entry.weight })),
    )
    if (picked) add(departDay + offset, picked)
  }

  return slots.sort((a, b) => (a.atDay === b.atDay ? a.event.localeCompare(b.event) : a.atDay - b.atDay))
}

export function startJourney(
  ctx: KernelContext,
  route: RouteDef,
  modeId: string,
  days: number,
  /** The end of the corridor being sailed to; defaults to the route's authored end. */
  destination: string = route.to,
): Journey {
  const mode = route.modes.find((candidate) => candidate.id === modeId)
  if (!mode) throw new RangeError(`Unknown travel mode "${modeId}".`)

  const departDay = ctx.state.calendar.day
  const journey: Journey = {
    route: route.id,
    mode: mode.id,
    origin: ctx.state.player.location,
    destination,
    departedAt: departDay,
    arrivesAt: departDay + days,
    slots: generateSlots(ctx, route, days, departDay),
    nextSlot: 0,
  }

  // One derived question per journey. The answer is a scene from the route's authored
  // outcomes, never an inline random table. Rescues and wrecks are content.
  const hazard = assessHazard(ctx.state, route, mode, destination, ctx.index)
  if (hazard) {
    const roll = ctx.rng.nextInt('hazard', 1, 100)
    ctx.events.push({
      type: 'HazardRolled',
      route: route.id,
      mode: mode.id,
      chance: hazard.chance,
      roll,
    })
    if (roll <= hazard.chance) {
      const picked = ctx.rng.weightedPick(
        'hazard',
        route.hazard?.outcomes.map((outcome) => ({
          value: outcome.event,
          weight: outcome.weight,
        })) ?? [],
      )
      if (picked && !journey.slots.some((slot) => slot.event === picked)) {
        const atDay = departDay + ctx.rng.nextInt('hazard', 1, days)
        journey.slots.push({ atDay, event: picked })
        journey.slots.sort((a, b) =>
          a.atDay === b.atDay ? a.event.localeCompare(b.event) : a.atDay - b.atDay,
        )
        ctx.events.push({ type: 'HazardTriggered', route: route.id, event: picked })
      }
    }
  }

  ctx.state.player.location = route.id
  ctx.state.narrative.journey = journey
  ctx.events.push({
    type: 'JourneyStarted',
    route: route.id,
    mode: mode.id,
    arrivesAt: journey.arrivesAt,
  })
  return journey
}

/**
 * Move the journey forward to its next stop, presenting a scene if one is due.
 *
 * Loops because a slot may hold an event that is no longer eligible: in that case the
 * journey skips it and continues.
 */
export function continueJourney(ctx: KernelContext): void {
  const journey = ctx.state.narrative.journey
  if (!journey) return
  if (ctx.state.narrative.pending) return

  // A choice on the road can spend the last of the traveller's strength. The road does
  // not kill them: it gives them back to the last port, lighter and later.
  if (ctx.state.player.flags['road.exhausted']) {
    collapseJourney(ctx, journey)
    return
  }

  for (let guard = 0; guard < 32; guard += 1) {
    const slot = journey.slots[journey.nextSlot]

    if (slot && slot.atDay <= journey.arrivesAt && slot.atDay <= ctx.state.calendar.day) {
      journey.nextSlot += 1
      const event = ctx.index.events.get(slot.event)
      if (!event) continue
      const applied = applyEvent(ctx, event)
      if (applied.presented) return
      continue
    }

    const target = slot ? Math.min(slot.atDay, journey.arrivesAt) : journey.arrivesAt
    if (ctx.state.calendar.day < target) {
      const days = target - ctx.state.calendar.day
      ctx.state = advanceDays(ctx.state, days)
      ctx.events.push({ type: 'TimeAdvanced', days, day: ctx.state.calendar.day })
      continue
    }

    arrive(ctx)
    return
  }
}

/**
 * The return from exhaustion. The traveller wakes at the port they left, two days later,
 * with one load gone and enough strength to try again. The journal and the story survive;
 * the time, the cargo and the distance do not.
 */
function collapseJourney(ctx: KernelContext, journey: Journey): void {
  const route = ctx.index.routes.get(journey.route)
  ctx.state.narrative.journey = null
  ctx.state.player.flags['road.exhausted'] = false
  ctx.state.player.location = journey.origin
  ctx.state.player.stamina = 2
  ctx.state = advanceDays(ctx.state, 2)
  ctx.events.push({ type: 'TimeAdvanced', days: 2, day: ctx.state.calendar.day })
  applyEffects([{ loseCargo: { quantity: 1 } }], ctx)
  ctx.events.push({
    type: 'JourneyCollapsed',
    route: journey.route,
    origin: journey.origin,
    day: ctx.state.calendar.day,
  })

  const dialogueId = route?.exhaustionDialogue
  const dialogue = dialogueId ? ctx.index.dialogues.get(dialogueId) : undefined
  if (dialogue) {
    ctx.state.narrative.pending = {
      kind: 'dialogue',
      dialogue: dialogue.id,
      node: dialogue.start,
    }
    ctx.events.push({
      type: 'DialoguePresented',
      dialogue: dialogue.id,
      node: dialogue.start,
    })
  }
}

function arrive(ctx: KernelContext): void {
  const journey = ctx.state.narrative.journey
  if (!journey) return

  ctx.state.player.location = journey.destination
  ctx.state.narrative.journey = null

  if (!ctx.state.knowledge.knownDestinations.includes(journey.destination)) {
    ctx.state.knowledge.knownDestinations.push(journey.destination)
  }

  ctx.state.player.deeds.push({
    id: `deed.travelled.${journey.route}.${ctx.state.calendar.day}`,
    kind: 'travelled',
    day: ctx.state.calendar.day,
    // Read as "travelled · <crossing>" at "<place>": the deed is the crossing, the
    // place is where it put the traveller.
    place: journey.destination,
    subject: journey.route,
    witnesses: [],
    knowledge: [],
  })

  ctx.events.push({ type: 'JourneyArrived', destination: journey.destination, day: ctx.state.calendar.day })

  // Arrival scenes are authored on the destination, never drawn at random.
  const destination = ctx.index.destinations.get(journey.destination)
  if (destination?.onArrival) {
    const event = ctx.index.events.get(destination.onArrival)
    if (event && isEligible(ctx.state, event, ctx.content, ctx.rng)) {
      applyEvent(ctx, event)
    }
  }
}

/** Present the next encounter slot without travelling further (used by tests and the UI). */
export function peekJourney(state: { narrative: { journey: Journey | null } }): Journey | null {
  return state.narrative.journey
}

export function routeEncounterCandidates(ctx: KernelContext, routeId: string) {
  const route = ctx.index.routes.get(routeId)
  return route ? selectEncounter(ctx, route.encounters) : null
}
