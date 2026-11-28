/**
 * The traveller's own status: identity, purse, load, languages, standing, obligations and
 * deeds, read from the persisted player state and existing read models.
 *
 * Nothing here is a new mechanic and nothing is persisted. It is the one place the player
 * can see the whole of their situation without visiting four separate screens.
 */

import { goodName, placeName, subjectName, type ContentIndex } from '../content'
import { itemWeight } from '../economy'
import { deriveFactions, deriveLanguages } from '../journal'
import type { FactionView, LanguageView } from '../journal'
import { formatDisplayDate } from '../time'
import { difficultyConfig, STAMINA_MAX, type Difficulty, type GameState } from '../state'

export interface SelfGoodView {
  id: string
  name: string
  quantity: number
  weight: number
  protected: boolean
}

export interface SelfObligationView {
  id: string
  name: string
  amount: number
  kind: 'person' | 'faction'
  /** Who carries the obligation, written for the Status screen. */
  direction: 'owes-you' | 'you-owe' | 'faction' | 'faction-owes-you'
}

export interface SelfDeedView {
  id: string
  kind: string
  day: number
  date: string
  placeName: string
  subjectName: string
  consequence?: string
}

export interface SelfReputationView {
  id: string
  name: string
  band: string
}

export interface SelfAfflictionView {
  id: string
  name: string
  severity: 'light' | 'grave'
  description: string
  remedy?: string
  sinceDay: number
}

export interface SelfDifficultyView {
  id: Difficulty
  name: string
  note: string
  hazardShift: number
}

export interface SelfView {
  name: string
  presentation: string
  locationName: string
  travelling: boolean
  date: string
  money: number
  carried: number
  capacity: number
  stamina: number
  staminaMax: number
  difficulty: SelfDifficultyView
  afflictions: SelfAfflictionView[]
  transport: string
  goods: SelfGoodView[]
  languages: LanguageView[]
  factions: FactionView[]
  reputation: SelfReputationView[]
  obligations: SelfObligationView[]
  deeds: SelfDeedView[]
}

const TRANSPORT_LABELS: Record<string, string> = {
  'transport.on-foot': 'on foot',
}

function transportLabel(id: string): string {
  return TRANSPORT_LABELS[id] ?? id.replace(/^transport\./, '').replace(/-/g, ' ')
}

export function deriveSelf(state: GameState, index: ContentIndex): SelfView {
  const goods = state.player.inventory.map((entry) => ({
    id: entry.item,
    name: goodName(index, entry.item),
    quantity: entry.quantity,
    weight: itemWeight(index, entry.item) * entry.quantity,
    protected: entry.protected ?? false,
  }))

  const obligations: SelfObligationView[] = [
    ...Object.entries(state.narrative.relationships)
      .filter(([, relationship]) => relationship.obligation !== 0)
      .map(([id, relationship]) => ({
        id,
        name: subjectName(index, id),
        amount: relationship.obligation,
        kind: 'person' as const,
        direction: relationship.obligation > 0 ? ('owes-you' as const) : ('you-owe' as const),
      })),
    ...Object.entries(state.narrative.factions)
      .filter(([, faction]) => faction.obligation !== 0)
      .map(([id, faction]) => ({
        id,
        name: subjectName(index, id),
        amount: faction.obligation,
        kind: 'faction' as const,
        direction:
          faction.obligation > 0 ? ('faction-owes-you' as const) : ('faction' as const),
      })),
  ]

  const destination = index.destinations.get(state.player.location)

  const afflictions: SelfAfflictionView[] = state.player.afflictions.map((entry) => {
    const definition = index.afflictions.get(entry.id)
    return {
      id: entry.id,
      name: definition?.name ?? entry.id,
      severity: definition?.severity ?? 'light',
      description: definition?.description ?? '',
      remedy: definition?.remedyNote,
      sinceDay: entry.sinceDay,
    }
  })

  const mode = difficultyConfig(state.meta.difficulty)

  return {
    name: state.player.identity.selfName,
    presentation: state.player.identity.presentation,
    locationName: destination?.name ?? placeName(index, state.player.location),
    travelling: !destination,
    date: formatDisplayDate(state.calendar.day),
    money: state.player.money,
    carried: goods.reduce((total, good) => total + good.weight, 0),
    capacity: state.player.capacity,
    stamina: state.player.stamina,
    staminaMax: STAMINA_MAX,
    difficulty: {
      id: mode.id,
      name: mode.name,
      note: mode.note,
      hazardShift: mode.hazardShift,
    },
    afflictions,
    transport: transportLabel(state.player.transport),
    goods,
    languages: deriveLanguages(state, index),
    factions: deriveFactions(state, index),
    reputation: Object.entries(state.player.reputation).map(([id, band]) => ({
      id,
      name: subjectName(index, id),
      band,
    })),
    obligations,
    deeds: [...state.player.deeds].reverse().map((deed) => ({
      id: deed.id,
      kind: deed.kind,
      day: deed.day,
      date: formatDisplayDate(deed.day),
      placeName: placeName(index, deed.place),
      subjectName: subjectName(index, deed.subject),
      consequence: deed.consequence,
    })),
  }
}
