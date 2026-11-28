/**
 * The art catalog is content-facing presentation data: an `art.*` ID in a pack must
 * resolve here, and every catalog entry must point at a file the browser can serve.
 * These tests are the guard that keeps a renamed or missing illustration from shipping
 * as a silent blank space.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { loadContentIndex } from '@store/content'
import { ART, artFor } from './art'
import { MENU_LANDS, PROLOGUE_BEATS, WORLD_WONDERS } from './title'

const index = loadContentIndex()
const base = import.meta.env.BASE_URL

function publicPath(src: string): string {
  const relative = src.startsWith(base) ? src.slice(base.length) : src.replace(/^\/+/, '')
  return join(process.cwd(), 'public', relative)
}

const referenced: { kind: string; id: string; art?: string }[] = [
  ...[...index.destinations.values()].map((destination) => ({
    kind: 'destination',
    id: destination.id,
    art: destination.art,
  })),
  ...[...index.destinations.values()].flatMap((destination) =>
    destination.places.map((place) => ({
      kind: 'place',
      id: place.id,
      art: place.art,
    })),
  ),
  ...[...index.destinations.values()].flatMap((destination) =>
    destination.night?.art
      ? [{ kind: 'night', id: destination.id, art: destination.night.art }]
      : [],
  ),
  ...[...index.characters.values()].map((character) => ({
    kind: 'character',
    id: character.id,
    art: character.art,
  })),
  ...[...index.goods.values()].map((good) => ({
    kind: 'good',
    id: good.id,
    art: good.art,
  })),
  ...[...index.dialogues.values()].flatMap((dialogue) =>
    Object.entries(dialogue.nodes).flatMap(([node, definition]) =>
      definition.art
        ? [{ kind: 'dialogue', id: `${dialogue.id}:${node}`, art: definition.art }]
        : [],
    ),
  ),
]

/**
 * A port may give a good its own picture, because the local craft looks different. These
 * are content references too and must resolve like any other.
 */
const marketArt = [...index.destinations.values()].flatMap((destination) =>
  Object.entries(destination.market.art ?? {}).map(([item, art]) => ({
    kind: 'market',
    id: `${destination.id}:${item}`,
    art,
  })),
)

/**
 * Pictures the interface shows before a journey has a save: the menu screen and the
 * prologue screen. A place may appear on both — the menu and the prologue are different
 * screens — but never twice on the same one.
 */
const menuScreen = [
  ...MENU_LANDS.map((land) => land.art),
  ...WORLD_WONDERS.map((wonder) => wonder.art),
]
const menuArt = [...menuScreen, ...PROLOGUE_BEATS.map((beat) => beat.art)]

/** Beat plates are content references too; the orphan check must see them. */
const authoredBeatArt = [
  ...[...index.dialogues.values()].flatMap((dialogue) =>
    Object.values(dialogue.nodes).flatMap((node) => node.beatArt ?? []),
  ),
  ...[...index.destinations.values()].flatMap((destination) => [
    ...(destination.beatArt ?? []),
    ...(destination.night?.beatArt ?? []),
  ]),
  ...[...index.journal.values()].flatMap((entry) => entry.beatArt ?? []),
  ...[...index.codex.values()].flatMap((entry) => entry.beatArt ?? []),
]

describe('art catalog', () => {
  it('covers every place, person and beat the slice shows', () => {
    expect(referenced.length).toBe(45)
  })

  it('illustrates the menu and every prologue beat', () => {
    expect(menuScreen.length).toBe(MENU_LANDS.length + WORLD_WONDERS.length)
    expect(new Set(menuScreen).size).toBe(menuScreen.length)
    expect(new Set(PROLOGUE_BEATS.map((beat) => beat.art)).size).toBe(PROLOGUE_BEATS.length)
    for (const id of menuArt) expect(artFor(id), `${id} has no picture`).not.toBeNull()
  })

  it.each([...referenced, ...marketArt])('resolves $kind $id', ({ art }) => {
    expect(art, 'authored entity has no art ID').toBeTruthy()
    expect(artFor(art)).not.toBeNull()
  })

  it('resolves nothing for an unknown or absent ID', () => {
    expect(artFor('art.nowhere')).toBeNull()
    expect(artFor(undefined)).toBeNull()
  })

  it.each(Object.values(ART))('serves $id from a real file', (asset) => {
    expect(asset.alt.trim().length).toBeGreaterThan(20)
    expect(asset.src.startsWith(base)).toBe(true)
    expect(existsSync(publicPath(asset.src)), `${asset.src} is missing`).toBe(true)
  })

  it('dates every picture to one horizon, and the slice uses A only', () => {
    const assets = Object.values(ART)
    for (const asset of assets) {
      expect(['A', 'B', 'C'], `${asset.id} has no valid horizon`).toContain(asset.horizon)
    }
    expect(new Set(assets.map((asset) => asset.horizon))).toEqual(new Set(['A']))
  })

  it('has no catalog entry that nothing references', () => {
    const used = new Set([
      ...referenced.map((entry) => entry.art),
      ...marketArt.map((entry) => entry.art),
      ...menuArt,
      ...authoredBeatArt,
    ])
    const orphans = Object.keys(ART).filter((id) => !used.has(id))
    expect(orphans).toEqual([])
  })

  it('gives every illustrated beat its own picture', () => {
    const beatArts = referenced
      .filter((entry) => entry.kind === 'dialogue')
      .map((entry) => entry.art)
    expect(new Set(beatArts).size).toBe(beatArts.length)
  })

  it('gives every cargo type its own thumbnail', () => {
    const goods = [...index.goods.values()]
    expect(goods.length).toBeGreaterThan(0)
    expect(new Set(goods.map((good) => good.art)).size).toBe(goods.length)
  })

  it('illustrates each beat of the cloth thread with the picture it was written for', () => {
    const beats: [string, string, string][] = [
      ['dlg.ugarit.refugee-ask', 'ask', 'art.ugarit.cloth-table'],
      ['dlg.ugarit.refugee-ask', 'thanks', 'art.ugarit.cloth-tied'],
      ['dlg.ugarit.refugee-ask', 'refused', 'art.ugarit.cloth-refused'],
      ['dlg.ugarit.sibtu.ask', 'amends', 'art.ugarit.cloth-amends'],
      ['dlg.ugarit.sibtu.ask', 'bundle-missing', 'art.ugarit.cloth-missing'],
      ['dlg.ugarit.sibtu.ask', 'settle', 'art.ugarit.cloth-settle'],
      ['dlg.ugarit.sibtu.ask', 'settled', 'art.ugarit.cloth-settled'],
      ['dlg.ugarit.sibtu.ask', 'kept', 'art.ugarit.cloth-kept'],
      ['dlg.ugarit.sibtu.ask', 'after-cloth', 'art.ugarit.cloth-after'],
    ]

    for (const [dialogue, node, art] of beats) {
      expect(index.dialogues.get(dialogue)?.nodes[node]?.art, `${dialogue}:${node}`).toBe(art)
    }
  })

  it('never puts one picture in two places on the same screen', () => {
    for (const destination of index.destinations.values()) {
      const shown = [
        destination.art,
        ...destination.places.map((place) => place.art),
        ...destination.cast.map((id) => index.characters.get(id)?.art),
      ].filter((id): id is string => Boolean(id))
      expect(new Set(shown).size, `${destination.id} repeats a picture`).toBe(shown.length)
    }
  })
})
