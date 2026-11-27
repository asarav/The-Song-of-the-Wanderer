import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  buildContentIndex,
  contentErrorCount,
  type RawEntityFile,
  type RawPack,
} from '../src/engine/content'
import type { EntityFolder, Manifest } from '../src/engine/content'
import {
  findCargoClaimIssues,
  findDeveloperProseIssues,
  findScriptReadingIssues,
  lintContentDirectory,
  loadPacks,
} from './content-lint'

const root = join(process.cwd(), 'src', 'content')
const fixtures = join(root, '__fixtures__')

async function brokenPack(): Promise<RawPack> {
  const packRoot = join(fixtures, 'packs', 'broken')
  const manifest = JSON.parse(
    await readFile(join(packRoot, 'manifest.json'), 'utf8'),
  ) as Manifest

  const files: RawEntityFile[] = []
  for (const folder of ['destinations', 'events', 'dialogues'] as EntityFolder[]) {
    files.push({
      folder,
      file: 'broken.json',
      data: JSON.parse(await readFile(join(packRoot, folder, 'broken.json'), 'utf8')) as unknown,
    })
  }

  return { manifest, files }
}

function loadPack(text: string, effects: unknown[] = [{ items: { item: 'good.grain', quantity: -1 } }]): RawPack {
  return {
    manifest: {
      id: 'pack.test',
      contentVersion: 1,
      requires: [],
      entities: { goods: ['good.grain', 'good.olive-oil'], dialogues: ['dlg.test.load'] },
    },
    files: [
      {
        folder: 'goods',
        file: 'grain.json',
        data: {
          id: 'good.grain',
          name: 'Grain',
          art: 'art.good.grain',
          category: 'food',
          weight: 2,
        },
      },
      {
        folder: 'goods',
        file: 'oil.json',
        data: {
          id: 'good.olive-oil',
          name: 'Olive oil',
          art: 'art.good.olive-oil',
          category: 'food',
          weight: 3,
        },
      },
      {
        folder: 'dialogues',
        file: 'load.json',
        data: {
          id: 'dlg.test.load',
          start: 'shift',
          nodes: {
            shift: {
              text,
              choices: [
                {
                  text: 'Let it go.',
                  effects,
                  next: null,
                },
              ],
            },
          },
        },
      },
    ],
  }
}

describe('cargo claims', () => {
  const loss = [{ loseCargo: { quantity: 1 } }]

  it('fails a scene that takes whatever is held but names a good', () => {
    const issues = findCargoClaimIssues([loadPack('One jar of oil goes over the side.', loss)])
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('names')
    expect(issues[0]?.message).toContain('{cargo}')
  })

  it('fails a scene that takes cargo without reading the hold', () => {
    const issues = findCargoClaimIssues([loadPack('Something goes over the side.', loss)])
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('without naming it')
  })

  it('passes a scene that writes {cargo}', () => {
    expect(
      findCargoClaimIssues([loadPack('By the time you wake, {cargo} is in the water.', loss)]),
    ).toEqual([])
  })

  it('fails a scene that removes a named good the trader may not carry', () => {
    const issues = findCargoClaimIssues([loadPack('You hand over a sack of grain.')])
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('without checking')
  })

  it('passes a sale the choice guards with the item', () => {
    const pack = loadPack('You put the grain on the scale.')
    const dialogue = pack.files[2]?.data as {
      nodes: { shift: { choices: { conditions?: unknown }[] } }
    }
    dialogue.nodes.shift.choices[0]!.conditions = {
      itemAtLeast: { item: 'good.grain', quantity: 1 },
    }
    expect(findCargoClaimIssues([pack])).toEqual([])
  })
})

