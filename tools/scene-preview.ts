/**
 * See one scene's text and answers without launching the app.
 *
 * Usage:
 *   pnpm scene:preview dlg.ugarit.sibtu.ask
 *   pnpm scene:preview dlg.ugarit.sibtu.ask --flags sibtu.met,carries.sibtu-cloth
 *   pnpm scene:preview dlg.ugarit.sibtu.ask --regard char.ugarit.sibtu=4 --language lang.akkadian=fluent
 */

import { createDslContent } from '../src/engine/content'
import type { KernelContext } from '../src/engine/kernel'
import { RngCursor } from '../src/engine/rng'
import { createInitialState } from '../src/engine/state'
import { deriveScene, startDialogue } from '../src/engine/narrative'
import { loadContent } from './simulate'

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function main(): Promise<void> {
  const id = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  if (!id) {
    process.stderr.write('scene:preview: name a dialogue id\n')
    process.exitCode = 1
    return
  }

  const index = await loadContent()
  const state = createInitialState({
    seed: 'scene-preview',
    location: 'dest.ugarit',
    money: 100,
    capacity: 20,
  })

  for (const flag of (option('--flags') ?? '').split(',').filter(Boolean)) {
    state.player.flags[flag] = true
  }
  for (const pair of (option('--regard') ?? '').split(',').filter(Boolean)) {
    const [character, value] = pair.split('=')
    if (!character) continue
    const trust = Number(value ?? 0)
    state.narrative.relationships[character] = {
      trust,
      affection: 0,
      obligation: 0,
      fear: 0,
      respect: 0,
    }
  }
  for (const pair of (option('--language') ?? '').split(',').filter(Boolean)) {
    const [language, tier] = pair.split('=')
    if (!language) continue
    state.player.languages[language] = {
      xp: 100,
      tier: (tier ?? 'fluent') as 'unfamiliar' | 'basic' | 'conversational' | 'fluent' | 'deep',
    }
  }

  const ctx: KernelContext = {
    state,
    index,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
    events: [],
  }
  const rejected = startDialogue(ctx, id)
  if (rejected) {
    process.stderr.write(`scene:preview: ${rejected}\n`)
    process.exitCode = 1
    return
  }

  const view = deriveScene(state, index, ctx.content)
  if (!view) {
    process.stderr.write('scene:preview: the scene did not open\n')
    process.exitCode = 1
    return
  }

  process.stdout.write(`${view.speakerName ?? ''}\n${view.text}\n\n`)
  process.stdout.write(`node ${view.node}\n`)
  for (const choice of view.choices) {
    process.stdout.write(
      `  [${choice.id ?? '-'}] ${choice.available ? ' ' : 'x'} ${choice.text}${choice.reason ? ` (${choice.reason})` : ''}\n`,
    )
  }
}

void main()
