/**
 * M4b model migration.
 *
 * One-off, idempotent migration that brings the slice to the character/scene model:
 * - recurring characters gain object wants, a voice, ties, knowledge and appearances;
 * - every dialogue choice gains a stable id and a dramatic intent;
 * - the recurring graphs gain a scene contract.
 *
 * Run: `pnpm migrate:model`
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = join(process.cwd(), 'src', 'content', 'packs', 'slice')

type Json = Record<string, unknown>

interface Want {
  id: string
  text: string
  stake: string
  scene: string
}

interface CharacterUpgrade {
  wants: Want[]
  voice: {
    register: string
    address: string[]
    tics: string[]
    avoid: string[]
    sampleLines: [string, string, string]
  }
  ties?: { character: string; kind: string }[]
  knowledge?: { fact: string; belief?: string }[]
  appearances: string[]
}

const CHARACTERS: Record<string, CharacterUpgrade> = {
  'amnit.json': {
    wants: [
      {
        id: 'winter-contract',
        text: 'A grain contract that survives the winter',
        stake: "Her household's name",
        scene: 'dlg.ugarit.amnit.meeting',
      },
      {
        id: 'clean-name',
        text: "Her household's name kept clean",
        stake: 'Credit with the quarter',
        scene: 'dlg.cyprus.amnit',
      },
    ],
    voice: {
      register: 'Brisk merchant. Short declaratives, dry arithmetic, weights as feeling.',
      address: ['you'],
      tics: ['weighing a thing before naming a price', 'turning a jar so the mark faces the wall'],
      avoid: ['self-pity', 'raised voice'],
      sampleLines: [
        'Ask me something worth the interruption.',
        'That is the yard’s price. The price for you is the same, because I have decided to like you.',
        'A man who pays a messenger has decided not to pay you.',
      ],
    },
    ties: [
      { character: 'char.ugarit.sibtu', kind: 'neighbor' },
      { character: 'char.ugarit.hannu', kind: 'patron' },
    ],
    knowledge: [{ fact: 'sibtu.lives-in-workshop-quarter' }],
    appearances: ['dlg.ugarit.amnit.meeting', 'dlg.cyprus.amnit'],
  },
  'hannu.json': {
    wants: [
      {
        id: 'no-incident',
        text: 'No incident he has to explain',
        stake: 'His post at the gate',
        scene: 'dlg.ugarit.hannu.gate',
      },
      {
        id: 'son-posting',
        text: 'His son’s place at the harbor school',
        stake: 'The only future he can buy',
        scene: 'dlg.ugarit.night-watch',
      },
    ],
    voice: {
      register: 'Bureaucratic, terse, numbers before names. Dry mercy when he thinks no one is looking.',
      address: ['you'],
      tics: ['wetting a stylus he does not need', 'turning the board so it cannot be read'],
      avoid: ['confession', 'compliments'],
      sampleLines: [
        'Name. Cargo. And whether you have been in this harbor before.',
        'The board does not forget.',
        'Eat something. The palace does not bargain with the tired.',
      ],
    },
    knowledge: [{ fact: 'ugarit.harbor-tax' }],
    appearances: ['dlg.ugarit.arrival', 'dlg.ugarit.hannu.gate', 'dlg.ugarit.night-watch'],
  },
  'yada.json': {
    wants: [
      {
        id: 'the-text',
        text: 'A copy of a text he has only heard of',
        stake: 'The one thing his teacher left him wanting',
        scene: 'dlg.ugarit.yada.lesson',
      },
      {
        id: 'a-student',
        text: 'A student who does not waste his morning',
        stake: 'His hand and his patience',
        scene: 'dlg.ugarit.yada.lesson',
      },
    ],
    voice: {
      register: 'Precise and contemptuous; corrections are affection. Bad proverbs, never explained.',
      address: ['you'],
      tics: ['turning a reed between two fingers', 'tapping the empty corner of the board'],
      avoid: ['praise', 'explaining the joke'],
      sampleLines: [
        'You write like a man copying a sign he does not love.',
        'Four of them are the same sign being lazy.',
        'Do not tell anyone I said that.',
      ],
    },
    knowledge: [{ fact: 'archive.being-moved' }],
    appearances: ['dlg.ugarit.yada.lesson'],
  },
  'tiro.json': {
    wants: [
      {
        id: 'full-hold',
        text: 'A full hold and an early tide',
        stake: 'The crew’s wages',
        scene: 'dlg.ugarit.tiro.passage',
      },
      {
        id: 'a-favor',
        text: 'A favor owed by someone useful',
        stake: 'The next winter',
        scene: 'dlg.ugarit.tiro.passage',
      },
    ],
    voice: {
      register: 'Fatalistic shipmaster. Names the sea instead of the fear; bargaining as ritual.',
      address: ['you'],
      tics: ['mending rope that does not need mending', 'spitting over the side'],
      avoid: ['thanks', 'the wreck by name'],
      sampleLines: [
        'Everyone wants the island, and the island does not want any of us.',
        'A man who works is easier to take than one who does not.',
        'I have enough storms.',
      ],
    },
    appearances: ['dlg.ugarit.tiro.passage'],
  },
  'belet.json': {
    wants: [
      {
        id: 'the-feast',
        text: 'The feast sung properly',
        stake: 'Her place in the temple',
        scene: 'dlg.ugarit.belet.temple',
      },
      {
        id: 'the-name',
        text: 'To know why the name will not leave her',
        stake: 'Her sister’s memory',
        scene: 'dlg.ugarit.mystery',
      },
    ],
    voice: {
      register: 'Liturgical cadence in ordinary speech; sudden bluntness; grief held under work.',
      address: ['you'],
      tics: ['turning a lamp down without putting it out', 'folding cloth already folded'],
      avoid: ['comfort', 'certainty'],
      sampleLines: [
        'If you have come to look, look from the doorway.',
        'Names are not only names. If they were, I would be out of work.',
        'It has been a year and the word is still strange.',
      ],
    },
    knowledge: [{ fact: 'ninshubur.in-the-hymn' }],
    appearances: ['dlg.ugarit.belet.temple', 'dlg.ugarit.mystery'],
  },
  'sibtu.json': {
    wants: [
      {
        id: 'work-for-hands',
        text: 'Work for three more pairs of hands',
        stake: 'Four children in a cousin’s room',
        scene: 'dlg.ugarit.sibtu.ask',
      },
      {
        id: 'not-a-burden',
        text: 'Not to be a burden on her cousin',
        stake: 'The last of her standing',
        scene: 'dlg.ugarit.refugee-ask',
      },
    ],
    voice: {
      register: 'Terse, concrete, refuses pity. Speaks to the loom; uses the children to end a conversation.',
      address: ['you'],
      tics: ['cutting thread with her teeth', 'not looking up from the shuttle'],
      avoid: ['begging', 'saying her husband is dead'],
      sampleLines: [
        'Sit, if you can sit without being asked twice.',
        'I cannot go to the yard myself without someone deciding I am for sale.',
        'He is not dead. I would know.',
      ],
    },
    ties: [{ character: 'char.ugarit.amnit', kind: 'neighbor' }],
    knowledge: [{ fact: 'sibtu.husband-stayed-inland' }],
    appearances: ['dlg.ugarit.sibtu.ask', 'dlg.ugarit.refugee-ask'],
  },
  'kinyras.json': {
    wants: [
      {
        id: 'a-buyer',
        text: 'A buyer who will not argue about weight',
        stake: 'The yard’s margin',
        scene: 'dlg.cyprus.kinyras.meeting',
      },
      {
        id: 'ledger-name',
        text: 'His name in a mainland merchant’s ledger',
        stake: 'The trade his father lost',
        scene: 'dlg.cyprus.copper-offer',
      },
    ],
    voice: {
      register: 'Jovial, familiar; “my friend” is a warning. Numbers as endearments; never threatens.',
      address: ['you', 'my friend'],
      tics: ['turning a charcoal stick', 'tapping the tally board once'],
      avoid: ['anger', 'explaining the trick'],
      sampleLines: [
        'Do not tell me the crossing was good. Nobody’s crossing is good.',
        'I do not weigh opinions.',
        'We are both richer and neither of us is happy. That is a good deal.',
      ],
    },
    ties: [{ character: 'char.cyprus.shipti', kind: 'neighbor' }],
    knowledge: [{ fact: 'kinyras.buys-at-yard-price' }],
    appearances: ['dlg.cyprus.kinyras.meeting', 'dlg.cyprus.copper-offer'],
  },
  'ada.json': {
    wants: [
      {
        id: 'tin',
        text: 'Tin enough to finish the season',
        stake: 'The workshop’s orders',
        scene: 'dlg.cyprus.ada.smithy',
      },
      {
        id: 'daughter',
        text: 'Her daughter to learn the trade properly',
        stake: 'The girl’s future',
        scene: 'dlg.cyprus.night-kiln',
      },
    ],
    voice: {
      register: 'Blunt, technical, talks to the metal. Affection arrives as instruction.',
      address: ['you', 'girl'],
      tics: ['weighing tin in her hand before the scale', 'watching the color of the coals'],
      avoid: ['praise of her own work', 'saying the girl’s name in front of strangers'],
      sampleLines: [
        'Put it on the scale. Do not tell me it is good; the scale decides.',
        'The good blades go to men who will use them and never think of me.',
        'She has the hands. She does not yet have the patience.',
      ],
    },
    knowledge: [{ fact: 'cyprus.ada.father-sold-yard' }],
    appearances: ['dlg.cyprus.ada.smithy', 'dlg.cyprus.night-kiln'],
  },
  'shipti.json': {
    wants: [
      {
        id: 'paying-travelers',
        text: 'Travelers who pay on time',
        stake: 'The inn through the quiet season',
        scene: 'dlg.cyprus.shipti.inn',
      },
      {
        id: 'news',
        text: 'News from the mainland',
        stake: 'A brother who owes her',
        scene: 'dlg.cyprus.shipti.inn',
      },
    ],
    voice: {
      register: 'Oblique and watchful; hospitality as a weapon. Remembers everything she pretends not to hear.',
      address: ['you'],
      tics: ['mending a net she does not own', 'biting thread'],
      avoid: ['direct questions about her brother', 'thanks'],
      sampleLines: [
        'The yard is honest and the harbor is not.',
        'I am not its keeper, and I am not yours.',
        'If it is about my brother, do not tell me yet.',
      ],
    },
    ties: [{ character: 'char.cyprus.kinyras', kind: 'neighbor' }],
    knowledge: [{ fact: 'letter.addressed-from-ugarit' }],
    appearances: ['dlg.cyprus.arrival', 'dlg.cyprus.shipti.inn'],
  },
}

interface Contract {
  goal: string
  obstacle: string
  turn: string
  stakes: string
  want?: string
  callback?: string
}

const CONTRACTS: Record<string, Contract> = {
  'dlg.ugarit.amnit.meeting': {
    goal: 'Sell grain without being cheated',
    obstacle: 'A stranger who smells of the boat and has no ledger',
    turn: 'She offers the good end of the mat',
    stakes: "Her household's credit",
    want: 'winter-contract',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.cyprus.amnit': {
    goal: 'Collect a debt in person',
    obstacle: 'Her name is no good on this island',
    turn: 'She asks the traveller to stand as witness',
    stakes: "The debt and her cousin's household",
    want: 'clean-name',
    callback: 'journal:journal.slice.amnit-met',
  },
  'dlg.ugarit.hannu.gate': {
    goal: 'Get through the gate without an incident',
    obstacle: "Hannu's ledger and the palace audit",
    turn: 'He gives directions and a warning instead of a fine',
    stakes: 'A night on the mole',
    want: 'no-incident',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.ugarit.night-watch': {
    goal: 'Walk the mole without being taken for a thief',
    obstacle: "Hannu's lamp and his silence",
    turn: 'He admits the house is empty',
    stakes: 'A bed and a witness',
    want: 'no-incident',
    callback: 'flag:arrived.ugarit',
  },
  'dlg.ugarit.yada.lesson': {
    goal: 'Get a lesson without being insulted out of it',
    obstacle: "Yada's contempt and his price",
    turn: 'He lets the word “good” escape',
    stakes: 'Silver and the alphabet',
    want: 'a-student',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.ugarit.tiro.passage': {
    goal: 'Book passage without paying more than the fare',
    obstacle: 'A leaking hull and a crew owed wages',
    turn: 'He offers work instead of charity',
    stakes: 'The crossing and the fare',
    want: 'full-hold',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.ugarit.belet.temple': {
    goal: 'Hear the hymn and learn the name',
    obstacle: "Belet's grief and the temple's short version",
    turn: 'She admits her sister sang it at the funeral',
    stakes: "The feast and her sister's memory",
    want: 'the-feast',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.ugarit.mystery': {
    goal: 'Find out why the name follows her',
    obstacle: 'She cannot prove what she suspects',
    turn: 'She names the trader and the funeral',
    stakes: "Her sister's memory",
    want: 'the-name',
    callback: 'flag:belet.hymn',
  },
  'dlg.ugarit.sibtu.ask': {
    goal: 'Get the cloth sold without being seen as merchandise',
    obstacle: 'The yard and her pride',
    turn: 'She asks plainly and hates asking',
    stakes: 'Four children and a husband inland',
    want: 'work-for-hands',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.ugarit.refugee-ask': {
    goal: 'Find a buyer without going to the yard',
    obstacle: 'No flax, no protector, and a cousin with a roof',
    turn: 'She hands over the cloth',
    stakes: 'The household',
    want: 'not-a-burden',
    callback: 'flag:sibtu.met',
  },
  'dlg.cyprus.kinyras.meeting': {
    goal: 'Find out what copper is worth',
    obstacle: 'A broker counting what he has already counted',
    turn: 'He names the yard price without being asked twice',
    stakes: 'A first trade on the island',
    want: 'a-buyer',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.cyprus.copper-offer': {
    goal: 'Sell the grain at the yard price',
    obstacle: "Kinyras's count and the late boats",
    turn: 'He respects an argument and raises the price',
    stakes: "The season's margin",
    want: 'ledger-name',
    callback: 'flag:kinyras.met',
  },
  'dlg.cyprus.ada.smithy': {
    goal: 'Sell the tin without being cheated',
    obstacle: "Ada's scale and her daughter's eyes",
    turn: 'She lets the girl watch the weighing',
    stakes: "The workshop's season",
    want: 'tin',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.cyprus.night-kiln': {
    goal: 'See the firing through',
    obstacle: 'The tin came late and the mould will not wait',
    turn: 'She talks about her father selling the yard',
    stakes: 'The workshop and the girl’s future',
    want: 'daughter',
    callback: 'flag:ada.work',
  },
  'dlg.cyprus.shipti.inn': {
    goal: 'Find out who buys copper and whether there is post',
    obstacle: "Shipti's net and her watchfulness",
    turn: 'She admits her brother owes her',
    stakes: 'A room and a letter',
    want: 'news',
    callback: 'journal:journal.slice.opening',
  },
  'dlg.cyprus.arrival': {
    goal: 'Find a bed for the night',
    obstacle: 'A stranger at the door who has already priced him',
    turn: 'She warns him about the yard and the harbor',
    stakes: 'A night’s shelter',
    want: 'paying-travelers',
    callback: 'journal:journal.slice.opening',
  },
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 4)
    .join('-')
}

function intentOf(choice: Json): string {
  const text = String(choice.text ?? '')
  const effects = Array.isArray(choice.effects) ? (choice.effects as Json[]) : []
  const has = (key: string): boolean =>
    effects.some((effect) => Object.prototype.hasOwnProperty.call(effect, key))

  if (has('money') || has('items') || has('loseCargo') || has('stamina')) return 'cost'
  if (has('relationship') || has('faction') || has('promise') || has('settlePromise')) {
    return /bargain|price|cost|deal|thirty|fair/i.test(text) ? 'bargain' : 'help'
  }
  if (/^\(?(say nothing|leave|another time|not today|not now|no\b)/i.test(text)) {
    return 'deflect'
  }
  if (/^(what|who|where|why|how|ask|tell me|does|do you|is it|are you)\b/i.test(text)) {
    return 'probe'
  }
  return 'reveal'
}

async function migrateCharacters(): Promise<void> {
  const dir = join(ROOT, 'characters')
  for (const file of await readdir(dir)) {
    const upgrade = CHARACTERS[file]
    if (!upgrade) continue
    const path = join(dir, file)
    const data = JSON.parse(await readFile(path, 'utf8')) as Json
    data.wants = upgrade.wants
    data.voice = upgrade.voice
    if (upgrade.ties) data.ties = upgrade.ties
    if (upgrade.knowledge) data.knowledge = upgrade.knowledge
    data.appearances = upgrade.appearances
    await writeFile(path, `${JSON.stringify(data, null, 2)}\n`)
  }
}

async function migrateDialogues(): Promise<void> {
  const dir = join(ROOT, 'dialogues')
  let choices = 0
  let contracts = 0

  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue
    const path = join(dir, file)
    const data = JSON.parse(await readFile(path, 'utf8')) as Json

    const contract = CONTRACTS[String(data.id)]
    if (contract && !data.scene) {
      data.scene = contract
      contracts += 1
    }

    const nodes = (data.nodes ?? {}) as Record<string, Json>
    for (const node of Object.values(nodes)) {
      const list = Array.isArray(node.choices) ? (node.choices as Json[]) : []
      const seen = new Set<string>()
      for (const choice of list) {
        if (!choice.id) {
          const base = slug(String(choice.text ?? 'answer')) || 'answer'
          let id = base
          let suffix = 2
          while (seen.has(id)) {
            id = `${base}-${suffix}`
            suffix += 1
          }
          choice.id = id
          choices += 1
        }
        seen.add(String(choice.id))
        if (!choice.intent) choice.intent = intentOf(choice)
      }
    }

    await writeFile(path, `${JSON.stringify(data, null, 2)}\n`)
  }

  process.stdout.write(`migrate:model - ${choices} choice ids, ${contracts} scene contracts\n`)
}

await migrateCharacters()
await migrateDialogues()
