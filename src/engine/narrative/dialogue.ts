/**
 * Dialogue graphs.
 *
 * A scene is a node in an authored graph. Choices carry conditions, effects, and the
 * next node. Resolution order is: apply the choice's effects, record its journal entry,
 * then move to the next node (or end the scene). If a journey was interrupted, ending
 * the scene resumes it.
 */

import { evaluateCondition, pickCargoItem } from '../dsl'
import { applyEffects } from '../dsl'
import type { DslContent, Effect } from '../dsl'
import { RngCursor } from '../rng'
import type { DialogueDef, DialogueNodeDef } from '../content'
import type { ContentIndex } from '../content'
import { tierRank } from '../culture'
import type { GameState } from '../state'
import type { KernelContext } from '../kernel'
import { continueJourney } from './journey'

/**
 * What an answer asks of the traveller before it is taken. Presentation says it beside
 * the answer, so a fare is never discovered by watching the purse drop.
 */
export interface SceneChoiceCost {
  /** Silver it takes, in whole shekels. */
  money?: number
  /** Goods it gives up, with the name the market uses, and the count. */
  items?: { id: string; name: string; quantity: number }[]
  /** Loads taken from whatever cargo is actually in the hold. */
  cargo?: number
  /** Days it spends. */
  days?: number
  /** Stamina it spends. */
  stamina?: number
}

export interface SceneChoiceView {
  index: number
  text: string
  available: boolean
  reason?: string
  cost?: SceneChoiceCost
}

/**
 * Reads the price out of a choice's effects: silver spent, goods given up, cargo lost,
 * days passed. What an answer pays or gives is not a cost; the scene text says it.
 */
export function choiceCost(
  effects: readonly Effect[] | undefined,
  index: ContentIndex,
): SceneChoiceCost | undefined {
  if (!effects || effects.length === 0) return undefined

  const cost: SceneChoiceCost = {}
  for (const effect of effects) {
    if ('money' in effect) {
      if (effect.money < 0) cost.money = (cost.money ?? 0) - effect.money
    } else if ('items' in effect) {
      const { item, quantity } = effect.items
      if (quantity >= 0) continue
      const name = index.goods.get(item)?.name ?? item
      cost.items = [...(cost.items ?? []), { id: item, name, quantity: -quantity }]
    } else if ('loseCargo' in effect) {
      if (effect.loseCargo.quantity > 0) {
        cost.cargo = (cost.cargo ?? 0) + effect.loseCargo.quantity
      }
    } else if ('advanceTime' in effect) {
      if (effect.advanceTime.days > 0) {
        cost.days = (cost.days ?? 0) + effect.advanceTime.days
      }
    } else if ('stamina' in effect) {
      if (effect.stamina < 0) cost.stamina = (cost.stamina ?? 0) - effect.stamina
    }
  }

  if (!cost.money && !cost.items?.length && !cost.cargo && !cost.days && !cost.stamina) {
    return undefined
  }
  return cost
}

export interface SceneView {
  dialogue: string
  node: string
  speaker: string | null
  speakerName: string | null
  text: string
  /** The illustration this authored beat carries, if it has one. Presentation only. */
  art?: string
  /** The illustration for each prose beat, in order. Presentation only. */
  beatArt?: string[]
  choices: SceneChoiceView[]
  event?: string
}

/**
 * How a scene names the load. Scenes that talk about cargo write `{cargo}` and the text
 * is filled from the hold at the moment the scene is shown, so a trader carrying copper
 * never reads about a jar of oil going over the side.
 */
export function cargoPhrase(state: GameState, index: ContentIndex): string {
  const item = pickCargoItem(state.player.inventory)
  if (!item) return "a coil of the ship's rope"
  const name = index.goods.get(item)?.name ?? item
  return `the ${name.toLowerCase()}`
}

export function renderCargoText(text: string, state: GameState, index: ContentIndex): string {
  if (!text.includes('{cargo}')) return text
  return text.split('{cargo}').join(cargoPhrase(state, index))
}

/** The node's text in the best language the player actually understands. */
export function localizedText(state: GameState, node: DialogueNodeDef): string {
  let best = node.text
  let bestRank = -1

  for (const [languageId, variants] of Object.entries(node.textByLanguage ?? {})) {
    const tier = state.player.languages[languageId]?.tier
    if (!tier) continue
    const variant = variants[tier]
    if (variant && tierRank(tier) > bestRank) {
      best = variant
      bestRank = tierRank(tier)
    }
  }

  return best
}

