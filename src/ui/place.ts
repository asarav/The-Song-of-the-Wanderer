/** Copy and destination for the actions a place actually affords. */

import type { PlaceAction } from '@engine/content'

export interface PlaceActionView {
  screen: 'market' | 'routes'
  label: string
}

export function placeActionFor(action: PlaceAction): PlaceActionView {
  if (action === 'trade') return { screen: 'market', label: 'Trade at the market' }
  return { screen: 'routes', label: 'Arrange passage' }
}
