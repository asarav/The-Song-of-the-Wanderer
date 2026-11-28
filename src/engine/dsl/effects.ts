/**
 * Effect atoms.
 *
 * Every effect clamps rather than throwing: a save must never fail because a contract
 * paid more than the player had. Each clamp emits `EffectClamped` so the interface and
 * tests can see what happened. Effects are applied in array order (ADR-0002).
 */

import { z } from 'zod'

import type { DomainEvent } from '../kernel'
import { addLanguageXp } from '../culture'
import { createInitialState } from '../state'
import {
  cloneState,
  CHARACTER_STATUSES,
  DEED_KINDS,
  DIMENSION_MAX,
  DIMENSION_MIN,
  AFFLICTION_MAX,
  FACTION_DIMENSIONS,
  KNOWLEDGE_SOURCES,
  BELIEFS,
  RELATIONSHIP_DIMENSIONS,
  STAMINA_MAX,
  regardBand,
  type CharacterRuntimeState,
  type FactionState,
  type GameState,
  type Relationship,
} from '../state'
import { advanceDays } from '../time'
import { MAX_EFFECTS } from './limits'
import type { Effect, EffectAtom, EffectContext, DslContent } from './types'
import type { RngCursor } from '../rng'

const relationshipDimensionSchema = z.enum(RELATIONSHIP_DIMENSIONS)
const factionDimensionSchema = z.enum(FACTION_DIMENSIONS)

function clampDimension(value: number): number {
  return Math.min(DIMENSION_MAX, Math.max(DIMENSION_MIN, value))
}

export function zeroRelationship(): Relationship {
  return { trust: 0, affection: 0, obligation: 0, fear: 0, respect: 0 }
}

export function zeroFaction(): FactionState {
  return { trust: 0, favour: 0, obligation: 0, standing: 0, suspicion: 0 }
}

function ensureRelationship(ctx: EffectContext, characterId: string): Relationship {
  const existing = ctx.state.narrative.relationships[characterId]
  if (existing) return existing
  const created = zeroRelationship()
  ctx.state.narrative.relationships[characterId] = created
  return created
}

function ensureFaction(ctx: EffectContext, factionId: string): FactionState {
  const existing = ctx.state.narrative.factions[factionId]
  if (existing) return existing
  const created = zeroFaction()
  ctx.state.narrative.factions[factionId] = created
  return created
}

function ensureCharacter(ctx: EffectContext, characterId: string): CharacterRuntimeState {
  const existing = ctx.state.narrative.characterStates[characterId]
  if (existing) return existing

  const created: CharacterRuntimeState = {
    status: 'alive',
    location: ctx.content.characterHome(characterId) ?? 'unknown',
    age: 'unknown',
    relationships: {},
    flags: {},
  }
  ctx.state.narrative.characterStates[characterId] = created
  return created
}

/**
 * The cargo a scene means when it says "the load": the largest unprotected stack,
 * ties broken by item id so the same state always loses the same thing.
 */
export function pickCargoItem(
  inventory: readonly { item: string; quantity: number; protected?: boolean }[],
): string | undefined {
  let best: { item: string; quantity: number } | undefined
  for (const entry of inventory) {
    if (entry.quantity <= 0 || entry.protected) continue
    if (
      !best ||
      entry.quantity > best.quantity ||
      (entry.quantity === best.quantity && entry.item.localeCompare(best.item) < 0)
    ) {
      best = { item: entry.item, quantity: entry.quantity }
    }
  }
  return best?.item
}

/** Removes cargo the player actually holds, clamping and reporting shortfalls. */
function removeCargo(ctx: EffectContext, item: string, quantity: number, effect: string): void {
  const current = inventoryQuantity(ctx.state, item)
  const entry = ctx.state.player.inventory.find((cargo) => cargo.item === item)
  const wanted = Math.min(current, Math.abs(quantity))
  const removable = entry?.protected ? 0 : wanted
  if (removable < Math.abs(quantity)) {
    ctx.events.push(
      clampEvent(
        effect,
        -quantity,
        -removable,
        entry?.protected ? 'protected cargo cannot be lost' : 'not enough cargo to remove',
      ),
    )
  }
  if (removable > 0 && entry) {
    // Cost follows the units that leave the hold. A null basis is unknown, so it stays
    // unknown; omitting it means known zero (gift or starting cargo).
    if (entry.costBasis !== null && entry.costBasis !== undefined) {
      const removedBasis = Math.round((entry.costBasis * removable) / current)
      entry.costBasis = entry.costBasis - removedBasis
    }
    entry.quantity -= removable
    if (entry.quantity <= 0) {
      ctx.state.player.inventory = ctx.state.player.inventory.filter(
        (cargo) => cargo.item !== item,
      )
    }
    ctx.events.push({
      type: 'ItemChanged',
      item,
      delta: -removable,
      quantity: current - removable,
    })
  }
}

