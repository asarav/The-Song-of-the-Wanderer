# Playtest notes — design-owner quick pass, 2026-11-27

- **Persona:** design owner (knows the design documents)
- **Seed:** not recorded
- **Build:** `4f1720f` plus the fixes listed below
- **Dev server:** http://127.0.0.1:5173
- **Duration:** short pass, notes only; no recording
- **Session type:** design-owner quick pass — **not** one of the three Gate A sessions and
  not counted toward M4-T01

These are the notes the design owner wrote after playing the current slice. They are kept
verbatim in substance, with the response to each note recorded beside it. The pass is useful
for bug and friction discovery; it is not a substitute for the trader, curious-traveller and
helper sessions Gate A requires, and it cannot supply M4-T02 verdicts on its own.

## What the pass covered

Opening and prologue, Ugarit port and places, market buying and selling, roads and passage,
the crossing, Cyprus arrival, the copper yard, Ada's smithy, the inn, night events, the
journal, the maps, and the ending letter.

## Notes and response

### Reading and controls

1. **The Continue button moves as the text advances**, so the mouse has to follow it.
   The scene card now keeps a page's height and the Continue row sits at its foot, sticking
   to the viewport while a long beat scrolls. The prologue uses the same shape.
2. **The market needs horizontal scrolling at lower widths.** The price list now becomes
   one card per good whenever the reading column is narrow, not only when the window is.
   Buy and Sell moved into a wrapping row with the quantity control.

### Market and goods

3. **Goods pictures do not change by region.** Each port may now give a good its own
   picture. Cyprus has seven variants (grain, pottery, wool, oil, copper, tin, incense) so
   the island's wares read as Cypriot rather than Levantine.
4. **No way to choose a quantity when buying or selling.** Every row has a quantity field;
   Buy and Sell act on it, and the buttons say why they are unavailable when the purse,
   the stock or the hold cannot cover the chosen amount.

### Understanding the systems

5. **It was not clear why grain was needed for passage, or what "reserve" is, or where to
   watch it.** The sidebar now shows `Reserve n/8 · Grain n` under the purse. Roads explains
   that a passage spends fare, grain and reserve, that grain is food and not cargo, and
   where to buy it. The missing-grain line now says how much is needed and how much is
   carried.
6. **"Ordinary days at port" was vague.** The rest note now says plainly that rest restores
   reserve and a single day at port only passes time.
7. **No confirmation when a language improves.** A lesson now produces a status line such as
   "Your Cypriot improves (+4 xp)." or "Your Ugaritic is now basic."
8. **"Ugarit is tense" was unexplained.** A local state now carries authored plain-language
   note text, shown under its tag; Ugarit's `tense` says food is dear and the inland road is
   watched.

### Conversations and causality

9. **"Your jars are on the second shelf" had no point.** Hannu's night line now explains the
   harbor warehouse, the nightly fee he has waived, and why he counted the jars.
10. **The crossing offered no choice about who settled the toll.** "Keep your silver and work
    the rest of the crossing" is now always available, whether or not the purse could pay the
    master.
11. **"Neither can I" was not an answer to Belet's question.** It is replaced by a question
    about what she will do if the name turns out to be a joke, with her answer.
12. **"You write like a man copying a sign he does not love" had no clear speaker and no
    setup.** Yada now asks the traveler to copy their name first and says the line over the
    tablet, so the judgment has an object and a speaker.
13. **Looking at Shipti's shelf did nothing.** It now opens a scene: she shows the sealed
    tablet, refuses to hand it over in a watched yard, and promises it in the courtyard the
    next day — which is when the existing letter event fires.
14. **The tripod conversation with Ada repeated forever.** Finishing the tripod now sets a
    flag; later visits find her casting a votive blade, with a new question and a new line
    about her work.
15. **Night events repeated the same scene every night.** The Ugarit night watch and the
    Cypriot night kiln now open on a second, shorter night after the first, so neither
    conversation replays verbatim.
16. **"Nobody thanks you" made everyone sound stoic.** The squall now ends with the boy
    sharing bread and the master no longer shouting the traveler's name like a job.

### Navigation and records

17. **"Place" was a vague menu name.** The group and its screen are now called **Port**.
18. **The journal was oldest-first.** It is newest-first, and says so.
19. **The regional and world maps looked identical, and fog looked like water.** Unknown
    ground is now blank paper with a dashed edge instead of the sea wash. The regional sketch
    explains that it shows the region you are standing in; the world sketch says outright
    that with one known region it will show the same ground, and why.
20. **The game title sat in the sidebar.** Removed; the rail now starts with the date, place
    and purse.

## Not fixed in this pass

- **Audio repetition.** The slice has one looping bed per place and no additional audio was
  produced for this pass. The loop length is the cause; it needs an audio pass, not a code
  tweak.
- **Conversations feel superficial; motivations and through-lines are thin.** The named
  confusions were fixed, but a real pass over the cast's wants and the links between their
  scenes is content work, not a line edit. It is the largest finding for M4-T03.
- **Rules for repeatable conversation.** The rule is now written in `docs/CONTENT.md` and the
  two nightly offenders and Ada's commission are gated, but other graphs have not been
  audited against it.

## What this pass does not establish

- No Gate A persona was played, no session was recorded, and the player knows the design.
- Balance, the seven §22.1 questions, and the expand/revise/stop decision still need the
  three recorded human sessions in `docs/playtests/README.md`.
