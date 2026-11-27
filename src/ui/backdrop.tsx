/**
 * The world behind the text.
 *
 * One backdrop for the whole app, chosen from what the traveler is doing: a scene takes
 * the place behind the speaker, a place takes its hero, a journey takes the harbor it is
 * making for. The title is the exception: with no place of its own, it cycles the great
 * places of 1230 BCE. Two layers cross-fade so the picture changes without a flash of
 * empty parchment, and the image drifts slowly under a scrim that keeps the prose
 * readable.
 *
 * One picture appears once. Anything the stage is already showing is passed in `avoid`
 * and skipped here, and with no distinct picture left the backdrop stays plain rather
 * than repeating the panel or borrowing another coast's harbor.
 */

import { useEffect, useRef, useState } from 'react'

import { ART, artFor, type ArtAsset } from './art'
import { titleBackdropAt } from './title'

export type BackdropTone = 'ugarit' | 'cyprus'

export interface BackdropInput {
  screen: string
  placeArtId?: string | null
  speakerArtId?: string | null
  journeyArtId?: string | null
  /** Pictures the stage is already showing. The world behind never repeats one. */
  avoid?: readonly (string | null | undefined)[]
}

function fallbackArt(): ArtAsset {
  return ART['art.land.levant'] as ArtAsset
}

/** Which picture belongs behind this screen. Pure, so it is testable without a browser. */
export function backdropFor(input: BackdropInput): ArtAsset | null {
  const avoid = new Set((input.avoid ?? []).filter((id): id is string => Boolean(id)))

  const candidates: (string | null | undefined)[] = []
  if (input.screen === 'scene') candidates.push(input.speakerArtId)
  // At sea the world is the crossing, not the harbor left behind.
  candidates.push(input.journeyArtId, input.placeArtId)

  for (const id of candidates) {
    if (!id || avoid.has(id)) continue
    const art = artFor(id)
    if (art) return art
  }

  // The menu has no place of its own and opens on the coast the journey begins on. Every
  // other screen has a place to name, and no picture is better there than a coast from
  // somewhere else.
  if (input.screen === 'title' && !avoid.has(fallbackArt().id)) return fallbackArt()
  return null
}

/** Ugarit glows ochre; Cyprus cools toward copper and sea-green. */
export function toneFor(art: ArtAsset): BackdropTone {
  return art.id.startsWith('art.cyprus') ? 'cyprus' : 'ugarit'
}

interface Layer {
  id: number
  src: string | null
}

/** How long one title scene holds before the next begins to cross-fade in. */
export const TITLE_BACKDROP_INTERVAL_MS = 9_000

/**
 * The title's scenery. The menu has no single place, so it cycles the great places of
 * 1230 BCE above the name. `Backdrop` keeps the old layer under the new one, so the
 * change is a slow dissolve rather than a blank frame.
 */
export function TitleBackdrop() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(
      () => setStep((current) => current + 1),
      TITLE_BACKDROP_INTERVAL_MS,
    )
    return () => window.clearInterval(timer)
  }, [])

  return <Backdrop art={artFor(titleBackdropAt(step)) ?? fallbackArt()} />
}

export function Backdrop({ art }: { art: ArtAsset | null }) {
  const [layers, setLayers] = useState<Layer[]>(art ? [{ id: 0, src: art.src }] : [])
  const sequence = useRef(0)
  const src = art?.src ?? null

  useEffect(() => {
    setLayers((previous) => {
      if ((previous[previous.length - 1]?.src ?? null) === src) return previous
      sequence.current += 1
      return [...previous, { id: sequence.current, src }].slice(-2)
    })
  }, [src])

  useEffect(() => {
    if (layers.length < 2) return
    const newest = layers[layers.length - 1]
    const timer = window.setTimeout(() => {
      setLayers((previous) => previous.filter((layer) => layer.id === newest?.id))
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [layers])

  return (
    <div
      className={`backdrop tone-${art ? toneFor(art) : 'ugarit'}${
        art?.kind === 'portrait' ? ' is-portrait' : ''
      }`}
      aria-hidden="true"
    >
      {layers.map((layer, position) => (
        <div
          key={layer.id}
          className={position === layers.length - 1 ? 'backdrop-layer is-current' : 'backdrop-layer'}
          style={layer.src ? { backgroundImage: `url("${layer.src}")` } : undefined}
        />
      ))}
      <div className="backdrop-wash" />
      <div className="backdrop-grain" />
    </div>
  )
}
