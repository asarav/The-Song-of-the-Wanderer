/**
 * Structural limits for authored conditions and effects.
 *
 * Content is data, so a pathological nesting depth is a content bug, not a stack
 * overflow. These limits are checked when content is validated, and enforced again
 * during evaluation so a malformed fixture can never crash a save.
 */

export const MAX_CONDITION_DEPTH = 12
export const MAX_CONDITION_NODES = 200
export const MAX_EFFECTS = 100

export interface ConditionSize {
  depth: number
  nodes: number
}

const COMBINATORS = new Set(['all', 'any', 'not'])

function childrenOf(node: unknown): unknown[] {
  if (typeof node !== 'object' || node === null) return []
  const record = node as Record<string, unknown>
  if (Array.isArray(record.all)) return record.all
  if (Array.isArray(record.any)) return record.any
  if ('not' in record) return [record.not]
  return []
}

export function measureCondition(condition: unknown, depth = 1): ConditionSize {
  let maxDepth = depth
  let nodes = 1

  for (const child of childrenOf(condition)) {
    const measured = measureCondition(child, depth + 1)
    maxDepth = Math.max(maxDepth, measured.depth)
    nodes += measured.nodes
  }

  return { depth: maxDepth, nodes }
}

export function measureEffects(effects: readonly unknown[]): ConditionSize {
  return { depth: 1, nodes: effects.length }
}

export function conditionWithinLimits(condition: unknown): boolean {
  const size = measureCondition(condition)
  return size.depth <= MAX_CONDITION_DEPTH && size.nodes <= MAX_CONDITION_NODES
}

export function effectsWithinLimits(effects: readonly unknown[]): boolean {
  return effects.length <= MAX_EFFECTS
}

/** A readable explanation, or `null` when the structure is acceptable. */
export function conditionLimitIssue(condition: unknown): string | null {
  const size = measureCondition(condition)
  if (size.depth > MAX_CONDITION_DEPTH) {
    return `condition nests ${size.depth} levels deep (limit ${MAX_CONDITION_DEPTH})`
  }
  if (size.nodes > MAX_CONDITION_NODES) {
    return `condition has ${size.nodes} nodes (limit ${MAX_CONDITION_NODES})`
  }
  return null
}

export function effectLimitIssue(effects: readonly unknown[]): string | null {
  if (effects.length > MAX_EFFECTS) {
    return `${effects.length} effects in one list (limit ${MAX_EFFECTS})`
  }
  return null
}

export { COMBINATORS }
