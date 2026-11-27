/**
 * Exploratory audio catalog.
 *
 * Content and screens name `audio.*` IDs; this table resolves them to files. The
 * licensing ledger is `assets/audio/manifest.json`, which is also the source of this
 * catalog, so a shipped file cannot lose its provenance by being copied into code.
 *
 * The slice uses field recordings for place and weather, and original procedural music
 * and effects. Nothing here claims to reproduce a surviving Bronze Age melody.
 */

import manifest from '../../assets/audio/manifest.json'

export type AudioKind = 'ambience' | 'music' | 'sfx'
export type AudioLicense = 'public-domain' | 'cc0' | 'mixed'

export interface AudioSource {
  name: string
  url: string | null
  author: string
  license: AudioLicense
  modification: string
}

export interface AudioAsset {
  id: string
  kind: AudioKind
  file: string
  src: string
  title: string
  loop: boolean
  volume: number
  environment: string | null
  layers: string[]
  source: string
  sources: AudioSource[]
  license: AudioLicense
  use: string
  reviewStatus: string
  note: string
}

interface Manifest {
  assets: Omit<AudioAsset, 'src'>[]
}

const manifestAssets = (manifest as Manifest).assets
const base = import.meta.env.BASE_URL

/** Public files are served under `public/audio/`; the manifest names the file only. */
function sourcePath(file: string): string {
  return `${base}audio/${file}`
}

export const AUDIO: Record<string, AudioAsset> = Object.fromEntries(
  manifestAssets.map((asset) => [asset.id, { ...asset, src: sourcePath(asset.file) }]),
)

export function audioAsset(id: string | null | undefined): AudioAsset | null {
  if (!id) return null
  return AUDIO[id] ?? null
}

/** Which ambient bed belongs to each authored place. */
const PLACE_AMBIENCE: Record<string, string> = {
  'act.ugarit.market': 'audio.ambient.ugarit.market',
  'act.ugarit.harbour': 'audio.ambient.ugarit.harbour',
  'act.ugarit.palace-gate': 'audio.ambient.ugarit.market',
  'act.ugarit.temple': 'audio.ambient.ugarit.temple',
  'act.ugarit.workshops': 'audio.ambient.ugarit.workshops',
  'act.cyprus.market': 'audio.ambient.cyprus.yard',
  'act.cyprus.harbour': 'audio.ambient.cyprus.yard',
  'act.cyprus.smithy': 'audio.ambient.cyprus.smithy',
  'act.cyprus.inn': 'audio.ambient.cyprus.inn',
}

/** The bed a port uses when no finer place sound applies. */
const DESTINATION_AMBIENCE: Record<string, string> = {
  'dest.ugarit': 'audio.ambient.ugarit.harbour',
  'dest.cyprus': 'audio.ambient.cyprus.yard',
}

const NIGHT_AMBIENCE: Record<string, string> = {
  'dest.ugarit': 'audio.ambient.ugarit.night',
  'dest.cyprus': 'audio.ambient.cyprus.night',
}

const MARKET_AMBIENCE: Record<string, string> = {
  'dest.ugarit': 'audio.ambient.ugarit.market',
  'dest.cyprus': 'audio.ambient.cyprus.yard',
}

const ROUTE_AMBIENCE: Record<string, string> = {
  'dest.ugarit': 'audio.ambient.ugarit.harbour',
  'dest.cyprus': 'audio.ambient.cyprus.yard',
}

const PREGAME_SCREENS = new Set(['title', 'new', 'prologue', 'world', 'credits'])

export interface GameAudioInput {
  screen: string
  destinationId?: string | null
  placeId?: string | null
  /** A scene opened by a night encounter is still after dark. */
  atNight?: boolean
}

export interface GameAudio {
  ambience: AudioAsset | null
  music: AudioAsset | null
}

function firstAudio(...ids: (string | null | undefined)[]): AudioAsset | null {
  for (const id of ids) {
    const asset = audioAsset(id)
    if (asset) return asset
  }
  return null
}

/**
 * Pick the looping beds for the current screen. Place beats destination, and night beats
 * place; a scene keeps the room it is happening in. Pregame screens use open water and
 * the title theme, never a harbor the traveler has not reached.
 */
export function gameAudioFor(input: GameAudioInput): GameAudio {
  const destination = input.destinationId ?? null
  const placeAmbience = input.placeId ? PLACE_AMBIENCE[input.placeId] : undefined
  const destinationAmbience = destination ? DESTINATION_AMBIENCE[destination] : undefined
  const nightAmbience = destination ? NIGHT_AMBIENCE[destination] : undefined
  const marketAmbience = destination ? MARKET_AMBIENCE[destination] : undefined
  const routeAmbience = destination ? ROUTE_AMBIENCE[destination] : undefined
  const temple = input.placeId === 'act.ugarit.temple'

  let ambience: string | null | undefined
  if (PREGAME_SCREENS.has(input.screen)) {
    ambience = 'audio.ambient.sea'
  } else if (input.screen === 'journey') {
    ambience = 'audio.ambient.sea'
  } else if (input.screen === 'night' || input.atNight) {
    ambience = nightAmbience ?? destinationAmbience ?? 'audio.ambient.sea'
  } else if (input.screen === 'market') {
    ambience = marketAmbience ?? destinationAmbience
  } else if (input.screen === 'routes') {
    ambience = routeAmbience ?? destinationAmbience
  } else if (input.screen === 'place' || input.screen === 'scene') {
    ambience = placeAmbience ?? destinationAmbience
  } else {
    ambience = destinationAmbience ?? placeAmbience
  }

  return {
    ambience: firstAudio(ambience),
    music: firstAudio(
      PREGAME_SCREENS.has(input.screen) ? 'audio.music.title' : null,
      temple ? 'audio.music.temple' : null,
    ),
  }
}

/** A handful of actions have a diegetic one-shot; everything else is silent. */
export function sfxForCommand(type: string): AudioAsset | null {
  if (type === 'buy' || type === 'sell') return audioAsset('audio.sfx.balance')
  if (type === 'travel') return audioAsset('audio.sfx.oar')
  return null
}

/** The smithy's first ambience is accompanied by one hammer, not a looped clang. */
export function entrySfxFor(asset: AudioAsset | null): AudioAsset | null {
  if (asset?.id === 'audio.ambient.cyprus.smithy') return audioAsset('audio.sfx.hammer')
  return null
}
