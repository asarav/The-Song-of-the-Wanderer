/**
 * Audio catalog is presentation data: a screen or command names an `audio.*` ID and this
 * table resolves it to a served file. The test also keeps the licensing ledger honest:
 * every shipped file must have a source and a permissive license, and every catalog
 * entry must be reachable from a real screen or cue.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { loadContentIndex } from '@store/content'
import {
  AUDIO,
  audioAsset,
  entrySfxFor,
  gameAudioFor,
  sfxForCommand,
} from './audio'

const index = loadContentIndex()
const base = import.meta.env.BASE_URL

function publicPath(src: string): string {
  const relative = src.startsWith(base) ? src.slice(base.length) : src.replace(/^\/+/, '')
  return join(process.cwd(), 'public', relative)
}

const places = [...index.destinations.values()].flatMap((destination) =>
  destination.places.map((place) => ({ destination: destination.id, place: place.id })),
)

describe('audio catalog', () => {
  it('serves every track from a real file with a permissive license', () => {
    for (const asset of Object.values(AUDIO)) {
      expect(asset.title.trim().length, `${asset.id} has no title`).toBeGreaterThan(2)
      expect(asset.note.trim().length, `${asset.id} has no note`).toBeGreaterThan(20)
      expect(asset.src.startsWith(base), `${asset.id} is not under the public base`).toBe(true)
      expect(existsSync(publicPath(asset.src)), `${asset.src} is missing`).toBe(true)
      expect(asset.volume).toBeGreaterThan(0)
      expect(asset.volume).toBeLessThanOrEqual(1)
      expect(['ambience', 'music', 'sfx']).toContain(asset.kind)
      expect(['cc0', 'public-domain']).toContain(asset.license)
      expect(asset.sources.length).toBeGreaterThan(0)
      for (const source of asset.sources) {
        expect(['cc0', 'public-domain']).toContain(source.license)
        expect(source.author.length).toBeGreaterThan(2)
        expect(source.modification.length).toBeGreaterThan(10)
      }
    }
  })

  it('loops only the beds and plays only the effects once', () => {
    for (const asset of Object.values(AUDIO)) {
      expect(asset.loop, `${asset.id} loop flag`).toBe(asset.kind !== 'sfx')
    }
  })

  it('resolves nothing for an unknown or absent ID', () => {
    expect(audioAsset('audio.nowhere')).toBeNull()
    expect(audioAsset(undefined)).toBeNull()
  })

  it('dates the title and every pregame screen to open water and the title theme', () => {
    for (const screen of ['title', 'new', 'prologue', 'world', 'credits']) {
      const audio = gameAudioFor({ screen })
      expect(audio.ambience?.id, screen).toBe('audio.ambient.sea')
      expect(audio.music?.id, screen).toBe('audio.music.title')
    }
  })

  it('puts the crossing on open water and gives it no non-diegetic score', () => {
    const audio = gameAudioFor({ screen: 'journey' })
    expect(audio.ambience?.id).toBe('audio.ambient.sea')
    expect(audio.music).toBeNull()
  })

  it('routes each place, market and night to the matching bed', () => {
    expect(
      gameAudioFor({ screen: 'place', destinationId: 'dest.ugarit', placeId: 'act.ugarit.temple' })
        .ambience?.id,
    ).toBe('audio.ambient.ugarit.temple')
    expect(
      gameAudioFor({ screen: 'place', destinationId: 'dest.ugarit', placeId: 'act.ugarit.temple' })
        .music?.id,
    ).toBe('audio.music.temple')
    expect(
      gameAudioFor({ screen: 'place', destinationId: 'dest.cyprus', placeId: 'act.cyprus.smithy' })
        .ambience?.id,
    ).toBe('audio.ambient.cyprus.smithy')
    expect(
      gameAudioFor({ screen: 'market', destinationId: 'dest.ugarit' }).ambience?.id,
    ).toBe('audio.ambient.ugarit.market')
    expect(
      gameAudioFor({ screen: 'routes', destinationId: 'dest.cyprus' }).ambience?.id,
    ).toBe('audio.ambient.cyprus.yard')
    expect(
      gameAudioFor({ screen: 'night', destinationId: 'dest.ugarit' }).ambience?.id,
    ).toBe('audio.ambient.ugarit.night')
    expect(
      gameAudioFor({ screen: 'night', destinationId: 'dest.cyprus' }).ambience?.id,
    ).toBe('audio.ambient.cyprus.night')
  })

  it('keeps a night scene after dark and a place scene in its room', () => {
    expect(
      gameAudioFor({
        screen: 'scene',
        destinationId: 'dest.cyprus',
        placeId: 'act.cyprus.smithy',
        atNight: true,
      }).ambience?.id,
    ).toBe('audio.ambient.cyprus.night')
    expect(
      gameAudioFor({
        screen: 'scene',
        destinationId: 'dest.cyprus',
        placeId: 'act.cyprus.smithy',
      }).ambience?.id,
    ).toBe('audio.ambient.cyprus.smithy')
  })

  it('falls back to silence when there is no place or destination', () => {
    expect(gameAudioFor({ screen: 'destination' }).ambience).toBeNull()
    expect(gameAudioFor({ screen: 'destination' }).music).toBeNull()
  })

  it('maps the action one-shots and the smithy entry', () => {
    expect(sfxForCommand('buy')?.id).toBe('audio.sfx.balance')
    expect(sfxForCommand('sell')?.id).toBe('audio.sfx.balance')
    expect(sfxForCommand('travel')?.id).toBe('audio.sfx.oar')
    expect(sfxForCommand('talkTo')).toBeNull()
    expect(entrySfxFor(audioAsset('audio.ambient.cyprus.smithy'))?.id).toBe(
      'audio.sfx.hammer',
    )
    expect(entrySfxFor(audioAsset('audio.ambient.ugarit.market'))).toBeNull()
  })

  it('has no catalog entry that no screen or cue can reach', () => {
    const used = new Set<string>()
    for (const screen of ['title', 'new', 'prologue', 'world', 'credits', 'journey']) {
      used.add(gameAudioFor({ screen }).ambience?.id ?? '')
      used.add(gameAudioFor({ screen }).music?.id ?? '')
    }
    for (const destination of index.destinations.values()) {
      for (const screen of ['destination', 'market', 'routes', 'night'] as const) {
        used.add(gameAudioFor({ screen, destinationId: destination.id }).ambience?.id ?? '')
      }
      const selection = gameAudioFor({ screen: 'place', destinationId: destination.id })
      used.add(selection.ambience?.id ?? '')
      used.add(selection.music?.id ?? '')
    }
    for (const entry of places) {
      const selection = gameAudioFor({
        screen: 'place',
        destinationId: entry.destination,
        placeId: entry.place,
      })
      used.add(selection.ambience?.id ?? '')
      used.add(selection.music?.id ?? '')
    }
    for (const type of ['buy', 'sell', 'travel']) {
      used.add(sfxForCommand(type)?.id ?? '')
    }
    used.add(entrySfxFor(audioAsset('audio.ambient.cyprus.smithy'))?.id ?? '')
    used.add('audio.sfx.gate')

    const orphans = Object.keys(AUDIO).filter((id) => !used.has(id))
    expect(orphans).toEqual([])
  })
})
