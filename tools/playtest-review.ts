/**
 * Automated playtest review.
 *
 * This is the deterministic pre-pass for the playtester agent. It replays checked-in
 * scenarios and reads the authored content, then emits evidence for the same dimensions a
 * human session reports: clarity, confusion, character interaction, mechanics, friction,
 * emotional tone, enjoyment proxies and inconsistencies.
 *
 * It is deliberately honest about its limits: a scenario is not a played session. It can
 * find contradictions, repeated scenes, invisible changes and pacing candidates. It
 * cannot see the interface, hear the delivery, or decide whether the game is fun.
 *
 * Usage:
 *   pnpm playtest:review
 *   pnpm playtest:review -- --persona helper
 *   pnpm playtest:review -- --scenario slice-sibtu-paid
 *   pnpm playtest:review -- --json
 *   pnpm playtest:review -- --strict
 *   pnpm playtest:review -- --out /tmp/review.md
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  characterName,
  goodName,
  placeName,
  type ContentIndex,
  type DialogueDef,
  type DialogueNodeDef,
} from '../src/engine/content'
import { splitBeats } from '../src/engine/text/beats'
import type { DomainEvent } from '../src/engine/kernel'
import type { Scenario, ScenarioResult, ScenarioStep } from '../src/engine/testing'
import { runScenario } from '../src/engine/testing'
import { checkModel, type ModelIssue, type TerminalFlag } from './model-check'
import { lintProse, type ProseIssue } from './prose-lint'
import { loadContent, loadScenario, SCENARIO_ROOT } from './simulate'

export type ReviewCategory =
  | 'clarity'
  | 'confusion'
  | 'character'
  | 'mechanics'
  | 'friction'
  | 'tone'
  | 'enjoyment'
  | 'inconsistency'

export type FindingLevel = 'note' | 'warn' | 'error'

interface ReviewNote {
  category: ReviewCategory
  title: string
  where: string
  source?: string
}

export interface ReviewFinding extends ReviewNote {
  level: FindingLevel
  evidence: string
}

export interface AcceptedObservation extends ReviewNote {
  rationale: string
}

export interface ToneCounts {
  warm: number
  tense: number
  grief: number
  sensory: number
}

export interface SceneEvidence {
  dialogue: string
  node: string
  speaker: string | null
  speakerName: string
  beats: number
  choices: number
  tone: ToneCounts
}

export interface RunReview {
  id: string
  seed: string
  ok: boolean
  steps: number
  accepted: number
  rejected: { step: number; label: string; reason: string }[]
  final: {
    location: string
    day: number
    money: number
    journals: number
    promisesOpen: number
    charactersMet: number
  }
  firstChoiceStep: number | null
  firstSceneStep: number | null
  /** Human-readable actions a session report can retrace without re-reading the scenario. */
  beats: string[]
  scenes: SceneEvidence[]
  repeatedScenes: { key: string; count: number }[]
  metrics: {
    choices: number
    meaningfulChoices: number
    probeChoices: number
    durableChoices: number
    characterScenes: number
    characters: string[]
    destinations: number
    tradeActions: number
    journalEntries: number
    relationshipChanges: number
    regardChanges: number
    factionChanges: number
    promisesOpened: number
    promisesSettled: number
    languageTiers: number
    daysAdvanced: number
  }
  findings: ReviewFinding[]
  acceptedObservations: AcceptedObservation[]
}

export interface ReviewResult {
  label: string
  persona?: string
  runs: RunReview[]
  contentFindings: ReviewFinding[]
  scenarioIds: string[]
}

const CATEGORY_ORDER: ReviewCategory[] = [
  'clarity',
  'confusion',
  'character',
  'mechanics',
  'friction',
  'tone',
  'enjoyment',
  'inconsistency',
]

const PERSONA_SCENARIOS: Record<string, string[]> = {
  trader: ['slice-ugarit-day', 'slice-crossing', 'slice-cargo-hold', 'slice-cyprus-counter'],
  curious: ['slice-ugarit-day', 'slice-recurring', 'slice-cyprus-return', 'slice-palace-errand'],
  helper: ['slice-sibtu-paid', 'slice-sibtu-kept', 'slice-sibtu-news', 'slice-refugee'],
}

const WARM_WORDS = [
  'smile',
  'smiled',
  'laugh',
  'laughed',
  'warm',
  'kind',
  'gentle',
  'thanks',
  'welcome',
  'share',
  'shared',
  'bread',
  'soft',
  'hand',
  'hands',
  'home',
  'friend',
]

const TENSE_WORDS = [
  'hard',
  'cold',
  'sharp',
  'silence',
  'fear',
  'blood',
  'debt',
  'threat',
  'toll',
  'watch',
  'guard',
  'angry',
  'strike',
  'blade',
  'seal',
  'closed',
]

const GRIEF_WORDS = [
  'weep',
  'wept',
  'grief',
  'loss',
  'lost',
  'dead',
  'death',
  'grave',
  'ash',
  'alone',
  'missing',
  'hunger',
]

