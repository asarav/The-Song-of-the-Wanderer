/**
 * The game store.
 *
 * The only place the interface talks to the engine: it holds the current `GameState`,
 * dispatches commands through `reduce`, and derives everything else on read. No rule
 * lives here — a screen that needs a number asks the engine for it.
 */

import { create } from 'zustand'

import {
  characterName,
  factionName,
  goodName,
  languageName,
  type ContentIndex,
} from '@engine/content'
import { eventsOfType, type Command, type SequencedEvent } from '@engine/kernel'
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

const STARTING_PLACES = {
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

/** Presentation only: the breath between one authored scene and whatever comes next. */
export interface SceneExit {
  id: number
  speaker: string | null
  line: string
  destination: string | null
  /** True when the scene spent a day and the night is waiting behind the card. */
  night: boolean
}

/**
 * A one-shot cue for the audio layer. Presentation only: rejected commands leave it
 * untouched, and it never enters a save.
 */
interface SoundCue {
  id: number
  command: Command['type']
}

interface GameStore {
  index: ContentIndex
  state: GameState | null
  screen: GameScreen
  feedback: string | null
  /** The last time a command moved the calendar forward; never part of a save. */
  timePassed: TimePassed | null
  /** The last accepted command, so the UI can play its one-shot sound. */
  sfx: SoundCue | null
  /** A scene has closed; show its exit card before the next screen asks anything. */
  sceneExit: SceneExit | null
  /** A passing was swallowed by a scene; show the night when that scene closes. */
  nightPending: boolean
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
  dismissSceneExit: () => void
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
  index: ContentIndex,
): string | null {
  if (command.type !== 'buy' && command.type !== 'sell') return null

  const money = eventsOfType(events, 'MoneyChanged').at(-1)
  const changed = eventsOfType(events, 'ItemChanged').at(-1)
  if (!changed || !money || money.delta === 0) return null
  const item = { id: changed.item, delta: changed.delta }
  const silver = Math.abs(money.delta)
  const name = goodName(index, item.id)
  return `${command.type === 'buy' ? 'Bought' : 'Sold'} ${Math.abs(item.delta)} ${name.toLowerCase()} for ${silver} shekels.`
}

/**
 * Say what a conversation taught the traveller. Language growth used to happen in the
 * Languages screen and nowhere else, so a lesson read as no change at all.
 */
function languageConfirmation(
  events: SequencedEvent[],
  index: ContentIndex,
): string | null {
  const parts: string[] = []
  for (const event of eventsOfType(events, 'LanguageXpGained')) {
    if (event.amount <= 0) continue
    const name = languageName(index, event.language)
    parts.push(
      event.tierChanged
        ? `Your ${name} is now ${event.tier}.`
        : `Your ${name} improves (+${event.amount} xp).`,
    )
  }
  return parts.length > 0 ? parts.join(' ') : null
}

/**
 * Say when someone's regard has crossed into a readable band. The dimensions changed
 * silently before this: the number moved, the player had no way to notice.
 *
 * Below-band moves stay internal by design. Announcing every +1 would turn a character's
 * regard into a score popup, and the scene itself carries the smaller reaction. The
 * playtest review records that policy as an accepted observation rather than a gap.
 */
function regardConfirmation(
  events: SequencedEvent[],
  index: ContentIndex,
): string | null {
  const phrases: Record<string, string> = {
    hostile: 'has turned against you',
    cold: 'is cold with you now',
    wary: 'is wary of you',
    neutral: 'is neutral toward you again',
    warm: 'is warmer with you',
    close: 'is close to you now',
  }
  const changed = eventsOfType(events, 'RegardChanged')[0]
  if (!changed) return null
  const name = characterName(index, changed.character)
  return `${name} ${phrases[changed.to] ?? 'has noticed you'}.`
}

/**
 * Say when an institution has noticed the traveller. Faction standing had no confirmation
 * at all: it moved in the save while the player saw it only if they opened Factions.
 */
function factionConfirmation(
  events: SequencedEvent[],
  index: ContentIndex,
): string | null {
  const phrases: Record<string, [string, string]> = {
    trust: ['trusts you a little more', 'trusts you a little less'],
    favour: ['will remember the favour', 'will remember the refusal'],
    obligation: ['will expect more of you', 'will expect less of you'],
    standing: ['counts you a little higher', 'counts you a little lower'],
    suspicion: ['watches you more closely', 'watches you less closely'],
  }
  const lines: string[] = []
  for (const event of eventsOfType(events, 'FactionChanged')) {
    if (event.delta === 0) continue
    const name = factionName(index, event.faction)
    const phrase = phrases[event.dimension]?.[event.delta > 0 ? 0 : 1]
    lines.push(`${name} ${phrase ?? 'has noticed you'}.`)
  }
  return lines.length > 0 ? lines.join(' ') : null
}

/** A promise or debt is a standing record, so it is announced when it is opened. */
function promiseConfirmation(
  events: SequencedEvent[],
  index: ContentIndex,
): string | null {
  const opened = eventsOfType(events, 'PromiseOpened')[0]
  if (!opened) return null
  const name = characterName(index, opened.character)
  return opened.owedBy === 'player'
    ? `You owe ${name}: ${opened.kind === 'debt' ? 'a debt' : 'a promise'}. It is written in the journal.`
    : `${name} owes you. It is written in the journal.`
}

let passages = 0
let soundCues = 0
let exits = 0

/**
 * The last spoken line of a scene, without markdown emphasis. A scene often closes on a
 * line of narration after the speaker has stopped; quoting that sentence would put the
 * narrator's description in the speaker's mouth.
 */
function closingLine(text: string): string {
  const plain = text.replace(/\*\*/g, '').replace(/\n+/g, ' ').trim()
  const spoken = [...plain.matchAll(/["“]([^"”]+)["”]/g)]
  if (spoken.length > 0) return spoken.at(-1)?.[1]?.trim() ?? plain
  const sentences = plain.split(/(?<=[.!?])\s+/).filter(Boolean)
  const line = sentences.at(-1) ?? plain
  // The card supplies its own quotation marks; do not double them when the line already
  // ends inside a character's speech.
  return line.replace(/^["“]/, '').replace(/["”]$/, '')
}

/**
 * A scene that ends is a moment, not a cut. The card names who was speaking and keeps
 * their last line in front of the reader until they choose to go on.
 */
function sceneExitAfter(
  before: GameState,
  after: GameState,
  index: ContentIndex,
  previousScreen: GameScreen,
  overnight: boolean,
): SceneExit | null {
  if (previousScreen !== 'scene') return null
  const pending = before.narrative.pending
  if (!pending) return null
  const next = after.narrative.pending
  if (next && next.dialogue === pending.dialogue) return null

  const dialogue = index.dialogues.get(pending.dialogue)
  const node = dialogue?.nodes[pending.node]
  if (!dialogue || !node) return null
  const speaker = dialogue.speaker ? characterName(index, dialogue.speaker) : null
  const destinationId = after.narrative.journey?.destination ?? after.player.location
  const destination = index.destinations.get(destinationId)?.name ?? null
  return {
    id: (exits += 1),
    speaker,
    line: closingLine(node.text),
    destination,
    night: overnight,
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  index: loadContentIndex(),
  state: null,
  screen: 'title',
  feedback: null,
  timePassed: null,
  sfx: null,
  sceneExit: null,
  nightPending: false,
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
      sceneExit: null,
      nightPending: false,
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

  dismissSceneExit: () => set({ sceneExit: null }),

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
    const previousScreen = get().screen

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
    const pending = Boolean(result.state.narrative.pending)
    const journey = Boolean(result.state.narrative.journey)
    const nightPending = !journey && (to > from || get().nightPending) && pending
    const nightFalls = !pending && !journey && (to > from || get().nightPending)

    // A place belongs to the port; changing where the player is ends that visit.
    const placeId = result.state.player.location === state.player.location ? get().placeId : null
    const screen = nightFalls ? 'night' : screenAfter(result.state, get().screen, placeId)
    const sceneExit = sceneExitAfter(
      state,
      result.state,
      index,
      previousScreen,
      get().nightPending || to > from,
    )
    const confirmation = [
      tradeConfirmation(command, result.events, index),
      languageConfirmation(result.events, index),
      regardConfirmation(result.events, index),
      factionConfirmation(result.events, index),
      promiseConfirmation(result.events, index),
    ].filter((line): line is string => Boolean(line))

    set({
      state: result.state,
      screen,
      placeId,
      sceneExit: sceneExit ?? get().sceneExit,
      nightPending,
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
      sceneExit: null,
      nightPending: false,
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
      sceneExit: null,
      nightPending: false,
      dialogueLog: [],
      readPassages: [],
      placeId: null,
    }),
}))
