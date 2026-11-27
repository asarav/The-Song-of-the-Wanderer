import { describe, expect, it } from 'vitest'

import { createDslContent, type ContentIndex } from '../src/engine/content'
import type { KernelContext } from '../src/engine/kernel'
import { RngCursor } from '../src/engine/rng'
import { createInitialState } from '../src/engine/state'
import { startDialogue } from '../src/engine/narrative'
import { loadContent } from './simulate'

interface Opening {
  /** Stable test label: the situation the player is in. */
  when: string
  flags?: string[]
  journal?: string[]
  node: string
}

/** Every recurring slice character and the graph `talkTo` opens. */
const RECURRING = [
  { character: 'char.ugarit.amnit', dialogue: 'dlg.ugarit.amnit.meeting' },
  { character: 'char.ugarit.amnit', dialogue: 'dlg.cyprus.amnit' },
  { character: 'char.cyprus.ada', dialogue: 'dlg.cyprus.ada.smithy' },
  { character: 'char.ugarit.belet', dialogue: 'dlg.ugarit.belet.temple' },
  { character: 'char.ugarit.hannu', dialogue: 'dlg.ugarit.hannu.gate' },
  { character: 'char.cyprus.kinyras', dialogue: 'dlg.cyprus.kinyras.meeting' },
  { character: 'char.cyprus.shipti', dialogue: 'dlg.cyprus.shipti.inn' },
  { character: 'char.ugarit.sibtu', dialogue: 'dlg.ugarit.sibtu.ask' },
  { character: 'char.ugarit.tiro', dialogue: 'dlg.ugarit.tiro.passage' },
  { character: 'char.ugarit.yada', dialogue: 'dlg.ugarit.yada.lesson' },
]

/** The opening each situation must produce. Order matters: first match wins. */
const OPENINGS: Record<string, Opening[]> = {
  'dlg.ugarit.amnit.meeting': [
    { when: 'first visit', node: 'greet' },
    {
      when: 'has heard the harbour news',
      flags: ['amnit.harbour'],
      node: 'again-harbour',
    },
    {
      when: 'has met her but not asked about the harbour',
      journal: ['journal.slice.amnit-met'],
      node: 'again',
    },
    {
      when: 'both flags set — the harbour entry wins',
      flags: ['amnit.harbour'],
      journal: ['journal.slice.amnit-met'],
      node: 'again-harbour',
    },
  ],
  'dlg.cyprus.amnit': [
    { when: 'first meeting on the island', node: 'yard' },
    { when: 'has spoken to her in the yard', flags: ['amnit.cyprus'], node: 'again' },
  ],
  'dlg.cyprus.ada.smithy': [
    { when: 'first visit', node: 'light' },
    { when: 'has sold her tin', flags: ['ada.tin'], node: 'again-tin' },
    { when: 'has asked the island word', flags: ['ada.asked-word'], node: 'again-word' },
    { when: 'has only watched her work', flags: ['ada.work'], node: 'again-work' },
    {
      when: 'tin and work — tin wins',
      flags: ['ada.tin', 'ada.work'],
      node: 'again-tin',
    },
  ],
  'dlg.ugarit.belet.temple': [
    { when: 'first visit', node: 'greet' },
    {
      when: 'after the name in the hymn',
      journal: ['journal.slice.mystery'],
      node: 'after-mystery',
    },
    { when: 'has sold her oil', flags: ['belet.oil'], node: 'again-oil' },
    { when: 'has asked about the hymn', flags: ['belet.hymn'], node: 'again-hymn' },
    {
      when: 'oil and hymn — oil wins',
      flags: ['belet.oil', 'belet.hymn'],
      node: 'again-oil',
    },
  ],
  'dlg.ugarit.hannu.gate': [
    { when: 'first visit', node: 'greet' },
    {
      when: 'after answering the letter',
      flags: ['palace.letter.answered', 'hannu.errand'],
      node: 'after-answered',
    },
    {
      when: 'after burning the letter',
      flags: ['palace.letter.burned'],
      node: 'after-burned',
    },
    { when: 'has been given the errand', flags: ['hannu.errand'], node: 'again' },
  ],
  'dlg.cyprus.kinyras.meeting': [
    { when: 'first visit', node: 'greet' },
    {
      when: 'after the copper deal',
      flags: ['kinyras.met'],
      journal: ['journal.slice.copper-deal'],
      node: 'after-deal',
    },
    { when: 'has spoken to him', flags: ['kinyras.met'], node: 'again' },
  ],
  'dlg.cyprus.shipti.inn': [
    { when: 'first visit', node: 'courtyard' },
    {
      when: 'is carrying the palace letter',
      flags: ['shipti.letters', 'carries.palace-letter'],
      node: 'again-carried',
    },
    {
      when: 'left the palace letter on the shelf',
      flags: ['shipti.letters', 'left.palace-letter'],
      node: 'again-left',
    },
    { when: 'has asked about letters', flags: ['shipti.letters'], node: 'again-letters' },
    { when: 'has asked who buys copper', flags: ['shipti.who'], node: 'again-who' },
  ],
  'dlg.ugarit.sibtu.ask': [
    { when: 'first visit', node: 'greet' },
    {
      when: 'after helping her',
      journal: ['journal.slice.refugee-helped'],
      node: 'after-help',
    },
    {
      when: 'after refusing her',
      journal: ['journal.slice.refugee-refused'],
      node: 'after-refusal',
    },
    { when: 'has met her but not been asked', flags: ['sibtu.met'], node: 'again' },
  ],
  'dlg.ugarit.tiro.passage': [
    { when: 'first visit', node: 'greet' },
    {
      when: 'has booked passage',
      flags: ['met.tiro', 'tiro.passage'],
      node: 'again-booked',
    },
    { when: 'has spoken to him but not booked', flags: ['met.tiro'], node: 'again' },
  ],
  'dlg.ugarit.yada.lesson': [
    { when: 'first visit', node: 'greet' },
    { when: 'after the free line', flags: ['yada.free-lesson'], node: 'return' },
    {
      when: 'after a paid lesson',
      flags: ['yada.free-lesson', 'yada.paid-lesson'],
      node: 'practised',
    },
  ],
}