const SENSORY_WORDS = [
  'salt',
  'smoke',
  'copper',
  'oil',
  'dust',
  'wind',
  'light',
  'dark',
  'stone',
  'wool',
  'clay',
  'harbour',
  'harbor',
  'market',
  'kiln',
  'loom',
  'sea',
]

function countWords(text: string, words: readonly string[]): number {
  const lower = text.toLowerCase()
  let total = 0
  for (const word of words) {
    const matches = lower.match(new RegExp(`\\b${word}\\b`, 'g'))
    total += matches?.length ?? 0
  }
  return total
}

export function toneOf(text: string): ToneCounts {
  return {
    warm: countWords(text, WARM_WORDS),
    tense: countWords(text, TENSE_WORDS),
    grief: countWords(text, GRIEF_WORDS),
    sensory: countWords(text, SENSORY_WORDS),
  }
}

function speakerLabel(index: ContentIndex, id: string | undefined): string {
  if (!id) return 'narrator'
  return characterName(index, id)
}

function entityPath(index: ContentIndex, id: string): string | undefined {
  return index.byId.get(id)?.path
}

function speakerOf(dialogue: DialogueDef): string | null {
  return dialogue.speaker ?? null
}

function sceneKey(dialogue: string, node: string): string {
  return `${dialogue}:${node}`
}

function labelOfStep(step: ScenarioStep): string {
  if (!step.command) return step.kind
  const command = step.command
  switch (command.type) {
    case 'chooseChoice':
      return `choose ${command.dialogue ?? '?'}:${command.node ?? '?'}/${command.choiceId}`
    case 'travel':
      return `travel ${command.route} (${command.mode})`
    case 'talkTo':
      return `talk to ${command.character}`
    case 'buy':
    case 'sell':
      return `${command.type} ${command.quantity} ${command.item}`
    case 'advanceTime':
    case 'rest':
    case 'work':
      return `${command.type} ${command.days}d`
    default:
      return command.type
  }
}

function dialogueForCommand(
  index: ContentIndex,
  step: ScenarioStep,
): { dialogue: DialogueDef; node: DialogueNodeDef; choiceId: string } | null {
  const command = step.command
  if (!command || command.type !== 'chooseChoice') return null
  const candidates = command.dialogue
    ? [index.dialogues.get(command.dialogue)]
    : [...index.dialogues.values()]
  for (const dialogue of candidates) {
    if (!dialogue) continue
    const node = command.node ? dialogue.nodes[command.node] : undefined
    if (node) return { dialogue, node, choiceId: command.choiceId }
    if (!command.node) {
      for (const value of Object.values(dialogue.nodes)) {
        if (value.choices.some((choice) => choice.id === command.choiceId)) {
          return { dialogue, node: value, choiceId: command.choiceId }
        }
      }
    }
  }
  return null
}

function choiceHasDurableValue(choice: DialogueNodeDef['choices'][number]): boolean {
  return Boolean(choice.effects?.length || choice.journal)
}

function choiceHasAnyValue(choice: DialogueNodeDef['choices'][number]): boolean {
  return choiceHasDurableValue(choice) || Boolean(choice.next)
}

function hasCondition(choice: DialogueNodeDef['choices'][number]): boolean {
  return Boolean(choice.conditions)
}

/** A presentation count is what a repeated conversation looks like from outside. */
function presentedScenes(result: ScenarioResult): string[] {
  const keys: string[] = []
  for (const step of result.steps) {
    for (const event of step.events) {
      if (event.type === 'DialoguePresented') keys.push(sceneKey(event.dialogue, event.node))
    }
  }
  return keys
}

