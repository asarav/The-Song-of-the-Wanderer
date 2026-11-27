import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * A word shown in another script depends on the prose font falling through to a font that
 * has the signs. Without these families the glyphs render as boxes on a machine that has
 * no such font installed by default.
 */
const css = readFileSync(new URL('./theme.css', import.meta.url), 'utf8').replace(/\s+/g, ' ')

const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))
const stack = /font-family: ([^;]+);/.exec(root)?.[1] ?? ''

describe('words in their own script', () => {
  it('gives the prose font historic-script fallbacks', () => {
    expect(stack).toContain("'Segoe UI Historic'")
    expect(stack).toContain("'Noto Sans Cuneiform'")
    expect(stack).toContain("'Noto Sans Linear B'")
    expect(stack).toContain("'Noto Sans Ugaritic'")
  })

  it('keeps them after the reading font and before the generic serif', () => {
    expect(stack.indexOf('Georgia')).toBeGreaterThanOrEqual(0)
    expect(stack.indexOf('Georgia')).toBeLessThan(stack.indexOf("'Segoe UI Historic'"))
    expect(stack.indexOf("'Segoe UI Historic'")).toBeLessThan(stack.lastIndexOf('serif'))
  })

  it('styles the reading so it never competes with the signs', () => {
    expect(css).toContain('.written-script {')
    expect(css).toContain('.written-reading {')
    expect(css).toContain('.written-place {')
  })
})
