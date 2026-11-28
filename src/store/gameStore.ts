/**
 * The game store.
 *
 * The only place the interface talks to the engine: it holds the current `GameState`,
 * dispatches commands through `reduce`, and derives everything else on read. No rule
 * lives here — a screen that needs a number asks the engine for it.
 */

import { create } from 'zustand'

import type { Command, SequencedEvent } from '@engine/kernel'
import { newGame } from '@engine/kernel'
import { reduce } from '@engine/kernel'
import { deserialize, SaveError, serialize } from '@engine/save'
import { DEFAULT_DIFFICULTY, type Difficulty, type GameState } from '@engine/state'
import { deriveDayReport, type DayReport } from '@engine/views'
import { loadContentIndex } from './content'
import { appendDialogueLog, type DialogueLogEntry } from './dialogueLog'

export type GameScreen =
  | 'title'
  | 'world'
  | 'credits'
  | 'prologue'
  | 'new'
  | 'destination'
  | 'place'
  | 'night'
  | 'status'
  | 'map'
  | 'market'
  | 'routes'
  | 'journey'
  | 'scene'
  | 'journal'
  | 'codex'
  | 'characters'
  | 'factions'
  | 'languages'
  | 'cargo'
  | 'settings'
  | 'save'

export const SAVE_KEY = 'song-of-the-wanderer.save.v1'
export const AUTOSAVE_KEY = 'song-of-the-wanderer.autosave.v1'

export const STARTING_PLACES = {
  location: 'dest.ugarit',
  capacity: 20,
  languages: { 'lang.akkadian': { xp: 25, tier: 'basic' as const } },
  inventory: [{ item: 'good.olive-oil', quantity: 2 }],
  knownDestinations: ['dest.ugarit'],
  knownRoutes: [] as string[],
}

export interface StartOptions {
  seed: string
  difficulty?: Difficulty
}

/**
 * A calendar move the interface can show: the day before, the day now, and an id that
 * grows so two passings in a row are two events. Presentation only — never saved.
 */
export interface TimePassed {
  id: number
  from: number
  to: number
  /** What the player's conditions did over those days; null when there were none. */
  report: DayReport | null
}

/**
 * A one-shot cue for the audio layer. Presentation only: rejected commands leave it
 * untouched, and it never enters a save.
 */
export interface SoundCue {
  id: number
  command: Command['type']
}

interface GameStore {
  index: ReturnType<typeof loadContentIndex>
  state: GameState | null
  screen: GameScreen
  feedback: string | null
  /** The last time a command moved the calendar forward; never part of a save. */
  timePassed: TimePassed | null
  /** The last accepted command, so the UI can play its one-shot sound. */
  sfx: SoundCue | null
  /** What has been said this session; cleared by a new run or a load. */
  dialogueLog: DialogueLogEntry[]
  /** Paced passages already read this session, so they are not paced twice. */
  readPassages: string[]
  /**
   * The place the player last entered. Presentation only: not saved, and cleared when
   * they leave the port, so a scene or the market can return to the place it opened from.
   */
  placeId: string | null
  start: (options: StartOptions) => void
  noteDialogue: (entry: DialogueLogEntry) => void
  markPassageRead: (passage: string) => void
  setScreen: (screen: GameScreen) => void
  visitPlace: (placeId: string) => void
  dispatch: (command: Command) => void
  save: () => void
  load: () => void
  reset: () => void
}

function screenFor(state: GameState): GameScreen {
  if (state.narrative.pending) return 'scene'
  if (state.narrative.journey) return 'journey'
  return 'destination'
}

/**
 * Keep the current screen for ordinary commands (a purchase should not eject the player
 * from the market), but follow scenes and journeys as they open and close.
 */
export function screenAfter(
  state: GameState,
  current: GameScreen,
  placeId: string | null = null,
): GameScreen {
  if (state.narrative.pending) return 'scene'
  if (state.narrative.journey) return 'journey'
  if (current === 'scene') return placeId ? 'place' : 'destination'
  if (current === 'journey') return 'destination'
  return current
}

/**
 * Whether the title can honestly offer Continue. A key alone is not enough: the slot
 * must deserialize, so a corrupt envelope does not present as a working run.
 */
export function hasSavedJourney(storage?: Pick<Storage, 'getItem'>): boolean {
  let disk = storage
  if (!disk) {
    try {
      disk = window.localStorage
    } catch {
      return false
    }
  }
  for (const key of [SAVE_KEY, AUTOSAVE_KEY]) {
    try {
      const raw = disk.getItem(key)
      if (!raw) continue
      if (deserialize(JSON.parse(raw) as unknown).ok) return true
    } catch {
      // An unreadable slot is skipped; the other may still hold a run.
    }
  }
  return false
}

