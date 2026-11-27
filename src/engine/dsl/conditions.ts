/**
 * Condition atoms.
 *
 * The registry maps a name to `{ schema, evaluate }`. `evaluateCondition` looks the name
 * up in the registry; there is no `switch` over atom types anywhere in the engine.
 */

import { z } from 'zod'

import { RNG_STREAMS } from '../rng'
import {
  FACTION_DIMENSIONS,
  LANGUAGE_TIERS,
  RELATIONSHIP_DIMENSIONS,
  type FactionDimension,
  type RelationshipDimension,
} from '../state'
import { tryParseDate } from '../time'
import { COMBINATORS, MAX_CONDITION_DEPTH, conditionLimitIssue } from './limits'
import type { Condition, ConditionAtom, ConditionContext } from './types'

const relationshipDimensionSchema = z.enum(RELATIONSHIP_DIMENSIONS)
const factionDimensionSchema = z.enum(FACTION_DIMENSIONS)

const dateStringSchema = z
  .string()
  .refine((value) => tryParseDate(value) !== null, 'expected a game date like 1230-04-01')

export const CONDITION_ATOMS: Record<string, ConditionAtom> = {
  flag: {
    schema: z.string().min(1),
    evaluate: (payload, ctx) => Boolean(ctx.state.player.flags[payload as string]),
  },

  languageAtLeast: {
    schema: z.object({ language: z.string().min(1), tier: z.enum(LANGUAGE_TIERS) }).strict(),
    evaluate: (payload, ctx) => {
      const { language, tier } = payload as { language: string; tier: string }
      const known = ctx.state.player.languages[language]
      if (!known) return false
      const required = LANGUAGE_TIERS.indexOf(tier as (typeof LANGUAGE_TIERS)[number])
      const current = LANGUAGE_TIERS.indexOf(known.tier)
      return current >= required && required >= 0
    },
  },

  relationship: {
    schema: z
      .object({
        character: z.string().min(1),
        dimension: relationshipDimensionSchema.optional(),
        atLeast: z.int(),
      })
      .strict(),
    evaluate: (payload, ctx) => {
      const { character, dimension, atLeast } = payload as {
        character: string
        dimension?: RelationshipDimension
        atLeast: number
      }
      const relationship = ctx.state.narrative.relationships[character]
      if (!relationship) return false
      return relationship[dimension ?? 'trust'] >= atLeast
    },
  },

  factionStanding: {
    schema: z
      .object({
        faction: z.string().min(1),
        dimension: factionDimensionSchema.optional(),
        atLeast: z.int(),
      })
      .strict(),
    evaluate: (payload, ctx) => {
      const { faction, dimension, atLeast } = payload as {
        faction: string
        dimension?: FactionDimension
        atLeast: number
      }
      const state = ctx.state.narrative.factions[faction]
      if (!state) return false
      return state[dimension ?? 'standing'] >= atLeast
    },
  },

  dateAfter: {
    schema: dateStringSchema,
    evaluate: (payload, ctx) => {
      const day = tryParseDate(payload as string)
      return day !== null && ctx.state.calendar.day > day
    },
  },

  dateBefore: {
    schema: dateStringSchema,
    evaluate: (payload, ctx) => {
      const day = tryParseDate(payload as string)
      return day !== null && ctx.state.calendar.day < day
    },
  },

  routeOpen: {
    schema: z.string().min(1),
    evaluate: (payload, ctx) => {
      const routeId = payload as string
      if (!ctx.content.routeExists(routeId)) return false
      const state = ctx.state.world.routeStates[routeId]
      if (state === 'closed') return false
      const closedWhen = ctx.content.routeClosedWhen(routeId)
      if (closedWhen && evaluateCondition(closedWhen, ctx)) return false
      return true
    },
  },

  itemAtLeast: {
    schema: z.object({ item: z.string().min(1), quantity: z.int().min(1) }).strict(),
    evaluate: (payload, ctx) => {
      const { item, quantity } = payload as { item: string; quantity: number }
      const entry = ctx.state.player.inventory.find((cargo) => cargo.item === item)
      return (entry?.quantity ?? 0) >= quantity
    },
  },

  moneyAtLeast: {
    schema: z.int().min(0),
    evaluate: (payload, ctx) => ctx.state.player.money >= (payload as number),
  },

  characterAlive: {
    schema: z.string().min(1),
    evaluate: (payload, ctx) => {
      const characterId = payload as string
      const runtime = ctx.state.narrative.characterStates[characterId]
      if (runtime) return runtime.status === 'alive'
      return ctx.content.hasCharacter(characterId)
    },
  },

  characterAt: {
    schema: z.object({ character: z.string().min(1), destination: z.string().min(1) }).strict(),
    evaluate: (payload, ctx) => {
      const { character, destination } = payload as { character: string; destination: string }
      const runtime = ctx.state.narrative.characterStates[character]
      if (runtime) return runtime.location === destination
      return ctx.content.characterHome(character) === destination
    },
  },

  hasJournalEntry: {
    schema: z.string().min(1),
    evaluate: (payload, ctx) => ctx.state.knowledge.journalEntries.includes(payload as string),
  },

  hasAffliction: {
    schema: z.string().min(1),
    evaluate: (payload, ctx) =>
      ctx.state.player.afflictions.some((affliction) => affliction.id === payload),
  },

  chance: {
    schema: z.object({ p: z.number().min(0).max(1), stream: z.enum(RNG_STREAMS).optional() }).strict(),
    evaluate: (payload, ctx) => {
      const { p, stream } = payload as { p: number; stream?: (typeof RNG_STREAMS)[number] }
      return ctx.rng.chance(stream ?? 'narrative', p)
    },
  },
}

