# M4 findings

**Status:** written 2026-11-27 from three agent sessions and one design-owner pass;
updated 2026-11-28 when M4b closed. Gate A accepted the original evidence under ADR-0017.

**Decision:** revise. M4b is defined in `docs/milestones/M4b-slice-revision.md` and is
complete as of 2026-11-28.

## Evidence in hand

| Source | Kind | Counts toward the original M4-T01 protocol? |
|---|---|---|
| `agent/2026-11-26-curious-traveller.md` | agent session | no |
| `agent/2026-11-27-trader.md` | agent session | no |
| `agent/2026-11-27-helper.md` | agent session | no |
| `human/2026-11-27-design-owner-quick-pass.md` | design-owner pass, notes only | no |
| `human/2026-11-28-fresh-reader.md` | owner attestation, not a transcript | M4b condition |

## What the evidence agrees on

1. **The world is the strongest part.** The gate, the market scale, the copper yard and the
   crossing stops read as a specific place rather than generic antiquity.
2. **The loop is legible once the first crossing is understood.** Arrive, visit places,
   speak, trade, learn a route, book passage, resolve the crossing. The friction is in the
   first twenty minutes, not in the loop itself.
3. **The opening is too long before the first choice.** Ten prologue beats plus a new-game
   form. Every source that played from the title raised it.
4. **The cast is not yet carrying the story.** The player could not say what most recurring
   characters wanted, and two conversations repeated verbatim. The named confusions were
   fixed in this pass; the missing wants and through-lines were not.

## The seven §22.1 questions

### 1. Travel loop enjoyment — promising

The loop is a real loop: places are chosen, the market and harbor have different people,
the crossing pauses for scenes, and arrival changes what is available. The design-owner
pass moved through it without getting lost, and the agent sessions describe the crossing as
texture rather than a loading screen. The weakness is the runway into it, not the loop.

Confidence: medium. One designer and three agents, all familiar with games of this shape.

### 2. Trading as a reason to travel — promising

Prices differ by port and by local state, the gain column compares a sale with what was
paid, and the Cypriot copper route leaves a real margin (ten to buy, twelve to sell). The
new quantity control makes a bulk trade possible in one action. Against that: one route
means one arbitrage, so the slice can demonstrate trade but not sustain it.

Confidence: medium.

### 3. Character memorability and desire to return — weak

The characters are distinct in voice and setting — Hannu's ledger, Ada's yard, Sibtu's
loom — but the pass could not say what most of them wanted, and conversations did not build
on each other. The tripod and the night kiln repeated until they were gated in this pass.
Distinctiveness is not the same as memorability; a player returns for a person with a
problem, not for a well-observed accent.

Confidence: high. This is the clearest finding in the evidence.

### 4. Language progression as reward, not obstruction — promising

Language never blocks trade; it changes bargaining and opens optional lines. The gain was
invisible until this pass added a status line for every increase, which removes the main
complaint. What is still thin is a moment where a tier visibly opens something the player
could not do before, beyond a better price.

Confidence: low. The pass noticed the missing feedback, not the progression curve.

### 5. Faction relationships as understandable opportunity — weak

No moment in the pass surfaced a change in standing. Standing lives on a screen the player
has to seek, and the four threads that move it (cloth, copper, letter, faction request) do
not say who noticed. The player cannot treat faction standing as an opportunity if it never
appears as an event.

Confidence: medium. The evidence is absence of comment as much as comment.

### 6. Vivid, distinctive ancient world — strong

The harbor smell, the gate tax, the scale everyone watches, the copper yard, the kiln at
night and Shipti's courtyard all landed. The notes argue about people and clarity, not
about whether the world feels like a place. Provenance discipline is visible in the
specificity.

Confidence: high.

### 7. Mystery as curiosity, not confusion — weak

The Ninshubur recognition and the sealed letter are meant to pull; in play they produced
"who is saying this?" and "why is that the answer?" rather than a question the player wanted
to pursue. Some of that was line-level and is fixed. The larger issue is that the mystery
has no legible question yet: the player is shown a strange reaction, not given something to
wonder about.

Confidence: medium.

## What the M4 pass changed

- Stable Continue control for scene and prologue passages.
- Market: card layout at narrow column widths, per-row quantity, port-specific goods art.
- Sidebar: reserve and grain, no game title.
- Roads and rest: grain, reserve and "ordinary day" wording.
- Language gains reported as they happen.
- Local destination states explain themselves.
- Journal newest-first; Port replaces Place; maps separate unknown ground from sea.
- Dialogue: Hannu's warehouse line, the crossing's work choice, Belet's answer, Yada's
  setup, Shipti's shelf, Ada's finished tripod, the two nightly events, the squall's ending.
- The repeatable-scene rule in `docs/CONTENT.md`, with the two nightly events gated.

## What M4b changed

- **Cast through-lines.** Every recurring character now has an object want, a pressure and
  a later scene that answers an earlier one (`docs/design/cast-threads.md`). The cloth,
  copper, letter and faction-request threads leave a visible consequence.
- **The first twenty minutes.** The opening is eight illustrated beats before the first
  choice, the arrival intro names Tiro at the mole, and the fresh-reader attestation
  records that the first crossing was reached and grain, reserve and fare were understood
  afterwards.
- **Standing legibility.** A regard or faction change produces a status line at the moment
  it happens, in the same channel as the language notice.
- **The machine that builds the machine.** `pnpm factory` scaffolds, expands authored
  recipes and audits coverage. It is offline, deterministic and refuses to ship `TODO:`.
- **Living time.** Day and travel now have authored observations; night varies by culture
  and day instead of one static paragraph per port. Four daytime storylets give the ports
  scenes in daylight rather than only at night. No new mechanic and no save change.

## The decision

**Revise.** The world and the loop are worth keeping; the cast, the opening and standing
legibility are not ready to carry a larger world. M4b fixes those three, with a fresh-reader
session as an acceptance condition, then M5 opens. Expanding now would build a timeline
around characters who do not yet want anything.

## Not blockers, still known

- **Audio loops are too short** for a session of this length. One bed per place; the loop
  length is the cause. This belongs to the M18 audio pass, not M4b.
- **The sea-toll trap** still asks the player to keep silver back. It is signposted, and no
  evidence says it is unfair; leave it.
- **Beat-art debt** is 256 beats. M4's non-goal is new art; do not grow the debt in M4b.