export function analyseRun(result: ScenarioResult, index: ContentIndex): RunReview {
  const keys = presentedScenes(result)
  const counts = new Map<string, number>()
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)

  const scenes: SceneEvidence[] = []
  for (const key of counts.keys()) {
    const [dialogueId, nodeId] = key.split(':')
    const dialogue = dialogueId ? index.dialogues.get(dialogueId) : undefined
    const node = dialogue && nodeId ? dialogue.nodes[nodeId] : undefined
    if (!dialogue || !node) continue
    const speaker = speakerOf(dialogue)
    scenes.push({
      dialogue: dialogue.id,
      node: nodeId ?? '',
      speaker,
      speakerName: speakerLabel(index, speaker ?? undefined),
      beats: splitBeats(node.text).length,
      choices: node.choices.length,
      tone: toneOf(node.text),
    })
  }

  const rejected = result.steps
    .filter((step) => !step.accepted)
    .map((step) => ({
      step: step.index,
      label: labelOfStep(step),
      reason: step.reason ?? 'rejected',
    }))

  const selectedChoices: {
    step: ScenarioStep
    choice: DialogueNodeDef['choices'][number]
    dialogue: DialogueDef
  }[] = []
  for (const step of result.steps) {
    if (!step.accepted) continue
    const found = dialogueForCommand(index, step)
    if (!found) continue
    const choice = found.node.choices.find((entry) => entry.id === found.choiceId)
    if (choice) selectedChoices.push({ step, choice, dialogue: found.dialogue })
  }

  const selectedByStep = new Map(selectedChoices.map((entry) => [entry.step.index, entry.choice]))
  const beats: string[] = []
  for (const step of result.steps) {
    if (!step.accepted) continue
    const command = step.command
    if (!command) continue
    const choice = selectedByStep.get(step.index)
    if (choice) {
      beats.push(`“${choice.text}”`)
      continue
    }
    if (command.type === 'travel') {
      const route = index.routes.get(command.route)
      const mode = route?.modes.find((entry) => entry.id === command.mode)
      beats.push(`Travel ${route?.name ?? command.route}${mode ? ` by ${mode.name}` : ''}`)
    } else if (command.type === 'talkTo') {
      beats.push(`Talk to ${speakerLabel(index, command.character)}`)
    } else if (command.type === 'buy' || command.type === 'sell') {
      const item = goodName(index, command.item)
      beats.push(`${command.type === 'buy' ? 'Buy' : 'Sell'} ${command.quantity} ${item}`)
    } else if (
      command.type === 'rest' ||
      command.type === 'work' ||
      command.type === 'advanceTime'
    ) {
      beats.push(
        `${command.type === 'rest' ? 'Rest' : command.type === 'work' ? 'Work' : 'Wait'} ${command.days} day${command.days === 1 ? '' : 's'}`,
      )
    } else if (command.type === 'resolveEncounter') {
      beats.push(`Resolve encounter ${command.choice + 1}`)
    }
    if (beats.length >= 18) break
  }

  const events = result.steps.flatMap((step) => step.events)
  const relationshipChanges = events.filter((event) => event.type === 'RelationshipChanged')
  const regardChanges = events.filter((event) => event.type === 'RegardChanged')
  const factionChanges = events.filter((event) => event.type === 'FactionChanged')
  const promisesOpened = events.filter((event) => event.type === 'PromiseOpened')
  const promisesSettled = events.filter((event) => event.type === 'PromiseSettled')
  const languageTiers = events.filter(
    (event) => event.type === 'LanguageXpGained' && event.tierChanged,
  )
  const daysAdvanced = events
    .filter(
      (event): event is Extract<DomainEvent, { type: 'TimeAdvanced' }> =>
        event.type === 'TimeAdvanced',
    )
    .reduce((sum, event) => sum + event.days, 0)

  const characters = [
    ...new Set(
      scenes
        .map((scene) => scene.speaker)
        .filter((speaker): speaker is string => speaker !== null),
    ),
  ]
  const firstChoice = result.steps.find(
    (step) => step.accepted && step.command?.type === 'chooseChoice',
  )
  const firstScene = result.steps.find((step) => step.eventTypes.includes('DialoguePresented'))

  const findings: ReviewFinding[] = []
  const accepted: AcceptedObservation[] = []

  if (!result.ok) {
    for (const failure of result.failures) {
      findings.push({
        category: 'mechanics',
        level: 'error',
        title: 'Scenario assertion failed',
        where: `${result.id}${failure.step === undefined ? '' : ` step ${failure.step}`}`,
        evidence: `${failure.path}: ${failure.message}`,
      })
    }
  }

  for (const step of rejected) {
    findings.push({
      category: 'mechanics',
      level: 'error',
      title: 'Action rejected',
      where: `${result.id} step ${step.step} · ${step.label}`,
      evidence: step.reason,
    })
  }

  for (const step of result.steps) {
    for (const event of step.events) {
      if (event.type === 'EffectClamped') {
        if (event.effect === 'stamina' && event.requested > 0 && event.applied === 0) {
          accepted.push({
            category: 'mechanics',
            title: 'Rest at full stamina is clamped',
            where: `${result.id} step ${step.index}`,
            rationale: 'The traveller was already at maximum stamina; the clamp is the guard working, not a content defect.',
            source: 'src/engine/dsl/effects.ts',
          })
        } else {
          findings.push({
            category: 'mechanics',
            level: 'warn',
            title: 'Effect clamped',
            where: `${result.id} step ${step.index}`,
            evidence: `${event.effect} requested ${event.requested}, applied ${event.applied}: ${event.reason}`,
          })
        }
      } else if (event.type === 'EffectSkipped') {
        findings.push({
          category: 'mechanics',
          level: 'warn',
          title: 'Effect skipped',
          where: `${result.id} step ${step.index}`,
          evidence: `${event.effect}: ${event.reason}`,
        })
      } else if (event.type === 'JourneyCollapsed') {
        findings.push({
          category: 'mechanics',
          level: 'warn',
          title: 'Journey collapsed',
          where: `${result.id} step ${step.index}`,
          evidence: `route ${event.route} ended at ${event.origin}`,
        })
      }
    }
  }

  if (firstChoice && firstChoice.index > 5) {
    findings.push({
      category: 'friction',
      level: 'warn',
      title: 'Long runway before the first choice',
      where: `${result.id}`,
      evidence: `the first accepted choice is step ${firstChoice.index}; ${firstChoice.index} actions happen before the player can choose`,
    })
  }

  if (firstScene && firstChoice && firstChoice.index - firstScene.index > 6) {
    findings.push({
      category: 'friction',
      level: 'note',
      title: 'Many screens between first scene and first choice',
      where: `${result.id}`,
      evidence: `scene opens at step ${firstScene.index}, first choice at ${firstChoice.index}`,
    })
  }

  for (const [key, count] of counts) {
    if (count <= 1) continue
    const [dialogueId, nodeId] = key.split(':')
    const declaredEntry = index.dialogues
      .get(dialogueId ?? '')
      ?.entries?.some((entry) => entry.node === nodeId)
    if (declaredEntry) {
      accepted.push({
        category: 'friction',
        title: 'Repeated scene is a declared entry',
        where: `${result.id} · ${key}`,
        rationale: `presented ${count} times because the scenario deliberately reopens a gated repeat entry; the entry is authored, not a loop without a gate.`,
        source: entityPath(index, dialogueId ?? ''),
      })
    } else {
      findings.push({
        category: 'friction',
        level: 'warn',
        title: 'Scene presented more than once',
        where: `${result.id} · ${key}`,
        evidence: `presented ${count} times in one run; a repeat needs a shorter entry or a gate`,
        source: entityPath(index, dialogueId ?? ''),
      })
    }
  }

  for (const scene of scenes) {
    if (scene.beats > 6) {
      findings.push({
        category: 'friction',
        level: 'note',
        title: 'Long scene before the next decision',
        where: `${result.id} · ${sceneKey(scene.dialogue, scene.node)}`,
        evidence: `${scene.beats} prose beats; check whether the player can act sooner`,
        source: entityPath(index, scene.dialogue),
      })
    }
  }

  const openPromises = result.finalState.narrative.promises.filter(
    (promise) => promise.status === 'open',
  )
  for (const promise of openPromises) {
    accepted.push({
      category: 'inconsistency',
      title: 'Open promise is a live thread, not a defect',
      where: `${result.id} · ${promise.character}`,
      rationale: `${promise.text}${promise.dueDay === undefined ? '' : ` (due day ${promise.dueDay})`} remains open at the end of the replay. An open promise is a durable record the journal carries forward; settlement is a separate authored beat.`,
      source: 'src/engine/state/schema.ts',
    })
  }

  const silentRegard = new Map<string, number[]>()
  for (const step of result.steps) {
    const changed = step.events.filter((event) => event.type === 'RelationshipChanged')
    const announced = step.events.some((event) => event.type === 'RegardChanged')
    if (changed.length === 0 || announced) continue
    for (const event of changed) {
      silentRegard.set(event.character, [...(silentRegard.get(event.character) ?? []), step.index])
    }
  }
  for (const [character, steps] of silentRegard) {
    accepted.push({
      category: 'character',
      title: 'Below-band regard moves are intentionally quiet',
      where: `${result.id} · ${speakerLabel(index, character)}`,
      rationale: `${plural(steps.length, 'move')} at ${steps.length === 1 ? 'step' : 'steps'} ${steps.join(', ')} changed a dimension without crossing a band. Regard bands are the player-facing threshold by design; the scene carries the smaller reaction, and announcing every +1 would turn regard into a score popup.`,
      source: 'src/store/gameStore.ts',
    })
  }

  if (factionChanges.length > 0) {
    accepted.push({
      category: 'character',
      title: 'Faction moves are announced by the store',
      where: `${result.id}`,
      rationale: `${plural(factionChanges.length, 'faction change')} now reach the player through the store's faction confirmation; the Factions screen remains the detailed record.`,
      source: 'src/store/gameStore.ts',
    })
  }

  const finalCharacters = Object.keys(result.finalState.knowledge.characterIndex).length
  const location = result.finalState.player.location

  return {
    id: result.id,
    seed: result.seed,
    ok: result.ok,
    steps: result.steps.length,
    accepted: result.steps.filter((step) => step.accepted).length,
    rejected,
    final: {
      location,
      day: result.finalState.calendar.day,
      money: result.finalState.player.money,
      journals: result.finalState.knowledge.journalEntries.length,
      promisesOpen: openPromises.length,
      charactersMet: finalCharacters,
    },
    firstChoiceStep: firstChoice?.index ?? null,
    firstSceneStep: firstScene?.index ?? null,
    beats,
    scenes,
    repeatedScenes: [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key, count]) => ({ key, count })),
    metrics: {
      choices: selectedChoices.length,
      meaningfulChoices: selectedChoices.filter(
        ({ choice }) => choice.intent !== undefined && choice.intent !== 'probe',
      ).length,
      probeChoices: selectedChoices.filter(({ choice }) => choice.intent === 'probe').length,
      durableChoices: selectedChoices.filter(({ choice }) => choiceHasDurableValue(choice)).length,
      characterScenes: scenes.filter((scene) => scene.speaker !== null).length,
      characters,
      destinations: new Set(
        result.steps
          .flatMap((step) => step.events)
          .filter((event) => event.type === 'JourneyArrived')
          .map((event) => event.destination),
      ).size,
      tradeActions: result.steps.filter(
        (step) => step.command?.type === 'buy' || step.command?.type === 'sell',
      ).length,
      journalEntries: result.finalState.knowledge.journalEntries.length,
      relationshipChanges: relationshipChanges.length,
      regardChanges: regardChanges.length,
      factionChanges: factionChanges.length,
      promisesOpened: promisesOpened.length,
      promisesSettled: promisesSettled.length,
      languageTiers: languageTiers.length,
      daysAdvanced,
    },
    findings,
    acceptedObservations: accepted,
  }
}

