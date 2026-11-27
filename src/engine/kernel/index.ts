/**
 * Public surface of the kernel module.
 *
 * The kernel is the only place that composes the other modules into a command loop.
 * It exports the command and event vocabulary, the reducer, and new-game construction.
 */

export * from './ids'
export * from './events'
export * from './context'
export * from './commands'
export * from './reduce'
export * from './newGame'
