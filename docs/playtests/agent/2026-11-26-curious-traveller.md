# Playtest report — curious traveller, 2026-11-26

- **Persona:** curious traveller
- **Seed:** `curious-1126` (typed into the new-game field before Step ashore)
- **Build:** uncommitted tree on `35d5426` (77 dirty entries at session start)
- **Dev server:** http://127.0.0.1:5173 (`pnpm dev`)
- **Duration:** ~35 minutes, 7 in-game days (Ugarit day 1 → Cypriot harbour day 7)
- **Screens visited, in order:** title, new game, opening scene (8 beats), tally-board
  choice, Hannu gate scene, place (Ugarit), People, Yada, Tiro, Roads (empty), Roads
  (crossing known), journey scenes (anchorage, patrol check, anchorage again), arrival
  scene (Shipti), place (Cypriot harbour), Ada, Status, Market, Map (this place / region /
  world), Codex, Journal, Save.
- **Session type:** agent session (not human evidence)

## Story of the session

I read the whole opening — eight beats that place a trader in Ugarit between the Hittite
north and Egypt — and then chose the option a curious stranger would choose: ask the man
with the tally board what oil fetches. He said seven a jar, nine if the levies are late.
At the gate, Hannu asked for name, cargo and history; I gave the name and the two jars of
oil, and the prose told me the harbour tax would be three for oil. My purse did not move.
I asked where a person finds work, remembered the answer, and went up the hill.

In the city I read the four-beat place introduction, then talked to Yada about the
alphabet ("Who taught you?") and to Tiro about the island. Tiro wanted eight silver to
hug the shore or fourteen to cross straight; I offered to work the passage instead, and he
told me to be at the mole before the gulls. At that point the Roads screen still said I
knew no crossings, and leaving the scene to look had stranded it (B2); a day later the
route was known and both modes appeared.

I took the coastal passage for eight silver. The crossing was five days and three scenes:
a light on a shore with a sleepy man at the bow, a patrol boat that took six silver in
toll, and then the same anchorage scene again, word for word. I arrived at the Cypriot
harbour, paid three silver for two nights at Shipti's inn, and spent the rest of the day
on the town: Ada the smith (a tripod, and the island word for it), the market (bought one
copper at ten), the three map scales, the codex, and the journal.

## Bugs

### B1 — "Continue a saved run" resumes the manual save, not the newest autosave

- Severity: major (it silently rewinds a run; no data is destroyed, but a player loses
  progress they were told was saved)
- Where: title screen → Continue; Save screen ("AUTOSAVE after every action")
- Steps (fresh run, reproducible):
  1. Begin, Step ashore, play to a place screen and spend one day (rail: day 3).
  2. Save screen → **Save here** (writes `song-of-the-wanderer.save.v1`).
  3. Spend two more days (rail: day 5). The autosave now holds day 5.
  4. Reload the page, or close the tab and reopen it.
  5. Press **Continue a saved run**.
- Expected: resume day 5, the state the screen says is autosaved after every action.
- Actual: resumed day 3, the manual slot. No label, date or confirmation says which save
  is being loaded.
- Evidence: at step 3, `localStorage["song-of-the-wanderer.autosave.v1"]` had
  `state.calendar.day = 4` and `save.v1` had `day = 2` (the payload day is the rail day
  minus one). After Continue, the rail read **day 3** — the manual payload, not the
  autosave. With the manual slot absent, Continue fell back to the autosave correctly, so
  the defect is which slot is preferred, not a missing write.
- Notes: this is what ended the persona session. It ended on day 7 with 13 silver after
  buying copper; Continue came back at day 6 with 20 silver, matching an older manual save
  in storage (payload day 5) rather than the run just played. Two save payloads were
  present, dated day 3 and day 5, with seed `wanderer-1`.

### B2 — A pending scene is stranded if the player opens a sidebar screen

- Severity: major (soft lock: no dialogue, no travel until a day is spent)
- Where: any scene, then any nav screen; observed with Tiro's bargain, day 1
- Steps:
  1. Talk to Tiro → "I will work for the passage instead" → continue → "Be there before
     the gulls." (the scene is showing its last beats).
  2. Click **Roads** or **Place** in the sidebar.
  3. Try to speak to anyone.
