/**
 * Broken fixtures for the enforcement layer.
 *
 * These objects live only in this test. Each one violates exactly one rule and asserts
 * the message that rule produces. If a gate stops checking, the matching test fails even
 * while the real content is still clean.
 */

import { describe, expect, it } from 'vitest'

import type { CharacterDef, ContentIndex, DialogueDef } from '../src/engine/content'
import { checkDocs } from './docs-check'
import { fingerprintAll, guardProblems } from './content-guard'
import { checkInvariants } from './invariant-check'
import { checkModel } from './model-check'
import { checkPrices } from './price-check'
import { lintProse } from './prose-lint'

function indexOf(parts: {
  characters?: CharacterDef[]
  dialogues?: DialogueDef[]
}): ContentIndex {
  return {
    characters: new Map((parts.characters ?? []).map((entry) => [entry.id, entry])),
    dialogues: new Map((parts.dialogues ?? []).map((entry) => [entry.id, entry])),
    events: new Map(),
    journal: new Map(),
  } as unknown as ContentIndex
}

function character(overrides: Partial<CharacterDef> = {}): CharacterDef {
  return {
    id: 'char.test',
    name: 'Test',
    tier: 'recurring',
    home: 'ugarit',
    dialogue: 'dlg.test',
    wants: [{ id: 'want-test', text: 'Get paid.', stake: 'Bread.', scene: 'dlg.test' }],
    voice: {
      register: 'plain',
      address: 'you',
      tics: [],
      avoid: [],
      sampleLines: ['One.', 'Two.', 'Three.'],
      maxSentenceWords: 22,
    },
    ties: [],
    appearances: ['dlg.test'],
    ...overrides,
  } as unknown as CharacterDef
}

function dialogue(overrides: Partial<DialogueDef> = {}): DialogueDef {
  return {
    id: 'dlg.test',
    speaker: 'char.test',
    start: 'open',
    entries: [],
    scene: {
      goal: 'Get the tax paid.',
      obstacle: 'The clerk does not trust a stranger.',
      turn: 'The clerk names a smaller sum.',
      stakes: 'The gate stays shut.',
      callback: 'flag:seen',
    },
    nodes: {
      open: {
        text: 'A clerk waits with a tally board.',
        choices: [
          {
            id: 'pay',
            intent: 'bargain',
            text: 'Pay the tax.',
            effects: [{ flag: 'seen' }],
          },
        ],
      },
    },
    ...overrides,
  } as unknown as DialogueDef
}

function messages(issues: { level: string; message: string }[]): string[] {
  return issues.map((issue) => issue.message)
}

