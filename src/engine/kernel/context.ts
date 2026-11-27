/**
 * The context a command handler works in.
 *
 * `state` is a private draft: the reducer clones the incoming state before any handler
 * runs, so handlers may write freely without breaking purity.
 */

import type { DslContent } from '../dsl'
import type { ContentIndex } from '../content'
import type { RngCursor } from '../rng'
import type { GameState } from '../state'
import type { DomainEvent } from './events'

export interface KernelContext {
  state: GameState
  index: ContentIndex
  content: DslContent
  rng: RngCursor
  events: DomainEvent[]
}
