import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deserialize, serialize } from '@engine/save'
import { createInitialState } from '@engine/state'
import { AUTOSAVE_KEY, SAVE_KEY, hasSavedJourney, screenAfter, useGameStore } from './gameStore'

const start = () => useGameStore.getState().start({ seed: 'store-test-001' })

describe('game store', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: null,
      screen: 'title',
      feedback: null,
      timePassed: null,
      dialogueLog: [],
      readPassages: [],
      placeId: null,
    })
  })

  it('opens a run on the arrival scene with the authored content loaded', () => {
    start()
    const state = useGameStore.getState().state

    expect(state?.player.location).toBe('dest.ugarit')
    expect(state?.player.identity.selfName).toBe('e-ma-a₂')
    expect(state?.narrative.pending?.dialogue).toBe('dlg.slice.opening')
    expect(useGameStore.getState().screen).toBe('scene')
  })

  it('applies the chosen road to the opening purse and reserve', () => {
    useGameStore.getState().start({ seed: 'store-perilous', difficulty: 'perilous' })
    const state = useGameStore.getState().state

    expect(state?.meta.difficulty).toBe('perilous')
    expect(state?.player.money).toBe(24)
    expect(state?.player.stamina).toBe(6)
  })

  it('paces a passage once per session, not once per save', () => {
    start()
    useGameStore.getState().markPassageRead('place:dest.ugarit')
    useGameStore.getState().markPassageRead('place:dest.ugarit')
    useGameStore.getState().markPassageRead('codex:codex.ugarit')
    expect(useGameStore.getState().readPassages).toEqual([
      'place:dest.ugarit',
      'codex:codex.ugarit',
    ])

    start()
    expect(useGameStore.getState().readPassages).toEqual([])
  })

  it('routes a command through the reducer', () => {
    start()
    useGameStore.getState().dispatch({ type: 'advanceTime', days: 1 })
    expect(useGameStore.getState().state?.calendar.day).toBe(1)
  })

  it('attaches the daily condition report to a passing day', () => {
    const state = createInitialState({
      seed: 'store-day-report',
      location: 'dest.ugarit',
      money: 40,
      capacity: 20,
      afflictions: [{ id: 'aff.fever', sinceDay: 1 }],
    })
    useGameStore.setState({ state, screen: 'destination' })

    useGameStore.getState().dispatch({ type: 'advanceTime', days: 1 })

    expect(useGameStore.getState().timePassed?.report).toMatchObject({
      trend: 'same',
      conditions: [{ id: 'aff.fever', trend: 'lingering' }],
    })
  })

  it('opens a place and remembers it until the port index is opened', () => {
    start()
    for (let step = 0; step < 5 && useGameStore.getState().state?.narrative.pending; step += 1) {
      useGameStore.getState().dispatch({ type: 'chooseDialogue', choice: 0 })
    }

    useGameStore.getState().setScreen('map')
    useGameStore.getState().visitPlace('act.ugarit.market')

    expect(useGameStore.getState().screen).toBe('place')
    expect(useGameStore.getState().placeId).toBe('act.ugarit.market')

    // Going to the market from the place keeps the way back.
    useGameStore.getState().setScreen('market')
    expect(useGameStore.getState().placeId).toBe('act.ugarit.market')

    useGameStore.getState().setScreen('destination')
    expect(useGameStore.getState().placeId).toBeNull()
  })

  it('returns to the place after a conversation begun there', () => {
    start()
    for (let step = 0; step < 5 && useGameStore.getState().state?.narrative.pending; step += 1) {
      useGameStore.getState().dispatch({ type: 'chooseDialogue', choice: 0 })
    }

    useGameStore.getState().visitPlace('act.ugarit.market')
    useGameStore.getState().dispatch({ type: 'talkTo', character: 'char.ugarit.amnit' })
    expect(useGameStore.getState().screen).toBe('scene')

    for (let step = 0; step < 10 && useGameStore.getState().state?.narrative.pending; step += 1) {
      const pending = useGameStore.getState().state?.narrative.pending
      const node = pending
        ? useGameStore.getState().index.dialogues.get(pending.dialogue)?.nodes[pending.node]
        : undefined
      if (!node || node.choices.length === 0) break
      useGameStore.getState().dispatch({ type: 'chooseDialogue', choice: node.choices.length - 1 })
    }

    expect(useGameStore.getState().state?.narrative.pending).toBeFalsy()
    expect(useGameStore.getState().screen).toBe('place')
    expect(useGameStore.getState().placeId).toBe('act.ugarit.market')
  })

  it('shows the night after a day and returns to day on waking', () => {
    start()

    // Answer the opening scene, then spend a day: the first night may bring a scene.
    for (let step = 0; step < 5 && useGameStore.getState().state?.narrative.pending; step += 1) {
      useGameStore.getState().dispatch({ type: 'chooseDialogue', choice: 0 })
    }
    useGameStore.getState().dispatch({ type: 'advanceTime', days: 1 })
    for (let step = 0; step < 5 && useGameStore.getState().state?.narrative.pending; step += 1) {
      useGameStore.getState().dispatch({ type: 'chooseDialogue', choice: 0 })
    }
    expect(useGameStore.getState().screen).toBe('destination')

    // The next night is still on cooldown, so the place after dark is the screen.
    useGameStore.getState().dispatch({ type: 'advanceTime', days: 1 })
    expect(useGameStore.getState().screen).toBe('night')

    useGameStore.getState().setScreen('destination')
    expect(useGameStore.getState().screen).toBe('destination')
  })

  it('reports a day passing only when a command moved the clock', () => {
    start()
    expect(useGameStore.getState().timePassed).toBeNull()

    useGameStore.getState().dispatch({ type: 'advanceTime', days: 1 })
    const first = useGameStore.getState().timePassed
    expect(first).toMatchObject({ from: 0, to: 1 })

    useGameStore.getState().dispatch({ type: 'rest', days: 3 })
    const second = useGameStore.getState().timePassed
    expect(second).toMatchObject({ from: 1, to: 4 })
    expect(second?.id).not.toBe(first?.id)

    // A command that leaves the calendar alone reports no passing it can show.
    useGameStore.getState().dispatch({ type: 'advanceTime', days: 0 })
    expect(useGameStore.getState().timePassed).toBeNull()
  })

  it('confirms a trade with the goods and silver that moved', () => {
    start()
    for (let step = 0; step < 5 && useGameStore.getState().state?.narrative.pending; step += 1) {
      useGameStore.getState().dispatch({ type: 'chooseDialogue', choice: 0 })
    }

    useGameStore.getState().setScreen('market')
    useGameStore.getState().dispatch({ type: 'buy', item: 'good.grain', quantity: 1 })
    expect(useGameStore.getState().feedback).toBe('Bought 1 grain for 4 shekels.')

    useGameStore.getState().dispatch({ type: 'sell', item: 'good.grain', quantity: 1 })
    expect(useGameStore.getState().feedback).toBe('Sold 1 grain for 3 shekels.')

    // The confirmation belongs to the market, not to wherever the player goes next.
    useGameStore.getState().setScreen('destination')
    expect(useGameStore.getState().feedback).toBeNull()
  })

  it('reports a rejection without changing the state', () => {
    start()
    const before = JSON.stringify(useGameStore.getState().state)

    useGameStore.getState().dispatch({ type: 'buy', item: 'good.nothing', quantity: 1 })

    expect(useGameStore.getState().feedback).toBe('This market does not sell that.')
    expect(JSON.stringify(useGameStore.getState().state)).toBe(before)
  })

  it('keeps an ordinary command on the screen it was issued from', () => {
    const state = createInitialState({ seed: 'screen-test', location: 'dest.ugarit' })
    expect(screenAfter(state, 'market')).toBe('market')
    expect(screenAfter(state, 'status')).toBe('status')
  })

  it('returns a finished scene to the place it began in, or to the port', () => {
    const state = createInitialState({ seed: 'screen-place', location: 'dest.ugarit' })

    expect(screenAfter(state, 'scene', 'act.ugarit.market')).toBe('place')
    expect(screenAfter(state, 'scene')).toBe('destination')
    expect(screenAfter(state, 'journey', 'act.ugarit.market')).toBe('destination')
  })

  it('records a line once and clears the log for a new run', () => {
    const line = {
      key: 'dlg.ugarit.arrival:start',
      dialogue: 'dlg.ugarit.arrival',
      node: 'start',
      speaker: 'Hannu',
      text: 'You came in on the morning tide.',
      day: 0,
      date: 'Year 1230 BCE · month 1 · day 1',
    }

    useGameStore.getState().noteDialogue(line)
    useGameStore.getState().noteDialogue(line)
    expect(useGameStore.getState().dialogueLog).toHaveLength(1)

    start()
    expect(useGameStore.getState().dialogueLog).toEqual([])
  })

  it('autosaves every accepted command and reloads it', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    })

    try {
      start()
      useGameStore.getState().dispatch({ type: 'advanceTime', days: 1 })

      const raw = storage.get(AUTOSAVE_KEY)
      expect(raw).toBeTruthy()
      const loaded = deserialize(JSON.parse(raw as string))
      expect(loaded.ok).toBe(true)
      if (loaded.ok) expect(loaded.state.calendar.day).toBe(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('keeps a pending scene in front of the player', () => {
    start()
    expect(useGameStore.getState().screen).toBe('scene')

    useGameStore.getState().setScreen('market')
    expect(useGameStore.getState().screen).toBe('scene')
  })

  it('continues the newest save, not the older manual one', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    })

    try {
      const older = createInitialState({ seed: 'older', location: 'dest.ugarit', money: 40 })
      const newer = createInitialState({ seed: 'newer', location: 'dest.ugarit', money: 7 })
      storage.set(
        SAVE_KEY,
        JSON.stringify(serialize(older, { savedAt: '2026-01-01T00:00:00.000Z' })),
      )
      storage.set(
        AUTOSAVE_KEY,
        JSON.stringify(serialize(newer, { savedAt: '2026-01-02T00:00:00.000Z' })),
      )

      useGameStore.getState().load()
      expect(useGameStore.getState().state?.player.money).toBe(7)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('offers Continue only when a readable save exists', () => {
    const storage = new Map<string, string>()
    const disk = { getItem: (key: string) => storage.get(key) ?? null }

    expect(hasSavedJourney(disk)).toBe(false)

    storage.set(SAVE_KEY, '{not json')
    expect(hasSavedJourney(disk)).toBe(false)

    expect(
      hasSavedJourney({
        getItem: () => {
          throw new Error('blocked storage')
        },
      }),
    ).toBe(false)

    const state = createInitialState({ seed: 'continue-check', location: 'dest.ugarit', money: 12 })
    storage.set(SAVE_KEY, JSON.stringify(serialize(state, { savedAt: '2026-01-01T00:00:00.000Z' })))
    expect(hasSavedJourney(disk)).toBe(true)

    storage.delete(SAVE_KEY)
    storage.set(
      AUTOSAVE_KEY,
      JSON.stringify(serialize(state, { savedAt: '2026-01-02T00:00:00.000Z' })),
    )
    expect(hasSavedJourney(disk)).toBe(true)
  })

  it('starts a run that can reach a second destination', () => {
    start()
    const index = useGameStore.getState().index
    const route = index.routes.get('route.ugarit-cyprus')

    expect(route).toBeDefined()
    expect(index.destinations.get('dest.cyprus')).toBeDefined()
  })
})
