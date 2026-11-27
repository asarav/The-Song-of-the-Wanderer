/**
 * Exploratory art catalog.
 *
 * Content references `art.*` IDs; this table resolves them to files. These are the
 * on-demand illustrations described in `docs/ASSETS.md` §3 — reviewed for period detail,
 * but still exploratory rather than M18 production art. A missing entry is not an error:
 * the screen simply shows no picture.
 */

/** ADR-0010: every picture belongs to one dated material horizon. */
export type ArtHorizon = 'A' | 'B' | 'C'

export type ArtKind = 'place' | 'portrait' | 'scene' | 'good'

export interface ArtAsset {
  id: string
  kind: ArtKind
  horizon: ArtHorizon
  src: string
  alt: string
}

function file(name: string): string {
  return `${import.meta.env.BASE_URL}art/${name}`
}

export const ART: Record<string, ArtAsset> = {
  'art.good.grain': {
    id: 'art.good.grain',
    kind: 'good',
    horizon: 'A',
    src: file('good-grain.jpg'),
    alt: 'A sheaf of barley and emmer beside a linen sack and a wooden scoop.',
  },
  'art.good.olive-oil': {
    id: 'art.good.olive-oil',
    kind: 'good',
    horizon: 'A',
    src: file('good-olive-oil.jpg'),
    alt: 'Two round-shouldered clay oil jars with red painted bands.',
  },
  'art.good.wine': {
    id: 'art.good.wine',
    kind: 'good',
    horizon: 'A',
    src: file('good-wine.jpg'),
    alt: 'A small red-slipped Cypriot juglet with a white-painted lattice band on a dark ground.',
  },
  'art.good.copper': {
    id: 'art.good.copper',
    kind: 'good',
    horizon: 'A',
    src: file('good-copper.jpg'),
    alt: 'A flat oxhide-shaped copper ingot with green patina on a linen cloth.',
  },
  'art.good.tin': {
    id: 'art.good.tin',
    kind: 'good',
    horizon: 'A',
    src: file('good-tin.jpg'),
    alt: 'Three dull grey tin ingots stacked beside a small clay weight.',
  },
  'art.good.cedar': {
    id: 'art.good.cedar',
    kind: 'good',
    horizon: 'A',
    src: file('good-cedar.jpg'),
    alt: 'A rope-tied stack of rough cedar planks and short logs showing pale cut ends.',
  },
  'art.good.pottery': {
    id: 'art.good.pottery',
    kind: 'good',
    horizon: 'A',
    src: file('good-pottery.jpg'),
    alt: 'Three stacked hand-thrown clay bowls and a small burnished jug.',
  },
  'art.good.textile': {
    id: 'art.good.textile',
    kind: 'good',
    horizon: 'A',
    src: file('good-textile.jpg'),
    alt: 'A folded wool cloth with red and blue bands and a clay loom weight.',
  },
  'art.good.incense': {
    id: 'art.good.incense',
    kind: 'good',
    horizon: 'A',
    src: file('good-incense.jpg'),
    alt: 'A clay bowl of dark resin with a thread of smoke and a small linen pouch.',
  },
  'art.good.silver': {
    id: 'art.good.silver',
    kind: 'good',
    horizon: 'A',
    src: file('good-silver.jpg'),
    alt: 'Cut pieces of silver and a coiled silver ring on a folded linen cloth.',
  },
  'art.good.palace-seal': {
    id: 'art.good.palace-seal',
    kind: 'good',
    horizon: 'A',
    src: file('good-palace-seal.jpg'),
    alt: 'A clay tablet of wedge marks beside a carved cylinder seal and a linen cord.',
  },
  'art.good.sibtu-cloth': {
    id: 'art.good.sibtu-cloth',
    kind: 'good',
    horizon: 'A',
    src: file('good-sibtu-cloth.jpg'),
    alt: "A folded red cloth with a blue and undyed border and a clay spindle whorl.",
  },
  'art.opening.unloading': {
    id: 'art.opening.unloading',
    kind: 'scene',
    horizon: 'A',
    src: file('opening-unloading.jpg'),
    alt: 'The harbor of Ugarit: porters carrying clay jars down the gangplank of a single round-hulled ship at the stone mole, painted plaster warehouses and green hills behind.',
  },
  'art.opening.oil': {
    id: 'art.opening.oil',
    kind: 'scene',
    horizon: 'A',
    src: file('opening-oil.jpg'),
    alt: 'Two red-banded Canaanite oil jars and a small linen purse on a reed mat, a harbor scribe\'s hand resting a reed stylus over a blank clay tablet.',
  },
  'art.ugarit.harbour': {
    id: 'art.ugarit.harbour',
    kind: 'place',
    horizon: 'A',
    src: file('ugarit-harbour.jpg'),
    alt: 'The harbor quay of Ugarit: plastered houses with painted red and blue doorways, reed awnings, a stone quay with reed mats, baskets and jars, porters, green vineyards and wooded hills.',
  },
  'art.ugarit.night': {
    id: 'art.ugarit.night',
    kind: 'place',
    horizon: 'A',
    src: file('ugarit-night.jpg'),
    alt: 'Ugarit after dark: oil lamps along the harbor wall, the sea black under a low moon, plastered houses closing their painted doorways, and one light burning above the temple roofs.',
  },
  'art.ugarit.market': {
    id: 'art.ugarit.market',
    kind: 'place',
    horizon: 'A',
    src: file('ugarit-market.jpg'),
    alt: 'A market street in Ugarit: a woman weighing grain on a bronze balance, baskets of fruit, bolts of dyed wool, and clay jars.',
  },
  'art.ugarit.palace-gate': {
    id: 'art.ugarit.palace-gate',
    kind: 'place',
    horizon: 'A',
    src: file('ugarit-palace-gate.jpg'),
    alt: 'The palace gate at Ugarit: ashlar walls with painted reliefs of lions and a king, a painted timber door with bronze studs, a striped awning, patterned paving, officials and a scribe in dyed robes, faded painted bands on the flanking walls.',
  },
  'art.ugarit.temple': {
    id: 'art.ugarit.temple',
    kind: 'place',
    horizon: 'A',
    src: file('ugarit-temple.jpg'),
    alt: 'The temple courtyard at Ugarit: a veiled singer with a frame drum, a small altar fire, clay oil lamps, and offerings of bread and fruit.',
  },
  'art.ugarit.workshops': {
    id: 'art.ugarit.workshops',
    kind: 'place',
    horizon: 'A',
    src: file('ugarit-workshops.jpg'),
    alt: 'A workshop yard at Ugarit: a potter at a hand-turned wheel, a smoking clay kiln, drying pots and stacked firewood.',
  },
  'art.cyprus.arrival': {
    id: 'art.cyprus.arrival',
    kind: 'place',
    horizon: 'A',
    src: file('cyprus-arrival.jpg'),
    alt: 'The Cypriot harbor: plank boats on a shingle beach, low whitewashed houses with reed roofs, and cakes of copper stacked on the shore.',
  },
  'art.cyprus.night': {
    id: 'art.cyprus.night',
    kind: 'place',
    horizon: 'A',
    src: file('cyprus-night.jpg'),
    alt: 'A Cypriot workyard at night: a kiln glowing red at the edge of the yard, a lamp on a bench, low reed-roofed houses dark under the stars, and the sea beyond.',
  },
  'art.cyprus.yard': {
    id: 'art.cyprus.yard',
    kind: 'place',
    horizon: 'A',
    src: file('cyprus-yard.jpg'),
    alt: 'A copper yard on Cyprus: stacks of ingots, a bronze balance with stone weights, a broker with a tally, and a scribe marking a clay tablet.',
  },
  'art.cyprus.landing': {
    id: 'art.cyprus.landing',
    kind: 'place',
    horizon: 'A',
    src: file('cyprus-landing.jpg'),
    alt: 'The landing on Cyprus: boats drawn up on shingle, coiled rope and clay jars, and a bare-backed shipmaster looking out to sea.',
  },
  'art.cyprus.smithy': {
    id: 'art.cyprus.smithy',
    kind: 'place',
    horizon: 'A',
    src: file('cyprus-smithy.jpg'),
    alt: 'Ada, a Cypriot smith in a linen head-wrap and hide apron, holding tongs at a charcoal hearth with a hammer on the stone block, while a girl of about nine sorts charcoal into a basket beside her.',
  },
  'art.cyprus.inn': {
    id: 'art.cyprus.inn',
    kind: 'place',
    horizon: 'A',
    src: file('cyprus-inn.jpg'),
    alt: 'A Cypriot inn courtyard at dusk: a low table with bowls and a wine jar, travelers on stools, an innkeeper pouring, and a clay brazier.',
  },

  /*
   * The menu and the prologue. The two shores the journey reaches, then the world as it
   * stands before the traveler: a gate and its tablets, a palace store of copper and
   * tin, the arrival, the shrine and its pilgrims, and the balance on the quay. Each of
   * these was regenerated until the architecture read as Late Bronze Age Levant or
   * Cyprus rather than classical or medieval; see `assets/exploratory/README.md`.
   */
  'art.land.levant': {
    id: 'art.land.levant',
    kind: 'place',
    horizon: 'A',
    src: file('land-levant.jpg'),
    alt: 'A Levantine landing below wooded hills: a square stone gate tower, flat mud-brick houses with pale plaster, red- and blue-banded doorways, reed awnings and mats, jars and pomegranates on a quay beside green water, vineyards and olive terraces.',
  },
  'art.land.cyprus': {
    id: 'art.land.cyprus',
    kind: 'place',
    horizon: 'A',
    src: file('land-cyprus.jpg'),
    alt: 'A Late Cypriot courtyard above a blue bay: dressed stone below painted plaster, a red and mauve band around a timber door, a low tower with a faded painted frieze, an upright betyl, copper slabs and White Slip wares, olive and vines, pine-wooded hills.',
  },
  'art.prologue.gate': {
    id: 'art.prologue.gate',
    kind: 'place',
    horizon: 'A',
    src: file('prologue-gate.jpg'),
    alt: 'The open gate of a Levantine town: a timber door in a rough ashlar wall, a blank clay tablet and cut reed on a stone bench, a basket of tablets, and bread and an oil jar on the paving.',
  },
  'art.prologue.bronze': {
    id: 'art.prologue.bronze',
    kind: 'place',
    horizon: 'A',
    src: file('prologue-bronze.jpg'),
    alt: 'A palace storeroom: two thick oxhide-shaped copper slabs and gray tin slabs on a stone shelf, a beam balance with clay pans, sealed jars and cedar beams, and daylight from a small high window.',
  },
  'art.prologue.arrival': {
    id: 'art.prologue.arrival',
    kind: 'place',
    horizon: 'A',
    src: file('prologue-arrival.jpg'),
    alt: 'A round-hulled boat with a square sail at a stone quay, a bare-chested man in a wrapped kilt seated with a reed, two sealed jars and coiled rope on the stones, and flat-roofed warehouses behind.',
  },
  'art.prologue.temple': {
    id: 'art.prologue.temple',
    kind: 'place',
    horizon: 'A',
    src: file('prologue-temple.jpg'),
    alt: 'The stone shrine at Ugarit: a carved stela of a bearded god with a spear and a conical crown beside a plain weathered one, and a line of wrapped pilgrims with a lamb and baskets climbing the steps past clay jars.',
  },
  'art.prologue.purse': {
    id: 'art.prologue.purse',
    kind: 'place',
    horizon: 'A',
    src: file('prologue-purse.jpg'),
    alt: 'Two hemispherical bowls of one shape side by side — a white-slipped Cypriot bowl with a dark band of lozenges, and a local copy with a red band and a painted fish — beside a beam balance holding cut pieces of silver, jars, folded cloth, a tablet and an oxhide-shaped copper slab.',
  },

  /*
   * The wider world of 1230 BCE, as the menu shows it and the prologue visits it: Egypt,
   * Hatti, the Aegean, Elam and Mesopotamia, Nubia, Cyprus, Shang China and the ruins of
   * the Indus. Each is a place as it stood that year, not a road the journey takes; the
   * notes behind them are in `docs/design/05-the-world-in-1230.md`.
   */
  'art.world.karnak': {
    id: 'art.world.karnak',
    kind: 'place',
    horizon: 'A',
    src: file('world-karnak.jpg'),
    alt: 'The temple of Amun at Karnak: two tapering pylons with painted reliefs in blue, green, red and gold, gilded obelisk tips, painted columns and cornice, priests crossing the court, green Nile fields and palms beyond.',
  },
  'art.world.giza': {
    id: 'art.world.giza',
    kind: 'place',
    horizon: 'A',
    src: file('world-giza.jpg'),
    alt: 'The three pyramids and the Sphinx on the ochre Giza plateau, travelers on the sand, and below the plateau edge a green flood plain of barley, canals, palms and a mud-brick village.',
  },
  'art.world.hattusa': {
    id: 'art.world.hattusa',
    kind: 'place',
    horizon: 'A',
    src: file('world-hattusa.jpg'),
    alt: 'The Lion Gate at Hattusa: rough cyclopean stone with a lion relief, plastered mud-brick walls with a red and black painted band and a painted timber door, Hittite guards and an ox cart, oak and pine woodland, pasture and a stream, flat-roofed citadel above.',
  },
  'art.world.chogha-zanbil': {
    id: 'art.world.chogha-zanbil',
    kind: 'place',
    horizon: 'A',
    src: file('world-chogha-zanbil.jpg'),
    alt: 'The ziggurat of Chogha Zanbil: mud-brick terraces with blue-green glazed bands and knobs, painted geometric bands on the enclosure walls, dyed banners, Elamite priests and servants, irrigated barley, date palms and the Zagros beyond.',
  },
  'art.world.mycenae': {
    id: 'art.world.mycenae',
    kind: 'place',
    horizon: 'A',
    src: file('world-mycenae.jpg'),
    alt: 'The Lion Gate at Mycenae: two carved lions above the lintel in a massive stone wall, with green barley, olive groves, cypress and mountains.',
  },
  'art.world.abu-simbel': {
    id: 'art.world.abu-simbel',
    kind: 'place',
    horizon: 'A',
    src: file('world-abu-simbel.jpg'),
    alt: 'The Great Temple of Abu Simbel cut into the Nubian cliff, colossi flanking the doorway, and below a narrow green Nile bank of palms, reeds and barley with a boat, a village and cattle.',
  },
  'art.world.dur-kurigalzu': {
    id: 'art.world.dur-kurigalzu',
    kind: 'place',
    horizon: 'A',
    src: file('world-dur-kurigalzu.jpg'),
    alt: 'The Kassite ziggurat of Dur-Kurigalzu above a canal and green barley: a shaduf, a reed boat, marsh birds, date palms, flat-roofed houses, workers carrying baskets and a scribe.',
  },
  'art.world.enkomi': {
    id: 'art.world.enkomi',
    kind: 'place',
    horizon: 'A',
    src: file('world-enkomi.jpg'),
    alt: 'The copper town of Enkomi: stone-based houses with plastered walls, a red and mauve painted doorframe and a geometric frieze, a kiln, a wooden beam balance with clay pans, Cypriot pots, olive terraces, pine and oak hills, a blue bay.',
  },
  'art.world.anyang': {
    id: 'art.world.anyang',
    kind: 'place',
    horizon: 'A',
    src: file('world-anyang.jpg'),
    alt: 'The Shang capital at Anyang: a rammed-earth platform with plain red-brown timber posts and a straight thatched hall, bronze ding vessels and bronze workers, green millet fields, river reeds and wooded hills.',
  },
  'art.world.mohenjo-daro': {
    id: 'art.world.mohenjo-daro',
    kind: 'place',
    horizon: 'A',
    src: file('world-mohenjo-daro.jpg'),
    alt: 'The ruins of Mohenjo-daro beside the Indus: brick streets, covered drains and the great bath, green grass between the walls, reeds, a boat, and herders with goats.',
  },

  // Scenes: the cloth thread's beats. One picture per beat, never one used twice.
  'art.ugarit.cloth-table': {
    id: 'art.ugarit.cloth-table',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-table.jpg'),
    alt: 'The weaver Sibtu at a low table with a folded bundle of cloth tied with cord, an upright warp-weighted loom with clay loom weights behind her.',
  },
  'art.ugarit.cloth-tied': {
    id: 'art.ugarit.cloth-tied',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-tied.jpg'),
    alt: 'Sibtu pulling a plain cord tight around a folded bundle of undyed cloth on a wooden table, the warp-weighted loom behind her.',
  },
  'art.ugarit.cloth-amends': {
    id: 'art.ugarit.cloth-amends',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-amends.jpg'),
    alt: 'Sibtu pushing a tied bundle of cloth across a low wooden table with two fingers, her face turned down and away.',
  },
  'art.ugarit.cloth-refused': {
    id: 'art.ugarit.cloth-refused',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-refused.jpg'),
    alt: 'Sibtu folding undyed cloth back into a pegged wooden chest while two children sit watching on the floor.',
  },
  'art.ugarit.cloth-missing': {
    id: 'art.ugarit.cloth-missing',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-missing.jpg'),
    alt: 'A bare table with a loose coil of cord where a cloth bundle had lain, Sibtu looking up from her loom.',
  },
  'art.ugarit.cloth-settle': {
    id: 'art.ugarit.cloth-settle',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-settle.jpg'),
    alt: 'Sibtu on the loom bench holding one hand out over the empty table, palm up, her shuttle set down beside her.',
  },
  'art.ugarit.cloth-settled': {
    id: 'art.ugarit.cloth-settled',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-settled.jpg'),
    alt: "Sibtu counting cut pieces of silver from her palm into a small wooden box, the loom's warp bare behind her.",
  },
  'art.ugarit.cloth-kept': {
    id: 'art.ugarit.cloth-kept',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-kept.jpg'),
    alt: 'Sibtu at the loom with her shuttle in hand, two children standing still in the doorway behind her.',
  },
  'art.ugarit.cloth-after': {
    id: 'art.ugarit.cloth-after',
    kind: 'scene',
    horizon: 'A',
    src: file('ugarit-cloth-after.jpg'),
    alt: 'Sibtu seen from behind at a working warp-weighted loom, a shut roped chest and an empty table in the sunlit room.',
  },

  'art.ugarit.amnit': {
    id: 'art.ugarit.amnit',
    kind: 'portrait',
    horizon: 'A',
    src: file('ugarit-amnit.jpg'),
    alt: 'Painted portrait of Amnit, a Levantine merchant woman in a linen head-wrap and fringed shawl, holding a clay tablet.',
  },
  'art.ugarit.hannu': {
    id: 'art.ugarit.hannu',
    kind: 'portrait',
    horizon: 'A',
    src: file('ugarit-hannu.jpg'),
    alt: 'Painted portrait of Hannu, a weathered harbor official with a gray beard and a clay seal at his chest, a mud-brick wall and jars behind him.',
  },
  'art.ugarit.yada': {
    id: 'art.ugarit.yada',
    kind: 'portrait',
    horizon: 'A',
    src: file('ugarit-yada.jpg'),
    alt: 'Painted portrait of Yada, a scribe with ink-stained fingers, holding a clay tablet and a reed stylus.',
  },
  'art.ugarit.tiro': {
    id: 'art.ugarit.tiro',
    kind: 'portrait',
    horizon: 'A',
    src: file('ugarit-tiro.jpg'),
    alt: 'Painted portrait of Tiro, a wind-burnt shipmaster with a coil of rope over his shoulder, a furled sail behind him.',
  },
  'art.ugarit.belet': {
    id: 'art.ugarit.belet',
    kind: 'portrait',
    horizon: 'A',
    src: file('ugarit-belet.jpg'),
    alt: 'Painted portrait of Belet, a temple singer in a linen veil and bead necklace, holding a frame drum.',
  },
  'art.ugarit.sibtu': {
    id: 'art.ugarit.sibtu',
    kind: 'portrait',
    horizon: 'A',
    src: file('ugarit-sibtu.jpg'),
    alt: 'Painted portrait of Sibtu, a displaced weaver in a plain headscarf and fringed mantle, a loom behind her.',
  },
  'art.ugarit.mole': {
    id: 'art.ugarit.mole',
    kind: 'place',
    horizon: 'A',
    src: file('ugarit-mole.jpg'),
    alt: "The stone mole at Ugarit along the quay: porters with jars and baskets, a ship's stern and furled sail, warehouses and reed awnings, the walled city above.",
  },
  'art.cyprus.kinyras': {
    id: 'art.cyprus.kinyras',
    kind: 'portrait',
    horizon: 'A',
    src: file('cyprus-kinyras.jpg'),
    alt: 'Painted portrait of Kinyras, a Cypriot copper broker holding an ingot, stacks of copper behind him.',
  },
  'art.cyprus.ada': {
    id: 'art.cyprus.ada',
    kind: 'portrait',
    horizon: 'A',
    src: file('cyprus-ada.jpg'),
    alt: 'Painted portrait of Ada, a Cypriot smith with soot on her cheek, holding a hammered bronze bowl, the forge behind her.',
  },
  'art.cyprus.shipti': {
    id: 'art.cyprus.shipti',
    kind: 'portrait',
    horizon: 'A',
    src: file('cyprus-shipti.jpg'),
    alt: 'Painted portrait of Shipti, a Cypriot innkeeper in a faded head-wrap and shawl, holding a wine jar.',
  },
}

export function artFor(id: string | undefined): ArtAsset | null {
  if (!id) return null
  return ART[id] ?? null
}