function modelFindings(issues: ModelIssue[]): ReviewFinding[] {
  return issues.map((issue) => ({
    category: issue.message.includes('mystery') ? 'confusion' : 'inconsistency',
    level: issue.level === 'error' ? 'error' : 'warn',
    title: 'Model check',
    where: issue.entity,
    evidence: issue.message,
    ...(issue.source ? { source: issue.source } : {}),
  }))
}

function proseFindings(issues: ProseIssue[]): ReviewFinding[] {
  return issues.map((issue) => ({
    category: issue.message.includes('mystery')
      ? 'confusion'
      : issue.message.includes('interview')
        ? 'character'
        : 'clarity',
    level: issue.level === 'error' ? 'error' : 'warn',
    title: 'Prose lint',
    where: `${issue.entity}${issue.node ? `:${issue.node}` : ''}`,
    evidence: issue.message,
    ...(issue.source ? { source: issue.source } : {}),
  }))
}

/**
 * Content-wide findings that are not tied to one replayed run. They are intentionally
 * few and actionable; the authoritative gates still own errors like dead choices.
 */
export function contentFindings(index: ContentIndex): ReviewFinding[] {
  const findings: ReviewFinding[] = []

  for (const dialogue of index.dialogues.values()) {
    const source = entityPath(index, dialogue.id)
    for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
      const where = `${dialogue.id}:${nodeId}`
      const hiddenConditions = node.choices.filter(
        (choice) => hasCondition(choice) && !choice.unavailableNote,
      )
      if (hiddenConditions.length > 0) {
        findings.push({
          category: 'confusion',
          level: 'warn',
          title: 'Unavailable answer has no player-facing reason',
          where,
          evidence: hiddenConditions
            .slice(0, 3)
            .map((choice) => `"${choice.text}"`)
            .join('; '),
          ...(source ? { source } : {}),
        })
      }

      if (node.choices.length > 6) {
        findings.push({
          category: 'confusion',
          level: 'note',
          title: 'Many answers at one node',
          where,
          evidence: `${node.choices.length} choices; check whether the player must scan instead of decide`,
          ...(source ? { source } : {}),
        })
      }

      for (const choice of node.choices) {
        if (
          (choice.intent === 'help' || choice.intent === 'bargain') &&
          !choiceHasAnyValue(choice) &&
          !dialogue.nodes[nodeId]?.nextDialogue
        ) {
          findings.push({
            category: 'character',
            level: 'warn',
            title: 'A consequential intent leaves no record',
            where: `${where}/${choice.id ?? choice.text}`,
            evidence: `"${choice.text}" is tagged ${choice.intent}, but has no effect, journal, or next node`,
            ...(source ? { source } : {}),
          })
        }

        const number = choice.text.match(/\b\d+\b/)
        if (number && !choice.effects?.some((effect) => 'money' in effect)) {
          findings.push({
            category: 'clarity',
            level: 'note',
            title: 'Number in answer has no money effect',
            where: `${where}/${choice.id ?? choice.text}`,
            evidence: `"${choice.text}" names ${number[0]}; check that it is a quote, not a price`,
            ...(source ? { source } : {}),
          })
        }
      }
    }
  }

  for (const character of index.characters.values()) {
    if (character.tier !== 'major' && character.tier !== 'recurring') continue
    const scenes = [...index.dialogues.values()].filter(
      (dialogue) => dialogue.speaker === character.id,
    )
    const durable = scenes.some((dialogue) =>
      Object.values(dialogue.nodes).some((node) =>
        node.choices.some((choice) => choiceHasDurableValue(choice)),
      ),
    )
    if (!durable) {
      findings.push({
        category: 'character',
        level: 'note',
        title: 'Recurring character has no durable choice',
        where: character.id,
        evidence: `${scenes.length} scene(s) by ${character.name}; none leaves an effect or journal entry`,
        ...(entityPath(index, character.id) ? { source: entityPath(index, character.id) } : {}),
      })
    }
  }

  return findings
}

