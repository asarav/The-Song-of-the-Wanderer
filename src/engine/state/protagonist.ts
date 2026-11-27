/**
 * The protagonist's canon name (ADR-0006).
 *
 * `display` is the tablet spelling the game shows, including the subscript. `id` is the
 * stable ASCII key used by fixtures, tools and tests; it is never displayed. The two are
 * deliberately separate: the display form is historical typography, the id is a
 * technical convention.
 */
export const PROTAGONIST_NAME = {
  id: 'name.aegean.ema-a2',
  display: 'e-ma-a₂',
} as const
