import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  FACTORY_KINDS,
  checkFactory,
  containsPlaceholder,
  readRecipe,
  scaffoldFor,
  validateScaffold,
  variantBatch,
  variantEntity,
  writeScaffold,
  writeVariants,
  type FactoryKind,
} from './factory'

const roots: string[] = []

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'sotw-factory-'))
  roots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('factory scaffolds', () => {
  it.each(FACTORY_KINDS.filter((kind) => kind !== 'arc-brief'))(
    'creates a schema-valid %s scaffold that still has TODO markers',
    (kind) => {
      const data = scaffoldFor(kind as FactoryKind, `${kind}.test.example`)
      expect(validateScaffold(kind as FactoryKind, data)).toEqual([])
      expect(containsPlaceholder(data)).toBe(true)
    },
  )

  it('writes an arc brief as a design document, not a runtime entity', () => {
    const brief = scaffoldFor('arc-brief', 'arc.test.example')
    expect(typeof brief).toBe('string')
    expect(brief).toContain('Runtime `ArcDef` is M6 work')
    expect(brief).toContain('TODO:')
  })

  it('refuses to overwrite an existing scaffold', async () => {
    const root = await tempRoot()
    const first = await writeScaffold('ambient', 'ambient.test.once', { root, write: true })
    expect(first.wrote).toBe(true)

    await expect(
      writeScaffold('ambient', 'ambient.test.once', { root, write: true }),
    ).rejects.toThrow('refusing to overwrite')
  })

  it('does not create a file on a dry run', async () => {
    const root = await tempRoot()
    const result = await writeScaffold('journal', 'journal.test.dry', { root })
    expect(result.wrote).toBe(false)
    await expect(readFile(result.path, 'utf8')).rejects.toThrow()
  })
})

describe('factory variants', () => {
  it('is deterministic for the same seed and changes with another seed', async () => {
    const root = await tempRoot()
    const recipe = await readRecipe('ambient-example', process.cwd())
    const first = variantBatch(recipe, { seed: 'harbor', root })
    const second = variantBatch(recipe, { seed: 'harbor', root })
    const other = variantBatch(recipe, { seed: 'temple', root })
    expect(first).toEqual(second)
    expect(first.map((entry) => entry.data.id)).not.toEqual(other.map((entry) => entry.data.id))
  })

  it('builds culture, art and id from an authored row', () => {
    const entity = variantEntity(
      {
        id: 'ambient.test',
        kind: 'ambient',
        pack: 'pack.slice',
        defaults: { conditions: { all: [] }, weight: 1, provenance: { confidence: 'fictional', sources: [] } },
        variants: [],
      },
      {
        slug: 'night-stars',
        context: 'night',
        culture: 'culture.levant.coastal',
        art: 'art.ugarit.night',
        text: 'A line.',
      },
    )
    expect(entity.id).toBe('ambient.test.night-stars')
    expect(entity.cultures).toEqual(['culture.levant.coastal'])
    expect(entity.beatArt).toEqual(['art.ugarit.night'])
    expect(validateScaffold('ambient', entity)).toEqual([])
  })

  it('refuses count outside the set and malformed variants', async () => {
    const recipe = await readRecipe('ambient-example', process.cwd())
    expect(() => variantBatch(recipe, { count: 0 })).toThrow('positive integer')
    expect(() =>
      variantEntity(recipe, { context: 'day', culture: 'culture.levant.coastal' }),
    ).toThrow('slug')
  })

  it('writes variants only when asked and never overwrites', async () => {
    const root = await tempRoot()
    const recipe = await readRecipe('ambient-example', process.cwd())
    const dry = await writeVariants(recipe, { count: 1, root })
    expect(dry[0]?.wrote).toBe(false)
    await expect(readFile(dry[0]?.path ?? '', 'utf8')).rejects.toThrow()

    const written = await writeVariants(recipe, { count: 1, root, write: true })
    expect(written[0]?.wrote).toBe(true)
    await expect(writeVariants(recipe, { count: 1, root, write: true })).rejects.toThrow(
      'refusing to overwrite',
    )
  })
})

describe('factory gate', () => {
  it('has recipes that are deterministic and free of placeholders', async () => {
    const result = await checkFactory()
    expect(result.problems).toEqual([])
    expect(result.ok).toBe(true)
  })
})
