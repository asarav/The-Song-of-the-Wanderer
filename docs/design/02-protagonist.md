# The protagonist

Design truth for who the player is, what may be revealed, and what must stay unresolved.
Source: spec §5, §13.6, §17.3. This file overrides improvisation.

## 1. Premise

A travelling merchant in the Late Bronze Age. Not a chosen ruler, not a warrior, not a
priest. Their trade is the key that opens ordinary and elite doors: grain with a farmer,
copper with a smith, a sealed letter with an official, a story with a performer.

They do not age normally. They are still vulnerable to injury, imprisonment, loss,
hunger, and grief. The game never supplies a definitive explanation of their nature.

## 2. Hard rules

1. **Never confirm divinity.** No scene, codex entry, or ending states "you are a god"
   as fact. Every supernatural event must retain at least one mundane reading.
2. **Never deny it either.** Do not resolve the mystery in the other direction. The
   question stays open.
3. **No power fantasy.** No combat superpowers, no divine smiting, no immortality that
   removes stakes. Longevity is a burden and a wound as much as a gift.
4. **No universal pantheon.** A local deity who resembles the protagonist is not the same
   being as a deity elsewhere. Similar domains do not imply identity.
5. **Recognition must have a mechanism.** If someone knows the protagonist, the story
   must supply a plausible route: a story, a token, a family account, a resemblance, a
   rumour, a mistake. Never teleport knowledge.
6. **The player chooses their interpretation.** Dialogue offers embrace, rejection,
   investigation, and indifference. None is canonically correct.
7. **The protagonist has a voice.** Choices express temperament; they are not blank
   alignment switches.

## 3. Player-shaped identity

At the start the player sets:

- **Name** — what people call them here. Not a cosmic true name.
- **Presentation** — clothing, grooming, bearing; affects first impressions, never gates
  content.
- **Background** — two or three modest details (a home port, a former partner, a debt, a
  language learned young). These seed dialogue and contacts, not stats.
- **Starting knowledge** — one trade language at Basic, one regional contact, a small
  inventory.

The deeper origin is not selected and not explained.

## 4. Names across cultures

The protagonist accumulates names. Each is a local interpretation, not a translation
table:

| Kind | Example shape | Rule |
|---|---|---|
| Epithet | "the one who arrives" | Coined by a community; linguistically researched |
| Title | a ruler's grant | Tied to a specific favour and court |
| Story-name | a figure in an old tale | The tale predates the protagonist's apparent life |
| Mistaken name | a god or hero's name | Locals disagree about the identification |
| Family name | inherited from someone who helped them | Descendants use it without meeting the protagonist |

Rules:

- Names are researched per language. No exotic-sounding inventions without a source and
  a note.
- Names can contradict: benevolent in one place, a trickster in another.
- A name never functions as a key that unlocks all content. It changes how people talk,
  not what is mechanically possible.
- Track names in `docs/design/dossiers/` per region and in the player identity
  (`player.identity.localNames`). Use `flags` only for small local conditions, not as the
  primary record of identity or accomplishment. See `docs/DATA_MODEL.md` §4.

## 5. Longevity mechanics

- Time advances in days; the protagonist's apparent age changes only at authored
  thresholds.
- After roughly the first decade, visible ageing stops. This is noticed only by people
  who have a reason to compare memories.
- Most people do not recognise them across decades. Recognition is authored, rare, and
  earned.
- Recurring characters age normally. Descendants inherit stories, debts, and grudges.
- The journal records long gaps explicitly; no unexplained time skips.
- Each act should contain at least one scene about the cost of outliving someone or
  something.

## 6. The mystery ladder

How much the player can infer, by phase. Never more than this:

| Phase | What the world offers |
|---|---|
| Prologue | One recognition that cannot be explained; one dream or symbol |
| Act I | Contradictory local names; a story that seems to describe them; a stranger's odd courtesy |
| Act II | Someone recognises them after decades; a temple specialist is unsettled; a rumour precedes them |
| Act III | A community's story places them at an event they never attended; a god seems to notice them |
| Act IV | Descendants know them; different traditions claim them; the protagonist's own memory is questioned |
| Act V | Direct encounters with apparent gods; the player's interpretation is tested, not answered |
| Endgame | The player chooses what it means to them; the cosmos stays silent |

The ladder is a ceiling, not a checklist. A run that avoids the mystery must remain
coherent.

## 7. Voice

- Observant, practical, dry rather than quippy.
- Curious about how things are made and why people do what they do.
- Comfortable with silence; not a lecturer.
- Speaks in concrete images, not abstractions.
- Never uses modern therapeutic or bureaucratic language.

Sample register (not final copy):

> "The harbour smelled of tar and fish and someone's burnt porridge. A clerk was
> arguing with a sailor about the weight of a jar. I had three days before the ship
> left, and nothing to do but learn the city."

## 8. Arc questions

The protagonist's arc is not "what am I?" but "what will I do with the time I have?"

- Belonging versus movement.
- Memory versus preservation.
- Intervention versus witness.
- Being worshipped, feared, used, or misidentified.
- What is owed to people who trust them.

These questions must appear in scenes, not in narration.

## 9. Ending stance

Endings are thematic families (spec §6.2 Endgame), combinable. None resolves the
metaphysics. The final choice is about meaning and attachment:

- Keeper of Names
- Friend of Peoples
- King's Companion
- Merchant Beyond the Horizon
- The One Who Stayed
- The Unremembered Traveler
- The Divine Name (accepted, rejected, or evaded)
- The Unfinished Road

Conditions are authored from accumulated relationships, journeys, languages, preserved
knowledge, and the player's stated interpretation. No single mandatory final location.
