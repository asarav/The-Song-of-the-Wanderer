/**
 * The audio layer. It is presentation only: the game state never learns whether a sound
 * played, and a blocked or muted browser cannot block play.
 *
 * Browsers refuse audible autoplay until the first gesture. The player therefore tries
 * quietly, then resumes on the first pointer or key event; the visible toggle is also the
 * honest answer to "why is it silent?".
 */

import { useEffect, useRef, useState } from 'react'

import { useGameStore } from '@store/gameStore'
import { audioAsset, entrySfxFor, gameAudioFor, sfxForCommand } from './audio'
import {
  AUDIO_MUTED_KEY,
  DEFAULT_AUDIO_MUTED,
  readAudioMuted,
} from './comfort'

const FADE_MS = 900
const MUTE_FADE_MS = 450

let sfxMuted = false

/** Play a one-shot from the catalog. Used by the store cue and by the new-run gate. */
export function playSfx(id: string): void {
  if (sfxMuted || typeof window === 'undefined') return
  const asset = audioAsset(id)
  if (!asset) return
  const audio = new Audio(asset.src)
  audio.volume = Math.min(1, asset.volume)
  void audio.play().catch(() => {
    // A blocked one-shot is not worth interrupting the screen or logging.
  })
}

function fade(audio: HTMLAudioElement, target: number, duration: number): void {
  const start = performance.now()
  const from = audio.volume
  const step = (now: number) => {
    // A frame timestamp can land a hair before `start`; an unclamped progress would
    // push the volume just below zero and make the media element throw.
    const progress = Math.max(0, Math.min(1, (now - start) / duration))
    audio.volume = Math.max(0, Math.min(1, from + (target - from) * progress))
    if (progress < 1) window.requestAnimationFrame(step)
  }
  window.requestAnimationFrame(step)
}

function pauseAfter(audio: HTMLAudioElement, delay: number): number {
  return window.setTimeout(() => {
    audio.pause()
  }, delay)
}

export function AudioPlayer({
  screen,
  destinationId,
  placeId,
  atNight,
}: {
  screen: string
  destinationId?: string | null
  placeId?: string | null
  atNight?: boolean
}) {
  const cue = useGameStore((s) => s.sfx)
  const [muted, setMuted] = useState(() => {
    try {
      return readAudioMuted(typeof window === 'undefined' ? null : window.localStorage)
    } catch {
      return DEFAULT_AUDIO_MUTED
    }
  })
  const selection = gameAudioFor({ screen, destinationId, placeId, atNight })
  const channels = useRef<{
    ambience: HTMLAudioElement | null
    music: HTMLAudioElement | null
  }>({ ambience: null, music: null })
  const timers = useRef<number[]>([])
  const previousAmbience = useRef<string | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIO_MUTED_KEY, String(muted))
    } catch {
      // A blocked store must not break the control.
    }
    sfxMuted = muted
    if (!muted) return

    for (const audio of [channels.current.ambience, channels.current.music]) {
      if (!audio) continue
      fade(audio, 0, MUTE_FADE_MS)
      timers.current.push(pauseAfter(audio, MUTE_FADE_MS + 30))
    }
  }, [muted])

  useEffect(() => {
    const channel = 'ambience' as const
    const asset = selection.ambience
    const current = channels.current[channel]

    if (!asset || muted) {
      if (current) {
        fade(current, 0, FADE_MS)
        timers.current.push(pauseAfter(current, FADE_MS + 30))
        channels.current[channel] = null
      }
      return
    }

    if (current?.dataset.assetId === asset.id) {
      current.volume = asset.volume
      if (current.paused) {
        void current.play().catch(() => {
          // Autoplay is waiting for the gesture listener below.
        })
      }
      return
    }

    const next = new Audio(asset.src)
    next.loop = asset.loop
    next.preload = 'auto'
    next.volume = 0
    next.dataset.assetId = asset.id
    channels.current[channel] = next
    void next.play().catch(() => {
      // Autoplay is waiting for the gesture listener below.
    })
    fade(next, asset.volume, FADE_MS)

    if (current) {
      fade(current, 0, FADE_MS)
      timers.current.push(pauseAfter(current, FADE_MS + 30))
    }
  }, [selection.ambience?.id, muted])

  useEffect(() => {
    const channel = 'music' as const
    const asset = selection.music
    const current = channels.current[channel]

    if (!asset || muted) {
      if (current) {
        fade(current, 0, FADE_MS)
        timers.current.push(pauseAfter(current, FADE_MS + 30))
        channels.current[channel] = null
      }
      return
    }

    if (current?.dataset.assetId === asset.id) {
      current.volume = asset.volume
      if (current.paused) {
        void current.play().catch(() => {
          // Autoplay is waiting for the gesture listener below.
        })
      }
      return
    }

    const next = new Audio(asset.src)
    next.loop = asset.loop
    next.preload = 'auto'
    next.volume = 0
    next.dataset.assetId = asset.id
    channels.current[channel] = next
    void next.play().catch(() => {
      // Autoplay is waiting for the gesture listener below.
    })
    fade(next, asset.volume, FADE_MS)

    if (current) {
      fade(current, 0, FADE_MS)
      timers.current.push(pauseAfter(current, FADE_MS + 30))
    }
  }, [selection.music?.id, muted])

  // One gesture is enough to let the already-created elements play. Keeping the listener
  // installed means a tab that was suspended can recover without a reload.
  useEffect(() => {
    const unlock = () => {
      for (const audio of [channels.current.ambience, channels.current.music]) {
        if (audio?.paused) {
          void audio.play().catch(() => {
            // Still blocked; the next gesture will try again.
          })
        }
      }
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (!cue) return
    const asset = sfxForCommand(cue.command)
    if (asset) playSfx(asset.id)
  }, [cue?.id])

  useEffect(() => {
    const id = selection.ambience?.id ?? null
    const asset = entrySfxFor(selection.ambience)
    if (previousAmbience.current && id && previousAmbience.current !== id && asset) {
      playSfx(asset.id)
    }
    previousAmbience.current = id
  }, [selection.ambience?.id])

  useEffect(
    () => () => {
      for (const audio of [channels.current.ambience, channels.current.music]) audio?.pause()
      for (const timer of timers.current) window.clearTimeout(timer)
    },
    [],
  )

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={!muted}
      aria-label={
        muted ? 'Sound is off. Turn sound on.' : 'Sound is on. Mute sound.'
      }
      onClick={() => setMuted((value) => !value)}
    >
      {muted ? 'Sound off' : 'Sound on'}
    </button>
  )
}

/** Exposed for the new-game gate, which fires before a saved run exists. */
export function playGateSfx(): void {
  playSfx('audio.sfx.gate')
}
