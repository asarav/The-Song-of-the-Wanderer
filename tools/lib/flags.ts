/** Walk content for the flags and facts a scene writes and reads. */

import type { ContentIndex } from '../../src/engine/content'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export interface FlagUse {
  flag: string
  writer: string[]
  reader: string[]
}

function conditionFlags(condition: unknown, out: Set<string>): void {
  if (!isObject(condition)) return
  if (typeof condition.flag === 'string') out.add(condition.flag)
  for (const key of ['all', 'any']) {
    const list = condition[key]
    if (Array.isArray(list)) for (const entry of list) conditionFlags(entry, out)
  }
  if (condition.not) conditionFlags(condition.not, out)
}

export function flagUses(index: ContentIndex): Map<string, FlagUse> {
  const uses = new Map<string, FlagUse>()
  const use = (flag: string): FlagUse => {
    const existing = uses.get(flag)
    if (existing) return existing
    const created: FlagUse = { flag, writer: [], reader: [] }
    uses.set(flag, created)
    return created
  }

  const scan = (dialogueId: string, effects: unknown, conditions: unknown): void => {
    if (Array.isArray(effects)) {
      for (const effect of effects) {
        if (!isObject(effect) || !('flag' in effect)) continue
        const value = effect.flag
        const name =
          typeof value === 'string'
            ? value
            : isObject(value) && typeof value.name === 'string'
              ? value.name
              : undefined
        if (name) use(name).writer.push(dialogueId)
      }
    }
    const read = new Set<string>()
    conditionFlags(conditions, read)
    for (const flag of read) use(flag).reader.push(dialogueId)
  }

  for (const dialogue of index.dialogues.values()) {
    scan(dialogue.id, undefined, dialogue.entries?.map((entry) => entry.when))
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      for (const choice of node.choices) {
        scan(`${dialogue.id}:${nodeId}`, choice.effects, choice.conditions)
      }
    }
  }
  for (const event of index.events.values()) {
    scan(event.id, event.effects, event.conditions)
  }
  return uses
}

/** Every fact the content teaches, and every scene that teaches it. */
export function factWriters(index: ContentIndex): Map<string, string[]> {
  const facts = new Map<string, string[]>()
  const note = (fact: string, place: string): void => {
    const list = facts.get(fact) ?? []
    list.push(place)
    facts.set(fact, list)
  }
  for (const dialogue of index.dialogues.values()) {
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      for (const choice of node.choices) {
        if (!Array.isArray(choice.effects)) continue
        for (const effect of choice.effects as unknown[]) {
          const record = isObject(effect) ? effect : undefined
          if (record && isObject(record.knowledge) && typeof record.knowledge.fact === 'string') {
            note(record.knowledge.fact, `${dialogue.id}:${nodeId}`)
          }
        }
      }
    }
  }
  for (const event of index.events.values()) {
    if (!Array.isArray(event.effects)) continue
    for (const effect of event.effects as unknown[]) {
      const record = isObject(effect) ? effect : undefined
      if (record && isObject(record.knowledge) && typeof record.knowledge.fact === 'string') {
        note(record.knowledge.fact, event.id)
      }
    }
  }
  return facts
}
