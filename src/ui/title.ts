/**
 * The main menu and the prologue it opens, in reading order.
 *
 * The menu is a title screen: a name, two ways in, and one deliberate door to the world
 * gallery (two shores and the great places of 1230 BCE) without listing places on the way
 * in. Behind the name, the scenery cycles through those great places one at a time.
 * `Begin` plays the prologue,
 * which says what the world already is — the inherited cities, law, writing and bronze
 * economy, and the courts and ruins beyond the eastern Mediterranean — one beat at a
 * time, each beside its own picture, before the traveler is introduced. Nothing here
 * talks about the build: see `docs/CONTENT.md`, *Text and tone*.
 *
 * `**Double asterisks**` set a key word, as everywhere else in the prose.
 */

export interface PrologueBeat {
  text: string
  /** The picture that belongs to this beat; resolved through `art.ts`. */
  art: string
}

/**
 * A land on the menu. The arm of the menu that shows it is the picture; the name comes
 * from the region content, so the menu cannot call a land something the world does not.
 */
export interface MenuLand {
  region: string
  art: string
  /** Where this land stands in the journey, said over its picture. */
  where: string
  /** One line about the land itself. */
  line: string
}

/**
 * A place in the wider world of 1230 BCE: not a road the journey takes, but a name the
 * traveler hears at a quay or in a temple courtyard. The menu shows it so the world the
 * slice enters is measured against the rest of the world as it stood that year.
 */
export interface WorldWonder {
  name: string
  /** The region or country it belongs to, said in the card's eyebrow. */
  where: string
  art: string
  /** What the place is, and who lives there and how. */
  line: string
}

export const MENU = {
  eyebrow: 'Late Bronze Age · c. 1230 BCE',
  name: 'The Song of the Wanderer',
  tagline: 'A merchant, a road, and a world that will not stay the same.',
  begin: 'Begin a journey',
  lands: 'The lands you may explore',
  landsNote:
    'The coast you come ashore on, and the island across the water. The rest of the world you learn from the people who have been there.',
  world: 'The world in 1230 BCE',
  worldPlaces: 'Ten places named at quays and in courtyards',
  worldNote:
    'Ten places named at quays and in temple courtyards: cities older than any kingdom now standing, courts raising their own monuments, fleets loading at dawn, caravans crossing the dry ground between rivers, and one city already a ruin. Every court keeps its own gods, every road has a divine claim on it, and every horizon belongs to somebody. You will not sail to all of them. They are the scale against which the world you enter is measured. The world is not one desert: reed marsh, irrigated barley, oak and pine hills, olive terraces and dry steppe lie within a few days of one another.',
  prologueEyebrow: 'Before you',
  prologueTitle: 'The world you step into',
} as const

export interface CreditAttribution {
  title: string
  lines: readonly string[]
  link?: { label: string; href: string }
}

export const CREDITS = {
  label: 'Credits',
  eyebrow: 'Credits',
  role: 'Game created by',
  creator: 'A.S. Mori',
  line: 'A narrative historical travel RPG set in the Late Bronze Age.',
  attributions: [
    {
      title: 'Sound',
      lines: [
        'Field recordings by Joseph SARDIN for BigSoundBank, released under CC0.',
        'Original music and sound effects were synthesized for The Song of the Wanderer and dedicated to CC0.',
      ],
      link: { label: 'BigSoundBank', href: 'https://bigsoundbank.com/' },
    },
    {
      title: 'Illustration',
      lines: [
        'The illustrations were generated for The Song of the Wanderer and reviewed for historical detail.',
        'No third-party image is included.',
      ],
    },
  ] satisfies readonly CreditAttribution[],
} as const

export const MENU_LANDS: readonly MenuLand[] = [
  {
    region: 'region.levant',
    art: 'art.land.levant',
    where: 'You come ashore here',
    line: 'A narrow shore of small ports between Egypt and the Hittite king, where cedar, oil and grain are counted at every gate: vineyards and olive terraces on the plain, cedars on the wooded hills, and the ships of three seas at one mole.',
  },
  {
    region: 'region.cyprus',
    art: 'art.land.cyprus',
    where: 'Two days’ sail west',
    line: 'An island of pine and oak hills, copper and charcoal, where the bronze of every palace begins, and strangers from the Aegean are lately coming to stay.',
  },
]

/**
 * Ten places around the Mediterranean, Africa and Asia, c. 1230 BCE. Each line is about
 * the place as it stood that year and the people who lived in it — not a promise that the
 * journey reaches it. Sources and the date of each claim are in
 * `docs/design/05-the-world-in-1230.md`.
 */