describe('model:check rejects broken character and scene models', () => {
  it('rejects a recurring character without a voice or a want', () => {
    const characterDef = character({ wants: [], voice: undefined })
    const issues = checkModel(indexOf({ characters: [characterDef], dialogues: [dialogue()] }))
    expect(messages(issues)).toContain('recurring character has no want')
    expect(messages(issues)).toContain('recurring character has no voice profile')
  })

  it('rejects a recurring graph with no scene contract', () => {
    const issues = checkModel(
      indexOf({ characters: [character()], dialogues: [dialogue({ scene: undefined })] }),
    )
    expect(messages(issues)).toContain('recurring scene has no scene contract')
  })

  it('names every missing contract field and the file', () => {
    const issues = checkModel(
      indexOf({
        characters: [character()],
        dialogues: [
          dialogue({
            scene: {
              goal: 'Get the tax paid.',
              obstacle: '',
              turn: '',
              stakes: '',
            } as DialogueDef['scene'],
          }),
        ],
      }),
    )
    expect(issues.some((issue) => issue.entity === 'dlg.test')).toBe(true)
    expect(messages(issues)).toContain('scene contract is missing obstacle')
    expect(messages(issues)).toContain('scene contract is missing turn')
    expect(messages(issues)).toContain('scene contract is missing stakes')
  })

  it('rejects a callback that nothing writes', () => {
    const issues = checkModel(
      indexOf({
        characters: [character()],
        dialogues: [
          dialogue({
            scene: {
              goal: 'Get the tax paid.',
              obstacle: 'The clerk does not trust a stranger.',
              turn: 'The clerk names a smaller sum.',
              stakes: 'The gate stays shut.',
              callback: 'flag:never-written',
            },
          }),
        ],
      }),
    )
    expect(messages(issues)).toContain('callback "flag:never-written" is never written')
  })

  it('rejects an asymmetric kin tie', () => {
    const one = character({
      id: 'char.one',
      ties: [{ character: 'char.two', kind: 'kin' }],
    })
    const two = character({ id: 'char.two', dialogue: undefined, wants: [], voice: undefined })
    const issues = checkModel(
      indexOf({ characters: [one, two], dialogues: [dialogue({ speaker: 'char.one' })] }),
    )
    expect(messages(issues)).toContain('kin tie to char.two is not mirrored')
  })

  it('rejects a recurring scene where every answer is a probe', () => {
    const probe = dialogue({
      nodes: {
        open: {
          text: 'A clerk waits with a tally board.',
          choices: [
            { id: 'what', intent: 'probe', text: 'What is the tax?', effects: [{ flag: 'seen' }] },
            { id: 'why', intent: 'probe', text: 'Why three?', effects: [{ flag: 'seen' }] },
          ],
        },
      },
    })
    const issues = checkModel(indexOf({ characters: [character()], dialogues: [probe] }))
    expect(messages(issues)).toContain(
      'every answer is a probe; the scene does nothing but ask',
    )
  })

  it('rejects a duplicate choice id', () => {
    const duplicate = dialogue({
      nodes: {
        open: {
          text: 'A clerk waits with a tally board.',
          choices: [
            { id: 'same', intent: 'bargain', text: 'Pay.', effects: [{ flag: 'seen' }] },
            { id: 'same', intent: 'refuse', text: 'Refuse.', effects: [{ flag: 'seen' }] },
          ],
        },
      },
    })
    const issues = checkModel(indexOf({ characters: [character()], dialogues: [duplicate] }))
    expect(messages(issues)).toContain('choice ids must be unique within node "open"')
  })

  it('rejects a flag that is written but never read', () => {
    const unread = dialogue({
      nodes: {
        open: {
          text: 'A clerk waits with a tally board.',
          choices: [
            { id: 'pay', intent: 'bargain', text: 'Pay.', effects: [{ flag: 'ghost' }] },
          ],
        },
      },
    })
    const issues = checkModel(indexOf({ characters: [character()], dialogues: [unread] }))
    expect(messages(issues)).toContain(
      'flag is written but never read, and not declared terminal',
    )
  })
})

describe('prose:lint rejects broken prose', () => {
  it('rejects first person outside quotes', () => {
    const issues = lintProse(
      indexOf({ dialogues: [dialogue({ nodes: { open: { text: 'My hands are cold.', choices: [] } } })] }),
    )
    expect(messages(issues)).toContain('first person "My" in second-person narration')
  })

  it('rejects a modern word', () => {
    const issues = lintProse(
      indexOf({
        dialogues: [
          dialogue({ nodes: { open: { text: 'The harbor clock strikes nine.', choices: [] } } }),
        ],
      }),
    )
    expect(messages(issues)).toContain('modern word "clock" in period prose')
  })

  it('rejects an overlong beat', () => {
    const issues = lintProse(
      indexOf({
        dialogues: [
          dialogue({
            nodes: { open: { text: Array.from({ length: 141 }, () => 'word').join(' '), choices: [] } },
          }),
        ],
      }),
    )
    expect(messages(issues)).toContain('beat of 141 words is too long')
  })

  it('rejects a node that offers only questions', () => {
    const issues = lintProse(
      indexOf({
        dialogues: [
          dialogue({
            nodes: {
              open: {
                text: 'A clerk waits.',
                choices: [
                  { id: 'what', intent: 'probe', text: 'What is this?' },
                  { id: 'who', intent: 'probe', text: 'Who are you?' },
                ],
              },
            },
          }),
        ],
      }),
    )
    expect(messages(issues)).toContain('node "open" offers only questions')
  })

  it('rejects a sentence over the speaker ceiling', () => {
    const speaker = character({
      voice: {
        register: 'plain',
        address: 'you',
        tics: [],
        avoid: [],
        sampleLines: ['One.', 'Two.', 'Three.'],
        maxSentenceWords: 5,
      },
    } as unknown as Partial<CharacterDef>)
    const issues = lintProse(
      indexOf({
        characters: [speaker],
        dialogues: [
          dialogue({
            nodes: {
              open: {
                text: '"This sentence is much too long for the speaker."',
                choices: [],
              },
            },
          }),
        ],
      }),
    )
    expect(messages(issues)).toContain("sentence of 9 words exceeds Test's ceiling of 5")
  })
})

