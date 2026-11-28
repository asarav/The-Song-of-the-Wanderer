/**
 * Prose lint.
 *
 * Checks the mechanical classes of prose error that have reached the slice before:
 * first person in second-person narration, modern vocabulary, overlong beats, repeated
 * openings, a character breaking their own sentence ceiling, and two consecutive
 * information-only answers with no cost or feeling in the scene.
 *
 * It cannot judge whether a line is good. It can stop the mistakes we keep making.
 *
 * Usage: `pnpm prose:lint [--json] [--only <entity>]`
 */

import { splitBeats } from '../src/engine/text/beats'
import type { CharacterDef, ContentIndex } from '../src/engine/content'
import { loadContent } from './simulate'

export interface ProseIssue {
  level: 'error' | 'warning'
  entity: string
  node?: string
  message: string
}

const FIRST_PERSON = /\b(I|me|my|mine|myself|we|us|our|ours)\b/
const ANACHRONISMS = [
  'okay',
  'ok',
  'contact',
  'minutes',
  'seconds',
  'meters',
  'metres',
  'kilometers',
  'miles',
  'percent',
  'dozen',
  'adrenaline',
  'nicotine',
  'coffee',
  'potato',
  'tomato',
  'chocolate',
  'cigarette',
  'gun',
  'clock',
  'career',
  'stress',
  'anxiety',
  'depression',
  'trauma',
  'closure',
  'boundaries',
  'toxic',
  'gaslight',
  'narcissist',
  'self-care',
  'support system',
  'emotional labor',
  'check in',
  'hold space',
  'validate',
  'processing',
  'relationship',
  'attachment style',
  'inner child',
  'kids',
  'guy',
  'boss',
  'deadline',
  'feedback',
  'team',
  'weekend',
]

const QUOTED = /"[^"]*"|“[^”]*”|‘[^’]*’/g

/** Remove quoted speech so narration rules do not flag a character's own words. */
function narration(text: string): string {
  return text.replace(QUOTED, ' ').replace(/\b(says|said|reads|wrote|writes):[^\n]*/gi, ' ')
}

/** Only quoted lines are the character's own sentences; narration is the narrator's. */
function quotedSpeech(text: string): string[] {
  return [...text.matchAll(/"([^"]*)"|“([^”]*)”/g)].map(
    (match) => match[1] ?? match[2] ?? '',
  )
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function lintProse(index: ContentIndex): ProseIssue[] {
  const issues: ProseIssue[] = []
  const add = (
    level: ProseIssue['level'],
    entity: string,
    message: string,
    node?: string,
  ): void => {
    issues.push({ level, entity, node, message })
  }

  const openings = new Map<string, string[]>()

  const checkText = (
    entity: string,
    text: string,
    node: string | undefined,
    voice: CharacterDef | undefined,
    allowFirstPerson = false,
  ): void => {
    if (!allowFirstPerson && narration(text).match(FIRST_PERSON)) {
      const found = narration(text).match(FIRST_PERSON)?.[0]
      add('error', entity, `first person "${found}" in second-person narration`, node)
    }
    const lower = narration(text).toLowerCase()
    for (const word of ANACHRONISMS) {
      if (new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)) {
        add('error', entity, `modern word "${word}" in period prose`, node)
      }
    }
    for (const beat of splitBeats(text)) {
      const count = words(beat)
      if (count > 140) add('error', entity, `beat of ${count} words is too long`, node)
      else if (count > 90) add('warning', entity, `beat of ${count} words reads long`, node)
    }

    const opening = splitBeats(text)[0]?.split(/\s+/).slice(0, 5).join(' ').toLowerCase()
    if (opening) {
      const list = openings.get(opening) ?? []
      list.push(`${entity}${node ? `:${node}` : ''}`)
      openings.set(opening, list)
    }

    if (voice?.voice?.maxSentenceWords) {
      const ceiling = voice.voice.maxSentenceWords
      for (const speech of quotedSpeech(text)) {
        for (const sentence of sentences(speech)) {
          const count = words(sentence)
          if (count > ceiling) {
            add(
              'warning',
              entity,
              `sentence of ${count} words exceeds ${voice.name}'s ceiling of ${ceiling}`,
              node,
            )
          }
        }
      }
    }
  }

  for (const dialogue of index.dialogues.values()) {
    const speaker = dialogue.speaker ? index.characters.get(dialogue.speaker) : undefined
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      checkText(dialogue.id, node.text, nodeId, speaker)
      for (const [language, variants] of Object.entries(node.textByLanguage ?? {})) {
        for (const [tier, text] of Object.entries(variants)) {
          // A translated variant is one continuous utterance, often without quote marks.
          checkText(dialogue.id, text, `${nodeId}/${language}/${tier}`, speaker, true)
        }
      }

      const probes = node.choices.filter((choice) => choice.intent === 'probe')
      if (probes.length >= 2 && probes.length === node.choices.length) {
        add('warning', dialogue.id, `node "${nodeId}" offers only questions`, nodeId)
      }
    }
  }

  for (const journal of index.journal.values()) {
    // A journal is the traveller's own note, so first person is correct here.
    checkText(journal.id, journal.text, undefined, undefined, true)
  }

  for (const [opening, places] of openings) {
    if (places.length >= 3) {
      add(
        'warning',
        (places[0] ?? 'prose').split(':')[0] ?? 'prose',
        `${places.length} passages open with "${opening}"`,
      )
    }
  }

  return issues
}

function main(): void {
  const json = process.argv.includes('--json')
  const onlyIndex = process.argv.indexOf('--only')
  const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined

  void (async () => {
    const index = await loadContent()
    const issues = lintProse(index).filter(
      (issue) => !only || issue.entity === only || issue.entity.startsWith(`${only}:`),
    )
    const errors = issues.filter((issue) => issue.level === 'error')

    if (json) {
      process.stdout.write(`${JSON.stringify({ ok: errors.length === 0, issues }, null, 2)}\n`)
    } else {
      for (const issue of issues) {
        process.stdout.write(
          `prose:lint ${issue.level} ${issue.entity}${issue.node ? `:${issue.node}` : ''}: ${issue.message}\n`,
        )
      }
      process.stdout.write(
        `prose:lint - ${issues.length} findings, ${errors.length} errors, ${issues.length - errors.length} warnings\n`,
      )
    }
    if (errors.length > 0) process.exitCode = 1
  })()
}

main()
