import { describe, expect, it } from 'vitest'

import { minas, shekels } from './units'

describe('period units', () => {
  it.each([
    [0, '0 shekels'],
    [1, '1 shekel'],
    [8, '8 shekels'],
    [40, '40 shekels'],
  ])('reads %i of silver as %s', (count, expected) => {
    expect(shekels(count)).toBe(expected)
  })

  it.each([
    [0, '0 minas'],
    [1, '1 mina'],
    [3, '3 minas'],
    [20, '20 minas'],
  ])('reads %i of cargo as %s', (count, expected) => {
    expect(minas(count)).toBe(expected)
  })
})