function readSave(): { state: GameState } | { error: SaveError } {
  // Continue takes the most recent save. Preferring the manual slot stranded a run whose
  // autosave had moved on, because the manual save was older but looked more official.
  const candidates = [SAVE_KEY, AUTOSAVE_KEY]
    .map((key) => window.localStorage.getItem(key))
    .filter((raw): raw is string => raw !== null)

  const first = candidates[0]
  if (first === undefined) {
    return { error: new SaveError('not-a-save', 'There is no save yet.') }
  }

  let raw = first
  let newest = ''
  for (const candidate of candidates) {
    try {
      const envelope = JSON.parse(candidate) as { savedAt?: unknown }
      const savedAt = typeof envelope.savedAt === 'string' ? envelope.savedAt : ''
      if (savedAt > newest) {
        newest = savedAt
        raw = candidate
      }
    } catch {
      // An unreadable slot is skipped; another one may still load.
    }
  }
  try {
    const loaded = deserialize(JSON.parse(raw) as unknown)
    return loaded.ok ? { state: loaded.state } : { error: loaded.error }
  } catch {
    return { error: new SaveError('not-a-save', 'The save could not be read.') }
  }
}

/**
 * Say what a completed trade did, using the events the reducer already emitted. The
 * store does not re-price anything; it only names the silver and goods that moved.
 */
function tradeConfirmation(
  command: Command,
  events: SequencedEvent[],
  index: ReturnType<typeof loadContentIndex>,
): string | null {
  if (command.type !== 'buy' && command.type !== 'sell') return null

  let silver = 0
  let item: { id: string; delta: number } | null = null
  for (const entry of events) {
    if (entry.event.type === 'MoneyChanged') silver = Math.abs(entry.event.delta)
    if (entry.event.type === 'ItemChanged') {
      item = { id: entry.event.item, delta: entry.event.delta }
    }
  }

  if (!item || silver === 0) return null
  const name = index.goods.get(item.id)?.name ?? item.id
  return `${command.type === 'buy' ? 'Bought' : 'Sold'} ${Math.abs(item.delta)} ${name.toLowerCase()} for ${silver} shekels.`
}

/**
 * Say what a conversation taught the traveller. Language growth used to happen in the
 * Languages screen and nowhere else, so a lesson read as no change at all.
 */
function languageConfirmation(
  events: SequencedEvent[],
  index: ReturnType<typeof loadContentIndex>,
): string | null {
  const parts: string[] = []
  for (const entry of events) {
    if (entry.event.type !== 'LanguageXpGained') continue
    if (entry.event.amount <= 0) continue
    const name = index.languages.get(entry.event.language)?.name ?? entry.event.language
    parts.push(
      entry.event.tierChanged
        ? `Your ${name} is now ${entry.event.tier}.`
        : `Your ${name} improves (+${entry.event.amount} xp).`,
    )
  }
  return parts.length > 0 ? parts.join(' ') : null
}

/**
 * Say when someone's regard has crossed into a readable band. The dimensions changed
 * silently before this: the number moved, the player had no way to notice.
 */
function regardConfirmation(
  events: SequencedEvent[],
  index: ReturnType<typeof loadContentIndex>,
): string | null {
  const phrases: Record<string, string> = {
    hostile: 'has turned against you',
    cold: 'is cold with you now',
    wary: 'is wary of you',
    neutral: 'is neutral toward you again',
    warm: 'is warmer with you',
    close: 'is close to you now',
  }
  for (const entry of events) {
    if (entry.event.type !== 'RegardChanged') continue
    const name = index.characters.get(entry.event.character)?.name ?? entry.event.character
    return `${name} ${phrases[entry.event.to] ?? 'has noticed you'}.`
  }
  return null
}

/** A promise or debt is a standing record, so it is announced when it is opened. */
function promiseConfirmation(
  events: SequencedEvent[],
  index: ReturnType<typeof loadContentIndex>,
): string | null {
  for (const entry of events) {
    if (entry.event.type !== 'PromiseOpened') continue
    const name = index.characters.get(entry.event.character)?.name ?? entry.event.character
    return entry.event.kind === 'debt'
      ? `You now owe ${name}. It is written in the journal.`
      : `You have promised ${name}. It is written in the journal.`
  }
  return null
}

let passages = 0
let soundCues = 0