export function deriveScene(
  state: GameState,
  index: ContentIndex,
  content: DslContent,
): SceneView | null {
  const pending = state.narrative.pending
  if (!pending) return null

  const dialogue = index.dialogues.get(pending.dialogue)
  if (!dialogue) return null
  const node = dialogue.nodes[pending.node]
  if (!node) return null

  const speaker = dialogue.speaker ?? null
  const speakerName = speaker ? (index.characters.get(speaker)?.name ?? speaker) : null

  return {
    dialogue: dialogue.id,
    node: pending.node,
    speaker,
    speakerName,
    text: renderCargoText(localizedText(state, node), state, index),
    art: node.art,
    beatArt: node.beatArt,
    event: pending.event,
    choices: node.choices.map((choice, choiceIndex) => {
      const available = choice.conditions
        ? evaluateCondition(choice.conditions, {
            state,
            content,
            rng: new RngCursor(state.rng),
          })
        : true
      return {
        index: choiceIndex,
        text: choice.text,
        available,
        reason: available
          ? undefined
          : (choice.unavailableNote ?? 'You cannot follow where this would lead.'),
        cost: choiceCost(choice.effects, index),
      }
    }),
  }
}

/** The node a conversation opens on: the first matching entry, else the authored start. */
function openingNode(ctx: KernelContext, dialogue: DialogueDef): string {
  for (const entry of dialogue.entries ?? []) {
    if (
      evaluateCondition(entry.when, {
        state: ctx.state,
        content: ctx.content,
        rng: ctx.rng,
      })
    ) {
      return entry.node
    }
  }
  return dialogue.start
}

export function startDialogue(ctx: KernelContext, dialogueId: string): string | null {
  const dialogue = ctx.index.dialogues.get(dialogueId)
  if (!dialogue) return `There is no conversation "${dialogueId}".`

  const node = openingNode(ctx, dialogue)
  if (!dialogue.nodes[node]) return `"${node}" is missing from the conversation.`

  ctx.state.narrative.pending = { kind: 'dialogue', dialogue: dialogue.id, node }
  rememberSpeaker(ctx, dialogue)
  ctx.events.push({ type: 'DialoguePresented', dialogue: dialogue.id, node })
  return null
}

function rememberSpeaker(ctx: KernelContext, dialogue: DialogueDef): void {
  const speakerId = dialogue.speaker
  if (!speakerId) return
  const character = ctx.index.characters.get(speakerId)
  if (!character) return

  const existing = ctx.state.knowledge.characterIndex[speakerId]
  ctx.state.knowledge.characterIndex[speakerId] = {
    name: character.name,
    lastSeen: { day: ctx.state.calendar.day, location: ctx.state.player.location },
    ...(existing?.status ? { status: existing.status } : {}),
    ...(existing?.notes ? { notes: existing.notes } : {}),
  }

  const runtime = ctx.state.narrative.characterStates[speakerId]
  if (!runtime) {
    ctx.state.narrative.characterStates[speakerId] = {
      status: 'alive',
      location: character.home,
      age: 'unknown',
      relationships: {},
      flags: {},
      lastSeenByPlayer: { day: ctx.state.calendar.day, location: ctx.state.player.location },
    }
  } else {
    runtime.lastSeenByPlayer = { day: ctx.state.calendar.day, location: ctx.state.player.location }
  }
}

function endScene(ctx: KernelContext): void {
  const pending = ctx.state.narrative.pending
  ctx.state.narrative.pending = null
  if (pending) ctx.events.push({ type: 'DialogueEnded', dialogue: pending.dialogue })
  continueJourney(ctx)
}

/** Resolve choice `choiceIndex` of the pending scene. Returns a rejection reason. */
export function resolveChoice(ctx: KernelContext, choiceIndex: number): string | null {
  const pending = ctx.state.narrative.pending
  if (!pending) return 'There is nothing to answer.'

  const dialogue = ctx.index.dialogues.get(pending.dialogue)
  if (!dialogue) return 'That conversation is missing from the content.'
  const node = dialogue.nodes[pending.node]
  if (!node) return 'That part of the conversation has gone missing.'

  const choice = node.choices[choiceIndex]
  if (!choice) return 'That is not one of the answers available.'

  if (choice.conditions) {
    const available = evaluateCondition(choice.conditions, {
      state: ctx.state,
      content: ctx.content,
      rng: ctx.rng,
    })
    if (!available) return 'You cannot follow where this would lead.'
  }

  if (choice.effects) applyEffects(choice.effects, ctx)

  if (choice.journal && !ctx.state.knowledge.journalEntries.includes(choice.journal)) {
    ctx.state.knowledge.journalEntries.push(choice.journal)
    ctx.events.push({ type: 'JournalEntryAdded', entry: choice.journal })
  }

  if (choice.next) {
    if (!dialogue.nodes[choice.next]) {
      return `The conversation points at a missing node "${choice.next}".`
    }
    ctx.state.narrative.pending = { ...pending, node: choice.next }
    ctx.events.push({ type: 'DialoguePresented', dialogue: dialogue.id, node: choice.next })
    return null
  }

  if (node.nextDialogue) {
    return startDialogue(ctx, node.nextDialogue)
  }

  endScene(ctx)
  return null
}
