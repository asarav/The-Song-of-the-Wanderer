/**
 * Geometry for the map sketches.
 *
 * Pure string builders over authored 0–100 points: a ridge drawn as a row of peaks, a
 * line for a river or border, and a small walled mark for a city. Presentation only; the
 * engine decides what may be drawn, this decides how a line looks.
 */

export interface SketchPoint {
  x: number
  y: number
}

const round = (value: number): number => Math.round(value * 100) / 100

/** A straight line through the given points, in sketch units. */
export function polylinePath(points: SketchPoint[]): string {
  if (points.length === 0) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${round(point.x)} ${round(point.y)}`)
    .join(' ')
}

/**
 * A ridge of triangular peaks along the authored line. Peaks alternate either side of
 * the line's normal, spaced evenly along each segment, so a sketch of mountains reads as
 * mountains at any length. Deterministic for the same points.
 */
export function peakPath(points: SketchPoint[], spacing = 5, rise = 2.6): string {
  const first = points[0]
  if (!first || points.length < 2) return ''

  const parts: string[] = [`M ${round(first.x)} ${round(first.y)}`]
  let up = true

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]
    const to = points[index]
    if (!from || !to) continue

    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.hypot(dx, dy)
    if (length === 0) continue

    const nx = -dy / length
    const ny = dx / length
    const steps = Math.max(1, Math.round(length / spacing))

    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps
      const x = from.x + dx * t
      const y = from.y + dy * t

      if (up) {
        parts.push(`L ${round(x + nx * rise)} ${round(y + ny * rise)}`)
        parts.push(`L ${round(x)} ${round(y)}`)
      } else {
        parts.push(`L ${round(x)} ${round(y)}`)
      }
      up = !up
    }
  }

  return parts.join(' ')
}

/**
 * A coastline for a known region: an ellipse with a deterministic, gentle irregularity,
 * so the chart reads as land rather than a diagram. Points are 0–100 sketch units.
 */
export function coastPath(
  x: number,
  y: number,
  rx: number,
  ry: number,
  variant = 0,
): string {
  const steps = 20
  const points: SketchPoint[] = []

  for (let index = 0; index < steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2
    const wobble =
      1 +
      Math.sin(angle * 3 + variant * 1.7) * 0.055 +
      Math.cos(angle * 5 - variant * 0.9) * 0.025
    points.push({
      x: x + Math.cos(angle) * rx * wobble,
      y: y + Math.sin(angle) * ry * wobble,
    })
  }

  return `${polylinePath(points)} Z`
}

/**
 * A street from the center of the quarter toward a mark, bowed slightly to one side so a
 * sketch does not read as a spider of straight lines. Points are 0–100 sketch units.
 */
export function localStreetPath(x: number, y: number, bend = 1): string {
  const dx = x - 50
  const dy = y - 50
  const length = Math.hypot(dx, dy)
  if (length === 0) return ''

  const curve = Math.min(7, length * 0.14) * bend
  const controlX = (50 + x) / 2 - (dy / length) * curve
  const controlY = (50 + y) / 2 + (dx / length) * curve
  return `M 50 50 Q ${round(controlX)} ${round(controlY)} ${round(x)} ${round(y)}`
}

/**
 * A small walled mark for a city or port: a block with a raised middle tower, centerd on
 * the point. `scale` grows it for the place the player is standing in.
 */
export function cityPath(x: number, y: number, scale = 1): string {
  const half = 2.6 * scale
  const wall = 1.9 * scale
  const tower = 1.1 * scale

  return [
    `M ${round(x - half)} ${round(y + wall)}`,
    `L ${round(x - half)} ${round(y - wall + tower)}`,
    `L ${round(x - half / 2)} ${round(y - wall + tower)}`,
    `L ${round(x - half / 2)} ${round(y - wall)}`,
    `L ${round(x + half / 2)} ${round(y - wall)}`,
    `L ${round(x + half / 2)} ${round(y - wall + tower)}`,
    `L ${round(x + half)} ${round(y - wall + tower)}`,
    `L ${round(x + half)} ${round(y + wall)}`,
    'Z',
  ].join(' ')
}
