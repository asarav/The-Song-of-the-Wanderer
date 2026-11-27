import { describe, expect, it } from 'vitest'

import { cityPath, coastPath, localStreetPath, peakPath, polylinePath } from './sketch'

const numbers = (path: string): number[] =>
  (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)

describe('polylinePath', () => {
  it('starts at the first authored point and visits the rest in order', () => {
    expect(
      polylinePath([
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 35 },
      ]),
    ).toBe('M 10 20 L 30 40 L 50 35')
  })

  it('has no path without points', () => {
    expect(polylinePath([])).toBe('')
  })
})

describe('peakPath', () => {
  const ridge = [
    { x: 20, y: 70 },
    { x: 30, y: 50 },
    { x: 60, y: 50 },
  ]

  it('starts at the first point and ends at the last', () => {
    const path = peakPath(ridge)
    const values = numbers(path)

    expect(path.startsWith('M 20 70')).toBe(true)
    expect(values.slice(-2)).toEqual([60, 50])
  })

  it('adds peaks beyond the authored points', () => {
    const path = peakPath(ridge)

    expect(path.split('L').length).toBeGreaterThan(ridge.length + 1)
  })

  it('puts some peaks off the line itself', () => {
    const onLine = new Set(ridge.map((point) => `${point.x},${point.y}`))
    const values = numbers(peakPath(ridge))
    const drawn: string[] = []

    for (let index = 0; index < values.length; index += 2) {
      drawn.push(`${values[index]},${values[index + 1]}`)
    }

    expect(drawn.some((point) => !onLine.has(point))).toBe(true)
  })

  it('is deterministic and needs two points', () => {
    expect(peakPath(ridge)).toBe(peakPath(ridge))
    expect(peakPath([{ x: 10, y: 10 }])).toBe('')
  })
})

describe('coastPath', () => {
  it('closes a deterministic coast around its centre', () => {
    const path = coastPath(50, 50, 20, 14)
    const values = numbers(path)
    const xs = values.filter((_, index) => index % 2 === 0)

    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(Math.min(...xs)).toBeLessThan(32)
    expect(Math.max(...xs)).toBeGreaterThan(68)
    expect(path).toBe(coastPath(50, 50, 20, 14))
  })

  it('gives each region a slightly different shoreline', () => {
    expect(coastPath(50, 50, 20, 14, 1)).not.toBe(coastPath(50, 50, 20, 14, 2))
  })
})

describe('localStreetPath', () => {
  it('leaves the centre for the mark and bends on a quadratic', () => {
    const path = localStreetPath(70, 30)

    expect(path.startsWith('M 50 50 Q ')).toBe(true)
    expect(path.endsWith(' 70 30')).toBe(true)
    expect(path).toBe(localStreetPath(70, 30))
  })

  it('has no street when the mark sits at the centre', () => {
    expect(localStreetPath(50, 50)).toBe('')
  })
})

describe('cityPath', () => {
  it('draws a closed mark centerd on its point', () => {
    const path = cityPath(50, 50)
    const values = numbers(path)
    const xs = values.filter((_, index) => index % 2 === 0)
    const ys = values.filter((_, index) => index % 2 === 1)

    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(Math.min(...xs)).toBeLessThan(50)
    expect(Math.max(...xs)).toBeGreaterThan(50)
    expect(Math.min(...ys)).toBeLessThan(50)
    expect(Math.max(...ys)).toBeGreaterThan(50)
  })

  it('grows with its scale and stays deterministic', () => {
    const small = numbers(cityPath(50, 50))
    const large = numbers(cityPath(50, 50, 2))

    expect(Math.max(...large) - Math.min(...large)).toBeGreaterThan(
      Math.max(...small) - Math.min(...small),
    )
    expect(cityPath(50, 50)).toBe(cityPath(50, 50))
  })
})
