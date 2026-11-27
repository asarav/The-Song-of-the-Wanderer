import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Layout contract for the paced reader. The widths themselves belong to the browser, so
 * these pin the rules a regression would quietly break: one column when the card is
 * narrow, whole art at a bounded size, no numeric progress, and a touch-sized choice.
 */
const css = readFileSync(new URL('./theme.css', import.meta.url), 'utf8').replace(/\s+/g, ' ')

describe('paced reader layout', () => {
  it('stacks the beat card from its own width, not the window', () => {
    expect(css).toContain(".story { container-type: inline-size; }")
    expect(css).toContain('@container (max-width: 26rem)')
    expect(css).toContain(
      '@container (max-width: 26rem) { .story-beat { grid-template-columns: 1fr;',
    )
  })

  it('keeps whole art at a bounded size in the stacked card', () => {
    expect(css).toContain('.beat-art img { width: auto; max-width: 100%; max-height: 11rem;')
  })

  it('shows reader art whole, at its own ratio', () => {
    // No forced aspect-ratio and no cover-cropping: width/height follow the picture.
    expect(css).toContain('.beat-art img { display: block; width: 100%; height: auto;')
    expect(css).toContain('.passage-art img { display: block; width: auto; max-width: 100%; max-height: 20rem;')
    expect(css).toContain('.hero-art img { display: block; width: 100%; height: auto;')
    expect(css).not.toContain('.beat-art-portrait img { aspect-ratio')
  })

  it('gives a text-only passage the whole width', () => {
    expect(css).toContain('.story-beat-text { grid-template-columns: 1fr; }')
  })

  it('shows progress as dots that wrap as a unit, with no numeric counter rule left', () => {
    expect(css).toContain('.beat-dots .dot.on { background: var(--bronze); }')
    expect(css).toContain('.story-next { display: flex; flex-wrap: wrap;')
    expect(css).not.toContain('.beat-count')
  })

  it('gives choices a comfortable touch target', () => {
    expect(css).toContain('min-height: 2.75rem;')
  })

  it('removes the beat fade outright under reduced motion', () => {
    // A 0.01ms duration still starts at the keyframe's opacity 0, so the first frame
    // would be blank and the content would depend on the animation finishing.
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduce).toContain('.story-beat { animation: none !important; }')
  })

  it('drifts the backdrop only when motion is welcome', () => {
    expect(css).toContain('@keyframes backdrop-drift')
    expect(css).toContain('animation: backdrop-drift 52s ease-in-out infinite alternate;')
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduce).toContain('.backdrop-layer { animation: none !important; transform: none !important; }')
    expect(reduce).toContain('.backdrop-layer { transition: none !important; }')
    expect(reduce).toContain('.stage > section, .stage > article { animation: none !important; }')
  })
})
