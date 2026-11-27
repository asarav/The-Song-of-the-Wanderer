import { describe, expect, it } from 'vitest'

import { ART } from './art'
import { backdropFor, toneFor } from './backdrop'

describe('backdrop selection', () => {
  it('puts a speaker portrait behind a scene', () => {
    expect(
      backdropFor({ screen: 'scene', speakerArtId: 'art.cyprus.kinyras' })?.id,
    ).toBe('art.cyprus.kinyras')
  })

  it('puts the current place behind its screens', () => {
    expect(
      backdropFor({ screen: 'destination', placeArtId: 'art.ugarit.market' })?.id,
    ).toBe('art.ugarit.market')
  })

  it('shows the harbor a journey is making for while at sea', () => {
    expect(
      backdropFor({ screen: 'journey', journeyArtId: 'art.cyprus.arrival' })?.id,
    ).toBe('art.cyprus.arrival')
  })

  it('prefers the crossing over the port left behind', () => {
    expect(
      backdropFor({
        screen: 'journey',
        placeArtId: 'art.ugarit.harbour',
        journeyArtId: 'art.cyprus.arrival',
      })?.id,
    ).toBe('art.cyprus.arrival')
  })

  it('opens the menu on the coast the journey begins on', () => {
    expect(backdropFor({ screen: 'title' })?.id).toBe('art.land.levant')
  })

  it('keeps the world behind off a picture the stage is already showing', () => {
    expect(
      backdropFor({
        screen: 'scene',
        speakerArtId: 'art.cyprus.kinyras',
        placeArtId: 'art.cyprus.yard',
        avoid: ['art.cyprus.kinyras'],
      })?.id,
    ).toBe('art.cyprus.yard')
  })

  it('shows no picture rather than another coast', () => {
    expect(
      backdropFor({
        screen: 'destination',
        placeArtId: 'art.cyprus.yard',
        avoid: ['art.cyprus.yard'],
      }),
    ).toBeNull()
  })

  it('does not repeat a scene picture when the scene shows it', () => {
    expect(
      backdropFor({
        screen: 'scene',
        placeArtId: 'art.ugarit.harbour',
        avoid: ['art.ugarit.cloth-settle', 'art.ugarit.sibtu'],
      })?.id,
    ).toBe('art.ugarit.harbour')
  })

  it('gives each coast its own tone', () => {
    expect(toneFor(ART['art.ugarit.market']!)).toBe('ugarit')
    expect(toneFor(ART['art.cyprus.arrival']!)).toBe('cyprus')
  })
})