export const WORLD_WONDERS: readonly WorldWonder[] = [
  {
    name: 'Thebes · Karnak',
    where: 'Egypt, up the Nile',
    art: 'art.world.karnak',
    line: 'The temple of Amun is a walled world of pylons, obelisks and a hall of columns too thick for a man to reach around. Priests, singers, weavers and bread-makers live from its granaries, and the Nile flood sets the year for every farmer in Egypt.',
  },
  {
    name: 'Giza',
    where: 'Egypt, downriver',
    art: 'art.world.giza',
    line: 'The three pyramids and the Sphinx were ancient before your grandmother’s grandmother was born. Guides, water-sellers and a village of stonemasons live in their shadow, and travelers come a long way to stand at the base of a tomb nobody can explain.',
  },
  {
    name: 'Hattusa',
    where: 'Anatolia, the Hittite court',
    art: 'art.world.hattusa',
    line: 'The Hittite capital fills a hillside with cyclopean walls, the Lion Gate, temples and rooms of tablets. Chariot warriors, cuneiform scribes and farmers bringing grain and sheep keep a court that treats with Egypt as an equal.',
  },
  {
    name: 'Chogha Zanbil',
    where: 'Elam, beyond the Tigris',
    art: 'art.world.chogha-zanbil',
    line: 'A new sacred city on the Elamite plain: a five-terraced ziggurat of mud brick banded with blue glaze, its stairways built for gods rather than crowds. Priests, temple servants and the families who feed them live inside the enclosure wall.',
  },
  {
    name: 'Mycenae',
    where: 'Greece, across the Aegean',
    art: 'art.world.mycenae',
    line: 'A hill of walls above the Argive plain, entered through the Lion Gate. The king’s palace, shaft graves and beehive tombs hold gold and amber, while farmers, shepherds and potters fill Mycenaean ships with oil, cloth and painted pots.',
  },
  {
    name: 'Abu Simbel',
    where: 'Nubia, beyond the first cataract',
    art: 'art.world.abu-simbel',
    line: 'Ramesses II has cut a temple into the Nubian cliff, four seated colossi at its door. Garrisons, gold-washers, caravan men and Nubian archers live along a river that carries Egypt’s southern wealth north.',
  },
  {
    name: 'Dur-Kurigalzu',
    where: 'Mesopotamia, between the rivers',
    art: 'art.world.dur-kurigalzu',
    line: 'A Kassite royal foundation of ziggurat, temples and palace, raised to hold a conquered south. Scribes, brewers, weavers and date-growers keep a court that speaks Babylonian and Kassite, and writes both in cuneiform.',
  },
  {
    name: 'Enkomi',
    where: 'Cyprus, the copper coast',
    art: 'art.world.enkomi',
    line: 'A tight town of ashlar houses and workshops behind the beach, where smiths turn oxhide ingots into tools and traders weigh them against silver. Its people are Cypriot, with more Aegean faces at the quay than there were a generation ago.',
  },
  {
    name: 'Anyang',
    where: 'China, the Shang court',
    art: 'art.world.anyang',
    line: 'The Shang king’s capital on the Yellow River plain: rammed-earth platforms, thatched halls, bronze foundries and royal tombs. Charioteers, diviners reading cracks in heated bone, bronze casters and millet farmers live around the court.',
  },
  {
    name: 'Mohenjo-daro',
    where: 'The Indus, already a ruin',
    art: 'art.world.mohenjo-daro',
    line: 'A city of fired brick old and empty: straight streets, covered drains, a great bath, and no king. Herders and travelers shelter in its broken rooms, and nobody now remembers who laid the bricks or what the city was called.',
  },
]

/**
 * Scenery behind the title, in cycle order: the great places of the wider world first,
 * then the two shores the journey itself reaches. The title stays a title rather than a
 * list; the pictures carry the scale of the year.
 */
export const TITLE_BACKDROPS: readonly string[] = [
  ...WORLD_WONDERS.map((wonder) => wonder.art),
  ...MENU_LANDS.map((land) => land.art),
]

/** The title picture at a step, wrapped so a steadily increasing index never runs out. */
export function titleBackdropAt(index: number): string {
  const count = TITLE_BACKDROPS.length
  const position = ((Math.round(index) % count) + count) % count
  return TITLE_BACKDROPS[position] ?? 'art.land.levant'
}

