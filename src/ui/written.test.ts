import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { WRITTEN_WORDS, writtenFor, writtenForDisplay } from './written'

const codes = (text: string) => [...text].map((sign) => sign.codePointAt(0))

const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')

describe('words shown in their own script', () => {
  it("shows the protagonist's tablet signs with its spelling, not its reconstruction", () => {
    const word = writtenFor('name.aegean.ema-a2')

    expect(word?.script).toBe('𐀁𐀔𐀀')
    expect(codes(word?.script ?? '')).toEqual([0x10001, 0x10014, 0x10000])
    expect(word?.reading).toBe('e-ma-a₂')
    expect(word?.reading).not.toMatch(/Ermahas|Hermahas/)
  })

  it("shows the city's own Ugaritic spelling", () => {
    const word = WRITTEN_WORDS['dest.ugarit']

    expect(codes(word.script)).toEqual([0x1039c, 0x10382, 0x10397, 0x1039a])
    expect(word.reading).toBe('ugrt')
  })

  it('leaves invented names and unknown ids in transliteration', () => {
    expect(writtenFor('char.ugarit.amnit')).toBeUndefined()
    expect(writtenFor(undefined)).toBeUndefined()
    expect(writtenForDisplay('Amnit')).toBeUndefined()
    expect(writtenForDisplay('Kinyras')).toBeUndefined()
  })

  it('finds the protagonist by the display string the name reaches the interface with', () => {
    expect(writtenForDisplay('e-ma-a₂')?.script).toBe('𐀁𐀔𐀀')
  })

  it('is wired into the name and place displays', () => {
    expect(app).toContain('written-script')
    expect(app).toContain('written-reading')
    expect(app).toContain('writtenForDisplay')
    expect(app).toContain('writtenFor(')
  })
})