function aggregateMetrics(runs: RunReview[]) {
  const sum = (pick: (run: RunReview) => number) =>
    runs.reduce((total, run) => total + pick(run), 0)
  const characters = new Set(runs.flatMap((run) => run.metrics.characters))
  return {
    runs: runs.length,
    choices: sum((run) => run.metrics.choices),
    meaningfulChoices: sum((run) => run.metrics.meaningfulChoices),
    durableChoices: sum((run) => run.metrics.durableChoices),
    probeChoices: sum((run) => run.metrics.probeChoices),
    characterScenes: sum((run) => run.metrics.characterScenes),
    characters: characters.size,
    tradeActions: sum((run) => run.metrics.tradeActions),
    relationshipChanges: sum((run) => run.metrics.relationshipChanges),
    regardChanges: sum((run) => run.metrics.regardChanges),
    factionChanges: sum((run) => run.metrics.factionChanges),
    languageTiers: sum((run) => run.metrics.languageTiers),
    daysAdvanced: sum((run) => run.metrics.daysAdvanced),
  }
}

function percent(part: number, whole: number): string {
  return whole === 0 ? '0%' : `${Math.round((part / whole) * 100)}%`
}

function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count} ${count === 1 ? word : pluralWord}`
}

function renderNote(note: ReviewNote, body: string): string {
  const source = note.source ? ` (${note.source})` : ''
  return `- **${note.title}** — ${note.where}${source}: ${body}`
}

function renderFinding(finding: ReviewFinding): string {
  return renderNote(finding, finding.evidence)
}

function renderAccepted(observation: AcceptedObservation): string {
  return renderNote(observation, observation.rationale)
}

function renderRun(run: RunReview, index: ContentIndex): string {
  const lines: string[] = []
  const location = placeName(index, run.final.location)
  lines.push(`### ${run.id}`)
  lines.push('')
  lines.push(
    `- Seed: \`${run.seed}\` · ${run.accepted}/${run.steps} actions accepted · final: ${location}, day ${run.final.day}, ${run.final.money} silver`,
  )
  lines.push(
    `- First choice at step ${run.firstChoiceStep ?? 'none'} · ${plural(run.scenes.length, 'distinct scene')} · ${plural(run.metrics.characters.length, 'speaking character')} · ${plural(run.metrics.journalEntries, 'journal entry', 'journal entries')}`,
  )
  lines.push(
    `- Relationship moves: ${run.metrics.relationshipChanges} (${plural(run.metrics.regardChanges, 'band change')}) · faction moves: ${run.metrics.factionChanges} · promises: ${run.metrics.promisesOpened} opened, ${run.metrics.promisesSettled} settled`,
  )
  const outline = run.scenes
    .slice(0, 6)
    .map((scene) => `"${scene.node}" (${scene.speakerName})`)
    .join(' → ')
  if (outline) lines.push(`- Scene outline: ${outline}${run.scenes.length > 6 ? ' …' : ''}`)
  if (run.beats.length > 0) {
    lines.push(
      `- Session beats: ${run.beats.map((beat, index) => `${index + 1}. ${beat}`).join(' · ')}`,
    )
  }
  lines.push('')

  const byCategory = new Map<ReviewCategory, ReviewFinding[]>()
  for (const finding of run.findings) {
    byCategory.set(finding.category, [...(byCategory.get(finding.category) ?? []), finding])
  }
  for (const category of CATEGORY_ORDER) {
    const findings = byCategory.get(category)
    if (!findings?.length) continue
    lines.push(`#### ${category}`)
    for (const finding of findings.slice(0, 8)) lines.push(renderFinding(finding))
    if (findings.length > 8) lines.push(`- … ${findings.length - 8} more ${category} findings`)
    lines.push('')
  }

  return lines.join('\n')
}

