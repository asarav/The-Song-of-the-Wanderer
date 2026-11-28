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
import { join } from 'node:path'

import { flagUses } from './lib/flags'
import { loadContent } from './simulate'

interface Issue {
  level: 'error' | 'warning'
  entity: string
  message: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function effectList(effects: unknown): Record<string, unknown>[] {
  return Array.isArray(effects) ? effects.filter(isObject) : []
}

function main(): void {
  const json = process.argv.includes('--json')
  void (async () => {
    const index = await loadContent()
    const issues: Issue[] = []

    const add = (level: Issue['level'], entity: string, message: string): void => {
      issues.push({ level, entity, message })
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
          add('error', character.id, `want "${want}" is a string; recurring wants need id, stake and scene`)
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
      // A conversation graph is one `talkTo` can open. Event scenes may also use a
      // recurring speaker, but they are scheduled once and do not need a repeat entry.
      const conversation = Boolean(
        speaker &&
          (speaker.dialogue === dialogue.id ||
            Object.values(speaker.dialogueByDestination ?? {}).includes(dialogue.id) ||
            (speaker.appearances ?? []).includes(dialogue.id)),
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
        for (const choice of node.choices) {
          choices += 1
          if (choice.id) ids += 1
          if (choice.intent && choice.intent !== 'probe') nonProbe += 1
          if (!choice.intent) {
            add('warning', dialogue.id, `${nodeId}: choice "${choice.text}" has no intent`)
          }
        }
      }
      if (ids !== choices) {
        add('error', dialogue.id, `${choices - ids} choices have no stable id`)
      }
      if (recurring && conversation && nonProbe === 0) {
        add('error', dialogue.id, 'every answer is a probe; the scene does nothing but ask')
      }

      if (recurring && conversation && (dialogue.entries ?? []).length === 0) {
        add('warning', dialogue.id, 'recurring graph has no memory entry; a second meeting repeats the first')
      }
    }

    // Every written flag must change something later, or be declared terminal with a
    // reason. A terminal declaration that has since gained a reader is stale.
    let terminals: { flag: string; reason: string }[] = []
    try {
      terminals = JSON.parse(
        await readFile(join(process.cwd(), 'content', 'terminals.json'), 'utf8'),
      ) as { flag: string; reason: string }[]
    } catch {
      add('error', 'content/terminals.json', 'terminal flag declarations are missing')
    }
    const declared = new Map(terminals.map((entry) => [entry.flag, entry.reason]))
    for (const use of flagUses(index).values()) {
      if (use.writer.length === 0) continue
      if (use.reader.length === 0 && !declared.has(use.flag)) {
        add('error', use.flag, 'flag is written but never read, and not declared terminal')
      }
      if (use.reader.length > 0 && declared.has(use.flag)) {
        add('warning', use.flag, 'declared terminal but read by a later condition')
      }
    }

    const errors = issues.filter((issue) => issue.level === 'error')
    if (json) {
      process.stdout.write(`${JSON.stringify({ ok: errors.length === 0, issues }, null, 2)}\n`)
    } else {
      for (const issue of issues) {
        process.stdout.write(`model:check ${issue.level} ${issue.entity}: ${issue.message}\n`)
      }
      process.stdout.write(
        `model:check - ${index.characters.size} characters, ${index.dialogues.size} dialogues, ${errors.length} errors, ${issues.length - errors.length} warnings\n`,
      )
    }
    if (errors.length > 0) process.exitCode = 1
  })()
}

main()
