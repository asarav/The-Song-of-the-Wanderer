/**
 * Interface for the vertical slice.
 *
 * A changing illustrated world reached through six menu groups. Every number on screen
 * comes from an engine read model; presentation never computes a rule.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'

import { createDslContent, type ContentIndex } from '@engine/content'
import { formatDisplayDate } from '@engine/time'
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_SELF_NAME,
  DIFFICULTIES,
  DIFFICULTY_CONFIG,
  type Difficulty,
  type GameState,
} from '@engine/state'
import { itemWeight } from '@engine/economy'
import {
  deriveDestination,
  deriveLocalMap,
  derivePlace,
  deriveRegionalMap,
  deriveSelf,
  deriveWorldMap,
  presentCharacters,
} from '@engine/views'
import type { LocalMapView, LocalMarkView, MapFeatureView, MapPlaceView } from '@engine/views'
import { deriveJourney } from '@engine/views'
import { deriveMarket } from '@engine/economy'
import { deriveKnownRoutes, exertionOf, PASSAGE_PROVISION } from '@engine/world'
import { deriveScene } from '@engine/narrative'
import type { SceneChoiceCost } from '@engine/narrative'
import {
  deriveCharacterIndex,
  deriveCodex,
  deriveFactions,
  deriveJournal,
  deriveLanguages,
  formatRegard,
} from '@engine/journal'
import { hasSavedJourney, useGameStore, type GameScreen, type TimePassed } from '@store/gameStore'
import { artFor, type ArtAsset } from './art'
import { AudioPlayer, playGateSfx } from './audioPlayer'
import { Backdrop, TitleBackdrop, backdropFor } from './backdrop'
import { InfoTip } from './InfoTip'
import { groupCodex } from './codex'
import { groupLogByDay } from './log'
import { cityPath, coastPath, localStreetPath, peakPath, polylinePath } from './sketch'
import { placeActionFor } from './place'
import { beatAt, parseRuns, passageKey, splitBeats } from './story'
import { minas, shekels } from './units'
import { writtenFor, writtenForDisplay } from './written'
import { CREDITS, MENU, MENU_LANDS, PROLOGUE_BEATS, WORLD_WONDERS, prologueBeatAt } from './title'
import {
  DEFAULT_TEXT_SIZE,
  normalizeTextSize,
  readTextSize,
  TEXT_SIZE_KEY,
  TEXT_SIZES,
  type TextSize,
} from './comfort'

interface NavGroup {
  id: string
  label: string
  screens: { id: GameScreen; label: string }[]
}

/**
 * Six ways into the journey, not fourteen. Screens that answer the same question share a
 * group and a tab row: the market and your cargo, the map and the road, the people and
 * the record. The first screen is the one the group opens on.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'place',
    label: 'Place',
    screens: [{ id: 'destination', label: 'Place' }],
  },
  {
    id: 'trade',
    label: 'Trade',
    screens: [
      { id: 'market', label: 'Market' },
      { id: 'cargo', label: 'Cargo' },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    screens: [
      { id: 'map', label: 'Map' },
      { id: 'routes', label: 'Roads' },
      { id: 'journey', label: 'Journey' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    screens: [
      { id: 'characters', label: 'People' },
      { id: 'status', label: 'Status' },
      { id: 'factions', label: 'Factions' },
      { id: 'languages', label: 'Languages' },
    ],
  },
  {
    id: 'journal',
    label: 'Journal',
    screens: [
      { id: 'journal', label: 'Journal' },
      { id: 'codex', label: 'Codex' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    screens: [
      { id: 'settings', label: 'Settings' },
      { id: 'save', label: 'Save' },
    ],
  },
]

function navGroupFor(screen: GameScreen): NavGroup | undefined {
  // A place belongs to the Place group even though it is reached through its port.
  const target = screen === 'place' ? 'destination' : screen
  return NAV_GROUPS.find((group) => group.screens.some((item) => item.id === target))
}

/** Screens stay visible but unavailable while a scene or a journey forbids them. */
function screenAvailable(state: GameState, index: ContentIndex, screen: GameScreen): boolean {
  if (state.narrative.pending) return false
  if (screen === 'journey') return Boolean(state.narrative.journey)
  if (screen === 'market') return index.destinations.has(state.player.location)
  return true
}

export function App() {
  const state = useGameStore((s) => s.state)
  const screen = useGameStore((s) => s.screen)
  const index = useGameStore((s) => s.index)
  const placeId = useGameStore((s) => s.placeId)
  const timePassed = useGameStore((s) => s.timePassed)

  // A new screen starts at its heading, not wherever the last one was left.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  // A screen change replaces whatever control was focused. Keep keyboard users in the
  // new screen; the scene and journey screens focus themselves when they change node.
  useEffect(() => {
    if (screen === 'scene' || screen === 'journey') return
    // Keep the deliberate scroll position above; focusing must not tuck the heading
    // under the sticky phone masthead.
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [screen])

  if (!state) {
    const sound = <AudioPlayer screen={screen} />

    return (
      <div className="title-frame">
        {screen === 'credits' ? null : sound}
        {screen === 'title' ? (
          <TitleBackdrop />
        ) : (
          <Backdrop art={backdropFor({ screen: 'title' })} />
        )}
        {screen === 'new' ? (
          <NewGame />
        ) : screen === 'prologue' ? (
          <Prologue />
        ) : screen === 'world' ? (
          <World />
        ) : screen === 'credits' ? (
          <Credits sound={sound} />
        ) : (
          <Menu />
        )}
      </div>
    )
  }

  const pending = state.narrative.pending
  const pendingDialogue = pending ? index.dialogues.get(pending.dialogue) : undefined
  const pendingArt = pending ? pendingDialogue?.nodes[pending.node]?.art : undefined
  const pendingBeatArt = pending ? (pendingDialogue?.nodes[pending.node]?.beatArt ?? []) : []
  const speakerArt = pending ? index.characters.get(pendingDialogue?.speaker ?? '')?.art : undefined
  const destination = index.destinations.get(state.player.location)
  const currentPlace = placeId
    ? destination?.places.find((place) => place.id === placeId)
    : undefined
  const placeArtId = destination?.art
  const nightArtId = destination?.night?.art
  // A scene opened by one of the place's night encounters is still that place after dark.
  const atNight =
    screen === 'night' ||
    Boolean(
      pending?.event && destination?.night?.events.some((entry) => entry.event === pending.event),
    )
  const backdrop = backdropFor({
    screen,
    placeArtId: atNight ? (nightArtId ?? placeArtId) : placeArtId,
    journeyArtId: state.narrative.journey
      ? index.destinations.get(state.narrative.journey.destination)?.art
      : undefined,
    speakerArtId: speakerArt,
    /*
     * One picture, one place on the screen. A scene shows its own beat art and the
     * speaker's portrait; the Place screen shows the place as its hero. The world
     * behind yields rather than repeating either.
     */
    avoid:
      screen === 'scene'
        ? [pendingArt, speakerArt, ...pendingBeatArt]
        : screen === 'destination'
          ? [placeArtId, ...(destination?.beatArt ?? [])]
          : screen === 'place'
            ? [currentPlace?.art]
            : screen === 'night'
              ? [nightArtId ?? placeArtId]
              : [],
  })

  return (
    <div className="game">
      <Backdrop art={backdrop} />
      <a className="skip-link" href="#main">
        Skip to the story
      </a>
      <Sidebar timePassed={timePassed}>
        <AudioPlayer
          screen={screen}
          destinationId={state.player.location}
          placeId={placeId}
          atNight={atNight}
        />
      </Sidebar>
      <main id="main" className="stage" tabIndex={-1}>
        <ScreenTabs />
        <FirstSteps />
        {screen === 'scene' ? <Scene /> : null}
        {screen === 'destination' ? <Destination /> : null}
        {screen === 'place' ? <Place /> : null}
        {screen === 'night' ? <Night /> : null}
        {screen === 'status' ? <Status /> : null}
        {screen === 'map' ? <Map /> : null}
        {screen === 'market' ? <Market /> : null}
        {screen === 'routes' ? <Roads /> : null}
        {screen === 'journey' ? <Journey /> : null}
        {screen === 'journal' ? <Journal /> : null}
        {screen === 'codex' ? <Codex /> : null}
        {screen === 'characters' ? <People /> : null}
        {screen === 'factions' ? <Factions /> : null}
        {screen === 'languages' ? <Languages /> : null}
        {screen === 'cargo' ? <Cargo /> : null}
        {screen === 'settings' ? <Settings /> : null}
        {screen === 'save' ? <SavePanel /> : null}
      </main>
      <Feedback />
      <DayNote change={timePassed} />
    </div>
  )
}

/**
 * The main menu: the name, the two ways in, and one deliberate door to the world gallery.
 * No places are listed on the way into the journey.
 */
function Menu() {
  const setScreen = useGameStore((s) => s.setScreen)
  const load = useGameStore((s) => s.load)
  const [canContinue] = useState(() => hasSavedJourney())

  return (
    <main className="menu">
      <header className="menu-head">
        <p className="eyebrow">{MENU.eyebrow}</p>
        <h1>{MENU.name}</h1>
        <p className="tagline">{MENU.tagline}</p>

        <div className="actions menu-actions title-actions">
          <button type="button" className="btn primary" onClick={() => setScreen('prologue')}>
            {MENU.begin}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!canContinue}
            aria-describedby={canContinue ? undefined : 'continue-unavailable'}
            onClick={load}
          >
            Continue a saved journey
          </button>
          <button type="button" className="btn small" onClick={() => setScreen('world')}>
            {MENU.world}
          </button>
          <button type="button" className="btn small" onClick={() => setScreen('credits')}>
            {CREDITS.label}
          </button>
        </div>
        {!canContinue ? (
          <p id="continue-unavailable" className="note continue-note">
            No saved journey to continue on this device yet. Begin one, and it will wait here.
          </p>
        ) : null}
      </header>

      <TextSizeControl />
    </main>
  )
}

/**
 * The world gallery, kept off the title screen: the menu offers a journey, this page
 * offers context. It is the only place before play that lists places, and it is reached
 * deliberately rather than shown on the way in.
 */