- Expected: the scene stays reachable — it is still the game's pending state — or the
  rail's "A scene is waiting" is a control that reopens it.
- Actual: the screen shows the place; the rail says "A scene is waiting"; every Speak is
  refused with "There is already someone speaking."; there is no Scene entry in the nav.
- Evidence: feedback line "There is already someone speaking." while `scene` was absent
  from the DOM and the rail flag was set. The scene came back with its beats intact only
  after **Spend the day**, which advanced the calendar from day 1 to day 2 — recovering
  cost a day of travel time.
- Notes: the wipe itself is easy to do by accident, because the sidebar stays enabled
  while a scene is open.

### B3 — The harbour tax is narrated but never charged

- Severity: minor (prose and wallet disagree; the first priced scene teaches the player
  not to trust numbers)
- Where: Ugarit harbour gate, day 1, Hannu
- Steps:
  1. Fresh run → opening → Hannu's "Name. Cargo. And whether you have been in this
     harbour before."
  2. Choose "Give the name you use here, and the two jars of oil."
  3. Repeat with "Say nothing and let him look at you."
- Expected: purse 40 → 37 (the line says three for oil), or a line saying why it is not
  taken (deferred, waived, paid by someone else).
- Actual: purse stays **40** on both branches; the scene's only priced statement has no
  effect anywhere in the session.
- Evidence: "The harbour tax is two, unless the cargo is oil, in which case it is three
  and nobody has ever explained why." with `.where .purse` reading `40 silver` before and
  after both branches. Contrast: Shipti's "two nights" charge did take three silver
  (26 → 23), so priced prose can be wired up.

### B4 — Internal content ids appear in player-facing text

- Severity: minor
- Where: Roads ("The crossing to Cyprus"), Status (deeds), after learning the crossing
- Steps: learn the crossing from Tiro → Roads; then take passage → Status.
- Expected: "Ugarit → The Cypriot harbour"; a deed line without an id.
- Actual: the route subtitle reads `dest.ugarit → dest.cyprus · sea · moderate risk`; the
  Status deed reads `travelled · dest.cyprus`.
- Evidence: captured DOM strings on both screens.

### B5 — Generated titles repeat the article: "The market at The Cypriot harbour"

- Severity: cosmetic
- Where: Market and Map headings at the Cypriot harbour, day 7
- Steps: arrive at the Cypriot harbour → Market; → Map (This place).
- Expected: "The market at the Cypriot harbour" / "The quarter around the Cypriot
  harbour" (or a place name without its article in these templates).
- Actual: "The market at **The** Cypriot harbour"; "The quarter around **The** Cypriot
  harbour".
- Evidence: screen headings.

### B6 — The same authored encounter fires twice in one crossing

- Severity: minor
- Where: coastal crossing, day 4 and day 6
- Steps: take the coastal passage → resolve the anchorage encounter (ask whose light it
  is) → "Count what is left." → the next waypoint draws the same encounter.
