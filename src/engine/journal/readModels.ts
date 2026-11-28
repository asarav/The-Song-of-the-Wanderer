/**
 * Journal, character index, codex, language and faction read models.
 *
 * Every one of these reads **player knowledge**, never world truth (ADR-0004). The index
 * cannot name a character the protagonist has not met, and cannot show a status the
 * protagonist has not learned.
 */

import {
  createDslContent,
  factionName,
  languageName,
  type CodexCategory,
  type ContentIndex,
} from '../content'
import { evaluateCondition } from '../dsl'
import { nextTier, xpToNextTier } from '../culture'
import { RngCursor } from '../rng'
import {
  FACTION_DIMENSIONS,
  LANGUAGE_TIERS,
  RELATIONSHIP_DIMENSIONS,
  type GameState,
} from '../state'

export interface JournalEntryView {
  id: string
  title: string
  text: string
  beatArt?: string[]
}

/**
 * The journal, newest entry first: the last thing written is the thing you opened the
 * book to read. The conversation log keeps its own oldest-first order.
 */
export function deriveJournal(state: GameState, index: ContentIndex): JournalEntryView[] {
  return state.knowledge.journalEntries
    .map((id) => index.journal.get(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      text: entry.text,
      beatArt: entry.beatArt,
    }))
    .reverse()
}

/** One recorded dimension, shown so a favour never reads as nothing happened. */
export interface RegardView {
  dimension: string
  label: string
  value: number
}

const DIMENSION_LABELS: Record<string, string> = {
  trust: 'trust',
  affection: 'affection',
  obligation: 'obligation',
  fear: 'fear',
  respect: 'respect',
  favour: 'favor',
  suspicion: 'suspicion',
}

function regardOf(
  record: Record<string, number | string | undefined>,
  dimensions: readonly string[],
  skip: readonly string[] = [],
): RegardView[] {
  return dimensions
    .filter((dimension) => !skip.includes(dimension))
    .map((dimension) => ({ dimension, value: record[dimension] }))
    .filter((entry): entry is { dimension: string; value: number } =>
      typeof entry.value === 'number' && entry.value !== 0,
    )
    .map((entry) => ({
      dimension: entry.dimension,
      label: DIMENSION_LABELS[entry.dimension] ?? entry.dimension,
      value: entry.value,
    }))
}

export function formatRegard(regard: readonly RegardView[]): string {
  return regard.map((entry) => `${entry.label} ${entry.value > 0 ? '+' : ''}${entry.value}`).join(' · ')
}

export interface CharacterIndexView {
  id: string
  name: string
  lastSeen?: { day: number; location: string; placeName: string; date: string }
  status?: string
  notes: string[]
  regard: RegardView[]
}

export function deriveCharacterIndex(
  state: GameState,
  index: ContentIndex,
  formatDate: (day: number) => string,
): CharacterIndexView[] {
  return Object.entries(state.knowledge.characterIndex).map(([id, entry]) => {
    const place = entry.lastSeen ? index.destinations.get(entry.lastSeen.location) : undefined
    return {
      id,
      name: entry.name,
      lastSeen: entry.lastSeen
        ? {
            day: entry.lastSeen.day,
            location: entry.lastSeen.location,
            placeName: place?.name ?? entry.lastSeen.location,
            date: formatDate(entry.lastSeen.day),
          }
        : undefined,
      status: entry.status,
      notes: entry.notes ?? [],
      regard: regardOf(
        (state.narrative.relationships[id] ?? {}) as Record<string, number | undefined>,
        RELATIONSHIP_DIMENSIONS,
      ),
    }
  })
}

export interface CodexEntryView {
  id: string
  title: string
  text: string
  beatArt?: string[]
  /** The shelf the entry sits on; the reader groups the index by it. */
  category: CodexCategory
}

export function deriveCodex(state: GameState, index: ContentIndex): CodexEntryView[] {
  const content = createDslContent(index)
  return [...index.codex.values()]
    .filter((entry) => {
      if (!entry.unlockedBy) return true
      return evaluateCondition(entry.unlockedBy, {
        state,
        content,
        rng: new RngCursor(state.rng),
      })
    })
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      text: entry.text,
      beatArt: entry.beatArt,
      category: entry.category,
    }))
}

export interface LanguageView {
  id: string
  name: string
  tier: string
  xp: number
  nextTier: string | null
  xpToNext: number | null
}

export function deriveLanguages(state: GameState, index: ContentIndex): LanguageView[] {
  return Object.entries(state.player.languages).map(([id, progress]) => ({
    id,
    name: languageName(index, id),
    tier: progress.tier,
    xp: progress.xp,
    nextTier: nextTier(progress.tier),
    xpToNext: xpToNextTier(progress),
  }))
}

export interface FactionView {
  id: string
  name: string
  type: string
  standing: number
  band: string
  regard: RegardView[]
}

function factionBand(standing: number): string {
  if (standing <= -3) return 'hostile'
  if (standing <= -1) return 'cool'
  if (standing === 0) return 'unproven'
  if (standing <= 2) return 'favourable'
  return 'close'
}

export function deriveFactions(state: GameState, index: ContentIndex): FactionView[] {
  return Object.entries(state.narrative.factions).map(([id, faction]) => ({
    id,
    name: factionName(index, id),
    type: index.factions.get(id)?.type ?? 'community',
    standing: faction.standing,
    band: factionBand(faction.standing),
    regard: regardOf(
      faction as unknown as Record<string, number | string | undefined>,
      FACTION_DIMENSIONS,
      ['standing'],
    ),
  }))
}

export function languageTierNames(): readonly string[] {
  return LANGUAGE_TIERS
}
