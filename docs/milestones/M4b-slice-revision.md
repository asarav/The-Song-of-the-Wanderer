# M4b — Slice revision

**Status:** Done — T00–T05 complete; Gate A's carried-forward condition is recorded

## M4b-T00 — Model, enforcement, automation (done)

- [x] Character v2, scene contracts, interaction memory, promises, regard bands, save
      migration v6 and ADR-0018.
- [x] Choice ids and intents on all 274 answers; scene contracts on 16 recurring graphs;
      scenarios migrated to `chooseChoice`.
- [x] Gates: `model:check`, `prose:lint`, `price:check`, `content:guard`,
      `invariant:check`, `docs:check`.
- [x] Retrieval and automation: `task:brief`, `ask`, `entity`, `flag`, `impact`,
      `content:workbench`, `scene:preview`, `manuscript`, `coverage:choices`, `affected`,
      `docs:sync`, `new:dialogue`, `art:ledger`, `task:finish`.
**Depends on:** M4 (closed on design-owner evidence)
**Goal:** fix the three weaknesses Gate A found, then open M5.

**Blocks:** M5–M8. Do not start Wave 1 until this milestone's definition of done is met.

## Why this exists

Gate A's evidence was strong on the world and the travel loop, and weak on three things:
the cast does not pursue anything across scenes, the first twenty minutes ask too much
before the player can act, and a change in standing has no moment on screen. The slice
comes before the world, so these are fixed while the slice is still small.

## Non-goals

- New destinations, routes, goods or systems.
- M5 world-model work, arcs, directors or off-screen simulation.
- A new art or audio pipeline. The short audio loops are a known M18 problem; do not
  re-record the beds here.
- Retuning prices or thresholds without observed evidence.

## Tasks

### M4b-T01 — Cast wants and through-lines

The recurring cast answers questions about the world but does not want anything. Give each
recurring character a want, a pressure, and one later scene that exists because of an
earlier one.

- [x] Add `docs/design/cast-threads.md`: for Amnit, Hannu, Yada, Tiro, Belet, Sibtu,
      Kinyras, Ada and Shipti, one want, one pressure, and the earlier scene their later
      scene answers.
- [x] Voice pass on the recurring graphs: Amnit (both), Hannu (gate and night watch), Yada,
      Tiro, Belet (temple and mystery), Sibtu, Kinyras (both), Ada (smithy and kiln),
      Shipti, and the gate arrival. Each scene now has a live want, a period social stake
      (household, obligation, shame, patronage, hospitality) and physical business.
- [x] Each recurring dialogue graph opens on a node that reflects at least one prior scene
      through `entries`; the first meeting still reads as a first meeting. Four scheduled
      event scenes deliberately have no repeat entry; `model:check` warns and the audit
      says why.
- [x] No one-time object or finished commission repeats. The audit is
      `docs/design/dialogue-audit.md`.
- [x] Two chains are covered by scenarios: Sibtu's cloth through the paid ending, and
      Ada's tin through the blade (`scenario.slice.ada-tin`).

**Acceptance:** a reader can say what three recurring characters want and what changed
between two of their scenes.

### M4b-T02 — The first twenty minutes

The opening is ten illustrated beats plus a new-game form before the first choice, and the
first crossing has to be discovered rather than taught.

- [x] Cut or fold the prologue so the first meaningful choice arrives within about three
      minutes of pressing Begin; keep the pictures that carry the world. The opening is now
      one node of 303 words across eight illustrated beats before the first choice.
- [x] Make the first crossing reachable from the arrival screen without the design docs:
      name the person or open the conversation from the instruction. The Ugarit arrival
      intro names **Tiro** at the mole, and the First step hint names the action.
- [x] Keep the contextual First step hints, but let each one name the action, not the
      concept.
- [x] Record one session by a reader who has not seen the design docs, notes in
      `docs/playtests/human/`. This is the external evidence ADR-0017 carried forward.
      The record is `human/2026-11-28-fresh-reader.md`: an owner attestation, not a
      transcript, with no invented quotes.

**Acceptance:** the fresh reader reaches the first crossing and can explain grain, reserve
and the fare afterwards, without being told.

### M4b-T03 — Standing and consequence legibility

A favor, refusal or bargain changes numbers the player never sees move.

- [x] A change in faction standing or a character's regard produces a status line at the
      moment it happens, in the same channel as the language notice.
- [x] The cloth, copper, letter and faction-request threads each leave a journal entry or
      status line that says what the player's choice did.
- [x] The Factions screen explains what standing is for, in one sentence, without adding a
      new mechanic.

**Acceptance:** after a faction-relevant choice, the player can say who noticed and what
changed without opening the Factions screen.

### M4b-T04 — The content factory

Authoring volume without a second scaffolder or a live generator.

- [x] `pnpm factory -- new|variants|audit|check` in `tools/factory.ts`, with recipes in
      `tools/factory/recipes/`. Dry-run by default; `--write` refuses to overwrite and
      validates against the content registry.
- [x] Kinds: `ambient`, `event`, `dialogue`, `journal`, `codex`, `character`,
      `destination`, `route`, `arc-brief`. Arc briefs are markdown until M6.
- [x] `new:dialogue` delegates to the factory; generated scaffolds carry `TODO:` and fail
      `factory:check` until filled.
- [x] `factory:check` is part of `pnpm check`: recipe validation, deterministic dry runs,
      duplicate ids and shipped placeholders.
- [x] `tools/factory.test.ts` covers dry-run, seed determinism, overwrite refusal, invalid
      variants and TODO detection. ADR-0020 records the decision.

**Acceptance:** a new ambient matrix or dialogue shape can be planned, validated and
written from an authored recipe, and no generated placeholder can reach a pack.

### M4b-T05 — Living time

Day and travel have copy and scenes of their own, without slowing the loop.

- [x] `AmbientObservation` schema and `ambient/` pack folder; destination `day` pool;
      `fireDay` before `fireNight`. Ambient has no effects, scene or saved state.
- [x] `deriveAmbient` filters by context, culture, scope, conditions and weight; uses the
      seed, day and location; avoids the previous day's tag; falls back to `night.text`.
- [x] Night shows the day observation above the night one; Journey shows one travel
      observation; Port/Place show today's observation when no night card is active.
- [x] 22 observations: 4 day and 4 night for each Levantine and Cypriot harbour culture,
      plus 6 travel observations. Existing art only; no beat-art debt added.
- [x] Four daytime storylets with scenes, stable choice ids, cooldowns and existing cast
      voices: Ugarit water line and gate queue; Cyprus charcoal and Enkomi news.
- [x] `ambient:check` in `pnpm check`: coverage, deterministic selection, no consecutive
      repeat over 30 days. Prose, beat-art and art tests include ambient copy.

**Acceptance:** a day and a crossing each have more than one plausible observation, the
night is not one static paragraph, and the main loop keeps its one Continue.

## Definition of done

- `pnpm check` green and `pnpm build` green.
- `docs/design/cast-threads.md` and `docs/design/dialogue-audit.md` exist and are current.
- The fresh-reader session is recorded in `docs/playtests/human/`.
- `docs/playtests/findings.md` is updated with what the revision changed.
- `STATUS.md` names M5 as the active milestone and `PLAN.md` marks M4b done.
- T04 and T05 are part of `pnpm check` and are recorded in ADR-0020.
