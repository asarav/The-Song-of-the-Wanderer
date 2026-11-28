/**
 * The command vocabulary.
 *
 * Commands are intents. They never carry state and never name a rule; the reducer
 * validates them against content and player state. Expected failure is a rejection, not
 * an exception (`docs/ARCHITECTURE.md` §2).
 *
 * Each command is a registry entry: a structural schema plus a handler. The schema only
 * rejects malformed intents; policy limits (how far time may jump, how much a passage
 * holds) stay in the handler, which owns the player-facing reason.
 */

import { z } from 'zod'
import type { ZodType } from 'zod'

import type { KernelContext } from './context'

export type Command =
  | { type: 'advanceTime'; days: number }
  | { type: 'travel'; route: string; mode: string }
  | { type: 'buy'; item: string; quantity: number }
  | { type: 'sell'; item: string; quantity: number }
  | { type: 'talkTo'; character: string }
  | { type: 'resolveEncounter'; choice: number }
  | { type: 'chooseDialogue'; choice: number }
  | { type: 'chooseChoice'; choiceId: string; dialogue?: string; node?: string }
  | { type: 'rest'; days: number }
  | { type: 'work'; days: number }

export type CommandType = Command['type']

/**
 * One schema per command. `.strict()` so an interface bug (a stray field) is refused
 * rather than silently ignored.
 */
export const COMMAND_SCHEMAS: Record<CommandType, ZodType<Command>> = {
  advanceTime: z.object({ type: z.literal('advanceTime'), days: z.int() }).strict(),
  rest: z.object({ type: z.literal('rest'), days: z.int() }).strict(),
  work: z.object({ type: z.literal('work'), days: z.int() }).strict(),
  travel: z
    .object({ type: z.literal('travel'), route: z.string().min(1), mode: z.string().min(1) })
    .strict(),
  buy: z.object({ type: z.literal('buy'), item: z.string().min(1), quantity: z.int() }).strict(),
  sell: z.object({ type: z.literal('sell'), item: z.string().min(1), quantity: z.int() }).strict(),
  talkTo: z.object({ type: z.literal('talkTo'), character: z.string().min(1) }).strict(),
  resolveEncounter: z.object({ type: z.literal('resolveEncounter'), choice: z.int() }).strict(),
  chooseDialogue: z.object({ type: z.literal('chooseDialogue'), choice: z.int() }).strict(),
  chooseChoice: z
    .object({
      type: z.literal('chooseChoice'),
      choiceId: z.string().min(1),
      dialogue: z.string().min(1).optional(),
      node: z.string().min(1).optional(),
    })
    .strict(),
}

/** A handler returns a reason to reject, or `null` when the intent was carried out. */
export type CommandHandler = (ctx: KernelContext, command: Command) => string | null

/** A command is its schema plus its handler; `reduce` reads the registry, never a switch. */
export interface CommandDefinition {
  schema: ZodType<Command>
  run: CommandHandler
}

/** Read a command's name from the registry. Returns `null` for anything unregistered. */
export function commandTypeOf(command: { type: string }): CommandType | null {
  return Object.prototype.hasOwnProperty.call(COMMAND_SCHEMAS, command.type)
    ? (command.type as CommandType)
    : null
}

/** Every command name known to the engine. Used by coverage and documentation checks. */
export function commandNames(): CommandType[] {
  return Object.keys(COMMAND_SCHEMAS).sort() as CommandType[]
}