- Expected: each waypoint slot draws a different authored encounter, or a variant.
- Actual: identical two paragraphs, identical two choices ("Stay until the light goes
  out." / "Ask the man at the bow whose light it is."), two days apart. The journal
  recorded "A night at anchor" once, so the repetition appears in play but not in the
  record.
- Evidence: the two captures, day 4 and day 6, matching word for word.

### B7 — "Continue a saved run" is offered when there is no save, and does nothing

- Severity: minor
- Where: title screen after both save keys are absent
- Steps: with no `autosave.v1` and no `save.v1`, open the title and press **Continue a
  saved run**.
- Expected: hidden or disabled while nothing can be continued, or a message saying so.
- Actual: the button is present; pressing it changes nothing at all — no feedback, no
  transition.
- Evidence: storage contained only `text-size.v1`; the title still offered both buttons;
  the click left the title screen unchanged and the feedback slot empty.

## Friction

| Where | What the player was trying to do | What cost them time or confidence |
|---|---|---|
| Place (Ugarit), day 1 | Visit the harbour, the palace gate, the temple, the workshop quarter — the opening says each wants something different from a stranger | All four are cards with title, illustration and description but no control; only "The market" has a button. The first instinct after the introduction leads nowhere, and the player cannot tell whether it is broken or closed. |
| Market (Cyprus), day 7 | Buy a copper ingot to see how trade works | Pressing Buy changes the stock, the carried count and the purse, and says nothing. The note "Your basic speech gets you 2% off the asking price" is not observable either: the price shown was 10 and 10 was taken. The player asks "did that go through, and did my language help?" |
| Codex, day 7 | Read up on the places and goods just met | One entry exists after two ports, nine people and a purchase: "Akkadian, the language of the ledger". The screen shows no count and no locked shelf, so it reads as empty rather than early. |
| Journal, day 7 | Re-read the day | The three entries are a small block above a conversation log that repeats every line of the session, oldest first. The good prose is buried under the transcript. |
| Map → Region (Cyprus), day 7 | See the island | One marker ("you are here / The Cypriot harbour") and a lot of blank; the copy explains that only known ground is drawn, but the curious player's question — "is that all there is here?" — has no answer on screen. The world scale is much more informative. |
| Journey, days 4-6 | Follow a conversation | The man at the bow and the patrol's speaker talk in quotation marks with no name tag, while Hannu, Yada, Tiro, Shipti and Ada all get one. Narration and speech are hard to tell apart at a glance. |
| Patrol boat, day 5 | Understand who paid | "Say nothing and let the master handle it" still costs the player six silver; the prose ("The silver goes into a bag that is already full") does not say whose silver. |
| Yada, day 1 | Meet the scribe | His opening line, "You write like a man copying a sign he does not love", assumes a writing ability the opening never gave the protagonist (it says only that you speak enough Akkadian to be understood at a gate). Small, but it is the first line of the first character the player chooses to meet. |
| Place (Ugarit), day 1-2 | Leave a conversation | Clicking a sidebar screen during a scene strands it (B2), so the cost of looking at the map mid-conversation is a day. |

## Ideas

### I1 — Let the place cards open

- Pillar: 3, "the ancient world is colorful and specific" (and 1, the journey)
- Player problem: four of the five advertised parts of Ugarit cannot be entered; the
  place reads as a menu with one working item.
- Evidence: the Place screen, day 1 — harbour, palace gate, temple and workshop quarter
  all static.
- Cost: content — one short scene each, reusing the existing scene/dialogue system; no new
  mechanic.
- Sketch: each card's button opens a two- or three-beat vignette with one small choice
  (a porter's rumour, a temple singer's hymn, a potter's complaint). The harbour's version
  could also be where route knowledge is offered, which would give Tiro's bargain a
  second door.

### I2 — Give the codex something to collect

- Pillar: 7, "curiosity is rewarded"
- Player problem: two ports and a purchase produced one entry, so the collection did not
  register as a collection.
- Evidence: Codex, day 7.
- Cost: content plus unlock triggers on first meeting a place, a good or a person. The
  triggers are mechanic-adjacent — **needs the scope gate** if they are new effects.
- Sketch: a "known" entry per destination, per traded good and per recurring character,
  unlocked by the existing knowledge/deed effects rather than a new system.

### I3 — Split the Journal into entries and transcript

- Pillar: 2, "people make history personal"
- Player problem: the session transcript buries the day's three entries.
- Evidence: Journal, day 7.
- Cost: UI only (tabs or a collapsible "Conversation log" section).
- Sketch: entries first and always; the log behind a disclosure labelled "Everything said
  in this session (not saved)".

### I4 — Name the speaker, or mark narration

- Pillar: 3 and 8 (specific world, honest record)
- Player problem: incidental speakers quote without attribution, so the player cannot tell
  who is talking or whether a line is speech at all.
- Evidence: the tally-board man (day 1), the man at the bow (day 4), the patrol speaker
  (day 5).
- Cost: copy and a small UI rule (a "Narration" tag exists in the journal already, so the
  pattern is present).
- Sketch: give recurring bit-part speakers a name, and show the existing narration label
  in scenes rather than only in the log.

### I5 — Keep a fixed stop from repeating inside one journey

- Pillar: 1, "the journey is the game"
- Player problem: the same anchorage twice in five days makes the crossing feel
  procedurally thin at exactly the moment it should feel authored.
- Evidence: B6, days 4 and 6.
- Cost: content tagging (mark the event as once-per-journey), small.
- Sketch: a per-journey "already used" set for fixed-stop events, the way cooldowns
  already work for scheduled events.

### I6 — Say "at the shortest" where a duration is shown

- Pillar: 8, "the game respects historical uncertainty" (here: not overstating precision)
- Player problem: the world map labels the crossing "3 days" while the coastal passage
  took five; the small print elsewhere says "at the shortest", the label does not.
- Evidence: World map, day 7; the journey's own five days.
- Cost: copy.
- Sketch: "3 days at the shortest" on the world sketch, or the chosen mode's duration
  once passage is arranged.

## The seven questions

| # | Question | Verdict | Confidence |
|---|---|---|---|
| 1 | Travel loop enjoyment | promising | medium |
| 2 | Trading as a reason to travel | not enough evidence | medium |
| 3 | Character memorability and desire to return | promising | medium |
| 4 | Language progression as reward, not obstruction | weak | low |
| 5 | Faction relationships as understandable opportunity | not enough evidence | high |
| 6 | Vivid, distinctive ancient world | strong | medium |
| 7 | Mystery as curiosity, not confusion | not enough evidence | high |

**1. Travel loop.** Buying passage was legible — two modes, price and days side by side,
a captain who quotes the same numbers he quoted in conversation — and the crossing
produced two stops and three scenes in five days. What it did not produce was surprise:
the second anchorage was the first anchorage, word for word. Promising, because the shape
works and the pacing (a day per leg, a scene per stop) is right; not strong, because this
crossing ran out of authored material before it ran out of days.

**2. Trading.** I saw one market (Cyprus), bought one good, and never saw a second price
to compare it with, because I did not go back to Ugarit's market and the session ended
there. The interface also hid the one trade signal it claims to have: the 2% language
discount could not be seen in a 10-silver purchase. "Not enough evidence" is the honest
answer; a trader session that buys in one port and sells in the other is the test.

**3. Characters.** Hannu's tax line, Tiro's "the island does not want any of us", Ada's
tripod for a man who will never use it, and Shipti's "the yard is honest, the harbour is
not" are four distinct voices in one day, and I remembered all four without notes. Tiro's
obligation showed up in Status (`Tiro Obligation +1`), which is the seed of a reason to
come back. The doubt is structural: the slice has two destinations, so "seeing them again"
cannot yet be acted on.

**4. Language.** The island tongue went from nothing to "unfamiliar · 5 xp" on one
remark, and the market note promised 2% off — but no price moved visibly, so the reward
was invisible. Nothing obstructed me: the one language gate I met ("Argue the toll in
Akkadian — your Akkadian is not quick enough") offered three other routes and said why.
So: not obstructive, not yet rewarding. Low confidence, because 5 xp and one shop is a
very small sample.

**5. Factions.** None of the session's scenes involved a faction, no faction appeared in
Status, and the codex held nothing about one. This is a gap in what the route exposes, not
a judgement on the system.

**6. Vivid world.** Strong on prose and on the small mechanics that carry it: oil at seven
or nine depending on the levies, a tax nobody explains, two scripts at the gate, a smith
who cannot write the island's word for what she makes, a harbour where "nobody is writing
anything down". The place introduction and the market copy do the heavy lifting; the two
ports feel different in what they count and who does the counting. I did not assess the
illustrations as images in this session, so this verdict rests on text and screens, not on
art.

**7. Mystery.** The only traces were the tablet-form name in Status and the opening's "a
name this harbour will write down before it decides what to make of you". No mystery
encounter was reachable on this route in seven days, so there is nothing to judge.

## Recommendation

Fix **B1** first: a "Continue" that silently loads an older manual save over the autosave
undermines every other finding, because a session's end state is not the state the next
session starts from. Then **B2**, the stranded scene, which cost this session a day of
travel and would cost a real player their trust in the sidebar.

## What this session did not cover

- No selling, no price comparison between ports, no cargo-capacity pressure.
- No faction scene, no mystery encounter, no refugee story, no recurring-character return.
- No return leg to Ugarit; the manual Save screen was opened once, only to test B1.
- Settings, Cargo, Languages, People (Cyprus) and Factions screens were not opened.
- Images were not reviewed as images; evidence is DOM text, screen state and
  `localStorage` payloads.
- All findings come from the running build above. Nothing in this report was inferred from
  content files or design docs, and nothing was fixed.