function renderTone(runs: RunReview[]): string {
  const byCharacter = new Map<string, ToneCounts & { scenes: number }>()
  for (const run of runs) {
    for (const scene of run.scenes) {
      if (!scene.speaker) continue
      const key = scene.speakerName
      const current = byCharacter.get(key) ?? { warm: 0, tense: 0, grief: 0, sensory: 0, scenes: 0 }
      byCharacter.set(key, {
        warm: current.warm + scene.tone.warm,
        tense: current.tense + scene.tone.tense,
        grief: current.grief + scene.tone.grief,
        sensory: current.sensory + scene.tone.sensory,
        scenes: current.scenes + 1,
      })
    }
  }
  if (byCharacter.size === 0) return '- No spoken scenes were replayed.'
  const rows = [...byCharacter.entries()]
    .sort((a, b) => b[1].scenes - a[1].scenes)
    .map(
      ([name, value]) =>
        `| ${name} | ${value.scenes} | ${value.warm} | ${value.tense} | ${value.grief} | ${value.sensory} |`,
    )
  return [
    '| Character | Scenes | Warm markers | Tension markers | Grief markers | Sensory markers |',
    '|---|---:|---:|---:|---:|---:|',
    ...rows,
  ].join('\n')
}

function renderSevenQuestionEvidence(result: ReviewResult): string {
  const metrics = aggregateMetrics(result.runs)
  const travelDays = metrics.daysAdvanced
  const repeated = result.runs.reduce((sum, run) => sum + run.repeatedScenes.length, 0)
  return [
    '| Question | Deterministic evidence available | Do not infer |',
    '|---|---|---|',
    `| 1. Travel loop enjoyment | ${plural(result.runs.length, 'run')}, ${travelDays} days advanced, ${plural(metrics.characters, 'character')} met | Whether the loop felt worth repeating |`,
    `| 2. Trading as a reason to travel | ${plural(metrics.tradeActions, 'buy/sell action')}; compare port prices in the market screen | Whether the margin felt fair in play |`,
    `| 3. Character memorability | ${plural(metrics.characterScenes, 'character scene')}, ${metrics.relationshipChanges} relationship moves, ${repeated} repeated-scene candidates | Whether a character is memorable |`,
    `| 4. Language as reward | ${plural(metrics.languageTiers, 'tier change')} in the replayed runs | Whether the unlock was noticed or felt rewarding |`,
    `| 5. Faction opportunity | ${metrics.factionChanges} faction moves; each is announced in-scene and the Factions screen keeps the detail | Whether the player understood who noticed |`,
    `| 6. Vivid world | ${plural(metrics.characterScenes, 'spoken scene')} with sensory markers in the tone table | Whether the world felt specific in the browser |`,
    `| 7. Mystery as curiosity | Content/prose checks only; read the mystery scenes in the browser | Whether the player wanted the answer |`,
  ].join('\n')
}

