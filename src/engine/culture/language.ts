/**
 * Language proficiency.
 *
 * Five tiers (spec §11.3). Exposure and study add XP; the tier is derived from XP, never
 * stored independently of it. Related-language comprehension and per-language thresholds
 * are M7; the slice uses this fixed table.
 */

import { LANGUAGE_TIERS, type LanguageState, type LanguageTier } from '../state'

/** XP required to reach each tier. Index matches `LANGUAGE_TIERS`. */
export const LANGUAGE_THRESHOLDS: Record<LanguageTier, number> = {
  unfamiliar: 0,
  basic: 20,
  conversational: 60,
  fluent: 140,
  deep: 300,
}

export function tierForXp(xp: number): LanguageTier {
  const safeXp = Math.max(0, Math.trunc(xp))
  let tier: LanguageTier = 'unfamiliar'
  for (const candidate of LANGUAGE_TIERS) {
    if (safeXp >= LANGUAGE_THRESHOLDS[candidate]) tier = candidate
  }
  return tier
}

export function tierRank(tier: LanguageTier): number {
  return LANGUAGE_TIERS.indexOf(tier)
}

/** The next tier, or `null` at the top. */
export function nextTier(tier: LanguageTier): LanguageTier | null {
  const index = tierRank(tier)
  const next = LANGUAGE_TIERS[index + 1]
  return next ?? null
}

export function xpToNextTier(state: LanguageState): number | null {
  const next = nextTier(state.tier)
  if (!next) return null
  return Math.max(0, LANGUAGE_THRESHOLDS[next] - state.xp)
}

export interface LanguageProgress {
  language: LanguageState
  tierChanged: boolean
}

/** Add XP and recompute the tier. XP never goes below zero. */
export function addLanguageXp(state: LanguageState, amount: number): LanguageProgress {
  const xp = Math.max(0, state.xp + Math.trunc(amount))
  const tier = tierForXp(xp)
  return { language: { xp, tier }, tierChanged: tier !== state.tier }
}

/**
 * A rough, player-facing comprehension band used by price transparency and dialogue
 * gating. Slice scope: no mutual intelligibility between related languages yet.
 */
export function comprehension(tier: LanguageTier): 'none' | 'fragments' | 'ordinary' | 'full' {
  switch (tier) {
    case 'unfamiliar':
      return 'none'
    case 'basic':
      return 'fragments'
    case 'conversational':
      return 'ordinary'
    case 'fluent':
    case 'deep':
      return 'full'
  }
}
