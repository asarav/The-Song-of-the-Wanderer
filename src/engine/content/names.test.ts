import { describe, expect, it } from 'vitest'

import { testContent } from '../testing'
import {
  characterName,
  factionName,
  goodName,
  languageName,
  placeName,
  subjectName,
} from './names'

const index = testContent()

describe('content display names', () => {
  it('uses authored names for each entity kind', () => {
    expect(characterName(index, 'char.ugarit.amnit')).toBe('Amnit')
    expect(factionName(index, 'faction.ugarit.palace')).toBe('The palace')
    expect(goodName(index, 'good.grain')).toBe('Grain')
    expect(languageName(index, 'lang.akkadian')).toBe('Akkadian')
    expect(placeName(index, 'dest.ugarit')).toBe('Ugarit')
    expect(placeName(index, 'route.ugarit-cyprus')).toBe('Crossing to Cyprus')
  })

  it('falls back to the stable id when an entity is missing', () => {
    expect(characterName(index, 'char.missing')).toBe('char.missing')
    expect(factionName(index, 'faction.missing')).toBe('faction.missing')
    expect(goodName(index, 'good.missing')).toBe('good.missing')
    expect(languageName(index, 'lang.missing')).toBe('lang.missing')
    expect(placeName(index, 'place.missing')).toBe('place.missing')
    expect(subjectName(index, 'subject.missing')).toBe('subject.missing')
  })

  it('resolves a subject in the documented namespace order', () => {
    expect(subjectName(index, 'char.ugarit.amnit')).toBe('Amnit')
    expect(subjectName(index, 'faction.ugarit.palace')).toBe('The palace')
    expect(subjectName(index, 'good.grain')).toBe('Grain')
    expect(subjectName(index, 'dest.ugarit')).toBe('Ugarit')
    expect(subjectName(index, 'route.ugarit-cyprus')).toBe('Crossing to Cyprus')
  })
})