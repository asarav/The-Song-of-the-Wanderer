/**
 * Read a character's scenes as a script, without a save or a browser.
 *
 * Usage:
 *   pnpm manuscript                         # every dialogue
 *   pnpm manuscript char.ugarit.sibtu       # one character, all their scenes
 *   pnpm manuscript dlg.ugarit.sibtu.ask    # one graph
 */

import { loadContent } from './simulate'

async function main(): Promise<void> {
  const target = process.argv[2]
  const index = await loadContent()

  const dialogues = [...index.dialogues.values()].filter((dialogue) => {
    if (!target) return true
    return (
      dialogue.id === target ||
      dialogue.speaker === target ||
      (index.characters.get(target)?.appearances ?? []).includes(dialogue.id)
    )
  })

  if (dialogues.length === 0) {
    process.stdout.write(`manuscript: nothing matches "${target ?? '(all)'}"\n`)
    process.exitCode = 1
    return
  }

  for (const dialogue of dialogues) {
    const speaker = dialogue.speaker ? index.characters.get(dialogue.speaker) : undefined
    process.stdout.write(`\n========================================\n`)
    process.stdout.write(`${dialogue.id} — ${speaker?.name ?? 'narrator'}\n`)
    if (dialogue.scene) {
      process.stdout.write(
        `goal: ${dialogue.scene.goal}\nobstacle: ${dialogue.scene.obstacle}\nturn: ${dialogue.scene.turn}\nstakes: ${dialogue.scene.stakes}\n`,
      )
    }
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      process.stdout.write(`\n--- ${nodeId} ---\n${node.text}\n`)
      for (const choice of node.choices) {
        process.stdout.write(
          `  > [${choice.id ?? '-'}/${choice.intent ?? '-'}] ${choice.text}${choice.next ? ` -> ${choice.next}` : ''}\n`,
        )
      }
    }
  }
}

void main()
