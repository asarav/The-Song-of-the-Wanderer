import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { loadContentIndex } from '@store/content'

import { artFor } from './art'
import {
  CREDITS,
  MENU,
  MENU_LANDS,
  PROLOGUE_BEATS,
  TITLE_BACKDROPS,
  WORLD_WONDERS,
  prologueBeatAt,
  titleBackdropAt,
} from './title'

/**
 * The menu is the first thing a player sees, and the prologue is the first prose they
 * read. These pin the order — world first, traveler second — that every beat has its own
 * picture, that every land names a region the content actually has, and that no beat or
 * card addresses the build.
 */
const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const index = loadContentIndex()

const DEVELOPER_WORDS = [
  /the slice/i,
  /this slice/i,
  /one crossing/i,
  /the game/i,
  /this game/i,
  /the player/i,
  /graybox/i,
  /prototype/i,
  /placeholder/i,
  /this build/i,
  /dossier/i,
]

describe('the menu and its prologue', () => {
  it('opens with the state of the world before the traveler', () => {
    expect(PROLOGUE_BEATS.length).toBeGreaterThan(3)
    expect(PROLOGUE_BEATS[0].text).toMatch(/world is already old/i)
    expect(PROLOGUE_BEATS[1].text).toMatch(/bronze/i)

    const arrival = PROLOGUE_BEATS.findIndex((beat) => /You come ashore/i.test(beat.text))
    expect(arrival).toBeGreaterThan(1)
    expect(prologueBeatAt(PROLOGUE_BEATS.length - 1).text).toMatch(/trader/i)
  })

  it('gives every beat its own picture', () => {
    const art = PROLOGUE_BEATS.map((beat) => beat.art)
    expect(new Set(art).size).toBe(art.length)
    for (const id of art) expect(artFor(id), `${id} has no picture`).not.toBeNull()
  })

  it('names ten places of the wider world, each with its own picture and its people', () => {
    expect(WORLD_WONDERS.length).toBe(10)
    expect(new Set(WORLD_WONDERS.map((wonder) => wonder.name)).size).toBe(10)
    expect(new Set(WORLD_WONDERS.map((wonder) => wonder.art)).size).toBe(10)

    for (const wonder of WORLD_WONDERS) {
      expect(artFor(wonder.art), `${wonder.art} has no picture`).not.toBeNull()
      expect(wonder.where.trim().length).toBeGreaterThan(4)
      expect(wonder.line.trim().length).toBeGreaterThan(80)
    }
  })

  it('credits the game to A.S. Mori from a screen the title can reach', () => {
    expect(CREDITS.creator).toBe('A.S. Mori')
    expect(CREDITS.role).toMatch(/created/i)
    expect(app).toContain("setScreen('credits')")
    expect(app).toContain('{CREDITS.creator}')
    expect(app).toContain('CREDITS.attributions.map')
  })

  it('names the field-recording source and its CC0 terms', () => {
    const sound = CREDITS.attributions.find((entry) => entry.title === 'Sound')
    expect(sound).toBeDefined()
    expect(sound?.lines.join(' ')).toMatch(/Joseph SARDIN/)
    expect(sound?.lines.join(' ')).toMatch(/BigSoundBank/)
    expect(sound?.lines.join(' ')).toMatch(/CC0/)
    expect(sound?.link?.href).toBe('https://bigsoundbank.com/')

    const illustration = CREDITS.attributions.find((entry) => entry.title === 'Illustration')
    expect(illustration?.lines.join(' ')).toMatch(/No third-party image/)
  })

  it('cycles every wonder and both shores behind the title', () => {
    expect(TITLE_BACKDROPS).toHaveLength(WORLD_WONDERS.length + MENU_LANDS.length)
    expect(new Set(TITLE_BACKDROPS).size).toBe(TITLE_BACKDROPS.length)
    for (const id of TITLE_BACKDROPS) expect(artFor(id), `${id} has no picture`).not.toBeNull()

    expect(titleBackdropAt(0)).toBe(TITLE_BACKDROPS[0])
    expect(titleBackdropAt(TITLE_BACKDROPS.length)).toBe(TITLE_BACKDROPS[0])
    expect(titleBackdropAt(-1)).toBe(TITLE_BACKDROPS[TITLE_BACKDROPS.length - 1])
  })

  it('shows a land for every region the journey can reach, with its own picture', () => {
    const art = MENU_LANDS.map((land) => land.art)
    expect(new Set(art).size).toBe(art.length)

    for (const land of MENU_LANDS) {
      expect(index.regions.get(land.region), `${land.region} is not in the content`).toBeDefined()
      expect(artFor(land.art), `${land.art} has no picture`).not.toBeNull()
      expect(land.line.trim().length).toBeGreaterThan(40)
    }
  })

  it('speaks only to the player', () => {
    const prose = [
      MENU.eyebrow,
      MENU.name,
      MENU.tagline,
      MENU.begin,
      MENU.lands,
      MENU.landsNote,
      MENU.prologueEyebrow,
      MENU.prologueTitle,
      MENU.world,
      CREDITS.eyebrow,
      CREDITS.role,
      CREDITS.creator,
      CREDITS.line,
      ...CREDITS.attributions.flatMap((entry) => [entry.title, ...entry.lines]),
      MENU.worldPlaces,
      MENU.worldNote,
      ...MENU_LANDS.flatMap((land) => [land.where, land.line]),
      ...WORLD_WONDERS.flatMap((wonder) => [wonder.name, wonder.where, wonder.line]),
      ...PROLOGUE_BEATS.map((beat) => beat.text),
    ]

    for (const line of prose) {
      for (const pattern of DEVELOPER_WORDS) {
        expect(line).not.toMatch(pattern)
      }
    }
  })

  it('keeps a stale beat from pointing past the last picture', () => {
    expect(prologueBeatAt(0)).toBe(PROLOGUE_BEATS[0])
    expect(prologueBeatAt(99)).toBe(PROLOGUE_BEATS[PROLOGUE_BEATS.length - 1])
    expect(prologueBeatAt(-4)).toBe(PROLOGUE_BEATS[0])
  })

  it('is the copy and the pictures the screens render', () => {
    expect(app).toContain('PROLOGUE_BEATS.map')
    expect(app).toContain('MENU_LANDS.map')
    expect(app).toContain('WORLD_WONDERS.map')
    expect(app).toContain('prologueBeatAt(step)')
    expect(app).toContain('<TitleBackdrop />')
  })
})