function World() {
  const setScreen = useGameStore((s) => s.setScreen)
  const index = useGameStore((s) => s.index)

  return (
    <main className="menu world-page">
      <header className="menu-head">
        <p className="eyebrow">{MENU.eyebrow}</p>
        <h1>{MENU.world}</h1>
        <p className="tagline">{MENU.worldNote}</p>
        <div className="actions menu-actions">
          <button type="button" className="btn" onClick={() => setScreen('title')}>
            Back to the title
          </button>
        </div>
      </header>

      <section className="lands" aria-labelledby="lands-heading">
        <h2 id="lands-heading">{MENU.lands}</h2>
        <p className="lands-note">{MENU.landsNote}</p>
        <ul className="land-grid">
          {MENU_LANDS.map((land) => {
            const art = artFor(land.art)
            return (
              <li key={land.region} className="land-card">
                {art ? <img className="land-art" src={art.src} alt={art.alt} /> : null}
                <div className="land-body">
                  <p className="land-where">{land.where}</p>
                  <h3>{index.regions.get(land.region)?.name}</h3>
                  <p>{land.line}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="world" aria-labelledby="world-heading">
        <h2 id="world-heading">{MENU.worldPlaces}</h2>
        <ul className="wonder-grid">
          {WORLD_WONDERS.map((wonder) => {
            const art = artFor(wonder.art)
            return (
              <li key={wonder.name} className="land-card wonder-card">
                {art ? <img className="land-art" src={art.src} alt={art.alt} /> : null}
                <div className="land-body">
                  <p className="land-where">{wonder.where}</p>
                  <h3>{wonder.name}</h3>
                  <p>{wonder.line}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <TextSizeControl />
    </main>
  )
}

/**
 * The credits, reached from the title and deliberately outside the journey. The game has
 * one maker to name here; do not invent roles for people who have not been asked.
 */
function Credits({ sound }: { sound?: ReactNode }) {
  const setScreen = useGameStore((s) => s.setScreen)

  return (
    <main className="menu credits-page">
      <header className="menu-head">
        <p className="eyebrow">{CREDITS.eyebrow}</p>
        <h1>{MENU.name}</h1>
        <p className="tagline">{MENU.tagline}</p>
      </header>

      <section className="credits-card" aria-label="Game credits">
        <p className="eyebrow">{CREDITS.role}</p>
        <p className="credit-name">{CREDITS.creator}</p>
        <p className="credit-line">{CREDITS.line}</p>
      </section>

      <section className="credits-attributions" aria-labelledby="credits-attribution">
        <h2 id="credits-attribution">Attributions</h2>
        <div className="credit-sections">
          {CREDITS.attributions.map((entry) => (
            <section key={entry.title} className="credit-section">
              <h3>{entry.title}</h3>
              {entry.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {entry.link ? (
                <a className="credit-link" href={entry.link.href} target="_blank" rel="noreferrer">
                  {entry.link.label}
                </a>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      <div className="actions menu-actions">
        <button type="button" className="btn" onClick={() => setScreen('title')}>
          Back to the title
        </button>
      </div>

      <div className="credits-tools">
        {sound}
        <TextSizeControl />
      </div>
    </main>
  )
}

/**
 * The prologue: the world as it stands before the traveler, one beat beside its own
 * picture, then the name and the seed. It is the only passage read outside a save.
 */
function Prologue() {
  const setScreen = useGameStore((s) => s.setScreen)
  const [step, setStep] = useState(0)
  const beat = prologueBeatAt(step)
  const art = artFor(beat.art)
  const last = step >= PROLOGUE_BEATS.length - 1

  return (
    <main className="shell title-shell prologue-shell">
      <header className="masthead">
        <p className="eyebrow">{MENU.prologueEyebrow}</p>
        <h1>{MENU.prologueTitle}</h1>
      </header>

      <article className="panel prologue-panel">
        {art ? (
          <figure className="prologue-art">
            <img src={art.src} alt={art.alt} />
          </figure>
        ) : null}
        <p className="prologue-beat" aria-live="polite">
          <Rich text={beat.text} />
        </p>
        <div className="actions prologue-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => (last ? setScreen('new') : setStep(step + 1))}
          >
            {last ? 'Step ashore' : 'Continue'}
          </button>
          <span className="beat-dots" aria-hidden="true">
            {PROLOGUE_BEATS.map((entry, position) => (
              <span key={entry.art} className={position <= step ? 'dot on' : 'dot'} />
            ))}
          </span>
        </div>
      </article>
    </main>
  )
}

function TextSizeControl() {
  const [size, setSize] = useState<TextSize>(() => {
    try {
      return readTextSize(typeof window === 'undefined' ? null : window.localStorage)
    } catch {
      return DEFAULT_TEXT_SIZE
    }
  })

  useEffect(() => {
    document.documentElement.dataset.textSize = size
    try {
      window.localStorage.setItem(TEXT_SIZE_KEY, size)
    } catch {
      // A blocked store must not break the control.
    }
  }, [size])

  return (
    <label className="comfort">
      <span>Text size</span>
      <select value={size} onChange={(event) => setSize(normalizeTextSize(event.target.value))}>
        {TEXT_SIZES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Renders the tablet spelling with its subscript reading as a subscript in every font. */
function Subscripted({ text }: { text: string }) {
  const hasSubscript = text.endsWith('₂')
  return (
    <>
      {hasSubscript ? text.slice(0, -1) : text}
      {hasSubscript ? <span className="tablet-sub">₂</span> : null}
    </>
  )
}

/**
 * The name as the tablet writes it, with the spelling in parentheses. The reconstruction
 * (Ermahas) stays a codex gloss: no character says it and nothing here asserts it.
 */
function TabletName({ name }: { name: string }) {
  const written = writtenForDisplay(name)
  if (!written) return <span className="tablet-name">{name}</span>

  return (
    <span className="tablet-name written">
      <span className="written-script" aria-hidden="true">
        {written.script}
      </span>{' '}
      <span className="written-reading">
        (<Subscripted text={name} />)
      </span>
    </span>
  )
}

function NewGame() {
  const start = useGameStore((s) => s.start)
  const setScreen = useGameStore((s) => s.setScreen)
  const [seed, setSeed] = useState('wanderer-1')
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY)

  return (
    <main className="shell title-shell">
      <header className="masthead">
        <p className="eyebrow">A new journey</p>
        <h1>
          <TabletName name={DEFAULT_SELF_NAME} />
        </h1>
        <p className="tagline">
          The name the tablet gives you. The harbor, the temple and the island may each call you
          something else.
        </p>
      </header>

      <form
        className="panel form"
        onSubmit={(event) => {
          event.preventDefault()
          playGateSfx()
          start({ seed: seed.trim() || 'wanderer-1', difficulty })
        }}
      >
        <p className="note">
          The name is already written. You come ashore at Ugarit with two jars of oil and a past
          that people will read for themselves.
        </p>

        <label>
          <span>Seed</span>
          <input value={seed} onChange={(event) => setSeed(event.target.value)} />
          <small>The same seed and the same choices tell the same story.</small>
        </label>

        <fieldset className="difficulty">
          <legend>Choose the road</legend>
          <p className="note">
            The story is the same. The purse you land with, the reserve in your body and the odds
            the road asks of you are not.
          </p>
          <div className="difficulty-grid">
            {DIFFICULTIES.map((id) => {
              const mode = DIFFICULTY_CONFIG[id]
              return (
                <label
                  key={id}
                  className={`difficulty-option${difficulty === id ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={id}
                    checked={difficulty === id}
                    onChange={() => setDifficulty(id)}
                  />
                  <span className="difficulty-name">{mode.name}</span>
                  <span className="difficulty-start">
                    {mode.startingMoney} shekels · {mode.startingStamina} of 8 reserve
                  </span>
                  <small>{mode.note}</small>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="actions">
          <button type="submit" className="btn primary">
            Step ashore
          </button>
          <button type="button" className="btn" onClick={() => setScreen('title')}>
            Back
          </button>
        </div>
        <TextSizeControl />
      </form>
    </main>
  )
}

/**
 * The tab row for a menu group. It shows only where a group has more than one screen, so
 * Place stays a plain page rather than a tab of one.
 */
function ScreenTabs() {
  const screen = useGameStore((s) => s.screen)
  const setScreen = useGameStore((s) => s.setScreen)
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  const group = navGroupFor(screen)
  if (!state || !group || group.screens.length < 2) return null

  return (
    <nav className="screen-tabs" aria-label={`${group.label} screens`}>
      {group.screens.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={screen === item.id}
          disabled={!screenAvailable(state, index, item.id)}
          onClick={() => setScreen(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function Sidebar({
  timePassed,
  children,
}: {
  timePassed: TimePassed | null
  children?: ReactNode
}) {
  const screen = useGameStore((s) => s.screen)
  const setScreen = useGameStore((s) => s.setScreen)
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  if (!state) return null

  const place =
    index.destinations.get(state.player.location)?.name ??
    index.routes.get(state.player.location)?.name ??
    state.player.location

  const pending = state.narrative.pending
  const pendingSpeakerId = pending ? index.dialogues.get(pending.dialogue)?.speaker : undefined
  const pendingSpeaker = pendingSpeakerId
    ? (index.characters.get(pendingSpeakerId)?.name ?? pendingSpeakerId)
    : null
  const activeGroup = navGroupFor(screen)

  return (
    <aside className="sidebar">
      <p className="wordmark">The Song of the Wanderer</p>
      <div className="where">
        {/* A new day remounts the clock, so the change is visible where the date lives. */}
        <p key={timePassed?.id ?? 'clock'} className={timePassed ? 'eyebrow day-tick' : 'eyebrow'}>
          {formatDisplayDate(state.calendar.day)}
        </p>
        <p className="place">{place}</p>
        <p className="purse">{shekels(state.player.money)}</p>
        {pending ? (
          <p className="flag scene-waiting">
            {pendingSpeaker ? `${pendingSpeaker} is waiting for an answer.` : 'A scene is waiting.'}{' '}
            Answer to use the other screens.
          </p>
        ) : null}
      </div>

      <nav className="nav" aria-label="Screens">
        {NAV_GROUPS.map((group) => {
          // A scene holds the floor: the store already refuses to leave it, so say so
          // with the control rather than letting a click look like it worked.
          const firstOpen = group.screens.find((item) => screenAvailable(state, index, item.id))
          return (
            <button
              key={group.id}
              type="button"
              aria-pressed={group === activeGroup}
              disabled={!firstOpen}
              onClick={() => {
                if (firstOpen) setScreen(firstOpen.id)
              }}
            >
              {group.label}
            </button>
          )
        })}
      </nav>
      <div className="sidebar-tools">
        {children}
        <TextSizeControl />
      </div>
    </aside>
  )
}

function Feedback() {
  const feedback = useGameStore((s) => s.feedback)
  if (!feedback) return null
  return (
    <p className="feedback" role="status">
      {feedback}
    </p>
  )
}

/** How long a passing day stays on screen; the CSS fade runs for the same window. */
const DAY_NOTE_MS = 2600
/** A day report has more to read than a date, so it stays long enough to finish. */
const DAY_REPORT_MS = 8000

/**
 * The day that just passed, said once over the stage: how many days, and the date now.
 * The engine decided that time moved; this only reads the two days it reported.
 */
function DayNote({ change }: { change: TimePassed | null }) {
  const [dismissed, setDismissed] = useState<number | null>(null)

  useEffect(() => {
    if (!change) return
    const timer = window.setTimeout(
      () => setDismissed(change.id),
      change.report ? DAY_REPORT_MS : DAY_NOTE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [change])

  if (!change || dismissed === change.id) return null

  const days = change.to - change.from
  const report = change.report
  return (
    <div key={change.id} className={`day-note${report ? ' day-note-report' : ''}`} role="status">
      <span className="day-note-summary">{days === 1 ? 'A day passes' : `${days} days pass`}</span>
      <span className="day-note-date">{formatDisplayDate(change.to)}</span>
      {report ? (
        <>
          <span className="day-note-headline">{report.headline}</span>
          {report.conditions.slice(0, 4).map((condition) => (
            <span key={condition.id} className="day-note-condition">
              <strong>{condition.name}</strong> {condition.text}
            </span>
          ))}
          {report.conditions.length > 4 ? (
            <span className="day-note-more">And {report.conditions.length - 4} more.</span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/** One run of prose, with `**key words**` set in bold instead of shown as markers. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {parseRuns(text).map((run, index) =>
        run.bold ? <strong key={index}>{run.text}</strong> : run.text,
      )}
    </>
  )
}

/** A passage that paces itself: a journal entry, a codex entry, a log line. */
function PacedPassage({
  text,
  passage,
  beatArt,
}: {
  text: string
  passage: string
  beatArt?: readonly string[]
}) {
  const read = useGameStore((s) => s.readPassages.includes(passage))
  const markRead = useGameStore((s) => s.markPassageRead)
  const story = useBeats(text, read)

  return <Story story={story} beatArts={beatArt} onDone={() => markRead(passage)} />
}

/**
 * Reveal a passage one beat at a time. Pacing is presentation state, never a save field:
 * entering a scene again starts at its first beat.
 */
function useBeats(text: string, startAtEnd = false) {
  const beats = useMemo(() => splitBeats(text), [text])
  const [shown, setShown] = useState(startAtEnd ? beats.length : 1)
  const [tracked, setTracked] = useState(text)

  // A new node or a new place resets the pacing. This is the sanctioned
  // "adjust state when a prop changes" pattern, not an effect.
  if (tracked !== text) {
    setTracked(text)
    setShown(startAtEnd ? splitBeats(text).length : 1)
  }

  const frame = beatAt(beats, shown)

  return {
    beats,
    current: frame.current,
    index: frame.index,
    total: frame.total,
    done: frame.done,
    next: () => setShown((value) => Math.min(value + 1, beats.length)),
  }
}

/**
 * The paced passage itself: one beat beside its picture, then the whole passage at once
 * with a different picture when the caller has one.
 */
function Story({
  story,
  onDone,
  nextFocus,
  beatArt,
  beatArts,
  doneArt,
}: {
  story: ReturnType<typeof useBeats>
  onDone?: () => void
  /** Where focus should land when the passage ends; defaults to the passage itself. */
  nextFocus?: RefObject<HTMLElement | null>
  /** A fallback picture for the passage, when a beat has no plate of its own. */
  beatArt?: ArtAsset | null
  /** One authored plate per beat, in the order the beats are read. */
  beatArts?: readonly string[]
  /** A different picture for the finished passage, when one exists. */
  doneArt?: ArtAsset | null
}) {
  const passage = useRef<HTMLDivElement>(null)
  const finishing = story.index + 1 >= story.total
  const moveFocus = useRef(false)
  const shownArt = artFor(beatArts?.[story.index - 1]) ?? beatArt

  // The control unmounts with the last beat, which would drop focus onto <body>. An
  // effect runs after that commit; a frame callback would not run in a hidden tab.
  useEffect(() => {
    if (!story.done || !moveFocus.current) return
    moveFocus.current = false
    const target = nextFocus?.current ?? passage.current
    target?.focus()
  }, [story.done, nextFocus])

  const advance = () => {
    moveFocus.current = finishing
    story.next()
    if (finishing) onDone?.()
  }

  return (
    <>
      <div className="story" aria-live="polite" ref={passage} tabIndex={-1}>
        {story.done ? (
          <div className="story-complete">
            {doneArt ? (
              <figure className="passage-art">
                <img src={doneArt.src} alt={doneArt.alt} />
              </figure>
            ) : null}
            {story.beats.map((beat, index) => (
              <p key={index}>
                <Rich text={beat} />
              </p>
            ))}
          </div>
        ) : (
          <div className={shownArt ? 'story-beat' : 'story-beat story-beat-text'}>
            {shownArt ? (
              <figure className={`beat-art beat-art-${shownArt.kind}`}>
                <img src={shownArt.src} alt={shownArt.alt} />
              </figure>
            ) : null}
            <p className="beat">
              <Rich text={story.current} />
            </p>
          </div>
        )}
      </div>
      {story.done ? null : (
        <div className="story-next">
          <button type="button" className="btn primary" onClick={advance}>
            Continue
          </button>
          <span className="beat-dots" aria-hidden="true">
            {Array.from({ length: story.total }, (_, index) => (
              <span key={index} className={index < story.index ? 'dot on' : 'dot'} />
            ))}
          </span>
        </div>
      )}
    </>
  )
}

/** What an answer asks for, said beside it: silver, goods, cargo, days. */
function choiceCostLabel(cost: SceneChoiceCost): string {
  const parts: string[] = []
  if (cost.money) parts.push(shekels(cost.money))
  for (const item of cost.items ?? []) {
    parts.push(`${item.quantity} ${item.name.toLowerCase()}`)
  }
  if (cost.cargo) {
    parts.push(`${cost.cargo} cargo ${cost.cargo === 1 ? 'item' : 'items'}`)
  }
  if (cost.days) parts.push(`${cost.days} ${cost.days === 1 ? 'day' : 'days'}`)
  if (cost.stamina) parts.push(`${cost.stamina} reserve`)
  return `Costs ${parts.join(' · ')}`
}

function Scene() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const dispatch = useGameStore((s) => s.dispatch)
  const markPassageRead = useGameStore((s) => s.markPassageRead)
  const choices = useRef<HTMLDivElement>(null)
  const sceneSection = useRef<HTMLElement>(null)

  const scene = state ? deriveScene(state, index, createDslContent(index)) : null
  const story = useBeats(scene?.text ?? '')
  const sceneId = scene ? `${scene.dialogue}:${scene.node}` : null

  // A new scene node replaces the control the reader just used, so put focus on the
  // scene itself rather than letting it fall to the body.
  useEffect(() => {
    if (sceneId) sceneSection.current?.focus()
  }, [sceneId])

  if (!state) return null
  if (!scene) return <p className="empty">Nothing is waiting.</p>

  const command = (choice: number) =>
    dispatch(
      scene.event ? { type: 'resolveEncounter', choice } : { type: 'chooseDialogue', choice },
    )

  const speakerArt = artFor(scene.speaker ? index.characters.get(scene.speaker)?.art : undefined)
  // The beat's own picture, then the speaker's portrait. The stage never borrows the
  // place's hero, because the world behind this scene already shows that place.
  const sceneArt = artFor(scene.art)
  const beatArt = sceneArt ?? speakerArt
  const finalBeatArt = artFor(scene.beatArt?.at(-1))

  return (
    <section className="scene" ref={sceneSection} tabIndex={-1}>
      <DialogueRecorder
        dialogue={scene.dialogue}
        node={scene.node}
        speaker={scene.speakerName}
        text={scene.text}
        day={state.calendar.day}
        date={formatDisplayDate(state.calendar.day)}
      />
      {scene.speakerName ? (
        <div className="scene-head">
          {speakerArt && story.done ? (
            <img className="portrait speaker-portrait" src={speakerArt.src} alt={speakerArt.alt} />
          ) : null}
          <p className="speaker">{scene.speakerName}</p>
        </div>
      ) : null}
      <Story
        story={story}
        nextFocus={choices}
        beatArt={beatArt}
        beatArts={scene.beatArt}
        doneArt={sceneArt ?? finalBeatArt}
        onDone={() => {
          if (scene) markPassageRead(passageKey.scene(scene.dialogue, scene.node))
        }}
      />
      {story.done ? (
        <div className="choices" ref={choices} tabIndex={-1}>
          {scene.choices.map((choice) => {
            /*
             * A locked answer's reason is the narrator, not the traveler. Kept inside
             * the button it read as part of the line, so "I have tin." was followed by
             * "You have no tin" in the same breath. It sits under the answer instead.
             */
            const noteId = `choice-note-${choice.index}`
            const note = choice.available ? undefined : choice.reason
            return (
              <div key={choice.index} className="choice-row">
                <button
                  type="button"
                  className="choice"
                  disabled={!choice.available}
                  title={note}
                  aria-describedby={note ? noteId : undefined}
                  onClick={() => command(choice.index)}
                >
                  {choice.text}
                  {choice.cost ? (
                    <small className="choice-cost">{choiceCostLabel(choice.cost)}</small>
                  ) : null}
                </button>
                {note ? (
                  <small id={noteId} className="locked">
                    {note}
                  </small>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

/** Records the line actually shown, once per node, for the Journal's conversation log. */
function DialogueRecorder({
  dialogue,
  node,
  speaker,
  text,
  day,
  date,
}: {
  dialogue: string
  node: string
  speaker: string | null
  text: string
  day: number
  date: string
}) {
  const noteDialogue = useGameStore((s) => s.noteDialogue)

  useEffect(() => {
    noteDialogue({ key: `${dialogue}:${node}`, dialogue, node, speaker, text, day, date })
  }, [dialogue, node, speaker, text, day, date, noteDialogue])

  return null
}

/**
 * One first-voyage hint at a time, chosen by where the traveler is standing. The old
 * onboarding panel listed every lesson at once; this follows the actual first errands and
 * disappears once the first crossing is a deed.
 */
function FirstSteps() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const screen = useGameStore((s) => s.screen)
  const placeId = useGameStore((s) => s.placeId)
  const readPassages = useGameStore((s) => s.readPassages)

  if (!state || state.narrative.pending) return null
  if (state.player.deeds.some((deed) => deed.kind === 'travelled')) return null
  if (screen === 'scene' || screen === 'night' || screen === 'journey') return null

  // Let the arrival prose finish before putting a lesson above it.
  if (
    screen === 'destination' &&
    !readPassages.includes(passageKey.place(state.player.location))
  ) {
    return null
  }

  const destination = index.destinations.get(state.player.location)
  const place = placeId ? destination?.places.find((entry) => entry.id === placeId) : undefined
  const routeKnown = state.knowledge.knownRoutes.length > 0

  let hint: string | null = null
  if (screen === 'destination') {
    hint =
      'Choose a place. Days pass only when you spend them, and the market and harbor each have their own people and work.'
  } else if (screen === 'market' || place?.kind === 'market') {
    hint =
      'Buy here, sell there. Gain compares the sale with what you paid; language changes the bargain, not whether you can trade.'
  } else if (screen === 'routes' || (screen === 'place' && place?.kind === 'harbour')) {
    hint = routeKnown
      ? 'Book passage. The fare, grain and reserve are spent when you sail; keep a little silver back for the sea’s tolls.'
      : 'Ask the harbor master about a crossing. You need to know a route before Roads will offer it.'
  } else if (screen === 'place') {
    hint =
      'This place has its own people and work. Go back to the port to choose another place.'
  } else if (screen === 'cargo') {
    hint = 'Cargo is what you carry. The crossing eats grain, and the hold has a weight limit.'
  }

  if (!hint) return null
  return (
    <aside className="first-step-hint" aria-label="First step">
      <strong>First step.</strong> {hint}
    </aside>
  )
}

function Destination() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const dispatch = useGameStore((s) => s.dispatch)
  const setScreen = useGameStore((s) => s.setScreen)
  const visitPlace = useGameStore((s) => s.visitPlace)
  const readPassages = useGameStore((s) => s.readPassages)
  const markPassageRead = useGameStore((s) => s.markPassageRead)

  const view = state ? deriveDestination(state, state.player.location, index) : null
  const local = state ? deriveLocalMap(state, index) : null
  const introRead = view ? readPassages.includes(passageKey.place(view.id)) : false
  /* A first visit keeps the whole arrival open, even after its last beat is read.
     A return visit begins with the account folded away so the places come first. */
  const [introWasRead] = useState(introRead)
  const story = useBeats(view?.intro ?? '', introRead)

  if (!state) return null
  if (!view) return <p className="empty">You are between places.</p>
  const hero = artFor(index.destinations.get(view.id)?.art)
  const written = writtenFor(view.id)

  return (
    <section className="panel">
      <h2>{view.name}</h2>
      {written ? (
        <p className="written written-place">
          <span className="written-script" aria-hidden="true">
            {written.script}
          </span>{' '}
          <span className="written-reading">({written.reading})</span>
        </p>
      ) : null}
      {view.states.length > 0 ? (
        <p className="tags">
          {view.states.map((label) => (
            <span key={label} className="tag">
              {label}
            </span>
          ))}
        </p>
      ) : null}

      {hero && story.done ? (
        <figure className="hero-art">
          <img src={hero.src} alt={hero.alt} />
        </figure>
      ) : null}

      {introWasRead ? (
        <details className="destination-recap">
          <summary>Read the arrival again</summary>
          <Story
            story={story}
            beatArt={hero}
            beatArts={view.introBeatArt}
            onDone={() => markPassageRead(passageKey.place(view.id))}
          />
        </details>
      ) : (
        <Story
          story={story}
          beatArt={hero}
          beatArts={view.introBeatArt}
          onDone={() => markPassageRead(passageKey.place(view.id))}
        />
      )}
      {story.done ? (
        <>
          <div className="destination-index">
            <div className="destination-places">
              <h3>Places in the port</h3>
              <p className="note">Go to a place to find its people and the work it affords.</p>
              <ol
                className="map-place-list destination-place-list"
                aria-label="Places in this port"
              >
                {view.places.map((place, position) => (
                  <li key={place.id}>
                    <button type="button" onClick={() => visitPlace(place.id)}>
                      <PlaceThumb art={place.art} name={place.name} index={position} />
                      <span className="map-place-copy">
                        <strong>{place.name}</strong>
                        <small>{place.kind}</small>
                        <span>{place.description}</span>
                      </span>
                      <span className="map-place-go">Enter</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            {local ? (
              <div className="destination-sketch">
                <LocalSketch view={local} onVisit={(mark) => visitPlace(mark.id)} />
              </div>
            ) : null}
          </div>

          <p className="note">
            You are in {view.name}. Choose a place to go there; each has its own people and work.
            The roads out are listed below, and days pass only when you spend them.
          </p>

          <div className="actions">
            <button type="button" className="btn small" onClick={() => setScreen('map')}>
              Open the map
            </button>
          </div>

          {view.elsewhere.length > 0 ? (
            <p className="note elsewhere-note">
              <strong>Elsewhere in the port:</strong>{' '}
              {view.elsewhere.map((person) => person.name).join(', ')}. You can find them through
              the People index.
            </p>
          ) : null}

          <h3>Roads from here</h3>
          <ul className="list">
            {view.routes.map((route) => (
              <li key={route.id}>
                <strong>{route.name}</strong>
                <span>
                  {route.known
                    ? route.usable
                      ? `${route.kind} · ${route.modes.length} ways to go`
                      : (route.reason ?? 'Not available')
                    : 'You have not heard of this crossing.'}
                </span>
                {route.usable ? (
                  <button type="button" className="btn small" onClick={() => setScreen('routes')}>
                    Arrange passage
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="actions">
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'advanceTime', days: 1 })}
            >
              Spend the day
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'rest', days: 3 })}
            >
              Rest three days
            </button>
          </div>
          <p className="note">Rest restores your reserve. Ordinary days at port do not.</p>
        </>
      ) : null}
    </section>
  )
}

/** A way back to the place a market or the roads were opened from. */
function PlaceBack() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const placeId = useGameStore((s) => s.placeId)
  const setScreen = useGameStore((s) => s.setScreen)

  if (!state) return null
  const destination = index.destinations.get(state.player.location)
  if (!destination) return null
  const place = placeId
    ? destination.places.find((candidate) => candidate.id === placeId)
    : undefined

  return (
    <div className="place-back">
      <button
        type="button"
        className="btn small"
        onClick={() => setScreen(place ? 'place' : 'destination')}
      >
        Back to {place?.name ?? destination.name}
      </button>
    </div>
  )
}

/**
 * One place in the port: its own hero, description, people, and only the actions it
 * actually affords. The port index is for choosing; this is for being somewhere.
 */
function Place() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const placeId = useGameStore((s) => s.placeId)
  const dispatch = useGameStore((s) => s.dispatch)
  const setScreen = useGameStore((s) => s.setScreen)

  if (!state) return null
  const destination = index.destinations.get(state.player.location)
  const view = placeId ? derivePlace(state, state.player.location, placeId, index) : null

  if (!destination || !view) {
    return (
      <section className="panel">
        <h2>No place chosen</h2>
        <p className="empty">Choose a place in the port before looking for its people and work.</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => setScreen('destination')}>
            Back to {destination?.name ?? 'the port'}
          </button>
        </div>
      </section>
    )
  }

  const hero = artFor(view.art ?? destination.art)

  return (
    <section className="panel">
      <p className="eyebrow">{destination.name}</p>
      <h2>{view.name}</h2>
      <p className="tags">
        <span className="tag">{view.kind}</span>
      </p>

      {hero ? (
        <figure className="hero-art">
          <img src={hero.src} alt={hero.alt} />
        </figure>
      ) : null}

      <p className="place-description">{view.description}</p>

      {view.actions.length > 0 ? (
        <>
          <h3>Actions here</h3>
          <div className="actions place-actions">
            {view.actions.map((action) => {
              const target = placeActionFor(action)
              return (
                <button
                  key={action}
                  type="button"
                  className="btn"
                  onClick={() => setScreen(target.screen)}
                >
                  {target.label}
                </button>
              )
            })}
          </div>
        </>
      ) : null}

      {view.kind === 'harbour' ? (
        <div className="actions">
          <button type="button" className="btn" onClick={() => dispatch({ type: 'work', days: 1 })}>
            Work a day on the quay
          </button>
          <p className="note">Three shekels for a day's labour, and one reserve spent.</p>
        </div>
      ) : null}

      <h3>People here</h3>
      <ul className="list">
        {view.cast.length === 0 ? (
          <li>
            <span>Nobody you know is here just now.</span>
          </li>
        ) : null}
        {view.cast.map((person) => {
          const art = artFor(index.characters.get(person.id)?.art)
          return (
            <li key={person.id} className="person">
              {art ? <img className="portrait" src={art.src} alt={art.alt} loading="lazy" /> : null}
              <strong>{person.name}</strong>
              <span>{person.roles.join(' · ')}</span>
              <button
                type="button"
                className="btn small"
                onClick={() => dispatch({ type: 'talkTo', character: person.id })}
              >
                Speak
              </button>
            </li>
          )
        })}
      </ul>

      <div className="actions">
        <button type="button" className="btn" onClick={() => setScreen('destination')}>
          Back to {destination.name}
        </button>
      </div>
    </section>
  )
}

/**
 * The place after dark, shown when a day ends without a scene. It is not a second place
 * screen: a picture, the night passage authored for this location, and morning.
 */
function Night() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const setScreen = useGameStore((s) => s.setScreen)

  if (!state) return null

  const destination = index.destinations.get(state.player.location)
  const night = destination?.night
  const hero = artFor(night?.art ?? destination?.art)

  return (
    <section className="panel night-panel">
      <p className="eyebrow">Night</p>
      <h2>{destination?.name ?? 'Where you are'}</h2>
      {hero ? (
        <figure className="hero-art">
          <img src={hero.src} alt={hero.alt} />
        </figure>
      ) : null}
      {night ? (
        <p className="night-passage">
          <Rich text={night.text} />
        </p>
      ) : (
        <p className="note">You sleep where you can. Morning comes anyway.</p>
      )}
      <div className="actions">
        <button type="button" className="btn primary" onClick={() => setScreen('destination')}>
          Sleep until morning
        </button>
      </div>
    </section>
  )
}

function Status() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  if (!state) return null
  const view = deriveSelf(state, index)

  return (
    <section className="panel">
      <h2>Status</h2>
      <p className="note">Your own accounting: what you carry, what you speak, and what is owed.</p>

      <dl className="facts">
        <div>
          <dt>Traveler</dt>
          <dd>
            <TabletName name={view.name} />
          </dd>
        </div>
        <div>
          <dt>Bearing</dt>
          <dd>{view.presentation}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{view.date}</dd>
        </div>
        <div>
          <dt>Place</dt>
          <dd>{view.locationName}</dd>
        </div>
        <div>
          <dt>
            Purse{' '}
            <InfoTip label="silver and shekels">
              Silver is weighed, not coined. A shekel is the unit of account the interface uses for
              prices and your purse; the stored number is an abstraction, not a count of coins.
            </InfoTip>
          </dt>
          <dd>{shekels(view.money)} of silver</dd>
        </div>
        <div>
          <dt>
            Carrying{' '}
            <InfoTip label="minas and capacity">
              Minas measure weight, not how many things you hold. Every good has its own weight, and
              your capacity is a limit on the total load you can carry.
            </InfoTip>
          </dt>
          <dd>
            {view.carried} of {view.capacity} minas
          </dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd>{view.transport}</dd>
        </div>
        <div>
          <dt>
            Road{' '}
            <InfoTip label="difficulty and road risk">
              {view.difficulty.note} This choice is fixed for the journey.
            </InfoTip>
          </dt>
          <dd>
            {view.difficulty.name}
            {view.difficulty.hazardShift === 0
              ? ''
              : ` · ${view.difficulty.hazardShift > 0 ? '+' : ''}${view.difficulty.hazardShift}% road risk`}
          </dd>
        </div>
        <div>
          <dt>
            Reserve{' '}
            <InfoTip label="stamina and rest">
              One number for sleep, food, water and nerve. A passage spends it; rest restores it. If
              it runs out on the road, the road returns you to the last port with a lighter load.
            </InfoTip>
          </dt>
          <dd>
            {view.stamina} of {view.staminaMax}
          </dd>
        </div>
      </dl>

      <h3>Conditions</h3>
      {view.afflictions.length === 0 ? (
        <p className="empty">Nothing is working on you just now.</p>
      ) : (
        <ul className="list">
          {view.afflictions.map((affliction) => (
            <li key={affliction.id}>
              <strong>{affliction.name}</strong>
              <span>
                {affliction.severity} · since day {affliction.sinceDay + 1}
              </span>
              <span className="note">{affliction.description}</span>
              {affliction.remedy ? <span className="note">{affliction.remedy}</span> : null}
            </li>
          ))}
        </ul>
      )}

      <h3>Carried</h3>
      {view.goods.length === 0 ? (
        <p className="empty">You carry nothing.</p>
      ) : (
        <ul className="list">
          {view.goods.map((good) => (
            <li key={good.id}>
              <strong>
                {good.name} × {good.quantity}
              </strong>
              <span>
                {minas(good.weight)}
                {good.protected ? ' · not for sale' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Languages</h3>
      {view.languages.length === 0 ? (
        <p className="empty">You speak nothing yet.</p>
      ) : (
        <ul className="list">
          {view.languages.map((language) => (
            <li key={language.id}>
              <strong>{language.name}</strong>
              <span>
                {language.tier} · {language.xp} xp
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Standing</h3>
      {view.factions.length === 0 && view.reputation.length === 0 ? (
        <p className="empty">No faction has noticed you yet.</p>
      ) : (
        <ul className="list">
          {view.factions.map((faction) => (
            <li key={faction.id}>
              <strong>{faction.name}</strong>
              <span>
                {faction.band} ({faction.standing})
                {faction.regard.length > 0 ? ` · ${formatRegard(faction.regard)}` : ''}
              </span>
            </li>
          ))}
          {view.reputation.map((entry) => (
            <li key={`reputation-${entry.id}`}>
              <strong>{entry.name}</strong>
              <span>{entry.band} reputation</span>
            </li>
          ))}
        </ul>
      )}

      <h3>Obligations</h3>
      {view.obligations.length === 0 ? (
        <p className="empty">Nothing outstanding.</p>
      ) : (
        <ul className="list">
          {view.obligations.map((obligation) => (
            <li key={`${obligation.kind}-${obligation.id}`}>
              <strong>{obligation.name}</strong>
              <span>
                {obligation.kind === 'person' ? 'Obligation' : 'Faction obligation'}{' '}
                {obligation.amount > 0 ? `+${obligation.amount}` : obligation.amount}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Deeds</h3>
      {view.deeds.length === 0 ? (
        <p className="empty">Nothing yet that anyone would remember.</p>
      ) : (
        <ul className="list">
          {view.deeds.map((deed) => (
            <li key={deed.id}>
              <strong>
                {deed.kind} · {deed.subjectName}
              </strong>
              <span>
                {deed.placeName}, {deed.date}
              </span>
              {deed.consequence ? <span className="note">{deed.consequence}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function placeName(places: { id: string; name: string }[], id: string): string {
  return places.find((place) => place.id === id)?.name ?? id
}

type MapScale = 'local' | 'regional' | 'world'

interface SketchPlace {
  id: string
  name: string
  kind: string
  x: number
  y: number
  current: boolean
}

interface SketchRoute {
  id: string
  name: string
  from: string
  to: string
  open: boolean
  reason?: string
  days: number
  drawn: boolean
}

interface SketchRegion {
  id: string
  name?: string
  known: boolean
  x: number
  y: number
  radius: number
}

const MAP_TABS: { id: MapScale; label: string }[] = [
  { id: 'local', label: 'This place' },
  { id: 'regional', label: 'Region' },
  { id: 'world', label: 'World' },
]

/**
 * Regional and world sketches: region shapes, terrain, borders, crossings, places. Only
 * what the view hands over; the sketch never draws a feature the protagonist has not
 * learned of.
 */
function Sketch({
  regions,
  places,
  routes,
  features,
  label,
}: {
  regions: SketchRegion[]
  places: SketchPlace[]
  routes: SketchRoute[]
  features: MapFeatureView[]
  label: string
}) {
  return (
    <div className="map-frame">
      <div className="map-frame-label">
        <span>Known ground</span>
        <span>Not to scale</span>
      </div>
      <svg viewBox="0 0 100 100" role="img" aria-label={label}>
        <defs>
          <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" className="map-grid-line" />
          </pattern>
          <pattern id="map-fog" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2.6" className="map-fog-dot" />
            <circle cx="9" cy="8" r="2" className="map-fog-dot" />
          </pattern>
          <pattern id="map-water" width="14" height="10" patternUnits="userSpaceOnUse">
            <path d="M 0 5 Q 3.5 2.8 7 5 T 14 5" className="map-sea-line" />
          </pattern>
          <pattern id="map-land-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M -2 8 L 8 -2 M 2 10 L 10 2" className="map-land-hatch-line" />
          </pattern>
          <linearGradient id="map-sea-depth" x1="0" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#abc7c2" />
            <stop offset="0.52" stopColor="#c9dcd5" />
            <stop offset="1" stopColor="#dce6d9" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" className="map-sea" />
        <rect width="100" height="100" fill="url(#map-water)" />
        <rect width="100" height="100" fill="url(#map-grid)" />

        {regions.map((region, regionIndex) => {
          const coast = coastPath(
            region.x,
            region.y,
            region.radius,
            region.radius * 0.72,
            regionIndex,
          )
          return (
            <g key={region.id}>
              {region.known ? <path d={coast} className="map-coast-glow" /> : null}
              <path
                d={coast}
                className={
                  region.known ? `map-region region-tone-${regionIndex % 4}` : 'map-region fog'
                }
              />
              {region.known ? <path d={coast} className="map-region-hatch" /> : null}
              <text
                x={region.x}
                y={region.y - region.radius * 0.72 - 2.5}
                className={region.known ? 'map-region-label' : 'map-fog-label'}
              >
                {region.name ?? 'unexplored'}
              </text>
            </g>
          )
        })}

        {features.map((feature) => {
          if (feature.kind === 'mountains') {
            return (
              <g key={feature.id}>
                <path d={peakPath(feature.points, 7, 4.8)} className="map-mountains-back" />
                <path d={peakPath(feature.points)} className="map-mountains" />
              </g>
            )
          }

          return (
            <g key={feature.id}>
              {feature.kind === 'river' ? (
                <path d={polylinePath(feature.points)} className="map-river-bank" />
              ) : null}
              <path
                d={polylinePath(feature.points)}
                className={feature.kind === 'river' ? 'map-river' : 'map-border'}
              />
            </g>
          )
        })}

        {routes.map((route) => {
          const from = places.find((place) => place.id === route.from)
          const to = places.find((place) => place.id === route.to)
          if (!route.drawn || !from || !to) return null
          return (
            <g key={route.id}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="map-route-casing" />
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={route.open ? 'map-route' : 'map-route closed'}
              />
              <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 2} className="map-route-label">
                {route.open ? `${route.days} days` : 'closed'}
              </text>
            </g>
          )
        })}

        {places.map((place) => (
          <g key={place.id}>
            {place.current ? (
              <circle cx={place.x} cy={place.y} r="7" className="map-place-halo" />
            ) : null}
            {place.kind === 'city' || place.kind === 'port' ? (
              <>
                <path
                  d={cityPath(place.x, place.y, place.current ? 1.25 : 1)}
                  className="map-city-shadow"
                  transform="translate(0 0.6)"
                />
                <path
                  d={cityPath(place.x, place.y, place.current ? 1.25 : 1)}
                  className={place.current ? 'map-city current' : 'map-city'}
                />
              </>
            ) : (
              <>
                <circle
                  cx={place.x}
                  cy={place.y + 0.6}
                  r={place.current ? 3.4 : 2.4}
                  className="map-place-shadow"
                />
                <circle
                  cx={place.x}
                  cy={place.y}
                  r={place.current ? 3.4 : 2.4}
                  className={place.current ? 'map-place current' : 'map-place'}
                />
              </>
            )}
            {place.current ? (
              <text x={place.x} y={place.y - 5} className="map-you">
                you are here
              </text>
            ) : null}
            <text x={place.x} y={place.y + 7} className="map-label">
              {place.name}
            </text>
            <text x={place.x} y={place.y + 11} className="map-kind">
              {place.kind}
            </text>
          </g>
        ))}
        <MapCompass />
      </svg>
    </div>
  )
}

/** The compass rose shared by every sketch. */
function MapCompass() {
  return (
    <g className="map-compass" aria-hidden="true" transform="translate(88 86)">
      <circle r="6.6" className="map-compass-ring" />
      <circle r="4.9" className="map-compass-inner-ring" />
      <path d="M 0 -4.8 L 1.1 0 L 0 4.8 L -1.1 0 Z" className="map-compass-rose" />
      <path d="M -4.8 0 L 0 1.1 L 4.8 0 L 0 -1.1 Z" className="map-compass-cross" />
      <path d="M 0 -4.8 L 1.1 0 L 0 1.3 L -1.1 0 Z" className="map-compass-needle" />
      <circle r="0.65" className="map-compass-pin" />
      <text y="-7.9" className="map-compass-north">
        N
      </text>
    </g>
  )
}

/** A place mark on the quarter sketch, clickable by pointer and keyboard. */
function LocalBuilding({
  mark,
  building,
  index,
  onVisit,
}: {
  mark: LocalMarkView
  building: LocalMapView['buildings'][number]
  index: number
  onVisit: (mark: LocalMarkView) => void
}) {
  const { width, height } = building
  const top = mark.y - height / 2
  const nearCentre = Math.hypot(mark.x - 50, mark.y - 50) < 18
  const labelY = nearCentre ? top - 1.7 : mark.y + height / 2 + 3.1

  return (
    <g
      className="map-building-group"
      role="button"
      tabIndex={0}
      aria-label={`${mark.name}. Visit.`}
      onClick={() => onVisit(mark)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onVisit(mark)
      }}
    >
      <title>{`${mark.name} — visit`}</title>
      <rect
        x={mark.x - width / 2 + 0.35}
        y={top + 0.75}
        width={width}
        height={height}
        rx="0.9"
        className="map-building-shadow"
      />
      <rect
        x={mark.x - width / 2}
        y={top}
        width={width}
        height={height}
        rx="0.9"
        className={`map-building ${mark.kind}`}
      />
      <path
        d={`M ${mark.x - width / 2 + 1} ${top + height * 0.32} L ${mark.x + width / 2 - 1} ${top + height * 0.32} L ${mark.x} ${top + height * 0.58} Z`}
        className="map-building-roof"
      />
      <line
        x1={mark.x - width / 2 + 1}
        y1={top + height * 0.72}
        x2={mark.x + width / 2 - 1}
        y2={top + height * 0.72}
        className="map-building-ridge"
      />
      <line
        x1={mark.x}
        y1={top + height * 0.78}
        x2={mark.x}
        y2={top + height - 1}
        className="map-building-door"
      />
      <circle cx={mark.x} cy={mark.y} r="3" className="map-mark-badge" />
      <text x={mark.x} y={mark.y + 1} className="map-mark-index" textAnchor="middle">
        {index + 1}
      </text>
      <text x={mark.x} y={labelY} className="map-building-label" textAnchor="middle">
        {mark.name}
      </text>
    </g>
  )
}

/** The quarter around the player: authored marks, no invented geography. */
function LocalSketch({
  view,
  onVisit,
}: {
  view: LocalMapView
  onVisit: (mark: LocalMarkView) => void
}) {
  return (
    <div className="map-frame map-frame-local">
      <div className="map-frame-label">
        <span>{view.destination.name}</span>
        <span>What people here would name</span>
      </div>
      <svg
        viewBox="0 0 100 100"
        role="group"
        aria-label={`Sketch of the places people name around ${view.destination.name}`}
      >
        <defs>
          <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" className="map-grid-line" />
          </pattern>
          <pattern id="map-local-grain" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="2.1" r="0.16" className="map-local-grain-dot" />
            <circle cx="5.2" cy="5.6" r="0.11" className="map-local-grain-dot" />
          </pattern>
          <pattern id="map-local-hatch" width="9" height="9" patternUnits="userSpaceOnUse">
            <path d="M -2 9 L 9 -2 M 2 11 L 11 2" className="map-local-hatch-line" />
          </pattern>
          <radialGradient id="map-local-wash" cx="42%" cy="36%" r="74%">
            <stop offset="0" stopColor="#f1e7d2" />
            <stop offset="0.62" stopColor="#e8dcc4" />
            <stop offset="1" stopColor="#d8c9aa" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" className="map-ground" />
        <rect width="100" height="100" fill="url(#map-local-grain)" />
        <rect width="100" height="100" fill="url(#map-local-hatch)" />
        <rect width="100" height="100" fill="url(#map-grid)" />
        <circle cx="50" cy="50" r="43" className="map-local-boundary" />
        <circle cx="50" cy="50" r="28" className="map-ring-road" />
        <circle cx="50" cy="50" r="28" className="map-ring-road-edge" />

        {view.marks.map((mark, position) => (
          <g key={`street-${mark.id}`}>
            <path
              d={localStreetPath(mark.x, mark.y, position % 2 === 0 ? 1 : -1)}
              className="map-street"
            />
            <path
              d={localStreetPath(mark.x, mark.y, position % 2 === 0 ? 1 : -1)}
              className="map-street-line"
            />
          </g>
        ))}

        {view.marks.map((mark, position) => {
          const building = view.buildings.find((entry) => entry.id === mark.id)
          return building ? (
            <LocalBuilding
              key={mark.id}
              mark={mark}
              building={building}
              index={position}
              onVisit={onVisit}
            />
          ) : null
        })}

        <g className="map-you-mark" aria-hidden="true">
          <circle cx="50" cy="50" r="7" className="map-you-ring" />
          <circle cx="50" cy="50" r="4.4" className="map-place current" />
          <circle cx="50" cy="50" r="1.5" className="map-you-dot" />
          <text x="43.5" y="51" textAnchor="end" className="map-local-you">
            you
          </text>
        </g>
        <MapCompass />
      </svg>
    </div>
  )
}

/** A small place portrait for the choosing lists; the name beside it carries the meaning. */
function PlaceThumb({ art, name, index }: { art?: string; name: string; index: number }) {
  const thumb = artFor(art)

  return (
    <span className="map-place-thumb-wrap">
      {thumb ? (
        <img className="map-place-thumb" src={thumb.src} alt="" loading="lazy" />
      ) : (
        <span className="map-place-thumb-fallback" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
      )}
      <span className="map-place-number">{index + 1}</span>
    </span>
  )
}

function SketchPlaces({ places }: { places: MapPlaceView[] }) {
  if (places.length === 0) return null

  return (
    <div className="map-place-summary">
      <h4>Places on this sketch</h4>
      <ul>
        {places.map((place) => (
          <li key={place.id} className={place.current ? 'is-current' : undefined}>
            <span className="map-place-chip" aria-hidden="true" />
            <strong>{place.name}</strong>
            <small>
              {place.kind}
              {place.current ? ' · you are here' : ''}
            </small>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Map() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const setScreen = useGameStore((s) => s.setScreen)
  const visitPlace = useGameStore((s) => s.visitPlace)
  const [scale, setScale] = useState<MapScale>('local')

  if (!state) return null
  const local = deriveLocalMap(state, index)
  const regional = deriveRegionalMap(state, index)
  const world = deriveWorldMap(state, index)

  const places = scale === 'regional' ? (regional?.places ?? []) : world.places
  const routes = scale === 'regional' ? (regional?.routes ?? []) : world.routes
  const features = scale === 'regional' ? (regional?.features ?? []) : world.features

  const goToLocal = (mark: LocalMarkView) => visitPlace(mark.id)

  return (
    <section className="panel map-panel">
      <h2>Maps</h2>
      <p className="note">
        A working sketch of the ground you know: not a surveyor's chart, but enough to choose where
        to go next. The filled mark is where you are.
      </p>

      <div className="map-tabs" role="group" aria-label="Map scale">
        {MAP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={scale === tab.id ? 'btn small active' : 'btn small'}
            aria-pressed={scale === tab.id}
            onClick={() => setScale(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="map-key" aria-label="Map key">
        <span>
          <i className="map-key-you" /> you are here
        </span>
        <span>
          <i className="map-key-place" /> a place you know
        </span>
        <span>
          <i className="map-key-route" /> a crossing
        </span>
        {scale !== 'local' && features.some((feature) => feature.kind === 'mountains') ? (
          <span>
            <i className="map-key-ridge" /> a ridge
          </span>
        ) : null}
        {scale !== 'local' && features.some((feature) => feature.kind === 'river') ? (
          <span>
            <i className="map-key-river" /> a river
          </span>
        ) : null}
        {scale !== 'local' && features.some((feature) => feature.kind === 'border') ? (
          <span>
            <i className="map-key-border" /> a border of knowledge
          </span>
        ) : null}
        {scale === 'world' ? (
          <span>
            <i className="map-key-fog" /> unexplored
          </span>
        ) : null}
      </div>

      {scale === 'local' ? (
        local ? (
          <>
            <div className="map-heading">
              <div>
                <p className="eyebrow">The quarter</p>
                <h3>Around {local.destination.name}</h3>
              </div>
              <p className="note">Choose a named place to go there.</p>
            </div>
            <div className="map-layout">
              <LocalSketch view={local} onVisit={goToLocal} />
              <ol className="map-place-list" aria-label="Places in this quarter">
                {local.marks.map((mark, position) => (
                  <li key={mark.id}>
                    <button type="button" onClick={() => goToLocal(mark)}>
                      <PlaceThumb art={mark.art} name={mark.name} index={position} />
                      <span className="map-place-copy">
                        <strong>{mark.name}</strong>
                        <small>{mark.kind}</small>
                        <span>{mark.description}</span>
                      </span>
                      <span className="map-place-go">Enter</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <p className="note map-footnote">
              Footprints and streets are a sketch of a quarter, not a plan of it.
            </p>
          </>
        ) : (
          <p className="empty">
            You are between places. There is no quarter to sketch until you land.
          </p>
        )
      ) : null}

      {scale === 'regional' ? (
        regional ? (
          <>
            <h3>{regional.region.name}</h3>
            <Sketch
              regions={[
                {
                  id: regional.region.id,
                  name: regional.region.name,
                  known: true,
                  ...regional.shape,
                },
              ]}
              places={regional.places}
              routes={regional.routes}
              features={features}
              label={`Sketch of ${regional.region.name} and the places you know there`}
            />
            <SketchPlaces places={regional.places} />
            <p className="note">
              Only this region, and only the places, crossings and ground you know. Ridges, rivers
              and border lines are drawn from the region's sketch, not a survey; a border is the
              edge of what you know, not a treaty line. The coast beyond your knowledge stays blank.
            </p>
            {regional.places.length === 1 ? (
              <p className="note">
                You know one place in this region. Ask travelers and masters what else lies along
                this coast.
              </p>
            ) : null}
          </>
        ) : (
          <p className="empty">You are between regions, or have not learned of a region yet.</p>
        )
      ) : null}

      {scale === 'world' ? (
        <>
          <h3>The world you have heard of</h3>
          <Sketch
            regions={world.regions}
            places={world.places}
            routes={world.routes}
            features={features}
            label="Sketch of the regions and places you know"
          />
          <SketchPlaces places={world.places} />
          <p className="note map-fog-note">
            Fog gathers where you know nothing. A region keeps the name “unexplored” until you learn
            of a place in it; its ridges, rivers and border lines appear then too, and not before.
          </p>
        </>
      ) : null}

      {scale !== 'local' ? (
        <>
          <h3>Crossings on this sketch</h3>
          {routes.length === 0 ? (
            <p className="note">
              {scale === 'regional'
                ? 'No crossing you know stays inside this region. Longer roads belong on the world sketch.'
                : 'You have not heard of a crossing yet. Masters at the harbor talk about the sea roads; so do travelers.'}
            </p>
          ) : null}
          <ul className="list">
            {routes.map((route) => (
              <li key={route.id}>
                <strong>{route.name}</strong>
                <span>
                  {route.open
                    ? route.drawn
                      ? `${route.days} days at the shortest, between ${placeName(places, route.from)} and ${placeName(places, route.to)}`
                      : `${route.days} days at the shortest, to a place not yet on your sketch`
                    : (route.reason ?? 'Not available')}
                </span>
                {!route.drawn ? (
                  <span className="note">
                    You have not placed the far end of this crossing on your sketch yet.
                  </span>
                ) : null}
                {route.open ? (
                  <button type="button" className="btn small" onClick={() => setScreen('routes')}>
                    Arrange passage
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}

/** A signed count for a gain or loss, without repeating the unit on every row. */
function signedShekels(amount: number): string {
  const rounded = Math.round(amount)
  if (rounded === 0) return '0'
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}`
}

/** A paid price per unit, to one decimal when the stack's average is fractional. */
function averageShekels(amount: number): string {
  return `${Math.round(amount * 10) / 10}`
}

function Market() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const dispatch = useGameStore((s) => s.dispatch)

  if (!state) return null
  const view = deriveMarket(state, state.player.location, index)
  if (!view) return <p className="empty">There is no market here.</p>

  return (
    <section className="panel">
      <h2>The market at {view.destinationName}</h2>
      <PlaceBack />
      <p className="note">
        {view.hagglingTier === 'unfamiliar'
          ? 'You have no language for this market, so you cannot bargain: you pay the buying price and take the selling price shown.'
          : `Your bargaining gets you ${Math.round(view.hagglingDiscount * 100)}% off what you buy and ${Math.round(view.hagglingDiscount * 100)}% more for what you sell.`}{' '}
        Prices are in shekels of silver, per unit. Your purse is silver by weight, so it spends at
        every harbor; only the asking price changes.
        {view.estimated
          ? ' You can count the silver, but not yet judge whether the price is fair.'
          : ''}
      </p>

      <table className="table market-table">
        <thead>
          <tr>
            <th>Good</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Gain / loss</th>
            <th>Stock</th>
            <th>Carried</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {view.offers
            .filter((offer) => offer.stock > 0 || offer.owned > 0)
            .map((offer) => {
              const thumb = artFor(index.goods.get(offer.item)?.art)
              return (
                <tr key={offer.item}>
                  <td className="goods-cell">
                    {thumb ? (
                      <img className="good-thumb" src={thumb.src} alt={thumb.alt} loading="lazy" />
                    ) : null}
                    <div>
                      <strong>{offer.name}</strong>
                      <small>
                        {offer.category} · {minas(offer.weight)}
                        {offer.stock <= 0
                          ? ' · none left to buy'
                          : !offer.affordable
                            ? ' · not enough shekels to buy'
                            : !offer.fitsCapacity
                              ? ' · not enough room to buy'
                              : ''}
                      </small>
                    </div>
                  </td>
                  <td>{shekels(offer.unitPrice)}</td>
                  <td>{shekels(offer.sellUnitPrice)}</td>
                  <td className="market-gain">
                    {offer.owned <= 0 ? (
                      <span className="note">—</span>
                    ) : offer.profit === null || offer.costBasis === null ? (
                      <span className="unknown">unknown</span>
                    ) : (
                      <>
                        <strong className={offer.profit >= 0 ? 'gain' : 'loss'}>
                          {signedShekels(offer.profit)}
                        </strong>
                        <small>
                          all {offer.owned} ·{' '}
                          {offer.costBasis === 0
                            ? 'no purchase cost'
                            : `paid ${averageShekels(offer.costBasis / offer.owned)} each`}
                        </small>
                      </>
                    )}
                  </td>
                  <td>{offer.stock}</td>
                  <td>{offer.owned}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn small"
                      disabled={!offer.affordable || !offer.fitsCapacity || offer.stock <= 0}
                      onClick={() => dispatch({ type: 'buy', item: offer.item, quantity: 1 })}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      className="btn small"
                      disabled={offer.owned <= 0}
                      onClick={() => dispatch({ type: 'sell', item: offer.item, quantity: 1 })}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
      <p className="note market-gain-note">
        <InfoTip label="gain and loss">
          Gain compares the sale price for one unit with the average price you paid for the goods
          you still carry. Cargo from a gift has no purchase cost. A save from before cost tracking
          says “unknown” rather than pretending the goods were free.
        </InfoTip>{' '}
        Gain is a comparison with what you paid, not a promise about the next sale. The Sell button
        sells one unit; the row updates with the cost of what remains.
      </p>
    </section>
  )
}

function Roads() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const dispatch = useGameStore((s) => s.dispatch)
  const setScreen = useGameStore((s) => s.setScreen)
  const visitPlace = useGameStore((s) => s.visitPlace)

  if (!state) return null
  const routes = deriveKnownRoutes(state, index)
  if (routes.length === 0) {
    return (
      <section className="panel">
        <h2>Roads you know</h2>
        <PlaceBack />
        <p className="empty">
          You know of no crossings yet. A master at the harbor keeps the passage lists, and
          travelers will tell you where they came from.
        </p>
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              const harbour = index.destinations
                .get(state.player.location)
                ?.places.find((place) => place.kind === 'harbour')
              if (harbour) visitPlace(harbour.id)
              else setScreen('destination')
            }}
          >
            Go down to the harbor
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Roads you know</h2>
      <PlaceBack />
      {routes.map((route) => (
        <article key={route.id} className="route">
          <h3>{route.name}</h3>
          <p className="note">
            {route.fromName} → {route.toName} · {route.kind}
            {route.risk ? ` · ${route.risk} risk` : ''}
            {route.usable ? '' : ` · ${route.reason ?? 'Not available'}`}
          </p>
          {route.segments.length > 0 ? (
            <p className="note">
              Legs: {route.segments.map((segment) => segment.name).join(' → ')}
            </p>
          ) : null}
          {route.waypoints.length > 0 ? (
            <p className="note">
              Stops: {route.waypoints.map((waypoint) => waypoint.name).join(' · ')}
            </p>
          ) : null}
          <ul className="list">
            {route.modes.map((mode) => {
              const exertion = exertionOf(mode)
              const provisions = mode.provisions ?? 0
              const grain =
                state.player.inventory.find((entry) => entry.item === PASSAGE_PROVISION)
                  ?.quantity ?? 0
              const tooWeary = state.player.stamina < exertion
              const unfed = grain < provisions
              const hazard = route.hazards[mode.id]
              return (
                <li key={mode.id}>
                  <strong>{mode.name}</strong>
                  <span>
                    {mode.days} days · {shekels(mode.baseCost)} · carries {mode.capacity} minas
                    {' · '}
                    {exertion} reserve
                    {provisions > 0 ? ` · ${provisions} grain` : ''}
                  </span>
                  <span className="note">{mode.description}</span>
                  {hazard ? (
                    <span className="note">
                      Road risk {hazard.chance}% · {hazard.band}
                      {hazard.factors.length > 0
                        ? ` · ${hazard.factors
                            .map(
                              (factor) =>
                                `${factor.label} ${factor.delta > 0 ? '+' : ''}${factor.delta}`,
                            )
                            .join(' · ')}`
                        : ''}
                    </span>
                  ) : null}
                  {state.player.money < mode.baseCost ? (
                    <span className="note">You cannot pay this fare yet.</span>
                  ) : null}
                  {tooWeary ? (
                    <span className="note">
                      You do not have the strength for this passage. Rest first.
                    </span>
                  ) : null}
                  {unfed ? <span className="note">You need grain for the passage.</span> : null}
                  <button
                    type="button"
                    className="btn small"
                    disabled={
                      !route.usable || state.player.money < mode.baseCost || tooWeary || unfed
                    }
                    onClick={() => dispatch({ type: 'travel', route: route.id, mode: mode.id })}
                  >
                    Take passage
                  </button>
                </li>
              )
            })}
          </ul>
        </article>
      ))}
    </section>
  )
}

function Journey() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  if (!state) return null
  const view = deriveJourney(state, index)
  if (!view) return <p className="empty">You are not traveling.</p>

  return (
    <section className="panel">
      <h2>{view.routeName}</h2>
      <p>
        {view.modeName}, from {view.origin} to {view.destination}. Departed {view.departedAt}; due{' '}
        {view.arrivesAt}.
      </p>
      <dl className="facts">
        <div>
          <dt>Days remaining</dt>
          <dd>{view.daysRemaining}</dd>
        </div>
        <div>
          <dt>Stops remaining</dt>
          <dd>{view.stopsRemaining}</dd>
        </div>
      </dl>
      <p className="note">
        The crossing pauses when something happens. Answer the scene and the boat goes on.
      </p>
      {view.stops.length > 0 ? (
        <>
          <h3>Stops on this crossing</h3>
          <ul className="list">
            {view.stops.map((stop) => (
              <li key={stop.id}>
                <strong>{stop.name}</strong>
                <span>
                  {stop.kind} · {stop.date}
                  {stop.reached ? ' · passed' : ''}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}

function Journal() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const log = useGameStore((s) => s.dialogueLog)

  if (!state) return null
  const entries = deriveJournal(state, index)

  return (
    <section className="panel">
      <h2>Journal</h2>
      {entries.length === 0 ? <p className="empty">Nothing written yet.</p> : null}
      {entries.map((entry) => (
        <article key={entry.id} className="entry">
          <h3>{entry.title}</h3>
          <PacedPassage
            text={entry.text}
            passage={passageKey.journal(entry.id)}
            beatArt={entry.beatArt}
          />
        </article>
      ))}

      <details className="journal-log">
        <summary>Conversation log</summary>
        <p className="note">
          Everything said since you came ashore, oldest first. It clears when you leave the page and
          is not kept in your saved journey.
        </p>
        {log.length === 0 ? (
          <p className="empty">Nothing has been said yet.</p>
        ) : (
          groupLogByDay(log).map((day) => (
            <div key={`${day.date}-${day.lines[0]?.key ?? ''}`}>
              <h4 className="log-day">{day.date}</h4>
              <ul className="list log">
                {day.lines.map((line, lineIndex) => {
                  const node = index.dialogues.get(line.dialogue)?.nodes[line.node]
                  return (
                    <li key={`${lineIndex}-${line.key}`}>
                      <strong>{line.speaker ?? 'Narration'}</strong>
                      <div className="log-text">
                        <PacedPassage
                          text={line.text}
                          passage={passageKey.scene(line.dialogue, line.node)}
                          beatArt={node?.beatArt}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </details>
    </section>
  )
}

function Codex() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const [selected, setSelected] = useState<string | null>(null)

  if (!state) return null
  const entries = deriveCodex(state, index)
  const shelves = groupCodex(entries)
  // The index reads by shelf, so open on the first entry of the first shelf rather than
  // on whatever the pack happened to load first.
  const active = entries.find((entry) => entry.id === selected) ?? shelves[0]?.entries[0]

  return (
    <section className="panel">
      <h2>Codex</h2>
      <p className="note">What the traveler has learned of the world, and how it fits together.</p>

      {entries.length === 0 ? (
        <p className="empty">Nothing has been entered in the codex yet.</p>
      ) : (
        <div className="codex-layout">
          <nav className="codex-nav" aria-label="Codex entries">
            <p className="codex-count">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </p>
            {shelves.map((shelf) => (
              <div key={shelf.id} className="codex-group">
                <h4 className="codex-group-title">{shelf.label}</h4>
                <ul>
                  {shelf.entries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={entry.id === active?.id ? 'codex-link active' : 'codex-link'}
                        aria-current={entry.id === active?.id ? 'true' : undefined}
                        onClick={() => setSelected(entry.id)}
                      >
                        {entry.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {active ? (
            <article className="entry codex-entry" aria-live="polite">
              <h3>{active.title}</h3>
              <PacedPassage
                key={active.id}
                text={active.text}
                passage={passageKey.codex(active.id)}
                beatArt={active.beatArt}
              />
            </article>
          ) : null}
        </div>
      )}
    </section>
  )
}

function People() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  if (!state) return null
  const people = deriveCharacterIndex(state, index, formatDisplayDate)
  const here = presentCharacters(state, state.player.location, index)
  const hereIds = new Set(here.map((person) => person.id))

  return (
    <section className="panel">
      <h2>People</h2>
      <p className="note">
        Faces you have met, and how they read you. The place screen shows everyone here now.
      </p>
      {people.length === 0 ? (
        <p className="empty">You have not met anyone worth remembering.</p>
      ) : null}
      <ul className="list">
        {people.map((person) => {
          const art = artFor(index.characters.get(person.id)?.art)
          return (
            <li key={person.id} className="person">
              {art ? <img className="portrait" src={art.src} alt={art.alt} loading="lazy" /> : null}
              <strong>
                {person.name}
                {hereIds.has(person.id) ? ' · here now' : ''}
              </strong>
              <span>
                {person.lastSeen
                  ? `Last seen: ${person.lastSeen.placeName}, ${person.lastSeen.date}`
                  : 'Not placed'}
              </span>
              {person.regard.length > 0 ? (
                <span className="note">Regard: {formatRegard(person.regard)}</span>
              ) : null}
              {person.notes.map((note) => (
                <span key={note} className="note">
                  {note}
                </span>
              ))}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Factions() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  if (!state) return null
  const factions = deriveFactions(state, index)

  return (
    <section className="panel">
      <h2>Factions</h2>
      {factions.length === 0 ? <p className="empty">No faction has noticed you yet.</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Faction</th>
            <th>Kind</th>
            <th>Standing</th>
            <th>Regard</th>
          </tr>
        </thead>
        <tbody>
          {factions.map((faction) => (
            <tr key={faction.id}>
              <td>{faction.name}</td>
              <td>{faction.type}</td>
              <td>
                {faction.band} ({faction.standing})
              </td>
              <td>{faction.regard.length > 0 ? formatRegard(faction.regard) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Languages() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  if (!state) return null
  const languages = deriveLanguages(state, index)

  return (
    <section className="panel">
      <h2>Languages</h2>
      {languages.length === 0 ? <p className="empty">You speak nothing yet.</p> : null}
      <ul className="list">
        {languages.map((language) => (
          <li key={language.id}>
            <strong>{language.name}</strong>
            <span>
              {language.tier} · {language.xp} xp
              {language.nextTier
                ? ` · ${language.xpToNext ?? 0} to ${language.nextTier}`
                : ' · no further tier'}
            </span>
          </li>
        ))}
      </ul>
      <p className="note">
        Language never unlocks trade; it changes what you understand and how well you bargain.
      </p>
    </section>
  )
}

function Cargo() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)

  if (!state) return null
  const used = state.player.inventory.reduce(
    (total, entry) => total + entry.quantity * itemWeight(index, entry.item),
    0,
  )

  return (
    <section className="panel">
      <h2>Cargo</h2>
      <p className="note">
        {used} of {state.player.capacity} minas used{' '}
        <InfoTip label="cargo weight">
          Minas measure weight, not count. A light, valuable cargo can leave room for a heavier one;
          the capacity line is the load you can still carry.
        </InfoTip>{' '}
        · {deriveSelf(state, index).transport}
      </p>
      {state.player.inventory.length === 0 ? <p className="empty">You carry nothing.</p> : null}
      <ul className="list">
        {state.player.inventory.map((entry) => {
          const good = index.goods.get(entry.item)
          const thumb = artFor(good?.art)
          return (
            <li key={entry.item} className="cargo-entry">
              {thumb ? (
                <img className="good-thumb" src={thumb.src} alt={thumb.alt} loading="lazy" />
              ) : null}
              <div className="cargo-body">
                <strong>
                  {good?.name ?? entry.item} × {entry.quantity}
                </strong>
                <span>
                  {good?.category ?? 'unknown'} ·{' '}
                  {minas(itemWeight(index, entry.item) * entry.quantity)}
                </span>
                {entry.protected ? <span className="tag">not for sale</span> : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Settings() {
  return (
    <section className="panel">
      <h2>Settings</h2>
      <p className="note">
        Comfort preferences stay on this device. They are not part of your saved game and do not
        change the world.
      </p>

      <TextSizeControl />

      <h3>Play</h3>
      <dl className="facts">
        <div>
          <dt>Autosave</dt>
          <dd>after every action</dd>
        </div>
        <div>
          <dt>Conversation log</dt>
          <dd>on the Journal, for this sitting</dd>
        </div>
        <div>
          <dt>Motion</dt>
          <dd>follows your device's reduced-motion setting</dd>
        </div>
      </dl>
    </section>
  )
}

function SavePanel() {
  const state = useGameStore((s) => s.state)
  const index = useGameStore((s) => s.index)
  const save = useGameStore((s) => s.save)
  const load = useGameStore((s) => s.load)
  const reset = useGameStore((s) => s.reset)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  if (!state) return null
  const place = index.destinations.get(state.player.location)?.name ?? state.player.location
  const deeds = state.player.deeds.length
  const journal = state.knowledge.journalEntries.length

  return (
    <section className="panel">
      <h2>Save</h2>
      <dl className="facts">
        <div>
          <dt>Day</dt>
          <dd>{formatDisplayDate(state.calendar.day)}</dd>
        </div>
        <div>
          <dt>Place</dt>
          <dd>{place}</dd>
        </div>
        <div>
          <dt>Money</dt>
          <dd>{shekels(state.player.money)}</dd>
        </div>
        <div>
          <dt>Journal</dt>
          <dd>{journal} entries</dd>
        </div>
        <div>
          <dt>Deeds</dt>
          <dd>{deeds}</dd>
        </div>
        <div>
          <dt>Autosave</dt>
          <dd>after every action</dd>
        </div>
      </dl>
      <div className="actions">
        <button type="button" className="btn primary" onClick={save}>
          Save here
        </button>
        <button type="button" className="btn" onClick={load}>
          Load
        </button>
        <button
          type="button"
          className={confirmAbandon ? 'btn danger' : 'btn'}
          onClick={() => {
            if (confirmAbandon) reset()
            else setConfirmAbandon(true)
          }}
        >
          {confirmAbandon ? 'Yes, abandon it' : 'Abandon this journey'}
        </button>
        {confirmAbandon ? (
          <button type="button" className="btn" onClick={() => setConfirmAbandon(false)}>
            Keep playing
          </button>
        ) : null}
      </div>
      {confirmAbandon ? (
        <p className="note">Abandoning clears this journey and returns to the title.</p>
      ) : null}
    </section>
  )
}