export function renderReview(result: ReviewResult, index: ContentIndex): string {
  const metrics = aggregateMetrics(result.runs)
  const allContent = [...result.contentFindings]
  const contentByCategory = new Map<ReviewCategory, ReviewFinding[]>()
  for (const finding of allContent) {
    contentByCategory.set(finding.category, [
      ...(contentByCategory.get(finding.category) ?? []),
      finding,
    ])
  }

  const lines: string[] = [
    `# Automated playtest review — ${result.label}`,
    '',
    '- **Session type:** agent review (not human evidence)',
    `- **Scenarios:** ${result.scenarioIds.join(', ')}`,
    `- **Command:** \`pnpm playtest:review${result.persona ? ` -- --persona ${result.persona}` : ''}\``,
    '',
    '> This tool replays checked-in scenarios against the authored content. It can find',
    '> contradictions, repeated scenes, invisible state changes, pacing candidates and',
    '> missing player-facing reasons. It cannot see the rendered interface, hear the audio,',
    '> or decide whether the game is enjoyable. Use it to choose where to play, then confirm',
    '> or reject each candidate in the browser.',
    '',
    '## What the agent should do with this',
    '',
    '1. Read the findings; pick the two or three that would change a player decision.',
    '2. Reproduce each in the running build; a scenario finding is not a UI bug until seen.',
    '3. In the session report, mark each as **confirmed**, **not reproduced**, or **not visible in the replay**.',
    '4. Write the eight feedback dimensions from the player’s experience, not from this file.',
    '',
    '## Run evidence',
    '',
  ]

  for (const run of result.runs) lines.push(renderRun(run, index), '')

  const accepted = result.runs.flatMap((run) => run.acceptedObservations)
  lines.push('## Accepted observations (not open gaps)', '')
  if (accepted.length === 0) {
    lines.push('- None.')
  } else {
    for (const observation of accepted) lines.push(renderAccepted(observation))
  }
  lines.push('')

  const runFindings = result.runs.flatMap((run) => run.findings)
  const allFindings = [...runFindings, ...allContent]
  lines.push('## Feedback dimensions', '')
  lines.push(
    '| Dimension | Replay findings | Content-wide findings | What this can and cannot see |',
  )
  lines.push('|---|---:|---:|---|')
  for (const category of CATEGORY_ORDER) {
    const replay = runFindings.filter((finding) => finding.category === category).length
    const contentCount = allContent.filter((finding) => finding.category === category).length
    lines.push(
      `| ${category} | ${replay} | ${contentCount} | ${
        category === 'tone' || category === 'enjoyment'
          ? 'proxy markers only; not a quality verdict'
          : 'deterministic candidates; confirm in the browser'
      } |`,
    )
  }
  lines.push('')

  lines.push('## Content-wide findings', '')
  if (allContent.length === 0) {
    lines.push('- No additional content-wide candidates. The model and prose gates are clean.', '')
  } else {
    for (const category of CATEGORY_ORDER) {
      const findings = contentByCategory.get(category)
      if (!findings?.length) continue
      lines.push(`### ${category}`)
      for (const finding of findings.slice(0, 10)) lines.push(renderFinding(finding))
      if (findings.length > 10) lines.push(`- … ${findings.length - 10} more ${category} findings`)
      lines.push('')
    }
  }

  lines.push('## Emotional tone markers', '')
  lines.push(
    'Word-marker counts, not a judgment of quality. A low count may mean restraint; a high count may mean repetition.',
    '',
  )
  lines.push(renderTone(result.runs), '')

  lines.push('## Agency and consequence proxies', '')
  lines.push(
    `- ${metrics.choices} selected answers; ${metrics.meaningfulChoices} non-probe (${percent(metrics.meaningfulChoices, metrics.choices)}); ${metrics.durableChoices} left an effect or journal (${percent(metrics.durableChoices, metrics.choices)}).`,
  )
  lines.push(
    `- ${plural(metrics.characterScenes, 'character scene')} across ${plural(metrics.characters, 'speaking character')}; ${metrics.relationshipChanges} relationship moves, ${plural(metrics.regardChanges, 'visible band change')}.`,
  )
  lines.push(
    `- ${plural(metrics.tradeActions, 'trade action')} and ${metrics.daysAdvanced} days advanced across ${plural(metrics.runs, 'replayed run')}.`,
  )
  lines.push('')
  lines.push(
    'These are agency proxies. They cannot answer whether a choice felt meaningful, only whether it had a modeled consequence.',
    '',
  )

  lines.push('## Seven-question evidence', '')
  lines.push(renderSevenQuestionEvidence(result), '')

  lines.push('## Recommendation', '')
  const errors = allFindings.filter((finding) => finding.level === 'error')
  const warnings = allFindings.filter((finding) => finding.level === 'warn')
  if (errors.length > 0) {
    lines.push(
      `Fix the ${errors.length} error-level finding(s) before the session; the replay is not trustworthy until they pass.`,
    )
  } else if (warnings.length > 0) {
    lines.push(
      `Reproduce the highest-impact warning first: ${warnings[0]?.title} at ${warnings[0]?.where}.`,
    )
  } else {
    const notes = allFindings.filter((finding) => finding.level === 'note')
    if (notes.length > 0) {
      lines.push(
        `No deterministic failure found. Reproduce the highest-impact note first: ${notes[0]?.title} at ${notes[0]?.where}.`,
      )
    } else {
      lines.push(
        'No deterministic candidate found. Play the build for the eight feedback dimensions; this pre-pass cannot replace the session.',
      )
    }
  }

  return `${lines.join('\n').trimEnd()}\n`
}

