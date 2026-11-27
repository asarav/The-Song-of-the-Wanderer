import { describe, expect, it } from 'vitest'

import { placeActionFor } from './place'

describe('place actions', () => {
  it('opens trade at the market and passage on the roads screen', () => {
    expect(placeActionFor('trade')).toEqual({
      screen: 'market',
      label: 'Trade at the market',
    })
    expect(placeActionFor('passage')).toEqual({
      screen: 'routes',
      label: 'Arrange passage',
    })
  })
})