export const useGameStore = create<GameStore>((set, get) => ({
  index: loadContentIndex(),
  state: null,
  screen: 'title',
  feedback: null,
  timePassed: null,
  sfx: null,
  dialogueLog: [],
  readPassages: [],
  placeId: null,

  start: ({ seed, difficulty = DEFAULT_DIFFICULTY }) => {
    const index = get().index
    const started = newGame(
      {
        seed,
        difficulty,
        location: STARTING_PLACES.location,
        capacity: STARTING_PLACES.capacity,
        languages: STARTING_PLACES.languages,
        inventory: STARTING_PLACES.inventory.map((entry) => ({ ...entry })),
        knownDestinations: [...STARTING_PLACES.knownDestinations],
        knownRoutes: [...STARTING_PLACES.knownRoutes],
        contentVersions: { 'pack.core': 1, 'pack.slice': 1 },
      },
      index,
    )

    set({
      state: started.state,
      screen: screenFor(started.state),
      feedback: null,
      timePassed: null,
      sfx: null,
      dialogueLog: [],
      readPassages: [],
      placeId: null,
    })
  },

  noteDialogue: (entry) =>
    set((store) => ({ dialogueLog: appendDialogueLog(store.dialogueLog, entry) })),

  markPassageRead: (passage) =>
    set((store) =>
      store.readPassages.includes(passage)
        ? store
        : { readPassages: [...store.readPassages, passage] },
    ),

  setScreen: (screen) => {
    // A scene stays in front of you until it is answered: walking away from it used to
    // strand the run, with no control left that could resolve it.
    if (get().state?.narrative.pending && screen !== 'scene') {
      set({ screen: 'scene' })
      return
    }
    // The port index is the top level; leaving a place for it forgets the last place.
    // Trade confirmation belongs to the screen it happened on, not every screen after it.
    set({
      screen,
      feedback: null,
      ...(screen === 'destination' || screen === 'title' ? { placeId: null } : {}),
    })
  },

  visitPlace: (placeId) => {
    const state = get().state
    if (!state) return
    if (state.narrative.pending) {
      set({ screen: 'scene' })
      return
    }
    set({ screen: 'place', placeId, feedback: null })
  },

  dispatch: (command) => {
    const { state, index } = get()
    if (!state) return

    const result = reduce(state, command, index)
    if (result.rejected) {
      set({ feedback: result.rejected.reason })
      return
    }

    // Autosave every accepted command; the manual slot is a separate key.
    try {
      window.localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify(serialize(result.state, { savedAt: new Date().toISOString() })),
      )
    } catch {
      // A full or blocked store must not break play.
    }

    const from = state.calendar.day
    const to = result.state.calendar.day

    /*
     * A day spent at a place ends after dark. A scene that the evening opened (a night
     * encounter) stays in front; otherwise the night itself is the screen, and morning is
     * one button away. Presentation only: nothing about the night is saved.
     */
    const nightFalls =
      to > from && !result.state.narrative.pending && !result.state.narrative.journey

    // A place belongs to the port; changing where the player is ends that visit.
    const placeId = result.state.player.location === state.player.location ? get().placeId : null
    const screen = nightFalls ? 'night' : screenAfter(result.state, get().screen, placeId)
    const confirmation = [
      tradeConfirmation(command, result.events, index),
      languageConfirmation(result.events, index),
      regardConfirmation(result.events, index),
      promiseConfirmation(result.events, index),
    ].filter((line): line is string => Boolean(line))

    set({
      state: result.state,
      screen,
      placeId,
      feedback: confirmation.length > 0 ? confirmation.join(' ') : null,
      sfx: { id: (soundCues += 1), command: command.type },
      // Only a command that actually moved the clock reports a passing; a load does not.
      timePassed:
        to > from
          ? {
              id: (passages += 1),
              from,
              to,
              report: deriveDayReport(state, result.state, index),
            }
          : null,
    })
  },

  save: () => {
    const { state } = get()
    if (!state) return
    const envelope = serialize(state, { savedAt: new Date().toISOString() })
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(envelope))
    set({ feedback: 'Saved.' })
  },

  load: () => {
    const loaded = readSave()
    if ('error' in loaded) {
      set({ feedback: loaded.error.message })
      return
    }
    set({
      state: loaded.state,
      screen: screenFor(loaded.state),
      feedback: null,
      timePassed: null,
      sfx: null,
      dialogueLog: [],
      readPassages: [],
      placeId: null,
    })
  },

  reset: () =>
    set({
      state: null,
      screen: 'title',
      feedback: null,
      timePassed: null,
      sfx: null,
      dialogueLog: [],
      readPassages: [],
      placeId: null,
    }),
}))