describe('price:check rejects uncosted named prices', () => {
  it('rejects five shekels with no money movement', () => {
    const findings = checkPrices(
      indexOf({
        dialogues: [
          dialogue({
            nodes: {
              open: {
                text: 'The fee is five shekels.',
                choices: [{ id: 'pay', intent: 'bargain', text: 'Pay.' }],
              },
            },
          }),
        ],
      }),
      [],
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toBe('names five shekels but the node moves no money')
  })
})

describe('content:guard rejects a mechanics edit without an update', () => {
  it('reports a changed graph against its locked hash and reason', () => {
    const problems = guardProblems(
      { 'dlg.test': 'new-hash' },
      {
        version: 1,
        dialogues: {
          'dlg.test': { hash: 'old-hash', reason: 'original scene', updatedAt: '2026-01-01' },
        },
      },
    )
    expect(problems).toEqual(['dlg.test: mechanics changed since "original scene"'])
  })

  it('accepts the fingerprint of an unchanged graph', () => {
    const index = indexOf({ dialogues: [dialogue()] })
    const current = fingerprintAll(index)
    const problems = guardProblems(current, {
      version: 1,
      dialogues: {
        'dlg.test': { hash: current['dlg.test'] ?? '', reason: 'fixture', updatedAt: '2026-01-01' },
      },
    })
    expect(problems).toEqual([])
  })
})

describe('invariant:check rejects a broken authored invariant', () => {
  it('rejects the expected price when the choice moves nothing', () => {
    const failures = checkInvariants(
      indexOf({
        dialogues: [
          dialogue({
            nodes: {
              open: {
                text: 'The fee is five shekels.',
                choices: [{ id: 'pay', intent: 'bargain', text: 'Pay.' }],
              },
            },
          }),
        ],
      }),
      [
        {
          id: 'gate-tax',
          description: 'The gate tax is five.',
          dialogue: 'dlg.test',
          node: 'open',
          choice: 'pay',
          money: -5,
        },
      ],
    )
    expect(failures).toEqual([
      { id: 'gate-tax', message: 'expected money -5 at open:pay' },
    ])
  })
})

describe('docs:check rejects missing and stale docs', () => {
  it('reports a missing required file, a missing generated table and a stale table', () => {
    const files = new Map<string, string>([
      ['docs/STATUS.md', 'M4b\n'],
      ['docs/TOOLING.md', ''],
      ['docs/design/cast-threads.md', 'old table'],
    ])
    const problems = checkDocs({
      required: ['docs/STATUS.md', 'docs/WORKLOG.md'],
      files,
      generated: new Map([
        ['docs/design/cast-threads.md', 'new table'],
        ['docs/design/facts.md', 'facts'],
      ]),
    })
    expect(problems).toContain('missing required file docs/WORKLOG.md')
    expect(problems).toContain('missing generated file docs/design/facts.md')
    expect(problems).toContain('docs/design/cast-threads.md is stale; run pnpm docs:sync')
    expect(problems).toContain('STATUS.md has no active task line')
    expect(problems).toContain('docs/TOOLING.md does not document model:check')
  })
})