async function loadTerminals(): Promise<TerminalFlag[]> {
  return JSON.parse(
    await readFile(join(process.cwd(), 'content', 'terminals.json'), 'utf8'),
  ) as TerminalFlag[]
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

async function scenarioIds(args: string[]): Promise<string[]> {
  const explicit = valueAfter(args, '--scenario')
  if (explicit) return [explicit.replace(/\.json$/, '')]
  const persona = valueAfter(args, '--persona')
  if (persona) {
    const selected = PERSONA_SCENARIOS[persona]
    if (!selected) {
      throw new Error(
        `Unknown persona "${persona}". Choose ${Object.keys(PERSONA_SCENARIOS).join(', ')}.`,
      )
    }
    return selected
  }
  return (await readdir(SCENARIO_ROOT))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .sort()
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const json = args.includes('--json')
  const strict = args.includes('--strict')
  const out = valueAfter(args, '--out')
  const persona = valueAfter(args, '--persona')
  const ids = await scenarioIds(args)

  const index = await loadContent()
  const terminals = await loadTerminals().catch((): TerminalFlag[] => [])
  const runs: RunReview[] = []
  for (const id of ids) {
    const scenario: Scenario = await loadScenario(id)
    const result = runScenario(scenario, index)
    runs.push(analyseRun(result, index))
  }

  const model = checkModel(index, terminals)
  const prose = lintProse(index)
  const content = [...contentFindings(index), ...modelFindings(model), ...proseFindings(prose)]

  const review: ReviewResult = {
    label: persona
      ? `${persona} pre-pass`
      : ids.length === 1
        ? (ids[0] ?? 'scenario')
        : 'all scenarios',
    ...(persona ? { persona } : {}),
    runs,
    contentFindings: content,
    scenarioIds: ids,
  }

  const failures = runs
    .flatMap((run) => run.findings)
    .filter((finding) => finding.level === 'error')
  const contentErrors = content.filter((finding) => finding.level === 'error')

  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: failures.length === 0 && contentErrors.length === 0,
          review: {
            ...review,
            runs: review.runs.map((run) => ({
              ...run,
              metrics: run.metrics,
            })),
          },
        },
        null,
        2,
      )}\n`,
    )
  } else {
    const markdown = renderReview(review, index)
    process.stdout.write(markdown)
    if (out) {
      await mkdir(dirname(resolve(out)), { recursive: true })
      await writeFile(resolve(out), markdown, 'utf8')
      process.stdout.write(`\nWrote ${resolve(out)}\n`)
    }
  }

  if (failures.length > 0 || contentErrors.length > 0) {
    if (strict) process.exitCode = 1
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