const combinatorSchemas: z.ZodType[] = [
  z.object({ all: z.array(z.lazy(() => conditionSchema)) }).strict(),
  z.object({ any: z.array(z.lazy(() => conditionSchema)) }).strict(),
  z.object({ not: z.lazy(() => conditionSchema) }).strict(),
]

const atomSchemas: z.ZodType[] = Object.entries(CONDITION_ATOMS).map(([name, atom]) =>
  z.object({ [name]: atom.schema }).strict(),
)

/** Any syntactically valid condition. Size limits are checked by `parseCondition`. */
export const conditionSchema: z.ZodType<Condition> = z.lazy(
  () =>
    z.union([
      ...combinatorSchemas,
      ...atomSchemas,
    ] as unknown as [z.ZodType, z.ZodType, ...z.ZodType[]]) as unknown as z.ZodType<Condition>,
)

export interface ConditionParseResult {
  ok: boolean
  condition?: Condition
  issues: string[]
}

/** Parse and check structural limits. Used by the registry and the content linter. */
export function parseCondition(input: unknown): ConditionParseResult {
  const parsed = conditionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
    }
  }

  const limitIssue = conditionLimitIssue(parsed.data)
  if (limitIssue) return { ok: false, issues: [limitIssue] }

  return { ok: true, condition: parsed.data, issues: [] }
}

/**
 * Evaluate a condition. Deterministic given a state and an RNG cursor.
 *
 * Depth is guarded so malformed content can never overflow the stack: an over-deep tree
 * evaluates to `false` rather than throwing during play.
 */
export function evaluateCondition(
  condition: Condition,
  ctx: ConditionContext,
  depth = 0,
): boolean {
  if (depth > MAX_CONDITION_DEPTH) return false

  const record = condition as unknown as Record<string, unknown>

  if ('all' in record) {
    const list = record['all']
    return Array.isArray(list) ? list.every((child) => evaluateCondition(child as Condition, ctx, depth + 1)) : false
  }
  if ('any' in record) {
    const list = record['any']
    return Array.isArray(list)
      ? list.some((child) => evaluateCondition(child as Condition, ctx, depth + 1))
      : false
  }
  if ('not' in record) {
    return !evaluateCondition(record['not'] as Condition, ctx, depth + 1)
  }

  const atomName = Object.keys(record).find((key) => !COMBINATORS.has(key))
  if (!atomName) return false
  const atom = CONDITION_ATOMS[atomName]
  if (!atom) return false

  const payload = record[atomName]
  const validated = atom.schema.safeParse(payload)
  if (!validated.success) return false
  return atom.evaluate(validated.data, ctx)
}

/** Every atom name known to the engine. Used by coverage and documentation checks. */
export function conditionAtomNames(): string[] {
  return Object.keys(CONDITION_ATOMS).sort()
}