function inventoryQuantity(state: GameState, item: string): number {
  const entry = state.player.inventory.find((cargo) => cargo.item === item)
  return entry?.quantity ?? 0
}

function usedCapacity(state: GameState, content: DslContent): number {
  return state.player.inventory.reduce(
    (total, entry) => total + entry.quantity * content.itemWeight(entry.item),
    0,
  )
}

function clampEvent(
  effect: string,
  requested: number,
  applied: number,
  reason: string,
): DomainEvent {
  return { type: 'EffectClamped', effect, requested, applied, reason }
}

/** Closed vocabulary of remedies. A new tag needs an engine path that supplies it. */
export const TREATMENT_TAGS = [
  'town',
  'rest',
  'water',
  'food',
  'healer',
  'antidote',
  'shrine',
] as const

export const EFFECT_ATOMS: Record<string, EffectAtom> = {
  money: {
    schema: z.int(),
    apply: (payload, ctx) => {
      const delta = payload as number
      const before = ctx.state.player.money
      const after = before + delta
      if (after < 0) {
        ctx.state.player.money = 0
        ctx.events.push(clampEvent('money', delta, -before, 'money cannot fall below zero'))
      } else {
        ctx.state.player.money = after
      }
      ctx.events.push({ type: 'MoneyChanged', delta, money: ctx.state.player.money })
    },
  },

  /** The one light-survival track. Clamped, reported, and never below zero. */
  stamina: {
    schema: z.int(),
    apply: (payload, ctx) => {
      const delta = payload as number
      const before = ctx.state.player.stamina
      const after = Math.min(STAMINA_MAX, Math.max(0, before + delta))
      ctx.state.player.stamina = after
      ctx.events.push({ type: 'StaminaChanged', delta: after - before, stamina: after })
      if (after - before !== delta) {
        ctx.events.push(clampEvent('stamina', delta, after - before, 'stamina cannot leave its range'))
      }
      // A choice can spend the last of the traveller's strength on the road. The journey
      // reads this flag after the scene ends and returns them to the last port.
      if (after === 0 && ctx.state.narrative.journey) {
        ctx.state.player.flags['road.exhausted'] = true
      }
    },
  },

  /** A lasting condition. Adding is idempotent; removing a missing one is a no-op. */
  affliction: {
    schema: z
      .object({
        id: z.string().min(1),
        source: z.string().optional(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { id, source } = payload as {
        id: string
        source?: string
      }
      const existing = ctx.state.player.afflictions.find((entry) => entry.id === id)
      if (existing) return
      if (ctx.state.player.afflictions.length >= AFFLICTION_MAX) {
        ctx.events.push(
          clampEvent('affliction', 1, 0, 'too many afflictions are already active'),
        )
        return
      }
      ctx.state.player.afflictions.push({
        id,
        sinceDay: ctx.state.calendar.day,
        ...(source === undefined ? {} : { source }),
      })
      ctx.events.push({ type: 'AfflictionChanged', id, active: true })
    },
  },

  /** A treatment tag. A town day, a rest, a healer or a shrine applies one. */
  treatment: {
    schema: z.enum(TREATMENT_TAGS),
    apply: (payload, ctx) => {
      const tag = payload as string
      const removed = ctx.state.player.afflictions
        .filter((entry) => ctx.content.afflictionTreatments(entry.id).includes(tag))
        .map((entry) => entry.id)
      if (removed.length === 0) return
      ctx.state.player.afflictions = ctx.state.player.afflictions.filter(
        (entry) => !removed.includes(entry.id),
      )
      for (const id of removed) {
        ctx.events.push({ type: 'AfflictionChanged', id, active: false })
      }
      ctx.events.push({ type: 'Treated', treatment: tag, removed })
    },
  },

  items: {
    schema: z
      .object({
        item: z.string().min(1),
        quantity: z.int(),
        /** Total silver paid for the added quantity; omitted means no cash cost. */
        cost: z.int().min(0).optional(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { item, quantity, cost } = payload as {
        item: string
        quantity: number
        cost?: number
      }
      if (quantity === 0) return
      const current = inventoryQuantity(ctx.state, item)
      const entry = ctx.state.player.inventory.find((cargo) => cargo.item === item)

      if (quantity > 0) {
        const weight = ctx.content.itemWeight(item)
        const free = Math.max(0, ctx.state.player.capacity - usedCapacity(ctx.state, ctx.content))
        const allowed = weight <= 0 ? quantity : Math.floor(free / weight)
        const applied = Math.min(quantity, allowed)
        if (applied < quantity) {
          ctx.events.push(clampEvent('items', quantity, applied, 'not enough carrying capacity'))
        }
        if (applied > 0) {
          const costPart =
            cost === undefined ? undefined : Math.round((cost * applied) / quantity)
          if (entry) {
            entry.quantity += applied
            if (costPart !== undefined && entry.costBasis !== null) {
              entry.costBasis = (entry.costBasis ?? 0) + costPart
            }
          } else {
            ctx.state.player.inventory.push({
              item,
              quantity: applied,
              ...(costPart === undefined ? {} : { costBasis: costPart }),
            })
          }
          ctx.events.push({
            type: 'ItemChanged',
            item,
            delta: applied,
            quantity: current + applied,
          })
        }
        return
      }

      removeCargo(ctx, item, quantity, 'items')
    },
  },

  loseCargo: {
    schema: z.object({ quantity: z.int().min(1) }).strict(),
    apply: (payload, ctx) => {
      const { quantity } = payload as { quantity: number }
      const item = pickCargoItem(ctx.state.player.inventory)
      if (!item) {
        ctx.events.push(clampEvent('loseCargo', -quantity, 0, 'nothing in the hold to lose'))
        return
      }
      removeCargo(ctx, item, quantity, 'loseCargo')
    },
  },

  advanceTime: {
    schema: z.object({ days: z.int().min(0) }).strict(),
    apply: (payload, ctx) => {
      const { days } = payload as { days: number }
      if (days === 0) return
      ctx.state = advanceDays(ctx.state, days)
      ctx.events.push({ type: 'TimeAdvanced', days, day: ctx.state.calendar.day })
    },
  },

  relationship: {
    schema: z
      .object({
        character: z.string().min(1),
        dimension: relationshipDimensionSchema.optional(),
        delta: z.int(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { character, dimension, delta } = payload as {
        character: string
        dimension?: (typeof RELATIONSHIP_DIMENSIONS)[number]
        delta: number
      }
      const key = dimension ?? 'trust'
      const relationship = ensureRelationship(ctx, character)
      const before = relationship[key]
      const beforeBand = regardBand(relationship)
      const after = clampDimension(before + delta)
      relationship[key] = after
      ctx.events.push({
        type: 'RelationshipChanged',
        character,
        dimension: key,
        delta: after - before,
        value: after,
      })
      const afterBand = regardBand(relationship)
      if (afterBand !== beforeBand) {
        ctx.events.push({
          type: 'RegardChanged',
          character,
          from: beforeBand,
          to: afterBand,
        })
      }
      if (after - before !== delta) {
        ctx.events.push(clampEvent(`relationship.${key}`, delta, after - before, 'dimension capped'))
      }
    },
  },

  faction: {
    schema: z
      .object({
        faction: z.string().min(1),
        dimension: factionDimensionSchema.optional(),
        delta: z.int(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { faction, dimension, delta } = payload as {
        faction: string
        dimension?: (typeof FACTION_DIMENSIONS)[number]
        delta: number
      }
      const key = dimension ?? 'standing'
      const state = ensureFaction(ctx, faction)
      const before = state[key]
      const after = clampDimension(before + delta)
      state[key] = after
      ctx.events.push({
        type: 'FactionChanged',
        faction,
        dimension: key,
        delta: after - before,
        value: after,
      })
      if (after - before !== delta) {
        ctx.events.push(clampEvent(`faction.${key}`, delta, after - before, 'dimension capped'))
      }
    },
  },

  promise: {
    schema: z
      .object({
        id: z.string().min(1),
        character: z.string().min(1),
        kind: z.enum(['promise', 'debt']),
        text: z.string().min(1),
        dueDay: z.int().min(0).optional(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { id, character, kind, text, dueDay } = payload as {
        id: string
        character: string
        kind: 'promise' | 'debt'
        text: string
        dueDay?: number
      }
      if (ctx.state.narrative.promises.some((entry) => entry.id === id)) return
      ctx.state.narrative.promises.push({
        id,
        character,
        kind,
        text,
        openedDay: ctx.state.calendar.day,
        ...(dueDay === undefined ? {} : { dueDay }),
        status: 'open',
      })
      ctx.events.push({
        type: 'PromiseOpened',
        id,
        character,
        kind,
        ...(dueDay === undefined ? {} : { dueDay }),
      })
    },
  },

  settlePromise: {
    schema: z
      .object({ id: z.string().min(1), status: z.enum(['settled', 'broken']).optional() })
      .strict(),
    apply: (payload, ctx) => {
      const { id, status = 'settled' } = payload as {
        id: string
        status?: 'settled' | 'broken'
      }
      const promise = ctx.state.narrative.promises.find((entry) => entry.id === id)
      if (!promise || promise.status !== 'open') return
      promise.status = status
      promise.closedDay = ctx.state.calendar.day
      ctx.events.push({
        type: 'PromiseSettled',
        id,
        character: promise.character,
        status,
      })
    },
  },

  markTopic: {
    schema: z.object({ character: z.string().min(1), topic: z.string().min(1) }).strict(),
    apply: (payload, ctx) => {
      const { character, topic } = payload as { character: string; topic: string }
      const state = ensureCharacter(ctx, character)
      state.topics = state.topics ?? []
      if (state.topics.includes(topic)) return
      state.topics.push(topic)
      ctx.events.push({ type: 'TopicMarked', character, topic })
    },
  },

  flag: {
    schema: z.union([
      z.string().min(1),
      z
        .object({
          name: z.string().min(1),
          value: z.union([z.boolean(), z.int(), z.string()]),
        })
        .strict(),
    ]),
    apply: (payload, ctx) => {
      const parsed =
        typeof payload === 'string'
          ? { name: payload, value: true }
          : (payload as { name: string; value: boolean | number | string })
      ctx.state.player.flags[parsed.name] = parsed.value
      ctx.events.push({ type: 'FlagSet', name: parsed.name, value: parsed.value })
    },
  },

  schedule: {
    schema: z.object({ event: z.string().min(1), inDays: z.int().min(0) }).strict(),
    apply: (payload, ctx) => {
      const { event, inDays } = payload as { event: string; inDays: number }
      const dueDay = ctx.state.calendar.day + inDays
      ctx.state.world.scheduled.push({ event, dueDay })
      ctx.events.push({ type: 'EventScheduled', event, dueDay })
    },
  },

  journal: {
    schema: z.object({ entry: z.string().min(1) }).strict(),
    apply: (payload, ctx) => {
      const { entry } = payload as { entry: string }
      if (!ctx.state.knowledge.journalEntries.includes(entry)) {
        ctx.state.knowledge.journalEntries.push(entry)
      }
      ctx.events.push({ type: 'JournalEntryAdded', entry })
    },
  },

  languageXp: {
    schema: z.object({ language: z.string().min(1), amount: z.int() }).strict(),
    apply: (payload, ctx) => {
      const { language, amount } = payload as { language: string; amount: number }
      const current = ctx.state.player.languages[language] ?? { xp: 0, tier: 'unfamiliar' as const }
      const progress = addLanguageXp(current, amount)
      ctx.state.player.languages[language] = progress.language
      const applied = progress.language.xp - current.xp
      if (applied !== amount) {
        ctx.events.push(clampEvent('languageXp', amount, applied, 'xp cannot fall below zero'))
      }
      ctx.events.push({
        type: 'LanguageXpGained',
        language,
        amount,
        xp: progress.language.xp,
        tier: progress.language.tier,
        tierChanged: progress.tierChanged,
      })
    },
  },

  moveCharacter: {
    schema: z.object({ character: z.string().min(1), to: z.string().min(1) }).strict(),
    apply: (payload, ctx) => {
      const { character, to } = payload as { character: string; to: string }
      const state = ensureCharacter(ctx, character)
      const from = state.location
      state.location = to
      if (state.status === 'displaced' || state.status === 'missing') state.status = 'alive'
      ctx.events.push({ type: 'CharacterMoved', character, from, to })
    },
  },

  characterStatus: {
    schema: z
      .object({ character: z.string().min(1), status: z.enum(CHARACTER_STATUSES) })
      .strict(),
    apply: (payload, ctx) => {
      const { character, status } = payload as {
        character: string
        status: (typeof CHARACTER_STATUSES)[number]
      }
      const state = ensureCharacter(ctx, character)
      state.status = status
      ctx.events.push({ type: 'CharacterStatusChanged', character, status })
    },
  },

  unlockRoute: {
    schema: z.string().min(1),
    apply: (payload, ctx) => {
      const route = payload as string
      ctx.state.world.routeStates[route] = 'open'
      // A route someone has told you about is knowledge as well as world state;
      // otherwise the map and travel screens still say you have never heard of it.
      if (!ctx.state.knowledge.knownRoutes.includes(route)) {
        ctx.state.knowledge.knownRoutes.push(route)
      }
      ctx.events.push({ type: 'RouteStateChanged', route, state: 'open' })
    },
  },

  closeRoute: {
    schema: z.string().min(1),
    apply: (payload, ctx) => {
      const route = payload as string
      ctx.state.world.routeStates[route] = 'closed'
      ctx.events.push({ type: 'RouteStateChanged', route, state: 'closed' })
    },
  },

  destinationState: {
    schema: z
      .object({
        destination: z.string().min(1),
        state: z.string().min(1),
        active: z.boolean().optional(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { destination, state: name, active = true } = payload as {
        destination: string
        state: string
        active?: boolean
      }
      const current = ctx.state.world.destinationStates[destination] ?? []
      const next = active
        ? Array.from(new Set([...current, name]))
        : current.filter((entry) => entry !== name)
      ctx.state.world.destinationStates[destination] = next
      ctx.events.push({ type: 'DestinationStateChanged', destination, state: name, active })
    },
  },

  migration: {
    schema: z
      .object({
        group: z.string().min(1),
        from: z.string().min(1),
        to: z.string().min(1),
        outcome: z.string().optional(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { group, from, to, outcome } = payload as {
        group: string
        from: string
        to: string
        outcome?: string
      }
      ctx.state.world.migrations.push({
        group,
        from,
        to,
        day: ctx.state.calendar.day,
        outcome,
      })
      ctx.events.push({ type: 'MigrationRecorded', group, from, to })
    },
  },

  arc: {
    schema: z.object({ arc: z.string().min(1), beat: z.string().min(1), owner: z.string().min(1) }).strict(),
    apply: (payload, ctx) => {
      const { arc, beat, owner } = payload as { arc: string; beat: string; owner: string }
      const existing = ctx.state.narrative.arcStates[arc]
      ctx.state.narrative.arcStates[arc] = {
        arc,
        owner: existing?.owner ?? owner,
        current: beat,
        flags: existing?.flags ?? {},
        lastAdvanced: ctx.state.calendar.day,
        visibility: existing?.visibility ?? 'player-present',
        stranded: false,
      }
      ctx.events.push({ type: 'ArcAdvanced', arc, beat })
    },
  },

  deed: {
    schema: z
      .object({
        id: z.string().min(1),
        kind: z.enum(DEED_KINDS),
        subject: z.string().min(1),
        witnesses: z.array(z.string()).optional(),
        consequence: z.string().optional(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const { id, kind, subject, witnesses, consequence } = payload as {
        id: string
        kind: (typeof DEED_KINDS)[number]
        subject: string
        witnesses?: string[]
        consequence?: string
      }
      if (ctx.state.player.deeds.some((deed) => deed.id === id)) return
      ctx.state.player.deeds.push({
        id,
        kind,
        day: ctx.state.calendar.day,
        place: ctx.state.player.location,
        subject,
        witnesses: witnesses ?? [],
        knowledge: [],
        consequence,
      })
      ctx.events.push({ type: 'DeedRecorded', deed: id, kind, subject })
    },
  },

  knowledge: {
    schema: z
      .object({
        fact: z.string().min(1),
        source: z.enum(KNOWLEDGE_SOURCES).optional(),
        reliability: z.number().min(0).max(1).optional(),
        belief: z.enum(BELIEFS).optional(),
        detail: z.string().optional(),
      })
      .strict(),
    apply: (payload, ctx) => {
      const {
        fact,
        source = 'told',
        reliability = 0.9,
        belief = 'believed',
        detail,
      } = payload as {
        fact: string
        source?: (typeof KNOWLEDGE_SOURCES)[number]
        reliability?: number
        belief?: (typeof BELIEFS)[number]
        detail?: string
      }
      ctx.state.knowledge.entries.push({
        fact,
        learnedAt: ctx.state.calendar.day,
        source,
        reliability,
        belief,
        detail,
      })
      ctx.events.push({ type: 'KnowledgeLearned', fact, source, belief })
    },
  },
}

const effectSchemas: z.ZodType[] = Object.entries(EFFECT_ATOMS).map(([name, atom]) =>
  z.object({ [name]: atom.schema }).strict(),
)

export const effectSchema: z.ZodType<Effect> = z.lazy(
  () => z.union(effectSchemas as unknown as [z.ZodType, ...z.ZodType[]]) as unknown as z.ZodType<Effect>,
)

export interface EffectParseResult {
  ok: boolean
  effects?: Effect[]
  issues: string[]
}

export function parseEffects(input: unknown): EffectParseResult {
  const parsed = z.array(effectSchema).safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
    }
  }
  if (parsed.data.length > MAX_EFFECTS) {
    return { ok: false, issues: [`${parsed.data.length} effects (limit ${MAX_EFFECTS})`] }
  }
  return { ok: true, effects: parsed.data, issues: [] }
}

function atomNameOf(effect: Effect): string | undefined {
  return Object.keys(effect as unknown as Record<string, unknown>)[0]
}

/** Apply effects in order to a mutable draft. Never throws for authored content. */
export function applyEffects(effects: readonly Effect[], ctx: EffectContext): void {
  const list = effects.slice(0, MAX_EFFECTS)
  if (effects.length > MAX_EFFECTS) {
    ctx.events.push(
      clampEvent('effects', effects.length, list.length, `limit is ${MAX_EFFECTS} effects`),
    )
  }

  for (const effect of list) {
    const name = atomNameOf(effect)
    if (!name) continue
    const atom = EFFECT_ATOMS[name]
    if (!atom) {
      ctx.events.push({ type: 'EffectSkipped', effect: name, reason: 'unknown effect' })
      continue
    }
    const payload = (effect as unknown as Record<string, unknown>)[name]
    const validated = atom.schema.safeParse(payload)
    if (!validated.success) {
      ctx.events.push({ type: 'EffectSkipped', effect: name, reason: 'invalid payload' })
      continue
    }
    atom.apply(validated.data, ctx)
  }
}

export interface RunEffectsResult {
  state: GameState
  events: DomainEvent[]
}

/**
 * Apply effects to a clone of the state. The convenience entry point for the reducer,
 * tests, and the scenario runner.
 */
export function runEffects(
  state: GameState,
  effects: readonly Effect[],
  content: DslContent,
  rng: RngCursor,
): RunEffectsResult {
  const draft = cloneState(state)
  const ctx: EffectContext = { state: draft, content, rng, events: [] }
  applyEffects(effects, ctx)
  return { state: ctx.state, events: ctx.events }
}

/** A blank state, for content validation and unit tests that need a derive target. */
export function emptyState(seed = 'dsl'): GameState {
  return createInitialState({ seed, location: 'dest.nowhere' })
}

export function effectAtomNames(): string[] {
  return Object.keys(EFFECT_ATOMS).sort()
}