export const PROLOGUE_BEATS = [
  {
    art: 'art.prologue.gate',
    text: 'Before you, the world is already old. There are cities older than any kingdom now standing, law that turns a favor into a debt with a number on it, temples that take the first of the harvest, and **writing**, which lets a promise outlive the man who made it. None of it was invented in your lifetime, or your grandmother’s. It was inherited.',
  },
  {
    art: 'art.prologue.bronze',
    text: '**Bronze** is what holds it together. **Copper** comes from Cyprus and **tin** from the ends of the earth, and every palace on the coast counts the ingots as carefully as it counts its people. The chariots, the scribes, the harbors and the gods rest on that one arrangement. No one alive has seen it fail.',
  },
  {
    art: 'art.ugarit.temple',
    text: 'Every city keeps its gods at the center of the account. A household sets bread and oil before its own small figures; a temple feeds a god who owns the fields around it; a king asks a diviner to read the liver of a sheep or the cracks in a heated bone before he moves an army. The names change at every headland. A goddess who is a mother in one city is a warrior in the next, and a traveler is wise to learn which one is listening before he swears by her.',
  },
  {
    art: 'art.world.karnak',
    text: '**Egypt** is the oldest thing you know. At **Thebes** the temple of Amun grows a forest of painted columns and obelisks; downriver, the pyramids at **Giza** have stood for more than a thousand years, and farmers still time their fields to the **Nile** flood. Between the desert and the river lies a green ribbon of fields, palms and canals, and priests, scribes and grain-sellers live off the temple’s stores.',
  },
  {
    art: 'art.world.abu-simbel',
    text: 'South of the first cataract, **Ramesses II** has cut a temple into the Nubian cliff, four colossi seated at its door. **Nubia** sends gold, cattle and archers north; the river is the road, and the desert on either side belongs to no one who can hold it.',
  },
  {
    art: 'art.world.hattusa',
    text: 'North, the **Hittite** king rules from **Hattusa** — a hillside of cyclopean walls, a Lion Gate, temples and tablet rooms, above oak and pine woodland, pasture and streams. His chariots and grain feed a court that writes in cuneiform, keeps its treaties, and treats with Egypt as an equal.',
  },
  {
    art: 'art.mycenae.megaron',
    text: 'Across the Aegean, **Mycenae** is a hill of walls and gold: the Lion Gate, shaft graves, beehive tombs, above a plain of barley and olive groves. Its ships carry oil, cloth and painted pots to every coast, and its kings are lately more interested in trade than in tribute.',
  },
  {
    art: 'art.world.chogha-zanbil',
    text: 'East, between the rivers, **Dur-Kurigalzu** raises a Kassite ziggurat over canals and barley fields; farther east in **Elam**, a new sacred city at **Chogha Zanbil** climbs five terraces of mud brick banded with blue glaze. The plain around it is irrigated green, with date palms and barley, and the oak-covered **Zagros** rise beyond. Its stairways are for gods, and the people who feed the temple live inside the wall.',
  },
  {
    art: 'art.world.anyang',
    text: 'Farther than any of these, the **Shang** king keeps his court at **Anyang**: rammed-earth platforms, bronze foundries, chariots, and diviners reading the cracks in heated bone. Millet farmers and reed-cutters work the river plain around it, and the king’s bronze vessels are like nothing on the Mediterranean.',
  },
  {
    art: 'art.world.mohenjo-daro',
    text: 'And in the south-east, on the **Indus**, **Mohenjo-daro** is already a ruin — straight brick streets, covered drains, a great bath, and nobody left who can say whose city it was. The world is older than its oldest stories.',
  },
  {
    art: 'art.prologue.arrival',
    text: 'You come ashore at **Ugarit** with two jars of oil and a name that people write differently depending on which sea they learned to write beside. The plain behind the port is green with vineyards and grain, and the hills are wooded. The last winters have been poor, and the old men say the rains are moving.',
  },
  {
    art: 'art.prologue.temple',
    text: 'It is **1230 BCE**, and the eastern Mediterranean is a web of small kings. **Egypt** and **Hatti** are the great powers; between them the ports of the **Levantine** coast live by carrying other people’s goods. **Ugarit** is one of them — a harbor, a palace that counts everything, and a temple that sings.',
  },
  {
    art: 'art.prologue.purse',
    text: 'The name on the tablet is yours, though the harbor may write it differently. You come ashore as a **trader** with two jars of oil and a little Akkadian: courier, translator, and creditor, in whatever order the day asks. Buy low, carry the goods across the water, sell them, and find out who remembers you when you come back. What you were before this shore is yours to keep or to spend.',
  },
] as const satisfies readonly [PrologueBeat, ...PrologueBeat[]]

/** The beat at a position, clamped, so a stale index cannot point past the last picture. */
export function prologueBeatAt(index: number): PrologueBeat {
  const clamped = Math.min(Math.max(0, Math.round(index)), PROLOGUE_BEATS.length - 1)
  return PROLOGUE_BEATS[clamped] ?? PROLOGUE_BEATS[0]
}
