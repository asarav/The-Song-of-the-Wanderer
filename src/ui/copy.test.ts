import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * The interface is read by a trader, not by whoever builds it. Comments may say what they
 * like; the strings and JSX that reach the screen may not mention the build, and no screen
 * may print a raw content id (a `dest.…` or `route.…` in a cell is a working note left on
 * screen).
 */
const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')

const shipped = source
  .replace(/\/\*[\s\S]*?\*\//g, '') // block comments, including JSX comments
  .replace(/(^|[^:])\/\/.*$/gm, '$1') // line comments, leaving `https://` alone

const DEVELOPER_WORDS: [RegExp, string][] = [
  [/the slice/i, 'the slice'],
  [/this game/i, 'this game'],
  [/the game/i, 'the game'],
  [/the player/i, 'the player'],
  [/graybox/i, 'graybox'],
  [/prototype/i, 'prototype'],
  [/placeholder/i, 'placeholder'],
  [/dossier/i, 'dossier'],
  [/developer/i, 'developer'],
  [/simulation/i, 'simulation'],
  [/save format/i, 'save format'],
]

describe('interface copy', () => {
  it('never addresses the build', () => {
    const found = DEVELOPER_WORDS.filter(([pattern]) => pattern.test(shipped)).map(
      ([, word]) => word,
    )
    expect(found).toEqual([])
  })

  it('keeps every price and the purse in the traveler\'s own silver', () => {
    // A destination's `currency` is a description of the place, never a second purse.
    expect(shipped).not.toMatch(/\.currency\b/)
    expect(shipped).toContain('Prices are in shekels of silver')
    expect(shipped).toContain('Your purse is silver by weight')
  })

  it('states how a sale compares with the cargo\'s cost', () => {
    expect(shipped).toContain('Gain / loss')
    expect(shipped).toContain('Gain compares the sale price for one unit with the average price you paid')
    expect(shipped).toContain('says “unknown”')
  })

  it('defines the reserve and names what each day control costs', () => {
    expect(shipped).toContain('One number for sleep, food, water and nerve.')
    expect(shipped).toContain('Reserve</strong> is your stamina')
    expect(shipped).toContain('Pass a day (errands, no recovery)')
    expect(shipped).toContain('Rest three days (restores reserve)')
  })

  it('labels the passage terms instead of hiding them in a sentence', () => {
    for (const term of ['Fare', 'Days', 'Cargo', 'Reserve', 'Grain', 'Risk']) {
      expect(shipped).toContain(`<dt>${term}</dt>`)
    }
    expect(shipped).toContain('Take passage to {route.toName}')
  })

  it('draws fog as unknown ground and names the local shapes', () => {
    expect(shipped).toContain('map-fog-hatch')
    expect(shipped).toContain('unexplored · no account')
    expect(shipped).toContain('Shapes: market canopy')
  })

  it('never prints a raw content id', () => {
    expect(shipped).not.toMatch(
      /['"`](dest|route|good|char|faction|lang|dlg|evt|journal|name|transport)\.[a-z0-9]/,
    )
  })
})
