/**
 * The proper names the prose distinguishes.
 *
 * Two tones only: a place and a person. Everything else stays in the body colour, and
 * matching is case sensitive on purpose — prose says "the market", "the yard" and "the
 * harbor" in lower case, and those are common nouns, while Ugarit, Cyprus and Hannu are
 * names a reader can point at. Presentation only: nothing here reaches the engine or a
 * save.
 */

import type { ContentIndex } from '@engine/content'

import type { NameTerms } from './story'

/**
 * Places beyond the two slice destinations that the slice's own copy names. They are
 * authored already, in `title.ts` and the codex; this list only teaches the highlighter
 * to recognise them.
 */
const NEIGHBOUR_PLACES = ['Alashiya', 'Enkomi', 'Egypt', 'Thebes', 'Giza'] as const

export function nameTerms(index: ContentIndex | null | undefined): NameTerms {
  const places = new Set<string>(NEIGHBOUR_PLACES)
  const people = new Set<string>()

  if (index) {
    for (const destination of index.destinations.values()) places.add(destination.name)
    for (const character of index.characters.values()) people.add(character.name)
  }

  return { places: [...places], people: [...people] }
}