function context(
  index: ContentIndex,
  setup: { flags?: string[]; journal?: string[] },
): KernelContext {
  const state = createInitialState({
    seed: 'dialogue-memory-001',
    location: 'dest.ugarit',
    money: 120,
    capacity: 20,
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownDestinations: ['dest.ugarit'],
    knownRoutes: [],
  })

  for (const flag of setup.flags ?? []) state.player.flags[flag] = true
  state.knowledge.journalEntries = [...(setup.journal ?? [])]

  return {
    state,
    index,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
    events: [],
  }
}

function opening(index: ContentIndex, dialogue: string, setup: { flags?: string[]; journal?: string[] }) {
  const ctx = context(index, setup)
  const rejected = startDialogue(ctx, dialogue)
  return { rejected, node: ctx.state.narrative.pending?.node, events: ctx.events }
}

describe('recurring dialogue memory', () => {
  it.each(RECURRING)('$dialogue has a conditional opening', async ({ dialogue }) => {
    const index = await loadContent()
    const graph = index.dialogues.get(dialogue)

    expect(graph).toBeDefined()
    expect(graph?.entries?.length ?? 0).toBeGreaterThan(0)

    for (const entry of graph?.entries ?? []) {
      expect(graph?.nodes[entry.node]).toBeDefined()
      expect(entry.node).not.toBe(graph?.start)
    }
  })

  const rows = Object.entries(OPENINGS).flatMap(([dialogue, openings]) =>
    openings.map((setup) => ({ dialogue, ...setup })),
  )

  it.each(rows)(
    '$dialogue opens on $node when $when',
    async ({ dialogue, flags, journal, node }) => {
      const index = await loadContent()
      const result = opening(index, dialogue, { flags, journal })

      expect(result.rejected).toBeNull()
      expect(result.node).toBe(node)
      expect(result.events).toContainEqual({
        type: 'DialoguePresented',
        dialogue,
        node,
      })
    },
  )

  it.each(RECURRING)('$dialogue is deterministic for a repeatable state', async ({ dialogue }) => {
    const index = await loadContent()
    const openings = OPENINGS[dialogue]
    if (!openings) throw new Error(`no openings table for ${dialogue}`)
    const setup = openings.at(-1)
    if (!setup) throw new Error(`no opening cases for ${dialogue}`)

    const first = opening(index, dialogue, setup)
    const second = opening(index, dialogue, setup)

    expect(first.node).toBe(second.node)
    expect(first.events).toEqual(second.events)
  })
})