describe('authored content', () => {
  it('has no errors through the same validator the game uses', async () => {
    const loaded = await loadPacks(root)
    const built = buildContentIndex(loaded.packs)

    expect(loaded.issues.filter((issue) => issue.level === 'error')).toEqual([])
    expect(contentErrorCount(built.issues)).toBe(0)
    expect(built.counts.packs).toBe(2)
  })

  it('agrees between the CLI and the runtime on a broken pack', async () => {
    const runtime = buildContentIndex([await brokenPack()])
    const cli = await lintContentDirectory(fixtures, { skipFixtures: false })

    const runtimeMessages = runtime.issues
      .filter((issue) => issue.level === 'error')
      .map((issue) => issue.message)
    const cliMessages = cli.issues
      .filter((issue) => issue.level === 'error')
      .map((issue) => issue.message)

    expect(runtimeMessages.length).toBeGreaterThan(0)
    for (const message of runtimeMessages) {
      expect(cliMessages).toContain(message)
    }
  })

  it('names the specific faults in the broken fixture', async () => {
    const cli = await lintContentDirectory(fixtures, { skipFixtures: false })
    const text = cli.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')

    expect(text).toMatch(/cast/)
    expect(text).toMatch(/conditions/)
    expect(text).toMatch(/nowhere/)
  })

  it('gives every authored word in another script its reading', async () => {
    const loaded = await loadPacks(root)

    expect(findScriptReadingIssues(loaded.packs)).toEqual([])
  })

  it('writes every player-facing word for the player', async () => {
    const loaded = await loadPacks(root)

    expect(findDeveloperProseIssues(loaded.packs)).toEqual([])
  })
})

function wordPack(text: string): RawPack {
  const manifest: Manifest = {
    id: 'pack.words',
    contentVersion: 1,
    requires: [],
    entities: {},
  }

  return {
    manifest,
    files: [{ folder: 'codex', file: 'words.json', data: { id: 'codex.words', text } }],
  }
}

describe('player-facing prose', () => {
  it('accepts in-world text', () => {
    expect(
      findDeveloperProseIssues([wordPack('The harbour takes coin and the gate shuts at dark.')]),
    ).toEqual([])
  })

  it('warns when the text talks about the build instead of the world', () => {
    const issues = findDeveloperProseIssues([
      wordPack('The slice shows one harbour. The player can read this later.'),
    ])

    expect(issues.length).toBe(2)
    expect(issues.map((issue) => issue.message).join(' ')).toContain('the slice')
    expect(issues.every((issue) => issue.level === 'warning')).toBe(true)
  })

  it('leaves design notes and ids alone', () => {
    const pack = wordPack('A harbour.')
    pack.files.push({
      folder: 'codex',
      file: 'notes.json',
      data: {
        id: 'codex.notes',
        text: 'A harbour.',
        provenance: { confidence: 'fictional', sources: ['the slice'], notes: 'The slice is a placeholder.' },
      },
    })

    expect(findDeveloperProseIssues([pack])).toEqual([])
  })
})

describe('script words', () => {
  it('accepts a sign run followed by its reading in parentheses', () => {
    const issues = findScriptReadingIssues([
      wordPack('The tablets write 𐀁𐀔𐀀 (e-ma-a₂, read Ermahas) and 𒀭𒎏𒋚 (Ninshubur).'),
    ])

    expect(issues).toEqual([])
  })

  it('warns, naming the word, when the reading is missing', () => {
    const issues = findScriptReadingIssues([wordPack('The tablets write 𐀁𐀔𐀀.')])

    expect(issues).toHaveLength(1)
    expect(issues[0]?.level).toBe('warning')
    expect(issues[0]?.path).toBe('pack.words/codex/words.json')
    expect(issues[0]?.message).toContain('𐀁𐀔𐀀')
    expect(issues[0]?.message).toContain('reading in parentheses')
  })

  it('is deterministic: the same pack gives the same issues', () => {
    const pack = wordPack('Ugarit is 𐎜𐎂𐎗𐎚 and its name is 𐎜𐎂𐎗𐎚 (ugrt).')

    expect(findScriptReadingIssues([pack])).toEqual(findScriptReadingIssues([pack]))
    expect(findScriptReadingIssues([pack])).toHaveLength(1)
  })
})
