import { readdirSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * There is one purse. Every price and the traveler's own money are weighed silver
 * (ADR-0009), so a place that described itself as valuing something else would promise a
 * second balance the rules do not have.
 */
const directory = new URL('../content/packs/slice/destinations/', import.meta.url)

const destinations = readdirSync(directory)
  .filter((name) => name.endsWith('.json'))
  .map(
    (name) =>
      JSON.parse(readFileSync(new URL(name, directory), 'utf8')) as {
        id: string
        currency?: string
      },
  )

describe('one purse of silver', () => {
  it('describes every place as valuing silver', () => {
    expect(destinations.length).toBeGreaterThan(0)
    for (const destination of destinations) {
      expect(destination.currency ?? '', destination.id).toMatch(/silver/i)
    }
  })
})
