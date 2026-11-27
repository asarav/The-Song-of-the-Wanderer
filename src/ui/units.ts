/**
 * Period units for numbers the player reads. Ugarit weighed its silver and coined none
 * (`docs/design/dossiers/ugarit.md`, "Trade and money"), so prices are shekels of silver
 * and cargo is weighed in minas. Presentation only: the state keeps plain numbers and no
 * save format changes.
 */

export type Unit = 'shekel' | 'mina'

const PLURAL: Record<Unit, string> = {
  shekel: 'shekels',
  mina: 'minas',
}

/** "1 shekel", "8 shekels", "0 minas": the unit follows the count. */
export function countWithUnit(count: number, unit: Unit): string {
  return `${count} ${count === 1 ? unit : PLURAL[unit]}`
}

export function shekels(count: number): string {
  return countWithUnit(count, 'shekel')
}

export function minas(count: number): string {
  return countWithUnit(count, 'mina')
}
