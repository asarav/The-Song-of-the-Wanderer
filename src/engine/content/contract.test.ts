/**
 * Boundary contract for the `content` module (M1-T05).
 *
 * Imports only the module's public surface, as every other module must. The milestone's
 * promises are the ones asserted here: one schema per entity folder, a registry that
 * indexes by id and answers the DSL's read-only questions, issues that carry a path, and a
 * build that is deterministic.
 */

import { describe, expect, it } from 'vitest'

import {
  ENTITY_SCHEMAS,
  buildContentIndex,
  contentErrorCount,
  createDslContent,
  type EntityFolder,
  type RawPack,
} from '@engine/content'
import { testContent, testPack } from '@engine/testing'

const folders = Object.keys(ENTITY_SCHEMAS) as EntityFolder[]

describe('content module public surface', () => {
  it('publishes one schema for each of the fifteen folders', () => {
    expect(folders).toHaveLength(15)
    for (const folder of folders) {
      expect(typeof ENTITY_SCHEMAS[folder].safeParse).toBe('function')
    }
  })

  it('builds an index from raw pack data with no errors', () => {
    const built = buildContentIndex([testPack()])

    expect(built.issues.filter((issue) => issue.level === 'error')).toEqual([])
    expect(contentErrorCount(built.issues)).toBe(0)
    expect(built.counts.packs).toBe(1)
    expect(built.counts.entities).toBeGreaterThan(0)
  })

  it('indexes every entity by id and by its own map', () => {
    const { index } = buildContentIndex([testPack()])

    expect(index.byId.get('dest.ugarit')?.folder).toBe('destinations')
    expect(index.destinations.get('dest.ugarit')?.name).toBe('Ugarit')
    expect(index.routes.get('route.ugarit-cyprus')?.to).toBe('dest.cyprus')
    expect(index.goods.size).toBeGreaterThan(0)
    expect(index.dialogues.size).toBeGreaterThan(0)
    expect(index.events.size).toBeGreaterThan(0)
    // The fixture pack does not carry a climate; the slice does. The map still exists.
    expect(index.climates).toBeInstanceOf(Map)
  })

  it('answers the DSL questions from the index alone', () => {
    const { index } = buildContentIndex([testPack()])
    const lookup = createDslContent(index)

    expect(lookup.hasCharacter('char.ugarit.amnit')).toBe(true)
    expect(lookup.hasCharacter('char.nowhere')).toBe(false)
    expect(lookup.characterHome('char.ugarit.amnit')).toBe('dest.ugarit')
    expect(lookup.characterHome('char.nowhere')).toBeUndefined()
    expect(lookup.routeExists('route.ugarit-cyprus')).toBe(true)
    expect(lookup.routeExists('route.nowhere')).toBe(false)
    expect(lookup.itemWeight('good.unknown')).toBe(1)
  })

  it('reports every issue with a level, a path and a message', () => {
    const broken: RawPack = {
      manifest: { id: 'pack.broken', contentVersion: 1, requires: [], entities: {} },
      files: [
        { folder: 'goods', file: 'bad.json', data: { id: 'good.bad' } },
        {
          folder: 'dialogues',
          file: 'bad-dialogue.json',
          data: {
            id: 'dlg.bad',
            speaker: 'char.missing',
            start: 'only',
            nodes: { only: { text: 'A line.', choices: [{ text: 'On', next: 'nowhere' }] } },
            provenance: { confidence: 'fictional', sources: [] },
          },
        },
      ],
    }
    const built = buildContentIndex([broken])

    expect(contentErrorCount(built.issues)).toBeGreaterThan(0)
    for (const issue of built.issues) {
      expect(['error', 'warning']).toContain(issue.level)
      expect(issue.path.length).toBeGreaterThan(0)
      expect(issue.message.length).toBeGreaterThan(0)
    }
    const text = built.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')
    expect(text).toMatch(/nowhere/)
    expect(text).toMatch(/goods\/bad\.json/)
  })

  it('builds the same index twice from the same packs', () => {
    const one = buildContentIndex([testPack()])
    const two = buildContentIndex([testPack()])

    expect(two.counts).toEqual(one.counts)
    expect(two.issues).toEqual(one.issues)
    expect([...two.index.byId.keys()]).toEqual([...one.index.byId.keys()])
  })

  it('serves the same content as the shared test fixture', () => {
    const index = testContent()
    expect(index.packs).toEqual(['pack.test'])
    expect(index.destinations.has('dest.ugarit')).toBe(true)
  })
})
