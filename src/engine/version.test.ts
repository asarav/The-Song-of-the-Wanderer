import { describe, expect, it } from 'vitest'

import { ENGINE_VERSION, SAVE_FORMAT_VERSION } from './version'

describe('engine version', () => {
  it('exposes an engine version', () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('keeps a positive save format', () => {
    expect(SAVE_FORMAT_VERSION).toBeGreaterThanOrEqual(1)
  })
})
