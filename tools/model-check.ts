/**
 * Model check.
 *
 * Enforces the character/scene model the prose depends on: wants that reach a scene, a
 * dramatic contract on every recurring graph, stable choice ids, at least one answer that
 * does more than ask a question, callbacks that resolve, ties that agree, and no dead
 * nodes. This is the gate that makes "surface-level" a structural failure.
 *
 * Usage: `pnpm model:check [--json]`
 */

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ContentIndex } from '../src/engine/content'
import { flagUses } from './lib/flags'
import { loadContent } from './simulate'

export interface ModelIssue {
  level: 'error' | 'warning'
  entity: string
  message: string
  /** Source file from the content index, when the entity has one. */
  source?: string
}

export interface TerminalFlag {
  flag: string
  reason: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function effectList(effects: unknown): Record<string, unknown>[] {
  return Array.isArray(effects) ? effects.filter(isObject) : []
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

function sourceOf(index: ContentIndex, id: string): string | undefined {
  return index.byId?.get(id)?.path
}

/**
 * Is this condition impossible against the content we actually ship?
 *
 * This is deliberately conservative: it only rejects references nothing writes and
 * literal `flag` / `not flag` contradictions. Numeric or relational conditions may still
 * be unreachable in a particular save without being dead in content.
 */
function deadReason(
  condition: unknown,
  context: {
    flagsWritten: Set<string>
    journalsWritten: Set<string>
    index: ContentIndex
  },
): string | undefined {
  if (!isObject(condition)) return undefined

  if (typeof condition.flag === 'string' && !context.flagsWritten.has(condition.flag)) {
    return `flag "${condition.flag}" is never written`
  }
  if (typeof condition.hasJournalEntry === 'string') {
    const id = condition.hasJournalEntry
    if (!context.journalsWritten.has(id) && !context.index.journal.has(id)) {
      return `journal entry "${id}" is never written`
    }
  }
  if (isObject(condition.itemAtLeast) && typeof condition.itemAtLeast.item === 'string') {
    if (!context.index.goods.has(condition.itemAtLeast.item)) {
      return `item "${condition.itemAtLeast.item}" does not exist`
    }
  }
  if (typeof condition.routeOpen === 'string' && !context.index.routes.has(condition.routeOpen)) {
    return `route "${condition.routeOpen}" does not exist`
  }
  if (isObject(condition.factionStanding) && typeof condition.factionStanding.faction === 'string') {
    if (!context.index.factions.has(condition.factionStanding.faction)) {
      return `faction "${condition.factionStanding.faction}" does not exist`
    }
  }
  if (isObject(condition.languageAtLeast) && typeof condition.languageAtLeast.language === 'string') {
    if (!context.index.languages.has(condition.languageAtLeast.language)) {
      return `language "${condition.languageAtLeast.language}" does not exist`
    }
  }
  if (typeof condition.hasAffliction === 'string' && !context.index.afflictions.has(condition.hasAffliction)) {
    return `affliction "${condition.hasAffliction}" does not exist`
  }
  for (const key of ['characterAlive', 'characterAt', 'topicAsked', 'regardBand'] as const) {
    const value = condition[key]
    const character = typeof value === 'string' ? value : isObject(value) ? value.character : undefined
    if (typeof character === 'string' && !context.index.characters.has(character)) {
      return `character "${character}" does not exist`
    }
  }

  // `not X` is true whenever X is false, so an impossible inner atom makes the negation
  // possible, not dead. We cannot prove tautologies here.
  if ('not' in condition) return undefined

  if (Array.isArray(condition.any)) {
    if (condition.any.length === 0) return 'any [] can never be true'
    const reasons = condition.any.map((entry) => deadReason(entry, context))
    return reasons.every(Boolean) ? (reasons[0] ?? 'every branch is impossible') : undefined
  }

  if (Array.isArray(condition.all)) {
    for (const entry of condition.all) {
      const reason = deadReason(entry, context)
      if (reason) return reason
    }
    const positive = new Set<string>()
    const negative = new Set<string>()
    const collect = (entry: unknown): void => {
      if (!isObject(entry)) return
      if (typeof entry.flag === 'string') positive.add(entry.flag)
      if (isObject(entry.not) && typeof entry.not.flag === 'string') {
        negative.add(entry.not.flag)
      }
      if (Array.isArray(entry.all)) for (const child of entry.all) collect(child)
    }
    for (const entry of condition.all) collect(entry)
    const contradiction = [...positive].find((flag) => negative.has(flag))
    if (contradiction) {
      return `requires both flag "${contradiction}" and not flag "${contradiction}"`
    }
  }

  return undefined
}

/** The predicate. The CLI and the broken-fixture test both run this function. */
export function checkModel(index: ContentIndex, terminals: TerminalFlag[] = []): ModelIssue[] {
  const issues: ModelIssue[] = []

  const add = (
    level: ModelIssue['level'],
    entity: string,
    message: string,
    source?: string,
  ): void => {
    issues.push({ level, entity, message, source })
  }

  // Every fact a scene can answer must be produced somewhere.
  const flagsWritten = new Set<string>()
  const journalsWritten = new Set<string>()
  const deedsWritten = new Set<string>()
  const relationsWritten = new Set<string>()
  const factsWritten = new Set<string>()

  const noteEffect = (effect: Record<string, unknown>): void => {
    if ('flag' in effect) {
      const value = effect.flag
      if (typeof value === 'string') flagsWritten.add(value)
      else if (isObject(value) && typeof value.name === 'string') flagsWritten.add(value.name)
    }
    if (isObject(effect.journal) && typeof effect.journal.entry === 'string') {
      journalsWritten.add(effect.journal.entry)
    }
    if (isObject(effect.deed) && typeof effect.deed.id === 'string') {
      deedsWritten.add(effect.deed.id)
    }
    if (isObject(effect.relationship) && typeof effect.relationship.character === 'string') {
      relationsWritten.add(effect.relationship.character)
    }
    if (isObject(effect.knowledge) && typeof effect.knowledge.fact === 'string') {
      factsWritten.add(effect.knowledge.fact)
    }
  }

  for (const dialogue of index.dialogues.values()) {
    for (const node of Object.values(dialogue.nodes)) {
      for (const choice of node.choices) {
        for (const effect of effectList(choice.effects)) noteEffect(effect)
        if (choice.journal) journalsWritten.add(choice.journal)
      }
    }
  }
  for (const event of index.events.values()) {
    for (const effect of effectList(event.effects)) noteEffect(effect)
    if (event.journal) journalsWritten.add(event.journal)
  }

  // A repeat entry is the only place a one-shot marker can stop a scene from replaying.
  const entryFlags = new Set<string>()
  for (const dialogue of index.dialogues.values()) {
    for (const entry of dialogue.entries ?? []) conditionFlags(entry.when, entryFlags)
  }

  const resolvesCallback = (callback: string): boolean => {
    const [kind, ...rest] = callback.split(':')
    const id = rest.join(':')
    if (!id) return false
    if (kind === 'flag') return flagsWritten.has(id)
    if (kind === 'journal') return journalsWritten.has(id) || Boolean(index.journal.get(id))
    if (kind === 'deed') return deedsWritten.has(id)
    if (kind === 'relationship') return relationsWritten.has(id)
    if (kind === 'fact') return factsWritten.has(id)
    return false
  }

  const seenTies = new Set<string>()

  for (const character of index.characters.values()) {
    if (character.tier !== 'major' && character.tier !== 'recurring') continue

    const wants = character.wants ?? []
    if (wants.length === 0) {
      add('error', character.id, 'recurring character has no want')
    }
    for (const want of wants) {
      if (typeof want === 'string') {
        add(
          'error',
          character.id,
          `want "${want}" is a string; recurring wants need id, stake and scene`,
        )
        continue
      }
      if (!want.id || !want.stake || !want.scene) {
        add('error', character.id, `want "${want.text ?? '?'}" is missing id, stake or scene`)
        continue
      }
      if (!index.dialogues.has(want.scene)) {
        add('error', character.id, `want "${want.id}" names missing scene ${want.scene}`)
      }
    }

    if (!character.voice) {
      add('error', character.id, 'recurring character has no voice profile')
    } else if (!character.voice.sampleLines || character.voice.sampleLines.length !== 3) {
      add('error', character.id, 'voice profile needs exactly three sample lines')
    }

    for (const scene of character.appearances ?? []) {
      if (!index.dialogues.has(scene)) {
        add('error', character.id, `appearance names missing scene ${scene}`)
      }
    }

    const graphs = new Set<string>()
    if (character.dialogue) graphs.add(character.dialogue)
    for (const scene of Object.values(character.dialogueByDestination ?? {})) {
      graphs.add(scene)
    }
    for (const scene of character.appearances ?? []) graphs.add(scene)
    for (const want of wants) {
      if (typeof want !== 'string' && want.scene) graphs.add(want.scene)
    }
    for (const graph of index.dialogues.values()) {
      if (graph.speaker === character.id) graphs.add(graph.id)
    }
    if (graphs.size < 2) {
      add(
        'error',
        character.id,
        `recurring character has only ${graphs.size} dialogue graph; add a second or correct the tier`,
        sourceOf(index, character.id),
      )
    }

    for (const tie of character.ties ?? []) {
      if (!index.characters.has(tie.character)) {
        add('error', character.id, `tie names missing character ${tie.character}`)
        continue
      }
      if (tie.kind !== 'kin') continue
      const key = [character.id, tie.character].sort().join('|')
      if (seenTies.has(key)) continue
      seenTies.add(key)
      const other = index.characters.get(tie.character)
      const mirrored = (other?.ties ?? []).some(
        (entry) => entry.character === character.id && entry.kind === 'kin',
      )
      if (!mirrored) {
        add('error', character.id, `kin tie to ${tie.character} is not mirrored`)
      }
    }
  }

  for (const dialogue of index.dialogues.values()) {
    const speaker = dialogue.speaker ? index.characters.get(dialogue.speaker) : undefined
    const recurring = speaker?.tier === 'major' || speaker?.tier === 'recurring'
    // A conversation graph is one `talkTo` can open (the character's dialogue, here or
    // in another destination). A scheduled event scene can use the same speaker, but it
    // happens once and must not be asked for a repeat entry.
    const conversation = Boolean(
      speaker &&
        (speaker.dialogue === dialogue.id ||
          Object.values(speaker.dialogueByDestination ?? {}).includes(dialogue.id)),
    )
    const contract = dialogue.scene

    if (recurring && conversation && !contract) {
      add('error', dialogue.id, 'recurring scene has no scene contract')
    }
    if (contract) {
      for (const key of ['goal', 'obstacle', 'turn', 'stakes'] as const) {
        if (!contract[key]) add('error', dialogue.id, `scene contract is missing ${key}`)
      }
      if (contract.callback && !resolvesCallback(contract.callback)) {
        add('error', dialogue.id, `callback "${contract.callback}" is never written`)
      }
    }

    const reachable = new Set<string>()
    const queue = [dialogue.start, ...(dialogue.entries ?? []).map((entry) => entry.node)]
    while (queue.length > 0) {
      const nodeId = queue.pop()
      if (!nodeId || reachable.has(nodeId)) continue
      const node = dialogue.nodes[nodeId]
      if (!node) {
        add('error', dialogue.id, `points at missing node "${nodeId}"`)
        continue
      }
      reachable.add(nodeId)
      for (const choice of node.choices) {
        if (choice.next) queue.push(choice.next)
      }
      if (node.nextDialogue) queue.push(dialogue.start)
    }
    for (const nodeId of Object.keys(dialogue.nodes)) {
      if (!reachable.has(nodeId)) add('error', dialogue.id, `node "${nodeId}" is unreachable`)
    }

    let nonProbe = 0
    let ids = 0
    let choices = 0
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      const choiceIds: string[] = []
      for (const choice of node.choices) {
        const dead = deadReason(choice.conditions, {
          flagsWritten,
          journalsWritten,
          index,
        })
        if (dead) {
          add(
            'error',
            dialogue.id,
            `node "${nodeId}" choice "${choice.id ?? choice.text}" can never be satisfied: ${dead}`,
            sourceOf(index, dialogue.id),
          )
        }
        choices += 1
        if (choice.id) {
          ids += 1
          choiceIds.push(choice.id)
        }
        if (choice.intent && choice.intent !== 'probe') nonProbe += 1
        if (!choice.intent) {
          add('warning', dialogue.id, `${nodeId}: choice "${choice.text}" has no intent`)
        }
      }
      if (new Set(choiceIds).size !== choiceIds.length) {
        add('error', dialogue.id, `choice ids must be unique within node "${nodeId}"`)
      }
    }
    if (ids !== choices) {
      add('error', dialogue.id, `${choices - ids} choices have no stable id`)
    }
    if (recurring && conversation && nonProbe === 0) {
      add('error', dialogue.id, 'every answer is a probe; the scene does nothing but ask')
    }

    if (recurring && conversation && (dialogue.entries ?? []).length === 0) {
      add(
        'warning',
        dialogue.id,
        'recurring graph has no memory entry; a second meeting repeats the first',
      )
    }
  }

  // Every written flag must change something later, or be declared terminal with a
  // reason. A terminal declaration that has since gained a reader is stale.
  const declared = new Map(terminals.map((entry) => [entry.flag, entry.reason]))
  for (const use of flagUses(index).values()) {
    if (use.writer.length === 0) continue
    if (use.reader.length === 0 && !declared.has(use.flag)) {
      add('error', use.flag, 'flag is written but never read, and not declared terminal')
    } else if (use.reader.length > 0 && !entryFlags.has(use.flag) && !declared.has(use.flag)) {
      add(
        'error',
        use.flag,
        `one-shot flag is not read by any dialogue entry (written at ${use.writer[0] ?? 'unknown'}); add an entry or declare it terminal`,
        sourceOf(index, use.writer[0]?.split(':')[0] ?? ''),
      )
    }
    if (use.reader.length > 0 && declared.has(use.flag)) {
      add('warning', use.flag, 'declared terminal but read by a later condition')
    }
  }

  return issues
}

async function loadTerminals(): Promise<TerminalFlag[]> {
  return JSON.parse(
    await readFile(join(process.cwd(), 'content', 'terminals.json'), 'utf8'),
  ) as TerminalFlag[]
}

async function main(): Promise<void> {
  const json = process.argv.includes('--json')
  const index = await loadContent()
  const terminals = await loadTerminals().catch((): TerminalFlag[] => [])
  const issues = checkModel(index, terminals)
  if (terminals.length === 0) {
    issues.push({
      level: 'error',
      entity: 'content/terminals.json',
      message: 'terminal flag declarations are missing',
    })
  }
  const errors = issues.filter((issue) => issue.level === 'error')

  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: errors.length === 0, issues }, null, 2)}\n`)
  } else {
    for (const issue of issues) {
      process.stdout.write(
        `model:check ${issue.level} ${issue.source ? `${issue.source}: ` : ''}${issue.entity}: ${issue.message}\n`,
      )
    }
    process.stdout.write(
      `model:check - ${index.characters.size} characters, ${index.dialogues.size} dialogues, ${errors.length} errors, ${issues.length - errors.length} warnings\n`,
    )
  }
  if (errors.length > 0) process.exitCode = 1
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
