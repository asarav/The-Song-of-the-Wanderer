# Worklog

Append one entry per completed work session. Newest last. Keep each entry under ten
lines. Do not rewrite history; correct it with a new entry.

Format:

```
## YYYY-MM-DD — Mx-Tyy — short title
- What changed (files or areas).
- Verification: pnpm check / specific tests.
- Notes or follow-ups.
```

---

## 2026-11-25 — M0 — Bootstrap

- Created the documentation system: `AGENTS.md`, `docs/README.md`, `PLAN.md`,
  `STATUS.md`, `WORKLOG.md`, `ARCHITECTURE.md`, `CONTENT.md`, `HISTORY.md`,
  three ADRs, four design docs, four templates, and milestone files M0–M4.
- Added four project skills under `.opencode/skills/`: `sotw-context`,
  `sotw-milestone`, `sotw-content`, `sotw-history`.
- Scaffolded Vite + React 19 + TypeScript 5.9 + Zustand + Zod + Vitest, strict
  `tsconfig`, ESLint flat config with an engine-purity rule, Prettier, content
  linter scaffold, and GitHub Actions CI.
- Verification: `pnpm check` green (typecheck, lint, 2 tests, content lint).
- Notes: TypeScript pinned to 5.9 because typescript-eslint does not yet support TS 7.
  esbuild postinstall approved via `pnpm.onlyBuiltDependencies`.

## 2026-11-25 — Planning — Expand to full production plan (M5–M19)

- Rewrote `PLAN.md` with five waves and M0–M19, six quality gates, and a scale-risk table.
- Added `WORLD_MODEL.md` (eras, phases, event taxonomy, propagation, truth vs knowledge,
  rumour latency, delta saves) and `NARRATIVE_SYSTEMS.md` (characters, itineraries, arcs,
  lineages, recognition, storylets, continuity).
- Added `SCALING.md` (module map, content packs, state partitioning, performance budgets,
  testing tiers, workspace-split triggers) and `TOOLING.md` (tool catalogue, studio,
  coverage, continuity, long-run simulation, generators).
- Added ADR-0004 (truth vs knowledge) and ADR-0005 (packs, derived state, delta saves).
- Added milestone files M5–M8 and `M9-M19-production-waves.md`.
- Added skills `sotw-world`, `sotw-character`, `sotw-qa`; updated `AGENTS.md`,
  `docs/README.md`, and architecture docs.
- Added authoring templates for region timelines and character arcs, and extended the
  content skill's schema reference with events, propagation, facts, and knowledge.
- Verification: `pnpm check` green; documentation links reviewed manually.

## 2026-11-25 — Data model — Canonical entity shapes

- Added `DATA_MODEL.md`: four representations (definition, state, view, knowledge) and
  entity shapes for player identity/deeds, regions, destinations, routes/waypoints, mobile
  groups, day context, characters, arcs, factions, culture, language, religion, cultural
  works, economy, objects, facts, and knowledge.
- Added the entity-model non-negotiable to `AGENTS.md` and linked the new doc from the
  documentation index and plan.
- Specified `DayContext`, climate phases, observances, and astronomical/religious events
  in `WORLD_MODEL.md`; expanded the event envelope to match the spec.
- Added character position, fame, allegiance, worldview, and authored reaction rules to
  `NARRATIVE_SYSTEMS.md`; added explicit `ArcState`.
- Aligned `ARCHITECTURE.md` and `SCALING.md` with player identity/deeds, route/waypoint
  views, and the data-model boundaries.
- Expanded M5, M6, M7, and M8 tasks, coverage checks, and content folders for the new
  entity types.
- Updated templates, skills, `src/content/README.md`, and M0–M4 milestones to use the
  expanded entity model.
- Updated the content schema cheat sheet and event shape to the canonical model.
- Added `ASSETS.md` defining asset IDs, manifest rules, exploratory generation workflow,
  prompt rules, and promotion criteria.
- Added a unified art-direction requirement: one visual language across all assets, with
  style anchors, consistency checks, and escalation rules.
- Documented public-domain and open-access reference sources, license rules, and a
  reference-asset manifest shape for development agility.
- Added audio asset rules: unified audio direction, open-access audio sources, Peter
  Pringle and modern reconstruction caution, ancient music source uncertainty, and
  audio manifest fields.
- Added ambient audio and environment rules: diegetic layers, seasonal/phase conditions,
  fallback silence, and consistency requirements.
- Added agent skills for assets/audio, save format, UI/read models, scenarios, and design
  decisions to cover the main development workflows.
- Moved canonical skills to `.agents/skills/` and mirrored them to Claude Code, Cline,
  Cursor, GitHub Copilot, Kilo, Freebuff/OpenCode-compatible, and Codex directories.
- Fixed GitHub Actions CI by pinning `pnpm/action-setup` to `v4.2.0` to avoid the
  v4.3.0 cache restore regression, and added an explicit lockfile cache dependency path.
- Added `tools/sync-skills.mjs`, `pnpm skills:sync`, and `pnpm skills:check` so skills
  and agents can be kept available across harnesses.
- Attempted four exploratory image generations; all failed with invalid credentials, so no
  exploratory images are committed.
- Verification: `pnpm check` green; documentation links checked.

## 2026-11-26 — M1–M3 implemented, slice playable

Implemented the approved rev. 4 plan through the slice gate.

- **M1** — state, calendar, six RNG streams, DSL registries, content schemas and registry,
  reducer with command registry, save v1 + v0→v1 migration, scenario runner and
  `tools/simulate.ts`. Deleted `MS_PER_GAME_DAY`.
- **M2** — inventory, market, routes, journeys, dialogue, scheduler, language, factions,
  journal/codex read models, derived views. Store + 14 greybox screens with autosave.
- **M3** — two content packs (98 entities), 4 authored scenarios, dossiers for Ugarit and
  Cyprus, cast briefs for nine characters, `content:lint` filename rule relaxed to accept
  namespaced IDs.
- **Docs** — Phase 0 reconciliations recorded in `DATA_MODEL.md` Appendix A; ADR-0006 and
  ADR-0007 added; milestone boxes for M1–M3 ticked; STATUS rewritten.
- **Fix log** — `import.meta.glob` path and Vite aliases were missing, so the browser
  build could not have loaded content; both fixed. Checkpoint encounter gained an
  unconditional first choice so no travel scene can present without an available answer.
- **Verification** — 192 tests, `content:lint` 0 errors, four scenarios pass headless.
- **Illustration** — first destination illustration generated (credentials working again):
  `assets/exploratory/ugarit-harbour.jpg`. Prompt built from the `ASSETS.md` §2.2 style
  anchors plus the Ugarit dossier. Exploratory only; not yet referenced by content or the
  asset manifest.
- **Preview** — `pnpm dev` on `127.0.0.1:5173`, registered in the thread preview.

## 2026-11-26 — Sealed engine module boundaries

Modularity rule 3 from the approved plan: each `src/engine/*` module exposes only its
`index.ts`, enforced by lint rather than convention.

- Added `index.ts` to `time`, `rng`, `kernel`, `culture`, `economy`, `world`, `narrative`,
  `journal`; `views/index.ts` now re-exports through `../world`, `../economy`,
  `../narrative` instead of their files.
- Rewrote every cross-module import in `src/engine`, `src/store`, `src/ui` and `tools` to
  the module surface. No `eslint-disable`, no rule loosening.
- `eslint.config.js` generates `../<module>/*`, `@engine/<module>/*` and
  `**/src/engine/<module>/*` patterns from one module list and applies them to engine,
  store and UI. Proven by a temporary `kernel → ../time/calendar` import: lint failed
  with the boundary message; removing it restored exit 0.
- Fix log: routing `dsl/effects` through `kernel/index.ts` created a
  `content → dsl → kernel → content` runtime cycle, which made `content/schema` read an
  uninitialised `effectSchema` and broke one registry test. Moved `cloneState`/
  `deepFreeze` from `kernel/clone.ts` to `state/clone.ts` (a leaf both sides already
  depend on), removing the cycle with no behaviour change.
- Verification: `pnpm check` green (192 tests, `content:lint` 0 errors, skills check) and
  all four scenarios pass headless against authored content.

## 2026-11-26 — Characters remember, and the map exists

Playtest feedback: the scribe repeated the same scene after being told there was no
silver, the screens explained little, and there was no map.

- **Dialogue memory** — `DialogueSchema.entries` gives a graph alternate openings with
  conditions; `startDialogue` picks the first match before `start`. The registry checks
  entry conditions and entry nodes, and counts them as reachable roots. Yada now opens on
  `return` after the free line and `practised` after a paid lesson, so the same path no
  longer replays.
- **Authored lock reasons** — `unavailableNote` on a choice replaces the generic
  "You cannot follow where this would lead." Yada's five-silver lesson says so.
- **Map** — `deriveMap` (views) and a Map screen drawing authored `mapPosition` nodes,
  known crossings only, current place filled, with a short legend. Reads knowledge, not
  truth.
- **Explanation** — Place screen says what the screen is for and links to the map; empty
  people/roads states and unaffordable fares now say why.
- Tests: `dialogue.test.ts` (entry selection, unknown graph, locked reason) and
  `map.test.ts` (known-only places, crossings need both ends known). 198 tests total.
- Verification: `pnpm check` green; `content:lint` 0 errors, 0 warnings; four scenarios
  pass. Dev server hot-reloaded on 127.0.0.1:5173.

## 2026-11-26 — Every recurring character remembers

Follow-up on the repeat-dialogue complaint: Yada was the only graph with conditional
openings, so the same complaint still reproduced with everyone else.

- Added `entries` and return nodes to the primary graph of Amnit (Ugarit and Cyprus),
  Ada, Belet, Hannu, Kinyras, Shipti, Sibtu and Tiro, keyed to their own flags, journal
  entries and completed trades. A second and third visit now open on a different scene,
  while first visits keep their original node and choice order.
- Added authored `unavailableNote`s to every gated named choice in those graphs and in the
  refugee-ask and copper-offer scenes, replacing the generic refusal.
- Left every thread reachable on return: Tiro can still grant passage, Sibtu can still be
  helped after a refusal (new amendment node), Shipti can still hand over a letter that
  was left on the shelf, Amnit/Sibtu/Belet still repeat the knowledge they gave.
- Fixed `unlockRoute`: it opened the route in world state but never added it to
  `knowledge.knownRoutes`, so Tiro's bargain left the map and Roads screen saying the
  crossing had never been heard of. It now records the knowledge once, with a test.
- Tests: `tools/dialogue-memory.test.ts` (table-driven: first match, later visits,
  no-entry fallback, determinism, 58 cases). `slice-recurring` now talks to Amnit twice on
  the island and asserts the second opening is `again`.
- Verification: `pnpm check` green (256 tests); content lint 0/0; four scenarios pass;
  live preview walked Amnit and Tiro twice with visibly different openings.
- Map follow-up: `deriveMap` now lists a crossing whose far end is not yet known instead of
  hiding it; the sketch draws only lines it can place, and the list says why.

## 2026-11-26 — M3 follow-up — local, regional and world maps with fog
- Split `deriveMap` into `deriveLocalMap`, `deriveRegionalMap` and `deriveWorldMap`; the Map
  screen gains three tabs. Local sketches use new `activities[].mapPosition` and a numbered
  key; regional sketches restrict known places and crossings to the current region (or the
  departure region while travelling); world sketches add authored region shapes.
- Fog of war is derived from knowledge: a region with no known destination keeps its name
  out of the view and is drawn fogged. Learning of Cyprus clears it and draws the crossing.
- Schema: optional `regions[].mapPosition`, `mapRadius`, `activities[].mapPosition`.
  Authored positions for both slice destinations, both regions. Docs updated
  (`DATA_MODEL.md` §5, `CONTENT.md` maps, `ARCHITECTURE.md` read models).
- Tests: `map.test.ts` expanded to 14 cases across all three scales (positions, fallbacks,
  region restriction, travel, fog naming, determinism). `pnpm check` green: 17 files /
  267 tests; content lint 0/0; all four scenarios pass.
- Live preview: local quarter sketch, regional sketch and world fog checked; injecting
  knowledge of Cyprus lifted the fog and drew the 3-day crossing. Save restored afterwards.

## 2026-11-26 — M3 follow-up — navigable codex
- Codex screen is now a two-pane reader: a sticky sidebar lists every unlocked entry and
  shows the active one; the reading pane renders only that entry. Empty state added.
  Responsive layout turns the sidebar into a wrapped row on narrow screens.
- `src/ui/App.tsx` (Codex component), `src/ui/theme.css` (`.codex-layout`, `.codex-nav`,
  `.codex-link`). No engine or content changes.
- Verification: `pnpm check` green (267 tests, content lint 0/0); live preview showed six
  entries in the index and switching from Akkadian to Cyprus replaced the reading pane.

## 2026-11-26 — Exploratory illustration set for places and people
- Generated 19 exploratory illustrations in the `ASSETS.md` style: ten places (Ugarit
  harbour, market, palace gate, temple, workshops; Cyprus arrival, copper yard, landing,
  smithy, inn) and nine character portraits. Early generations were discarded for modern
  clothing, glass and steel objects, tiled roofs and visible lettering; the reviewed set
  is recorded with per-file notes in `assets/exploratory/README.md`.
- Content now carries optional `art.*` IDs on destinations, activities and characters.
  `DestinationSchema`, `ActivitySchema` and `CharacterSchema` gained the field; the two
  destination packs and nine character files set it.
- `src/ui/art.ts` resolves IDs to `public/art/` files and alt text. The place screen shows
  a hero illustration and a card per activity; scenes show the speaker's portrait; the
  People screen and the place's people list show portrait thumbnails.
- `src/ui/art.test.ts` (42 cases) checks every authored place, activity and person resolves,
  every catalog entry has alt text and a real file, and no catalog entry is unused.
- Verification: `pnpm check` green (18 files / 309 tests); content lint 98 entities, 0/0;
  four scenarios pass. Dev server still serving at 127.0.0.1:5173.
- Not done: no M18 manifest, no `assets:check`, no promotion to production art.

## 2026-11-26 — Illustrated layer walked in the running app and repaired
- Audited every art-bearing screen at 1280px and 390px: both destination place screens, the
  People screen with all nine recurring characters, and scenes with Hannu, Tiro, Kinyras and
  Ada. All images loaded; every hero, card and portrait used `object-fit: cover`; no card or
  person-row overlap, no horizontal overflow, no clipped text.
- Alt text checked against the actual pictures; five strings corrected (Ada's bowl, the
  Cypriot arrival, the landing, the workshops, Hannu's background).
- Replaced period-breaking art: eight place images (market, palace gate, temple, workshops,
  Cyprus arrival, landing, smithy, inn) and two portraits (Amnit, Kinyras). Rejected along
  the way: a copper yard with a brimmed straw hat and gold-bar ingots, a landing whose boy
  wore a T-shirt, and two workshop variants with modern tank tops and a child in a tee.
- Residual issues are recorded per file in `assets/exploratory/README.md`: a tiled roof edge
  in the workshops, apron straps in the smithy, patterned textiles in the market, an
  agave-like plant at the arrival frame edge, flat disc ingots in the copper yard.
- The People audit used a local test save with all nine characters in the index (the game
  only lists people the traveller has met); the run was left at the Cypriot harbour.
- Verification: `pnpm check` green (18 files / 309 tests), content lint 98 entities 0/0.

## 2026-11-26 — Slice — Player status and fixed protagonist name
- Added `views/self.ts` (`deriveSelf`) and a Status screen: identity, date and place, purse,
  load and transport, goods, languages, faction standing, personal reputation, obligations
  and deeds, all derived from existing state with no new simulation.
- Removed the player-set name. `createInitialState` no longer accepts `selfName`, every new
  run starts as `e-ma-a₂`, and the new-game screen shows the tablet form (with a real
  subscript) and a seed only. Amended ADR-0006 and `design/02-protagonist.md` §3/§4.1.
- Verification: `pnpm check` green (19 files / 316 tests, 98 entities 0/0); New Game and
  Status walked in-app at 1280 and 390, empty and populated (faction, obligation, deed).

## 2026-11-26 — M4-T04 — Accessibility and comfort baseline
- Added a persisted text-size control, a skip link with focus outlines, text reasons for
  unavailable market purchases, a session conversation log on the Journal, and a
  reduced-motion CSS rule.
- Added store coverage for autosave (stubbed localStorage, deserialized back) and for the
  dialogue log's dedupe/reset; added a status-view test that no unknown people, factions,
  obligations or deeds are exposed.
- Canon: added `PROTAGONIST_NAME` (display `e-ma-a₂`, id `name.aegean.ema-a2`); cited
  PY Tn 316 and KN D 411 in the codex/dossier; made the Hermes reading
  `strongly-supported`, attributed only.
- Verification: `pnpm check` green (21 files / 333 tests, 98 entities 0/0); drove text
  size, skip link, log and market reasons at 1280 and 390.

## 2026-11-26 — Slice closeout — audit, route corridor, settings, playthrough
- Audited M0–M19 against code and tests: M0–M3 done, M4-T04 done, M4-T01/T02/T03/T05
  blocked on human playtesters, M5–M19 blocked behind Gate A/B and left untouched.
- Implemented the missing route corridor: segments, waypoints, risk band, authored stops
  as journey slots, route/waypoint tests; added the missing Settings screen.
- Reconciled the starting-destination illustration (present, reviewed, wired) and kept
  the e-ma-a₂ / `name.aegean.ema-a2` / attributed-codex / knowledge-only-status rules.
- Drove the full slice in the preview: new game, market, dialogue, route, Cyprus,
  journal, codex, status, save and reload; no console errors.
- Verification: `pnpm check` green (23 files / 345 tests, 98 entities 0/0).

## 2026-11-26 — Claim audit — illustration, route proof, screen fix
- Opened the actual Ugarit hero: the earlier kept image had tiled roofs, so it was
  regenerated through the project's image tool with a square sail and flat roofs; the
  shipped file now matches the review and loads in the app (hash checked).
- Added route-schema and registry rejection tests for waypoints; added journey-view
  applied/missing/clamped/deterministic tests and market state-modifier tests.
- Fixed the store: accepted commands no longer force the Place screen, so buying and
  selling stay in the market; scene/journey transitions still take over.
- Re-scoped milestone boxes that claimed absent slice features (mobile groups, season
  gating, multi-slot saves, contextual codex links, supply stock) and kept every checked
  line backed by code plus a test or live check.
- Full live slice: new game, market, dialogue, crossing, Cyprus, journal, codex, status,
  settings, save and reload; no console errors.
- Verification: `pnpm check` green (26 files / 370 tests; 98 entities 0/0).

## 2026-11-26 — Paced narrative — beats, bold key words, guided opening
- Added `src/ui/story.ts`: blank lines split authored prose into beats, `**…**` becomes a
  bold run, and an unpaired marker stays readable as typed. Table-driven tests cover both.
- Scenes, destination introductions, journal entries and codex entries now reveal one beat
  at a time behind a Continue control with an "n of n" count; choices appear only after the
  last beat. Pacing is presentation state, never saved, and a place's introduction is paced
  once per session (`readPlaces` in the store).
- Wrote `dlg.slice.opening`, now the scene `evt.ugarit.arrival` opens: eight short beats
  that explain 1230 BCE Ugarit, the palace's two scripts, the protagonist's trade and the
  loop, then hand over to Hannu's gate. Shortened and bolded the gate, the Ugarit intro and
  the opening journal entry.
- Added one command to the two Ugarit scenarios to account for the new opening scene.
- Verification: `pnpm check` green (27 files / 384 tests, 99 entities 0/0); in the running
  app the opening revealed 1→8 beats, the tally-man branch and the gate paced correctly,
  choices appeared at the end, no `**` markers reached the screen, and a revisited place
  intro stayed whole.

## 2026-11-26 — Paced reading, everywhere — proof, focus, large text
- Extended the beat reader beyond scenes and place introductions: journal entries, codex
  entries and the conversation log now pace too, each with its own counter and Continue.
  Session memory was generalised from `readPlaces` to `readPassages` with stable keys
  (`place:`, `scene:`, `journal:`, `codex:`); a scene and its log line share a key.
- Fixed two focus defects found in the running app: focus fell to `<body>` after the last
  beat (the Continue control unmounts) and after every scene-node change. A finished
  passage now focuses its choices (or the passage), a new scene focuses the scene, and a
  screen change focuses the stage. The focus move is an effect, not a frame callback: a
  background tab never ran the callback.
- Fixed a large-text defect: at a 200% root font size the codex two-pane grid starved the
  entry column to zero width and the page overflowed by 44px. The shell rail is now
  `clamp(10rem, 20vw, 15rem)` and the codex collapses by container width (`@container`,
  rem-based) instead of viewport width alone.
- Verified in the browser: scene 1→8 with choices gated until the last beat; the
  tally-man and gate nodes paced 1 of 2; single-beat nodes showed whole with no Continue;
  place intro 1 of 4 then whole on revisit; journal entry 1 of 2 then whole; codex entry
  1 of 2, resetting per entry, whole on return once read; conversation log whole for read
  scenes and 1 of 2 for a scene left unfinished, then whole after its Continue. No `**`
  reached the screen; bold rendered in scene, place intro, journal and log.
- Keyboard: Continue was one Tab from the focused scene and Enter advanced the beat with
  focus retained; Enter on the last beat moved focus to the choices; Tab then Enter chose
  an answer; place intro, journal entry, codex entry and log line each completed by Enter
  with focus left inside the passage.
- Large text: at 125% and at a forced 200% root font size, every Continue was fully inside
  the viewport and hit-testable, choices wrapped without clipping, and document scroll
  width equalled client width on scene, place, journal, codex and log.
- Verification: `pnpm check` green (27 files / 384 tests, 99 entities 0/0).

## 2026-11-26 — M1-T01 held to the test contract
- Audited M1-T01 (state construction and validation) against the plan's test contract
  instead of rewriting working code: every milestone box was already ticked, so the work
  was the missing evidence.
- `schema.test.ts` gained three tables. **Rejections, 15 cases**: one per partition rule
  (unknown root key → `(root)`, unknown key inside `calendar`, epoch − 1, fractional
  purse, capacity 0, unknown presentation, unknown language tier, cargo 0, non-scalar
  flag, a dimension past `DIMENSION_MAX`, unknown knowledge source, reliability > 1, a
  journey slot on a negative day, a pending scene that is not a dialogue, a missing RNG
  stream), each asserting the readable path a save loader would report.
  **Boundaries**: the values effects clamp toward are accepted — day 0, money 0,
  capacity 1, a relationship at −5 and a faction at +5, reliability 0 and 1, quantity 1.
  **Determinism**: identical bytes for identical input, and a changed seed alters only
  `rng` and the seed in `meta`.
- Added the opening golden vector (seed `golden-state-1`): exact stream values alongside
  the empty-collection guarantees, so a default that drifts shows up as a named field.
- Added a recursive JSON-plain walk over a played-in state, proving nothing persisted is a
  Map, Set, Date or non-finite number; JSON round-trip then re-validates to the same state.
- New `src/engine/state/contract.test.ts` imports only `@engine/state`, the surface other
  modules see: builders and validators present, authored limits and defaults, validated
  narrowing, junk refused without throwing, cloning without shared structure,
  deep-frozen state refusing mutation.
- New-game scenario in `src/engine/testing/scenario.test.ts` runs the real path (`newGame`,
  day 90, the test pack's arrival event): the run opens on `dlg.test.arrival` at `gate`,
  keeps the requested purse, capacity and cargo, has an empty journal, and records the
  arrival in `storyletCooldowns`. Two further cases: same seed → identical state, new seed
  → only the streams differ.
- Corrected STATUS: the state bullet claimed "branded IDs"; branding lives in `kernel` and
  the save format stores plain validated strings.
- Verification: `pnpm check` green (28 files / 419 tests, 99 entities 0/0, skills check).
  The paced prose surfaces were untouched and their tests still pass (`src/ui/story.test.ts`,
  `src/store/gameStore.test.ts`).

## 2026-11-26 — M1-T02 (calendar) held to the test contract
- Audited the calendar against the plan instead of rewriting it: the single month table,
  the 365-day year, `advanceDays` as the only mutation point and the display formatter
  were already right (the reducer, the `advanceTime` effect and the journey all call
  `advanceDays`; nothing else writes `calendar.day`). The pass added the missing evidence
  and corrected one comment.
- `calendar.test.ts` grew from 22 to 54 tests. **Rejections, 13 cases**: negative,
  fractional and non-numeric day counts; month 0 and month 14; a year before 1230 BCE; a
  fractional year; month 0 in a date; a 31st of a thirty-day month; a sixth epagomenal day;
  day 0 of a month; a malformed and an impossible date string — each a `RangeError` with a
  non-empty reason. A second table proves `tryParseDate`/`isGameDate` return null/false,
  without throwing, for seven junk strings.
- **Year-boundary golden vector**: days 358–366, 730 and 3650 pin `formatDate`,
  `formatDisplayDate`, `daysUntilYearEnd` and the `parseDate` round trip together, so the
  three renderings cannot drift apart.
- **Determinism**: a year of time from day 90 lands on `1229-04-01`; three stepped advances
  equal one long advance byte for byte; `advanceDays` leaves its argument untouched.
- Corrected the `daysUntilYearEnd` comment, which described a "month count".
- New `src/engine/time/contract.test.ts` imports only `@engine/time`: the exported
  surface, the one-table year, the year identity at seven dates inside the year,
  machine/display round trips, junk refused with `RangeError`, and `advanceDays` working
  on a deep-frozen state — so the only way time moves still cannot mutate its input.
- New end-to-end scenario `scenario.test.year-end`: opens on `1230-13-04` (the day before
  the last of the five epagomenal days), crosses into 1229 with two `advanceTime` commands
  and a rest, and has a 400-day jump and a zero-day rest refused with the reducer's own
  reasons; the run ends on day 368, `1229-01-04`.
- Verified in the app: ten "Rest three days" commands from day 0 moved the clock to day 30,
  and the rail and Save screen both read `Year 1230 BCE · month 2 · day 1` — the month
  rolls at thirty days, as the table says, not at thirty-one.
- Verification: `pnpm check` green (29 files / 460 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1-T03 (seeded RNG streams) held to the test contract
- Audited the RNG module: six named streams with one 32-bit number each inside `state.rng`,
  FNV-1a seeding from the save seed, mulberry32 steps, and a cursor whose only write-back
  is `snapshot()`. Generator, goldens and independence were already right (the journey
  draws its encounter count and its offsets from `encounters` and `travel`; nothing else
  draws), so this pass added the missing evidence.
- `streams.test.ts` grew from 12 to 30 tests. **Seed-hash golden vector**: FNV-1a of `''`,
  `seed`, `name.aegean.ema-a2` and `wanderer-1` pinned, because a hash change silently
  re-rolls every existing save.
- **Rejections, 4 cases**: `nextInt` with an inverted, fractional-low, fractional-high or
  NaN bound throws `RangeError` *without drawing* — the snapshot is unchanged after the
  refusal.
- **Clamped edges**: `chance` clamps −5 and 7 to false and true; a one-value integer range
  always returns that value; a negative weight counts as zero and is never chosen; a
  one-item list returns its item.
- **Determinism**: one stored stream state reproduces every helper's output, a cursor
  resumed from `snapshot()` continues identically, and drawing twenty times from each
  stream in turn leaves the other five at their seeded values.
- New `src/engine/rng/contract.test.ts` imports only `@engine/rng`: six streams, positive
  32-bit seeding that is distinct per stream, a plain JSON record, replay from a stored
  snapshot, an untouched input, a refused range with nothing drawn, values inside the
  requested range and probability, and a single-stream draw moving exactly one stream.
- New end-to-end scenario `scenario.test.seeded-draws`, built on the crossing fixture: the
  crossing advances `encounters` while `market`, `flavour` and `tests` keep their seeded
  values; one seed replays the run byte for byte, and a second seed draws a different
  encounter outcome (same arrival, different language gain).
- Verified in the app: a fresh run with the seed `preview-seed-a` saved `meta.seed`
  `preview-seed-a` with a `state.rng` identical to `createRngState('preview-seed-a')`;
  spending a day and resting three days advanced no stream, which is the "a stream moves
  only when drawn from" rule in the running build. The seed `preview-seed-b` gives six
  different values.
- Verification: `pnpm check` green (30 files / 488 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1-T04 (condition and effect DSL) held to the test contract
- Audited the DSL: 13 condition atoms and 18 effect atoms, each one `{ schema, run }` in
  its registry, one `evaluateCondition`, one `applyEffects`, and no `switch` anywhere —
  `reduce` gains nothing from an atom. The approved additions were already shipped
  (`dimension` on `relationship`/`factionStanding` and on the matching effects, plus
  `deed` and `knowledge`), and the slice uses all three in `dlg.cyprus.copper-offer`.
- **Fixed a real gap**: the `languageXp` effect clipped xp at zero without reporting it,
  which contradicted the milestone's "clamping emits `EffectClamped`" line. It now pushes
  `EffectClamped { effect: 'languageXp', requested, applied, reason: 'xp cannot fall below
  zero' }` before the gain event, and the existing "never below zero" test asserts it.
- `conditions.test.ts` grew to 69 tests: a `dimension: 'suspicion'` faction case; a
  per-atom rejection table (13 rows — each payload refused with a non-empty message, a
  `false` from evaluation and no throw); a per-atom determinism table; and the node-count
  limit (201 nodes) beside the existing depth limit.
- `effects.test.ts` grew to 73 tests: clamp reporting for `languageXp`, the 101-effect
  list clamp, deed idempotence (one record, one event) and knowledge defaults; a per-atom
  rejection table (18 rows — one `EffectSkipped` reading `invalid payload` and an
  untouched state each); and a per-atom determinism table.
- New `src/engine/dsl/contract.test.ts` imports only `@engine/dsl`: both registries and
  their `{ schema, run }` shape (13 and 18 names), the approved additions reachable from
  the surface, unknown atoms refused, array order preserved, `EffectClamped` fields,
  purity of `runEffects`, determinism, the structural limits and `emptyState`.
- End to end: `dlg.test.arrival` in the test pack gained one gate answer carrying the
  three approved effects, and `scenario.test.dsl-effects` drives it through
  `chooseDialogue`, asserting respect 2, one deed with its place, and one knowledge entry
  with source and reliability. The authored `slice-cyprus-return` scenario now also
  asserts the copper deal: one deed `deed.copper-agreed` witnessed by Kinyras, the
  knowledge fact `kinyras.buys-at-yard-price`, and the merchants' `trust` dimension.
- Verified in the app: a fresh run's Journal shows "The end of a crossing" on day 1 — the
  arrival event's `journal` effect reaching the screen — still paced 1 of 2.
- Verification: `pnpm check` green (31 files / 569 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1-T05 (content registry and content lint) held to the test contract
- Audited the registry: thirteen entity schemas, one `buildContentIndex` that indexes by
  id and per folder, `createDslContent` as the DSL's read-only view, provenance rules,
  pack cycles, duplicate ids, wrong-kind references, waypoint bounds, effect limits and
  the manifest warning. The acceptance the milestone asks for — a dangling `next` failing
  the test and the CLI with the same message — already had a test
  (`agrees between the CLI and the runtime on a broken pack`, over
  `src/content/__fixtures__/packs/broken`), so the work was the missing schema evidence.
- `schema.test.ts` grew from 7 to 60 tests. A `Record<EntityFolder, …>` of one minimal
  entity per folder — exhaustive by type, so a new folder fails to compile until a sample
  exists — is now checked four ways per folder: the sample is accepted, `{ id }` alone is
  refused with a non-empty reason, an invented key is refused (every schema is strict),
  and parsing twice yields the same value. The existing route cases (segments, waypoint
  day, risk band, unknown field) stay as they were.
- New `src/engine/content/contract.test.ts` imports only `@engine/content` (and the shared
  `@engine/testing` pack): thirteen schemas, a clean build from the test pack, the id map
  beside the per-folder maps, the DSL view's answers including the unknown-good weight of
  1, the issue shape (level, path, message) on a broken pack, a deterministic build and
  the shared fixture.
- New end-to-end scenario `scenario.test.registry`, on the test pack's market: a hold of
  ten fits five grain (weight 2 in the pack) and no copper beside it, the refusal reads
  "Your cargo cannot hold that much (10 of 10 used)", and selling two leaves three.
  Weight, stock and base price all come from the registry entry, not from the command.
- Verified in the app: the market at Ugarit lists the authored goods with their prices,
  stocks and weights (Grain 2, Olive oil 3, Copper 4, Cedar timber 6) — pack data
  reaching the screen through the same registry.
- Verification: `pnpm check` green (32 files / 631 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1-T06 (commands and domain events) held to the test contract
- The eight commands already behaved, but the vocabulary was split: `commandTypeOf` picked
  a name with a `switch`, `COMMAND_HANDLERS` held the handlers without schemas, and the
  `CommandDefinition` type carried a schema nothing validated against.
- `commands.ts` now owns `COMMAND_SCHEMAS`: one strict Zod object per command, structural
  only, so limits such as "between one and thirty days" stay in the handler that owns the
  player-facing reason. `reduce.ts` builds `COMMAND_REGISTRY: Record<Name, {schema, run}>`
  and `reduce` reads it — parse the intent, then run the handler. No `switch` over command
  names; a malformed intent gets the generic refusal before any handler runs.
- `reduce.test.ts` gained one table over all eight commands: applies and numbers its events
  from the state's own counter, refuses with the exact reason and no events on the same
  state object, runs identically twice, and leaves a deep-frozen state untouched.
- New `src/engine/kernel/contract.test.ts` (8 tests, `@engine/kernel` only): registry and
  schema shape, deep-frozen purity for every command, rejection identity, sequences 1–4
  across two commands, the golden event list for one purchase, determinism, an unregistered
  command, and `newGame` opening the arrival scene.
- `scenario.test.crossing` now asserts the final `eventSequence` equals every event the
  steps emitted, so numbering is proven end to end on the shared fixture.
- Verified in the app: a Market purchase at Ugarit took the purse from 40 to 36 and the
  grain row from 0 carried to 1 — the same `buy` path through the registry.
- Verification: `pnpm check` green (33 files / 675 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1-T07 (save, load, migrations) held to the test contract
- The module already wrote a v1 envelope and refused bad input with a typed `SaveError`,
  but the migration table was a bare `Record<version, fn>`, the v0 save was an inline
  object, and no save was ever checked in.
- `migrations.ts` is now `MIGRATIONS: Record<version, { from, to, migrate }>` with
  `migrationFrom`; `deserialize` walks the registry, requires each step to write the `to`
  it declares, and refuses a step past this build. A hand-edited inner `meta.saveVersion`
  is normalised to the envelope's format so a loaded state cannot claim a format this
  build does not write.
- Real fixtures in `src/engine/save/__fixtures__/`: `v0-pre-release.json` (flat pre-release
  blob) and its expected `v0-migrated-state.json`, plus `round-trip-v1.json` — the
  `scenario.test.crossing` run serialised at day 93, event sequence 21 — which loads
  deep-equal and serialises back to the same bytes.
- `save.test.ts` grew to 24 tests: a refusal table (null, text, number, array, truncated
  payload, missing/string/fractional/negative version, newer build, a foreign payload
  claiming the version), the registry contract, determinism, and both golden fixtures.
  New `contract.test.ts` imports only `@engine/save` plus public state/kernel/testing
  surfaces: round trip of a played state, the partitioned key list with no `views`, typed
  refusals, the registry and `inspectSave`.
- `scenario.test.crossing` gained a mid-crossing save test: play five steps, save, parse
  the text, load, finish both ways, and compare byte-equal.
- Verified in the app: manual Save at the Cypriot harbour (day index 5, 20 silver), page
  reload, Continue — the run came back at the same place, day and purse; console clean.
- Verification: `pnpm check` green (34 files / 697 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1-T08 (scenario runner) held to the test contract
- The runner already played a `commands` list through `reduce`, checked `path` assertions
  against the final state and printed a trace, but it had no entry kinds beyond commands,
  no event or per-step assertions, if-chains instead of matcher registries, and a trace
  that did not name the seed.
- `scenario.ts` now takes entries that are either a `Command` (it has a `type`) or an
  action (it has a `kind`). `SCENARIO_ACTIONS` holds the action kinds — `save` writes the
  run through the save envelope, reads it back and continues from the loaded state at a
  fixed `savedAt`. `ASSERTION_MATCHERS` holds `equals`, `contains` and `length`; an
  assertion may target `events` (`types`, or a payload at `events.N.*`) or be scoped to one
  step (`accepted`, `reason`, `eventTypes`, `events`).
- Failures are typed: `ScenarioFailure` carries `path`, `message` and the `step` when one
  was named, and `formatTrace` opens with `scenario <id> (seed "<seed>") — ok|FAILED`.
  An unknown action kind and a step that does not exist are refusals with reasons, not
  throws.
- New fixture scenario `src/engine/scenarios/slice-day-save.json`: three arrival choices,
  two days, a grain purchase, a `save` step and a coastal departure. `pnpm simulate --json`
  records the step, and `tools/simulate.test.ts` lists it with the other four.
- Tests: `scenario.test.ts` 17 → 24 (save step inside a run, unknown action, event
  assertions, a real `EffectClamped` from a new arrival choice whose respect delta exceeds
  the cap, trace naming, byte-identical trace replay). New `testing/contract.test.ts`
  (6 tests) imports only `@engine/testing` + public state/kernel/save surfaces and runs the
  three named scenarios, the save continuation and a typed failure.
- Headless task: `src/ui/**` and `src/store/**` untouched; the app was not re-driven.
- Verification: `pnpm check` green (35 files / 711 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1-T08 closed out against the milestone bullets
- Audited each bullet against the repo: scenario JSON with overrides, commands, state and
  event assertions and per-step assertions (`scenario.slice.day-and-save`); both
  registries; the runner under Vitest; the fixture scenario; `tools/simulate.ts`.
- Gaps fixed. `runScenario` used to throw on an unbuildable opening (a `RangeError` from
  `parseDate`, a ZodError from `createInitialState`) and on a handler that throws. It now
  returns one typed `start`/`start.date` failure with zero steps, and records a throwing
  step as `The runner could not run this step: …`. `scenario.test.ts` 24 → 26 tests.
- `tools/simulate.ts` gained `reportScenario(result, json)`. `--json` is now tested
  (id, ok, failures, steps including `save`), the fixture's step list is asserted (three
  dialogue choices, `advanceTime`, `buy`, `save`, `travel` → `JourneyStarted`), and
  `formatTrace` is asserted to print one line per step. `tools/simulate.test.ts` 7 → 10.
- No golden trace fixture: the milestone asks for a trace on failure and a deterministic
  replay, not a stored trace; it is recorded in the milestone as not applicable.
- Headless: `src/ui/**` and `src/store/**` untouched; the app was not re-driven.
- Verification: `pnpm check` green (35 files / 716 tests, 99 entities 0/0, skills check).

## 2026-11-26 — M1 close-out audit (no new task remains in M1)
- Walked every M1 bullet against the repo instead of the previous summaries: `state` (v1
  Zod schema, readable paths, 2 public-surface contracts), `time` (day counter, one month
  table, year-boundary vector), `rng` (six streams, seed-hash vector), `dsl` (13 condition
  and 18 effect registry entries, clamp events), `content` (13 entity schemas, registry,
  lint), `kernel` (`{ schema, run }` command registry, sequenced events), `save` (envelope,
  `{ from, to, migrate }` registry, v0 and round-trip fixtures), `testing` (runner over
  `SCENARIO_ACTIONS`/`ASSERTION_MATCHERS`, five authored scenarios).
- Evidence on disk: eight `@engine/*` contract tests, three save fixtures, five scenario
  JSON files, `tools/simulate.ts` with `--json`; the M1 demo script (`pnpm test`,
  `content:lint`, `check`) is the gate.
- No M1 task is unticked, so no new M1 work was started. The plan's next step is M4-T01,
  which needs recorded human sessions; `STATUS.md` already records that block.
- Doc accuracy: M1's status line and definition-of-done no longer claim `STATUS.md` sits at
  M2 — it records the M4 playtest gate.
- Verification: `pnpm check` green (35 files / 716 tests, 99 entities 0/0, skills check).

## 2026-11-26 — Maps carry buildings, terrain and borders
- The three sketches gained visible structure, all presentation over knowledge. The
  quarter sketch draws a footprint per activity (size by kind) with its number on the
  building instead of a numbered dot; regional and world sketches draw authored
  `regions[].mapFeatures` as a ridge of peaks, a river line or a dashed border, and a
  `city`/`port` place as a walled mark rather than a dot.
- Schema: optional `regions[].mapFeatures` (`river | mountains | border`, at least two
  schematic 0–100 points). Both slice regions authored with a ridge plus a border; the
  Levant also has a river. Features are unnamed and schematic; the screens say a border is
  the edge of the sketch, not a treaty line.
- Fog rule kept: `deriveWorldMap` lists terrain only for regions with a known
  destination, and `map.test.ts` covers it. New `src/ui/sketch.ts` (`peakPath`,
  `polylinePath`, `cityPath`) with its own tests.
- Verification: `pnpm check` green (36 files / 730 tests, 99 entities 0/0, skills check).

## 2026-11-26 — Reconciliation before Gate A (no code task)
- Compared the approved plan to the tree rather than to STATUS: M0–M3 have zero unchecked
  boxes and everything they name is on disk (fifteen engine modules, two packs, tools,
  save fixtures, five scenarios); M4-T04 is done; M4-T01, M4-T03 and M4-T05 need recorded
  human sessions, with M4-T02 written from them; M5–M8 are gated by Gate A.
- Nothing implementable remained, so no code was invented. The recent map work
  (`regions[].mapFeatures`, `deriveLocalMap.buildings`, regional/world `features`,
  `src/ui/sketch.ts`) is in the tree and covered by the suite.
- STATUS gained a reconciliation section; verification counts corrected to 36 files / 730
  tests; the reduced-motion debt line no longer claims there is no animation.
- Verification: `pnpm check` green (36 files / 730 tests, 99 entities 0/0, skills check).

## 2026-11-26 — A playtester agent (supplementary evidence)
- Added the first canonical agent, `.agents/agents/sotw-playtester/`: it plays the slice in
  the running app as one of the three M4 personas (trader, curious traveller, helper),
  records bugs with severity and reproduction, friction, ideas with pillar/cost, and
  verdicts on the seven §22.1 questions. It is an observer: it writes only under
  `docs/playtests/agent/` and never edits the build it is judging.
- The template lives beside it (`references/report-template.md`); `docs/playtests/README.md`
  defines the human/agent split. Agent sessions are explicitly not human evidence and
  cannot tick M4-T01/T02/T05 — the milestone's rule against ticking from non-human
  evidence is kept.
- Mirrored with `pnpm skills:sync` to `.claude`, `.cline`, `.codex`, `.cursor`, `.github`,
  `.kilo` and `.opencode`; `skills:check` now covers one agent as well as twelve skills.
- Verification: `pnpm check` green (36 files / 730 tests, 99 entities 0/0, skills check).

## 2026-11-26 — First agent playtest session (curious traveller)
- Ran the slice as a first-time curious traveller in the real app (dev server, seed
  `curious-1126`, uncommitted tree on `35d5426`): title → opening → Hannu → Ugarit place,
  Yada and Tiro → crossing known → coastal passage → anchorage, patrol toll, anchorage
  again → Cypriot harbour, Shipti, Ada → Status, Market, Map, Codex, Journal, Save.
  Seven in-game days, ~35 minutes. Report:
  `docs/playtests/agent/2026-11-26-curious-traveller.md`.
- Documented the run path in `docs/playtests/README.md` ("Starting a session"): `pnpm
  install`, `pnpm dev`, open `http://127.0.0.1:5173`, Begin → seed → Step ashore, with a
  pre-session `pnpm simulate` smoke check that is explicitly not a session.
- Findings came from the build, not the design: 7 bugs, 8 friction rows, 6 ideas and
  seven §22.1 verdicts (1 strong, 2 promising, 1 weak, 3 not enough evidence). The two
  that matter: Continue a saved run loads the manual slot over the newer autosave
  (reproduced twice), and a pending scene is stranded by sidebar navigation until a day
  is spent. Neither was fixed — this pass produces evidence.
- STATUS gained an agent-playtest section and a known-defect line; nothing ticked. Agent
  evidence cannot tick M4-T01/T02/T05, and M4-T01 still needs recorded human sessions.
- Verification: `pnpm check` green (36 files / 730 tests, 99 entities 0/0, skills check).

## 2026-11-26 — Period units on screen
- Money now reads in shekels of silver and cargo in minas, the units Ugarit actually
  weighed: purse, Status, Save summary, market column and prices, route fares and
  capacity, cargo totals and per-good weight. New `src/ui/units.ts` (`shekels`, `minas`,
  singular/plural) with `units.test.ts`; the state, the engine and the save format are
  untouched, so nothing migrates and no balance moves.
- Dialogue copy that states a price follows the same units: Hannu's harbour tax, Tiro's
  toll note, Shipti's room, the refugee loan and Yada's lesson now say shekels. Prose
  that treats silver as a substance ("Take the silver") is left alone.
- Canon recorded rather than implied: the Ugarit dossier's "Trade and money" gained the
  unit set (shekel ~9–10 g, 50 to the mina, 60 minas to the talent, `documented` for the
  units and `plausible` for the local standard) and says plainly that the slice's cargo
  and price figures are play abstractions. `docs/DATA_MODEL.md` §12 points at
  `src/ui/units.ts` as the only place the numbers are named.
- Verification: `pnpm check` green (37 files / 738 tests, 99 entities 0/0, skills check).

## 2026-11-26 — Beats as pages: one line, one picture, no counter
- Paced prose no longer accumulates or counts itself. A passage shows one beat beside the
  picture that belongs to it (speaker portrait in a scene, the place's hero on arrival,
  nothing where no art exists), with progress as a row of bronze dots instead of "1 of 8".
  Reading the last beat reveals the whole passage at once with a wider picture: a scene
  ends on the place illustration, a destination introduction on its hero, which appears at
  full width only once the text is complete.
- `beatAt` in `src/ui/story.ts` is the clamped, one-based frame the view reads; it is
  table-tested (first, middle, last, past the end, before the start, single beat, empty),
  and `useBeats` now returns the current beat plus the full list. The 0.28s fade respects
  the global reduced-motion rule; the log keeps a compact single-column beat.
- Content rules updated (`docs/CONTENT.md` "Pacing and emphasis"), STATUS's interface
  paragraph and this log follow. No engine, schema or save change.
- Verification: `pnpm check` green (37 files / 745 tests, 99 entities 0/0, skills check).

## 2026-11-26 — Reader verified and repaired at phone, mid and desktop widths
- Drove the running slice at 390, 768 and 1280 and measured each reader state (place
  introduction pacing and complete, scene pacing and complete, journal entry, conversation
  log): one beat, image beside it, bronze dots, no counter, no growth across Continues,
  no horizontal scroll, no overlap, whole art.
- Fixed three defects found that way: the stacked portrait rendered 268×357 and pushed the
  beat below the fold (art is now height-bounded, whole and at its own ratio inside the
  stacked card); the completed-scene image was squeezed into a 3.6:1 banner on a wide
  stage (now `max-height` only, so 480×320 at 1.5:1); and the Journal scrolled 44 px
  sideways because `.list li`'s grid outranked `.log li` and the new size container inside
  it collapsed to zero width (the log is a block again, and its story is not a container).
  A text-only passage no longer leaves an empty picture column, and choices gained a
  44 px minimum tap height.
- The beat card now answers to its container width (`@container (max-width: 26rem)`), so
  a narrow stage beside the sidebar stacks the same way a phone does. Art lost its forced
  4/3 and 3/4 frames and keeps its intrinsic ratio everywhere in the reader.
- `src/ui/reader.test.ts` pins the layout rules; docs/CONTENT.md's pacing note and this
  log follow.
- Verification: `pnpm check` green (38 files / 751 tests, 99 entities 0/0, skills check).
- Reduced motion, measured in Chromium over CDP (`Emulation.setEmulatedMedia`) rather than
  read off the stylesheet: the existing rule only shortened the beat fade to 0.01 ms, which
  still starts at `beat-in`'s `opacity: 0`; the first one or two frames of every passage
  were blank and their visibility depended on the animation finishing. `.story-beat` now
  has `animation: none !important` under the reduced-motion query. Re-measured per frame at
  390/768/1280: first frame opacity 1, `animation-name: none`, no frame below 1; under
  normal motion the same mount fades `beat-in 0.28 s` from 0 to 1 over 17 frames.
- Widest real passage: the content ships an eight-beat opening scene (`slice-opening.json`,
  `/nodes/shore/text`), used instead of the four-beat place introduction. Driven at 390
  with reduced motion: 8 dots on one 89 px row inside a 269 px row, no dots overflow, no
  horizontal scroll, one paragraph per Continue, no text/art overlap, completion with eight
  paragraphs, 44 px and 55 px choices, no dots left. Same numbers at 768 (89 px in a 462 px
  row) and 1280 (89 px in a 686 px row).
- 44 reader audits across the three widths: zero horizontal scroll, zero dot overflow, zero
  overlap, no counter.

## 2026-11-26 — Words shown in their own script, with the reading in parentheses
- Convention (docs/CONTENT.md, *Words in their own script*): a word from a language whose
  writing is attested appears in that script, followed by its reading in parentheses; a
  name invented for the game stays in transliteration; the sign-level source goes in the
  entry's provenance; a reconstruction stays in the codex and never in dialogue.
- Applied to the slice's attested names: `𐀁𐀔𐀀 (e-ma-a₂, read Ermahas)` and `Ἑρμῆς (Hermes)`
  in the names codex, `𒀭𒎏𒋚 (Ninshubur)` for the Sumerian/Akkadian story-name, and
  `𐎜𐎂𐎗𐎚 (ugrt)` as a new beat in the Ugarit codex. Sign strings checked against the
  Unicode Ugaritic and cuneiform charts (RASHA r, TO t; AN + NIN + ŠUBUR) and the
  documented ugrt spelling; the Linear B signs are B038 e, B080 ma, B008 a.
- The prose font now falls through Georgia → `Segoe UI Historic` → Noto Cuneiform/Linear
  B/Ugaritic → serif, so a script word renders rather than turning into boxes (verified in
  the running app: glyph runs 38.6/78.2/52.4 px against a 17.9 px tofu at 390, and
  `𐎜𐎂𐎗𐎚` 63.4 px against 16.3 px at 1280).
- `pnpm content:lint` gained a warning: a script word with no reading in parentheses. It
  caught its own author once (`𐀁𐀔𐀀` in a provenance note), which is the rule working.
- Tests: script-word cases in `tools/content-lint.test.ts` (accepted, warned with the word
  named, deterministic) plus an authored-content assertion; `src/ui/script.test.ts` pins
  the font fallback and its order. 39 files / 758 tests.
- Checked at 390 and 1280 in the running app: names entry (4 paragraphs) and Ugarit entry
  (3) carry every sign with its reading, no entry overflow, no horizontal scroll.

## 2026-11-26 — Proven glyphs and the written name in play
- Rendering proved against a deliberate placeholder instead of inferred from widths: each
  script word was drawn to canvas in the app's computed prose font at 64px beside a
  private-use glyph (U+E000), and checked three ways — word bitmap differs from the
  placeholder, every sign in the word has its own bitmap (Linear B 3/3, cuneiform 3/3,
  Ugaritic 4/4, Greek 5/5 distinct), and the per-sign advances are not one uniform box
  (Linear B 11.4/12/11.1 px, cuneiform 16.8/23/30.1, Ugaritic 16.8/6.7/22/16.8, Greek
  12.1/8.9/9.3/9.4/7.1, against a 16 px placeholder). No sign matched the placeholder.
  The fallback stack needed no shipped font on this machine.
- The name reaches the display (`src/ui/written.ts`): `TabletName` now renders
  `𐀁𐀔𐀀 (e-ma-a₂)` in the new-run masthead and the Status traveller row, and the Ugarit
  heading carries `𐎜𐎂𐎗𐎚 (ugrt)`. Invented names stay transliterated. The reconstruction
  stays a codex gloss; `written.ts` never exposes it.
- Style: `.written` baseline row, script at the text size, reading at `max(0.58em, 0.72rem)`
  in the label face. Measured 390 and 1280: masthead one line (35px/57px tall), script
  16px body / 28.9px and 54.4px in the h1, readings 11.5px and 31.6px; no overflow in the
  heading, the Status row or the place line; document scrollWidth === clientWidth.
- Tests: `src/ui/written.test.ts` pins the drawn forms, their code points, the absence of
  the reconstruction, and that invented names stay transliterated; `src/ui/script.test.ts`
  adds the reading/place styles. 40 files / 764 tests.

## 2026-11-26 — The world before the traveller, and no copy for the developer
- Title screen opens with the state of the world (inherited cities, law, writing,
  temples; bronze, copper from Cyprus, tin from the ends of the earth), then the
  arrival, the powers and the trader. `src/ui/title.ts` holds the five paragraphs.
- Deleted the review note "The slice is one crossing: Ugarit, Cyprus, and home again."
  and rewrote the codex lines that addressed the build ("the slice", "this game",
  "the player", "the dossier", "In play") in Alashiya, Cyprus, Ugarit and names.
- New lint rule `findDeveloperProseIssues` over player-facing keys; provenance and ids
  excluded. `docs/CONTENT.md` states the rule.
- Checked 390 and 1280: 5 paragraphs, no overflow, no banned phrase.
- Verification: pnpm check green, 41 files / 771 tests, content:lint 0/0.

## 2026-11-26 — The crossing, played end to end and repaired
- Played a new run with the real controls at 390 and 1280: title, name, opening scene,
  Ugarit market (bought oil), Tiro (worked the passage), coastal crossing with anchorage
  and harbour-check scenes, Cyprus market (sold oil, bought copper), Kinyras and the
  smithy, the return crossing, home; sold the copper and recorded the merchant-household
  faction plus Tiro and Sibtu obligations. No console error, no overflow.
- Engine: the corridor was one-way (Cyprus → Cyprus); `startJourney` takes a destination
  and `quoteTravel` requires an end of the route. Deeds record place and crossing in the
  right order; journeys resolve place names; route views carry display names.
- Store: Continue takes the newest save by `savedAt`; a pending scene cannot be navigated
  away from. UI: codex/settings/save/market copy rewritten, `.locked` is a block, Cargo
  reads the derived transport label, faction band "unproven".
- Checks: `src/ui/copy.test.ts` and four new content-lint patterns guard the copy; tests
  for reverse travel, route names, newest save and the scene guard. pnpm check green,
  42 files / 778 tests, content:lint 0/0.

## 2026-11-26 — Non-oil holds, cargo-aware scenes and visible regard
- Played seed `wanderer-4` twice with cargo that was not oil jars: grain at 390 px, copper
  and a measure of grain at 1280 px. Both reached the cargo-loss vignette on the first
  night ("the grain has gone into the water", "the copper has gone into the water"), lost
  the named good, took Kinyras' grain offer, and sold the return cargo at Ugarit on day 12.
- Engine: `{cargo}` is rendered from the inventory; `loseCargo` removes the largest stack
  actually held; the copper offer only appears with grain and records its journal on
  acceptance; passing water costs no oil; the squall jar is a water jar.
- Views: routes orient to the end the trader stands on; faction and character reads expose
  every non-zero dimension, shown in Factions, Status and People.
- Guards: content lint rejects cargo-losing scenes that name a good or skip `{cargo}` and
  choices that take a good without a condition; tests cover both and the regard surfacing.
  pnpm check green, 43 files / 798 tests, content:lint 0/0. Nothing committed.

## 2026-11-26 — Cargo fix locked into a scenario; playtesting budget cut
- Added `scenario.slice.cargo-hold`: sails with two copper and one grain, resolves the
  cargo-loss scene, and asserts the copper dropped to one while the grain survived. This
  locks the hard-coded-cargo repair without a browser run; `tools/simulate.test.ts` now
  lists it among the authored scenarios.
- Working note: future verification is headless (unit, content-lint, scenario, build).
  Browser playthroughs are reserved for an explicit request or a specific visual question,
  not for routine validation of engine changes.
- pnpm check green: 43 files / 799 tests, content:lint 0/0. Nothing committed.

## 2026-11-26 — The world behind the text: backdrop, palette, motion
- Added `src/ui/backdrop.tsx`: one fixed backdrop with two cross-fading layers, slow drift
  and a tinted scrim. `backdropFor` picks the speaker's portrait in a scene, then the
  current place's art, then the destination of a journey, then the harbour.
- `theme.css`: replaced the greybox tokens with ochre, terracotta, lapis, olive and gold;
  dark glass sidebar with a wordmark; parchment panels and a richer type hierarchy; hover
  lift on buttons, choices and art cards; gold focus ring; cinematic title over the
  harbour with Begin above the world introduction; compact sticky masthead and scrolling
  nav on phones. Reduced motion stays static.
- Fixed a grid sizing bug found while checking: `margin: 0 auto` on `.stage` collapsed it
  to fit-content, squeezing prose to one word per line. `.stage { width: 100% }` restores
  the reading column.
- Checks: `pnpm build` and `pnpm check` green, 44 files / 804 tests, content:lint 0/0.
  Browser check at 1280 and 390: no horizontal overflow; scene backdrop followed Amnit's
  portrait; no console errors. Nothing committed.

## 2026-11-26 — Visual language and flow held up in two real playthroughs
- Ran the slice at 1280 and 390 from Begin to the return sale: title, creation, both
  harbours, journey scenes and waypoints, both markets, journal, codex, save, reload and
  loading back in. Backdrops tracked place and speaker; art returned 200/304; no console
  errors or horizontal overflow.
- Flow repairs: quoting fares now unlocks the crossing (`ugarit-tiro-passage.json`), the
  empty Roads screen links back to the harbour, routes reverse their legs/waypoints from
  the traveller's end, and the backdrop prefers the crossing to the port left behind.
- Layout repairs: two-step abandon; text-size control inside the new-game form; the phone
  masthead wraps all nav items and uses a grid so long place names do not overlap the
  date; screen changes reset scroll and `overflow-anchor` is off; the market table becomes
  a two-line card per good; scene portraits are blurred behind the card.
- Tests: route reversal and backdrop precedence/reduced-motion contracts. `pnpm check`
  green, 44 files / 806 tests, content:lint 99 entities, 0/0. Nothing committed.

## 2026-11-26 — Reduced motion proven over CDP; Continue made honest
- Drove a headless Chromium via CDP at 1280 and 390, emulating
  `prefers-reduced-motion: reduce` with `Emulation.setEmulatedMedia`. Backdrop drift,
  crossfade (`transition: 0s`) and screen entrance were all suppressed; opacity stayed
  1, choices stayed visible, and a purchase still worked. Restored `no-preference` and
  confirmed drift/crossfade/entrance again.
- Added `hasSavedJourney()`; it deserializes a slot rather than trusting a key. The title
  disables Continue and shows the reason when no readable save exists; tests cover
  missing, corrupt, manual and autosave-only slots. Manual save at 1280 (day 3, Ugarit,
  36 shekels) survived reload → Continue exactly.
- `pnpm check` green, 44 files / 807 tests, content:lint 0/0. Nothing committed.

## 2026-11-26 — Sibtu's promised tomorrow is actually queued
- Reproduced the loop against the authored pack: the story branch reached the “Tomorrow.
  Ask me tomorrow…” node without scheduling `evt.ugarit.refugee-ask`; only the two “Do
  you need anything?” choices scheduled it.
- Moved the one-day schedule onto the shared “Tomorrow, then.” exit, so every route into
  the promise queues the request. Added `scenario.slice.refugee-tomorrow` to the
  authored-content simulations and registered it in `tools/simulate.test.ts`.
- Verified in Chromium: story route → spend a day → day 2 opens “The children are out…”.
  `pnpm check` green, 44 files / 808 tests. Nothing committed.

## 2026-11-27 — What an answer costs is said beside it
- Scene answers now carry a derived cost: silver, goods given up, cargo lost and days
  spent, read from the choice's effects by `choiceCost()` in the narrative module. The
  scene view hands it to the UI and the choice shows `Costs …` under its line, visible
  whether or not the answer is currently available. Gains are not a cost and stay in
  the scene text.
- Tests cover silver/goods/cargo/days together, unknown goods, sums across effects,
  answers that pay or give, free answers, and attachment to the scene view. The test
  pack's lesson now costs 5 shekels so the view is exercised. `pnpm check` green,
  44 files / 814 tests, content:lint 99 entities 0/0. Nothing committed.

## 2026-11-27 — Every spend is priced where it is decided (live pass)
- Drove the running dev build in the thread preview. Priced dialogue answers now show a
  bold bronze line under the answer: the Yada lesson (`Costs 5 shekels`, purse 40 → 35),
  Shipti's room (`Costs 3 shekels`), the checkpoint (`Costs 6`, `Costs 10`, `Costs 4
  shekels`), Belet's oil (`Costs 1 olive oil`), Ada's tin (`Costs 1 tin`), Sibtu's loan
  (`Costs 15 shekels`), and the cargo shift (`Costs 1 cargo item`). Unavailable answers
  show the cost and the requirement reason, in that order.
- Fixes this pass: cost line raised to 0.84rem/600 for legibility; market price cells now
  read `4 shekels` instead of a bare `4` (verified a 4-shekel pottery purchase moved the
  purse 22 → 18, and the fare 8 moved it 43 → 35); cargo wording changed from "a load
  from your hold" to `1 cargo item` so it does not claim the whole hold.
- Audited the other spend points: Roads states days and fare on the same line as Take
  passage and refuses with "You cannot pay this fare yet"; day actions name their cost
  (`Spend the day`, `Rest three days`); gated answers state their requirement (seal,
  Akkadian, oil) and the market names affordability/capacity under the good. The route's
  own requirement ("No master will take you without a word in Akkadian…") is shown by
  Roads when unmet; that state was reviewed in code, not driven live.
- The travel cargo scene is a random crossing encounter, so it was reached in the preview
  by loading a save whose pending scene was that node (real engine state through
  Continue), then reading the rendered answers. `pnpm check` green, 44 files / 814 tests,
  content:lint 99 entities 0/0. Nothing committed.

## 2026-11-27 — Protagonist answers that contradicted themselves
- A locked answer's reason was rendered inside the answer button, so the traveller's line
  and the narrator's denial were one utterance: "I have tin. / Costs 1 tin / You have no
  tin, and she does not buy the idea of tin." The reason now sits below the button, in
  its own muted line with a left rule, wired with `aria-describedby`; the button holds
  only what the traveller would say (and its price). Seen at the Ugarit gate and at
  Yada's board.
- Transcript-level contradictions:
  * Asking the price of a room at Shipti's inn charged three shekels before the traveller
    agreed to take it. The charge moved to "Take the room. Costs 3 shekels", with a
    "Not at that price." exit and an unavailable note when short. Verified live: asking
    left the purse at 18; taking it made it 15.
  * "Say nothing and let the master handle it" took six shekels with no explanation. It
    now leads to its own outcome: the master speaks and takes his fee. Verified 20 → 14.
  * The cargo-shift scene said the cargo had already gone into the water, then charged a
    cargo item for going after it or letting it go. It is now hanging over the gunwale,
    held by one lashing, so all three answers mean what they say.
  * "I have no silver for lessons" was offered with a full purse. It now needs the purse
    to be short, with a narrator note when it is not; the free lesson is still reachable
    at two shekels, the paid one at eighteen.
- `pnpm check` green, 44 files / 814 tests, content:lint 99 entities 0/0. Nothing
  committed.

## 2026-11-27 — Scenes that charged nothing for what they announced
- Swept every dialogue, event and journal in the slice for narration that claims a payment,
  handover, possession or state change the effects never apply, and made each one true.
- Harbour gate: the ledger announced a two- or three-shekel tax on oil that no effect took.
  The first answer now costs three shekels (label on the button), and the ledger says the
  three shekels are on the board and counted. Live new game: purse 40 → 37, cost shown on
  the answer, ledger text reads 37.
  * Copper yard: the scene sold twelve ingots and paid in silver. It now sells the grain
    measure for the twenty-four (or thirty-six) shekels the effects pay, and the journal no
    longer records ingots. Deed subject follows the grain.
  * Palace errand: the seal was granted when asking what it was for, while the pouch was
    only taken at the next answer; the errand journal was added by the event even when the
    traveller refused. The seal and the journal now arrive with "Take the pouch."; the
    event carries no effects.
  * Wreckage: "Take the rope." paid four shekels with no cause. The master now buys the
    rope for the four shekels before it goes into the locker.
  * Checkpoint argument: the text claimed the cargo was oil even with an empty hold. It
    now describes the four shekels the answer charges.
  * Sibtu: the refusal claimed cargo the hold may not have ("my own affairs" now); taking
    her bundle is recorded as `carries.sibtu-cloth`; the helped journal no longer claims a
    yard sale that never happens. The gate journal no longer claims a name the silent
    answer never gave. The Cyprus intro no longer says the crossing took two days.
- Added `tools/content-coherence.test.ts` (14 tests) driving each corrected scene through
  `startDialogue`/`resolveChoice` and pinning money, goods, flags, journals and the words
  the scene shows to the state it produces.
- Live preview, real playthroughs: new game gate 40 → 37 with the tax on the answer;
  Yada's paid answer `Costs 5` 37 → 32 and the free answer greyed with its note; coastal
  fare 32 → 24; the checkpoint's "say nothing" `Costs 6` 24 → 18 with the settled text;
  wreckage rope +4 (18 → 22); Shipti's room question free, "Take the room. Costs 3"
  22 → 19; cargo shift rendered "the olive oil is hanging over the gunwale" and lost one
  oil (2 → 1) on the answer marked `Costs 1 cargo item`. The original save was restored
  afterwards (day 7, Cyprus, 18 shekels).
- Left open, needs a design decision: the Tiro passage answers still promise work in place
  of the fare, while `travel` charges the full fare regardless
  (`src/content/packs/slice/dialogues/ugarit-tiro-passage.json`, "I will work the
  passage." / "I will work for the passage instead." / "I will work the passage again if
  you need hands.").
- `pnpm check` green, 45 files / 828 tests; content:lint 99 entities, 0 errors /
  0 warnings. Nothing committed.
- Follow-up: the player met Tiro's booked opening and asked what it meant. Nothing in the
  engine schedules a departure or checks attendance; the text ("either way the boat
  went") asserted one. Chose the content rewrite: the booked scene now says the boat has
  not gone and the price has not changed; "When do we sail?" answers that the boat waits
  on the traveller, not the wind; the work answers no longer promise a free crossing and
  the work node says plainly that the fare is still the fare. Added a coherence test for
  the scene. Verified live through the preview by opening the scene on a real save.
  `pnpm check` green, 45 files / 829 tests; content lint 0/0. Nothing committed.

## 2026-11-27 — Who is speaking, and why the rail is closed
- The sidebar said "A scene is waiting" without a name, while its navigation buttons
  stayed enabled; the store silently held the scene, so a click looked broken and the
  refusal "There is already someone speaking." named nobody. The rail now reads
  "Ada is waiting for an answer. Answer to use the other screens." (speaker resolved from
  the pending dialogue, with a generic form for scenes that have no speaker), and the
  navigation is disabled while a scene is open — the same rule the store already
  enforced, now visible.
- `talkTo` names the open speaker instead of "someone": "Amnit is still speaking. Answer
  the scene first."; a scene with no speaker says "The scene in front of you is not
  finished." Covered in `reduce.test.ts`.
- Live check on the saved run: Ada's scene showed the named note with every nav button
  disabled; answering "Leave her to it." restored the place screen and re-enabled the
  rail (Journey still disabled with no journey). The autosave was restored afterwards
  and the preview reloaded onto Ada's scene.
- `pnpm check` green, 45 files / 830 tests; content lint 99 entities, 0 errors /
  0 warnings. Nothing committed.

## 2026-11-27 — Sibtu's cloth: cargo, sale, and return
- The bundle was only the flag `carries.sibtu-cloth`: no good, no market row, so taking it
  changed nothing the player could see and the yard had nothing to sell. The earlier fix
  had removed the journal's claim of a sale rather than modelling the errand.
- Added `good.sibtu-cloth` ("Sibtu's cloth", textile, 1 mina) to the slice pack and its
  manifest, and an Ugarit market entry at basePrice 8 / stock 0. The market now hides rows
  with no stock and nothing carried, so the cloth appears only once it is in the hold.
- Both "Take the bundle." answers (the ask's `thanks` and the amends path) add the item;
  the amends path also schedules the existing eight-day news event.
- At the current prices the yard pays five shekels for it at every language tier. The new
  Sibtu entries offer the return only when `carries.sibtu-cloth` is set and the cloth is
  no longer in the hold; paying takes five, sets `sibtu.cloth-settled`, adds trust and
  journals `journal.slice.sibtu-cloth-settled`; refusing sets the same flag and costs two
  trust. A settled entry returns to an ordinary `after-cloth` conversation.
- A save that took the bundle under the old flag-only version can recover it: the
  `bundle-missing` entry (flag set, no item, no `sibtu.cloth-taken`) has Sibtu reissue it
  once and sets the new flag. A settled save is excluded.
- Added six content-coherence tests: both acquisition paths, the market entry and sale,
  the return's gating, the payment and journal, the "cannot give it" close, and the
  old-save reissue.
- Live preview at 390 px: took the bundle (20 shekels, hold 1); the yard showed "Sibtu's
  cloth", stock 0, carried 1, Sell; selling paid 20 → 25 and removed the row; speaking to
  Sibtu opened "You sold it, then." and "Give her the five shekels. Costs 5 shekels";
  paying took 25 → 20 and showed the settled text. Restored the original autosave (day 6,
  Cyprus, 18 shekels, pottery, Ada's scene) and reloaded it.
- `pnpm check` green, 45 files / 835 tests; content:lint 101 entities, 0 errors /
  0 warnings; skills check passed. Nothing committed.

## A picture for every beat, and each picture once — 2026-11-27

The task: an appropriate image for each new textual beat, no picture used over and over,
and never the same picture twice on one screen.

- Content model: a dialogue node may carry `art` (`DialogueNodeSchema`); `deriveScene`
  passes it through as `SceneView.art`. Presentation only — no engine rule, no save field,
  no migration.
- Nine new scene illustrations for the cloth thread, one per beat: the tied bundle
  (`cloth-table`), tying the cord (`cloth-tied`), pushing it across the table
  (`cloth-amends`), cutting the cord and folding it back into the chest (`cloth-refused`),
  the bare table and coil of cord (`cloth-missing`), the shuttle set down and the palm held
  out (`cloth-settle`), counting five shekels into the box (`cloth-settled`), back at the
  shuttle with the children watching (`cloth-kept`), and the shut chest and working loom
  (`cloth-after`). Authored on the nodes of `dlg.ugarit.refugee-ask` and
  `dlg.ugarit.sibtu.ask`; 4:3, same style anchors as the rest of the set.
- `art.ugarit.mole` gives the harbour activity card its own picture: it had been repeating
  the harbour hero directly above it on the Place screen.
- One picture appears once: `backdropFor` now takes `avoid` and returns `ArtAsset | null`.
  A scene avoids its own beat art and the speaker's portrait (the portrait was drawn both
  behind the card and inside it); the Place screen avoids the hero it is showing. With no
  distinct place picture left the backdrop is plain rather than borrowing the other coast's
  harbour. `Backdrop` renders without layers in that case.
- A scene no longer borrows the place's hero as beat art or as its finished-passage
  picture: the world behind it already is that place. Beat art is the node's picture, else
  the speaker's portrait; the finished passage shows the node picture, else the portrait
  stays in the scene head.
- Reviewed every file: two takes were regenerated for modern fittings (a wall switch, a
  light switch and lace-up shoes), and `cloth-missing` twice for standing inside the loom
  frame. Remaining notes are in `assets/exploratory/README.md` (a framed panel, plain wall
  plates at the edge, and a chest with metal corner plates).
- Guards: `art.test.ts` resolves every node art and pins each cloth beat to its picture,
  fails on a repeated beat image, and fails if one Place screen repeats a picture across
  hero, activities and cast; `backdrop.test.ts` covers the avoidance and the plain case.
- `pnpm check` green, 45 files / 860 tests; content lint 101 entities, 0 errors /
  0 warnings; skills check passed. All ten files serve 200 from the dev server. Nothing
  committed.

## Units explained, and a codex with shelves — 2026-11-27

The task: explain the period units in the codex with modern reference points, and organise
the codex (and similar reading screens) so the index is navigable.

- Three codex entries on a new `measure` shelf: `codex.shekel` (no coinage, a shekel of
  silver ~9–10 g, fifty to the mina, a jar of oil three shekels), `codex.mina` (a mina ~470
  g, sixty to the talent ~28 kg, and the play weights: ingot 4 minas, jar 3, porter's load
  20, a traveller on foot no more) and `codex.year` (365 days as 12×30 + five days, against
  a modern 28–31-day month and a leap day). Prose in beats; each entry carries provenance
  separating what is attested from the reader's gloss.
- `CodexSchema` gains a required `category` from a closed list (`place`, `people`,
  `language`, `road`, `measure`); `deriveCodex` passes it through. Existing six entries
  shelved: three places, the names entry under peoples, Akkadian under languages, the
  crossing under roads.
- `src/ui/codex.ts` holds the shelf order and labels and a `groupCodex` that hides empty
  shelves and keeps unknown ones under "Other". The index renders shelf headings; the
  codex opens on the first entry of the first shelf, not on content load order.
- The Journal's conversation log is grouped by day (`src/ui/log.ts`), one heading per run
  of consecutive lines from the same date instead of a date beside every line.
- CSS: the sticky index scrolls as one (was per-list), shelf headings added, day heading
  added; stacked layout releases the height cap so every shelf shows at once.
- ADR-0008 records why modern measures are allowed in the codex and forbidden in scenes,
  and that prices are never converted. `CONTENT.md` gains §10 with the entry shape and the
  shelf rule.
- Tests: `codex.test.ts` (5), `log.test.ts` (3), a readModels codex-category case, and two
  schema refusals (no shelf, unknown shelf).
- Seen in the running app at 390 and 1280: five shelves over nine entries, the mina entry's
  kilogram comparison, sticky two-column index, Journal log under its day heading, no
  horizontal overflow. `pnpm check` green, 47 files / 871 tests; content lint 104 entities,
  0 errors / 0 warnings. Nothing committed.

## One purse of silver, no exchange mechanic — 2026-11-27

The question: with a `currency` field on each destination, should money convert on arrival,
or should the game use something more generic?

- Answer: neither. Value is weighed metal and there are no coins, so there is one purse of
  silver and one unit in the traveller's ledger. A per-region purse would need invented
  exchange rates, rounding at borders, and a second balance against cargo capacity, none of
  which serves a pillar; local dearness is already the authored `priceModifier`.
- ADR-0009 records the decision, the rejected alternatives, and what a future copper or
  barley medium of exchange may be (a priced good or local convention, not a purse).
- The destination `currency` field is documented in the schema, `CONTENT.md` and the Ugarit
  dossier as descriptive only: no screen prints it, no rule reads it.
- Market copy gains one sentence: the purse is silver by weight and spends at every
  harbour, only the asking price changes. `codex.shekel` gains a fourth beat on the island's
  copper being cargo rather than a second money.
- Tests: `src/ui/money.test.ts` (every destination still values silver) and a `copy.test.ts`
  case pinning the market basis line and that the interface never reads `currency`.
- `pnpm check` green: 48 files / 873 tests, content lint 104 entities. One full run timed out
  three content-loading tests under parallel load; they passed alone and on the re-run.
- Seen in the running app: the Market screen at Ugarit shows the basis line beside the
  purse. Cyprus itself was not visited (the crossing needs the journey to be played).

## Ada is the smith, and the picture now says so — 2026-11-27

Reported: a woman smithing on Late Bronze Age Cyprus is unusual but plausible, and the
smithy illustration showed a man, contradicting Ada's dialogue and portrait.

- Decided Ada stays the smith (`char.cyprus.ada`, roles smith and workshop owner; her
  daughter sorts charcoal). Rewriting her into a man's daughter would have contradicted the
  dialogue she speaks, her wants, and the dossier. Recorded as a plausible local case in her
  provenance notes, the cast brief and the Cyprus dossier, with an explicit "no man at her
  anvil, in prose or art" so the inconsistency is not reintroduced.
- Regenerated `art.cyprus.smithy` three times; kept the cut with the clay hearth hood, the
  smith working with tongs and hammer, and the daughter sorting charcoal (the earlier cuts
  had a metal stovepipe, a mallet, or a bare-chested man). Files in `public/art/` and
  `assets/exploratory/`; alt text, README review row and generated date updated.
- Content: smithy blurb now "a girl of nine sorts charcoal by size while her mother works
  the bronze"; Ada's opening identifies the girl as her daughter; character provenance note
  extended.
- Gate: three content-loading tests (content-coherence, dialogue-memory, simulate) timed out
  at the 5 s default on several full runs while passing in isolation in 0.3–3 s, so
  `vite.config.ts` now sets `testTimeout: 15_000` with a comment. `pnpm check` green: 48
  files / 873 tests; content lint 104 entities.
- Verified the new image serves from `/art/cyprus-smithy.jpg` at 1248×832 and reviewed the
  file against Ada's portrait. The Cyprus Place screen and Ada's scene were not viewed in
  this pass.

## 2026-11-27 — Interface — A main menu of lands and an illustrated prologue

- Replaced the title's prose panel with a menu: name, Begin/Continue, then the two
  regions as large illustrated cards named from content (`MENU_LANDS`).
- Split the opening into five beats, each with its own picture (`PROLOGUE_BEATS`,
  `prologueBeatAt`); flow is menu → prologue → name and seed, and `prologue` joined the
  screen union.
- Seven exploratory images: `land-levant`, `land-cyprus`, `prologue-gate`, `-bronze`,
  `-arrival`, `-temple`, `-purse`, prompted from Ugarit's acropolis shrines, palace gate,
  Baal stela and Minet el-Beida quay, and Late Cypriot walls, betyls and oxhide ingots.
  Three rounds rejected for classical/medieval architecture, lettering and modern dress.
- Verification: `pnpm check`; menu and prologue opened in the browser at 1280 and 390.
- Notes: the generator's defaults fight period accuracy; guidance for the M18 brief is in
  `assets/exploratory/README.md`.

## 2026-11-27 — Design — Population shape and the ages of the cast

- Added `docs/design/04-demography.md`: a plausible (not measured) population baseline for
  1230 BCE, bent by settlement type, with casting rules and brief ages for the nine.
- Stated the limit plainly: no census, life expectancy at birth is not a death date, and
  no figure may reach game text without a source. No engine or save change.
- Recorded an old-storyteller seed as unclaimed until the protagonist document allows it.
- Verification: `pnpm check`, docs only.

## 2026-11-27 — Art — Regional wares and three dated horizons

- Added ADR-0010 and `docs/ASSETS.md` §2.5–2.6: regional art inventory, a styles-travel
  rule, and horizons A c. 1250–1230 / B c. 1200 / C c. 1175; later horizons are new files.
- Rebuilt four images around legible wares: Levant quay, Cypriot courtyard (White Slip II
  bowl, Base Ring II juglet, Canaanite jar), the balance with a Cypriot bowl beside its
  local copy, and the shrine with one carved stela and one plain.
- The Egyptianising ivory was rejected for the shrine (it returned as a stone icon) and is
  recorded as a future object study; the ivory bed panel at Ugarit is the source note.
- Verification: `pnpm check`; menu and prologue reloaded in the browser.

## 2026-11-27 — World gallery, a wider prologue, and regional ecology in the art

- Menu: added `WORLD_WONDERS`, a gallery of ten places of 1230 BCE beyond the two
  playable shores — Karnak, Giza, Hattusa, Chogha Zanbil, Mycenae, Abu Simbel,
  Dur-Kurigalzu, Enkomi, Anyang, Mohenjo-daro — each with its own picture and a line on
  the place and the people who live there. The copy says plainly that the journey does
  not sail to all of them.
- Prologue: five beats became twelve, widening from the eastern Mediterranean to Egypt,
  Nubia, Hatti, Mycenae, Elam, Mesopotamia, Shang China and the Indus, with one line of
  local climate stress at Ugarit.
- Art: corrected the single-desert register. `docs/design/05-the-world-in-1230.md` records
  each region's landscape, people, season and sources; `docs/ASSETS.md` §2.7 makes
  regional ecology and palette a review rule. Two land cards and ten world views were
  regenerated for green Nile corridors, wooded Cyprus and Anatolia, irrigated Elam and
  Mesopotamia, the Argive plain, riverine Anyang and the grass-grown Indus ruins.
- Also finished the American-English prose pass across content, UI, docs and skills. The
  displayed `favour` dimension label is now "favor"; the stored key and the `harbour`
  activity kind keep their identifiers, and `docs/CONTENT.md` §4 states the rule.
- Checks: `pnpm check` green; see the final count in the run that closed the pass.

## 2026-11-27 — Paint, plaster and colour

- Recorded that finished buildings were plastered and painted: `docs/ASSETS.md` §2.8 and
  `docs/design/05-the-world-in-1230.md` §4 give each region a colour identity and a
  pigment palette, separate elite from ordinary decoration, require weathering, and
  exclude the later Ishtar Gate glazed-brick look.
- Regenerated ten architecture-facing images — both land cards, eight world views, the
  Ugarit harbor and palace gate — with painted reliefs, frescoed plaster, red and mauve
  doorframes, glazed bands, painted doors, dyed awnings and patterned floors. Remaining
  defects are listed per file in `assets/exploratory/README.md`.

## 2026-11-27 — Story-priced goods no longer drift with the market

- Fixed the festival mismatch: Sibtu's cloth is sold at five shekels in the scene and the
  journal, but `sellPrice` computed it from basePrice 8 with the festival multiplier and
  haggling, which could pay six. Market entries now accept `fixedPrice`, honoured by buy
  and sell before any modifier, and the cloth is pinned at five.
- Engine test covers the exact six-versus-five case; the content-coherence test checks
  all five language tiers and the festival state. Rule added to `docs/CONTENT.md` §2.

## 2026-11-27 — Night events and night scenery

- Added a destination `night` band (art, passage, weighted encounters) and `fireNight`:
  one eligible minor event per night after a single day spent, no scene on long skips.
- Added the night screen and store routing, plus Ugarit and Cyprus night events/scenes.
- Added `ugarit-night.jpg` and `cyprus-night.jpg`, with caveats recorded.
- Verification: `pnpm check` green (905 tests, 108 entities); night screen not clicked
  through, images reviewed as files.

## 2026-11-27 — Cargo thumbnails

- Added a required `art` thumbnail to every good and twelve `art.good.*` plates.
- Shown in the market table and Cargo list, with alt text and a shared 44 px treatment.
- Art test covers resolution and uniqueness; caveats recorded in `assets/exploratory`.
- Verification: `pnpm check` green (930 tests, 108 entities); rows not viewed in the app.

## 2026-11-27 — Regional dress and household goods rule

- Added `docs/ASSETS.md` §2.11: dress, hair, ornaments, pottery and furniture by region,
  with slice guardrails and explicit classical/medieval/modern negatives.
- Prompt and review workflow now require the check; shared exploratory notes updated.
- Existing art flagged for an M18 dress-and-object audit; no images regenerated this pass.

## 2026-11-27 — Show both market prices

- Added `sellUnitPrice` to the market view and separate Buy/Sell columns.
- Replaced the confusing "prices are guesses" line with an accurate language note.
- Documented the deliberate 60% spread and the fixed-price exception.
- Verification: `pnpm check` green (931 tests, 108 entities); market not viewed in the app.

## 2026-11-27 — Move the world gallery off the title menu

- Title screen now holds only the name, tagline, Begin/Continue and a link to the world
  gallery; the land and wonder cards moved to their own `world` screen.
- Added `MENU.worldPlaces`; updated the gallery copy and docs. Tests unchanged.
- Verification: `pnpm check` green (931 tests, 108 entities); screens not viewed.

## 2026-11-27 — Remove the prologue's dead-end exit

- Removed "Leave this telling"; it only returned to the title without saving or skipping.
- Verification: `pnpm check`.

## 2026-11-27 — Group the game menu into six entries

- Replaced the fourteen-item sidebar with six groups (Place, Trade, Travel, People,
  Journal, Settings) and a per-group tab row for the secondary screens.
- Trade falls back to Cargo when no market is open; Save is under Settings.
- Verification: `pnpm check` green (931 tests, 108 entities); UI not viewed.

## 2026-11-27 — Require a picture for every paced beat

- Added ordered `beatArt` arrays to dialogue nodes, place intros, nights, journal and codex
  entries; `SceneView`, `JournalEntryView`, `CodexEntryView` and `DestinationView` carry
  them through.
- `Story` now resolves the plate for the current beat, falling back to the passage picture
  for legacy beats; the conversation log uses the dialogue node's plates.
- Illustrated all ten opening beats and both four-beat starting-place intros with distinct
  plates. Added `art.opening.unloading` and `art.opening.oil` (reviewed files, copies in
  `assets/exploratory/`).
- Added `beatArt.test.ts` and the 257-key legacy ledger. New missing beats fail, the ledger
  can only shrink, stale entries fail, and a passage cannot repeat a plate.
- Rejected generated takes with paper, metal pens, readable lettering, wall switches,
  glass lanterns, roof tiles, extra masts and classical temple columns; those are not in
  the catalog. `docs/ASSETS.md` §2.12 and `docs/CONTENT.md` record the rule.
- Verification: `pnpm check` green, 49 files / 940 tests, 108 entities, 0 errors /
  0 warnings. Opening/place art not walked beat by beat in the browser.

## 2026-11-27 — Show gain or loss against what cargo cost

- Added persisted `CargoEntry.costBasis`: total silver paid for the stack. Buy commands
  record the actual haggled total; gifts/starting cargo are zero; legacy saves are null.
- Partial sales and losses release `round(basis × removed / held)`; the market shows the
  total result for all carried units and the average paid, with “cost not recorded” for
  pre-v2 cargo.
- Bumped `SAVE_FORMAT_VERSION` to 2 with a v1→v2 migration and a v2 round-trip fixture; v1
  migration marks inventory cost unknown.
- Added engine tests for buy basis, loss on sale, proportional release, and market views;
  ADR-0011 and the data model record the rule.
- Rejected inferring cost from the current asking price or assigning zero to old saves.
- Verification: `pnpm check` green, 49 files / 946 tests, 108 entities, 0 errors /
  0 warnings. Market column not visually checked.

## 2026-11-27 — Cycle the world's great places behind the title

- Added `TITLE_BACKDROPS`, composed from `WORLD_WONDERS` and `MENU_LANDS`, and a pure
  `titleBackdropAt` wrapper.
- Added `TitleBackdrop`, which advances every nine seconds and lets the existing
  `Backdrop` cross-fade layers. It is mounted only on the title screen; the prologue,
  new-game form and world gallery keep their fixed backdrop.
- Extended the title tests to cover unique, resolvable scenery and wrapped indexes.
- Verification: `pnpm check` green, 49 files / 947 tests, 108 entities, 0 errors /
  0 warnings; checked the rotation and image loads in a clean browser profile.

## 2026-11-27 — Add a credits screen to the title

- Added a `credits` pre-game screen and a **Credits** button on the title menu, with a
  back link to the title.
- Credited game creation to **A.S. Mori** in a dedicated `CREDITS` block; no additional
  roles or names were invented.
- Styled the credit as a quiet gold-ruled panel beside the title, including a phone layout.
- Verification: `pnpm check` green, 49 files / 948 tests, 108 entities, 0 errors /
  0 warnings; inspected the screen at desktop and phone widths.

## 2026-11-27 — Make the maps readable and actionable

- Reworked the local quarter into a large chart with clickable/focusable building marks,
  labelled buildings, curved streets, a compass, and a printed index of places.
- Added `localActionFor`: market → Market, harbour → Roads, other activities → Place page.
  Added transient `activityFocus` so the Place page scrolls to and highlights the chosen
  card; it is cleared on the next screen change and never saved.
- Reworked regional/world charts with deterministic `coastPath` shorelines, sea hatching,
  chart framing, legible labels, and a places-on-this-sketch summary.
- Added tests for action routing, activity focus, coastline and street geometry.
- Verification: `pnpm check` green, 50 files / 955 tests, 108 entities, 0 errors /
  0 warnings; inspected desktop and phone layouts and exercised map links.

## 2026-11-27 — Make destinations, places, and people one hierarchy

- Renamed the code concept from activities to places (`places`, `PlaceSchema`, `PlaceDef`);
  kept `act.*` IDs. Destination now carries `places`; the redundant unmodeled `sites` field
  is gone.
- Added authored place `cast` (validated as a subset of the destination cast, one place per
  character) and `actions` (`trade`, `passage`); an unassigned present person appears under
  "Elsewhere in the port".
- Added the place screen with hero art, description, place people and Speak, and only its
  real actions. The destination is now an index: intro, local sketch, compact place list,
  roads and day actions, with no port-wide people list.
- Added transient `placeId`; scenes return to the place they began in, and market/roads
  show "Back to {place}". Local map marks open their place.
- Added ADR-0012 and updated `DATA_MODEL.md`, `STATUS.md`, content notes, and tests for both
  Ugarit and Cyprus.
- Verification: `pnpm check` green, 51 files / 963 tests, 108 entities, 0 errors /
  0 warnings. Destination, place and map screens not walked in the browser.

## 2026-11-27 — Trim the grouped menu and check its phone layout

- Removed the redundant `NavGroup.home` fallback and shared the screen-availability rule
  between the rail and tab row; the Place group now highlights on both port and place.
- Deleted the unused art-card/activity-focus CSS left by the old activities grid, and
  consolidated the phone rail into one 44 px-tall wrapping row.
- Verified at 390 px (one row) and 320 px (two rows), no horizontal overflow, Place active.
- Verification: `pnpm check` green, 51 files / 963 tests, 108 entities, 0 errors /
  0 warnings.

## 2026-11-27 — Make the group tabs visible on the phone

- The secondary tab row was dark text on the dark backdrop; it existed in the
  accessibility tree but could not be seen. It now sits on a dark glass shelf with cream
  labels and a gold-edged active tab.
- Checked People at 390 px (one row) and 320 px (tabs wrap inside the shelf), with the
  rail above it wrapping to two rows. No horizontal overflow.
- Verification: `pnpm check` green, 51 files / 963 tests, 108 entities, 0 errors /
  0 warnings.

## 2026-11-27 — Image audit against the art rules

- Reviewed all 62 exploratory images in labelled contact sheets, with a full-size check
  for every candidate, against `docs/ASSETS.md` §2.1–2.12, with the first dedicated pass
  over the §2.11 dress, hair, ornament, pottery and furniture rules.
- Replaced or cropped 15 files. The substantive fixes: Anyang now has a straight thatched
  hall and bronze casting rather than curved eaves, bracket sets and lattice windows;
  Abu Simbel has four colossi and a plain winged disk; Mycenae is cropped to the gate so
  the modern-dressed foreground is gone; Enkomi is a town-only view with plain openings
  and no stovepipe, glazing or tall rig; the Levant landing has a square flat-topped gate
  and no battlements, wall lamps, shutters, agave or lateen ship; the Ugarit harbour is a
  quay with no second mast or bench-like ingots; both night scenes lost their wall
  sconces, stovepipe and excess rig; the workshop has a warp-weighted loom, wrapped
  workers and no tiled roof, metal screws or smoking; Ada holds a bronze bowl in a wrapped
  shawl; the wine plate is a Base Ring juglet without the flowerpot cup; the Sibtu-cloth
  whorl is clay; and the settled-cloth frame and the arrival agave are cropped away.
- Rejected replacement takes that introduced tailored broker robes, classical temples,
  lateen rigs or visible flat patches. Kept local patches only where the repair did not
  read worse than the defect; reverted the cloth-after chest patch because it became a
  visible panel.
- Remaining defects are now explicit in `assets/exploratory/README.md`: Karnak obelisk
  narrative panels, Chogha Zanbil over-glazing, Giza field plots, Hattusa and Dur-Kurigalzu
  joinery, Mohenjo-daro's intact walls, the simplified Mycenae gate, Anyang's residual
  bargeboard, tailored guard/broker robes, the Cypriot yard's flat discs, and the cloth
  thread's sewn tunics and chest plates.
- Verification: `pnpm check` green, 51 files / 963 tests, 108 entities, 0 errors /
  0 warnings. Images reviewed as files and against each other; UI screens were not walked.

## 2026-11-27 — Date every art record to its horizon

- Added `ArtHorizon = 'A' | 'B' | 'C'` and a required `horizon` field to `ArtAsset`, then
  dated all 62 current catalog entries as horizon A. The catalog previously left the
  ADR-0010 horizon implicit in the exploratory notes, so no code record could be checked.
- Added an `art.test.ts` case that rejects a missing or invalid horizon and pins the
  current slice to A only. The test is the guard against an undated image entering the
  catalog, and against a B/C asset being added without a deliberate slice change.
- `docs/ASSETS.md` now states the per-record horizon rule; the exploratory README records
  the same 62/62 A result.
- Verification: `pnpm check` green, 51 files / 964 tests, 108 entities, 0 errors /
  0 warnings.

## 2026-11-27 — Name the cast rule's one exception

- The cast brief said all nine want something apart from the protagonist and can be
  understood without the protagonist's mystery. Belet's second want — to know why a name
  will not leave her alone — is the recognition thread, so the blanket rule was false for
  her.
- Rewrote the introduction to say eight follow the independent-want rule and Belet is the
  deliberate exception; added the same note to her brief. Her craft, fear and first want
  still stand on their own, and her authored JSON is unchanged.
- Verification: `pnpm check` green, 51 files / 964 tests, 108 entities, 0 errors /
  0 warnings.

## 2026-11-27 — Hear the slice

- Added 16 CC0 audio assets: ten ambience beds for the title, sea, Ugarit and Cyprus
  places and nights; two original modal cues; four one-shots for trade, passage, the gate
  and the smithy. The beds use BigSoundBank field recordings (water, gulls, market, fire,
  anvil, crickets, frogs); music and effects are original procedural synthesis.
- `src/ui/audio.ts` resolves `audio.*` IDs from `assets/audio/manifest.json` and maps the
  current screen, destination, place and night to an ambience bed. `src/ui/audioPlayer.tsx`
  cross-fades loops, plays accepted command cues, persists a mute preference and waits for
  a gesture when autoplay is blocked. No save or reducer state changed.
- Added `pnpm audio:build`, which downloads/caches the CC0 sources, synthesises the
  original cues, normalises everything, and writes the manifest; added `pnpm audio:check`
  to the gate for files, IDs, loop flags, licences and provenance. ADR-0013 records the
  exploratory-before-M18 decision and its limits.
- Verification: `pnpm check` green, 52 files / 981 tests, 108 entities, 0 errors /
  0 warnings. Served and played the title beds at their catalog volumes; checked mute
  pauses both and unmute resumes. Every bed was loudness-checked offline, not listened
  through in every scene.

## 2026-11-27 — Explain the jargon where it appears

- Added `InfoTip`, a small click/tap disclosure with `aria-expanded`, an `aria-live` note,
  Escape and outside-click dismissal, and focus return. It is used for the market's gain
  and loss cost basis, the Status purse and carrying units, and the Cargo weight line.
- The market explanation stays in the note below the table rather than the `Gain / loss`
  column header, because on phones the header row is hidden; the visible note is shorter and
  the cost-basis detail lives in the popover. The popover is portalled to the body and placed
  from the trigger's measured rectangle, shifting inside the viewport and flipping above the
  trigger when needed.
- Updated the interface-copy assertion to the new cost-basis sentence rather than loosening
  the check.
- Verification: `pnpm check` green, 52 files / 981 tests, 108 entities, 0 errors /
  0 warnings; `pnpm build` green. Walked Market, Status and Cargo at 390 px and 1280 px;
  checked opening, second-click and Escape dismissal, focus return, and popover bounds.

## 2026-11-27 — More pigment in the sketches

- Enriched the map presentation without changing its read model: sea-depth gradient, wave
  hatching, region-tinted land, land hatching, a coast glow, layered ridges, river banks,
  cased crossings, place shadows, a current halo and a fuller compass rose.
- The quarter sketch gained a radial ground wash, grain/hatch texture, a double ring road,
  building shadows, roofs, ridges and door marks, and a current ring. Building fills now
  distinguish market, harbor, palace, temple, quarter, workshop and archive marks.
- Added ridge, river and border-of-knowledge key entries only when those features are drawn.
  Fog, labels and the knowledge views remain the source of what the map claims; no terrain,
  street or place was invented.
- Verification: `pnpm check` green, 52 files / 981 tests, 108 entities, 0 errors /
  0 warnings; `pnpm build` green. Inspected SVG fills, element counts, key wrapping and
  horizontal overflow at 390 px and 1280 px. No screenshots.

## 2026-11-27 — Put faces on the places

- Added place portraits to the quarter map and port choosing lists. The images are the
  existing exploratory place art, shown as 3.5rem square crops with the map number on a
  small badge; the name and description stay as the accessible, meaningful content.
- `LocalMarkView` carries the authored `art` ID so the map list can resolve it through
  `src/ui/art.ts`; the engine does not resolve files. Places without art fall back to an
  initial tile.
- Verification: `pnpm check` green, 52 files / 982 tests, 108 entities, 0 errors /
  0 warnings; `pnpm build` green. Confirmed five thumbnails loaded at 54 × 54 in the map
  and destination lists, with no horizontal overflow at 320, 390 or 1280 px. No screenshots.

## 2026-11-27 — Make the interface fit its chosen shape

- Audited the title, destination, place, map, market and settings at 320, 390 and 1280 px.
- Moved the game sound control into the rail; fixed the title action/note collision with a
  responsive action grid; folded a read destination arrival into a disclosure and put its
  places before the quarter sketch; clamped phone place descriptions to two lines.
- Fitted the 320 px nav to one row, moved the narrow market card's carrying and actions
  onto a second row so its headers cannot collide, and made the desktop quarter sketch
  stick beside its list.
- Verification: `pnpm check` green, 52 files / 982 tests, 108 entities, 0 errors /
  0 warnings; `pnpm build` green. Screenshots at 320/390/1280; measured market cell boxes at
  320/360/390. Desktop full-page capture was clipped by the preview panel; journal and
  codex screens were not rewalked.

## 2026-11-27 — Name the sources in the credits

- Added `CREDITS.attributions` and an **Attributions** section to the credits screen:
  field recordings by Joseph SARDIN / BigSoundBank under CC0, original music and effects
  synthesized for the journey, and generated illustrations with no third-party image.
- Added the BigSoundBank link and moved the credits sound control into the tool row beside
  Text size so the fixed control cannot cover the new copy on phones.
- Extended `title.test.ts` to pin the source, CC0 terms, link and illustration statement,
  and to include attribution copy in the player-facing-language check.
- Verification: `pnpm check` green, 52 files / 983 tests, 108 entities, 0 errors /
  0 warnings; `pnpm build` green. Checked credits at 390/700 px.

## 2026-11-27 — Slice arc and tutorial audit

- Audited both destinations and the crossing for complete arcs and onboarding. No `ArcDef`
  existed; kept the formal arc runtime in M6 and completed Sibtu's cloth thread with paid
  and kept endings, journals and trust consequences.
- Fixed the unreachable palace errand, added the seal delivery to Kinyras, awarded the
  first-crossing journal, deduped journey encounters and added trade confirmation. Added
  four scenarios: `slice-sibtu-paid`, `slice-sibtu-kept`, `slice-palace-errand`,
  `slice-palace-seal`.
- Added the folded First steps panel and moved the session transcript behind a Journal
  disclosure. Recorded Amnit/Belet/faction deferrals in `docs/design/slice-arc-audit.md`.
- Verification: `pnpm check` green, 52 files / 990 tests, 110 entities, 0 errors /
  0 warnings, 16 audio assets; `pnpm build` green (existing chunk warning only). No browser
  walk of the new panel.

## 2026-11-27 — Give the road a body, and make failure a return

- Filled the missing stakes in the slice: one persisted reserve (`player.stamina`, 0–8),
  route-mode exertion and grain provisions, grain spent at departure, reserve restored by
  Rest, and physical road choices that spend reserve.
- Made exhaustion fail backward rather than end the run: `continueJourney` returns the
  traveller to the journey's origin after two days, loses one cargo item, restores 2
  reserve and presents `dlg.travel.exhaustion`, a roadside shrine scene. Save format v3
  migrates v2 runs at full reserve.
- Added the UI readouts (Status Reserve, route reserve/grain, choice stamina cost, First
  steps provisioning copy, Rest note) and covered collapse, migration, effect vocabulary,
  route costs and scenario grain consumption with tests.
- Wrote ADR-0014 and `docs/design/stakes-and-provisioning.md`; updated `docs/DATA_MODEL.md`
  §4 and §6.4.
- Verification: `pnpm check` green (52 files / 995 tests, 111 entities, 16 audio assets, 0
  errors / 0 warnings); `pnpm build` green (existing >500 kB chunk warning); `pnpm
  playtest:build` wrote 10 checkpoints. Loaded the real v2 Run A autosave, migrated it,
  finished the return crossing in the browser, and read Reserve 8/8 in Status and the new
  route costs on the Roads screen. Loaded the crossing checkpoint, set reserve to 1, bailed
  in the squall, and confirmed the return scene, two days, cargo loss and reserve 2. Run B
  and the final sanity pass remain.

## 2026-11-27 — Run B, and a floor under an empty purse

- Finished the open-water Run B: 40 shekels, grain and oil bought, two jars sold, copper
  bought at Ugarit, Tiro's crossing learned, 14-shekel open-water passage and 10-shekel
  harbor toll paid, Cyprus reached, Shipti met. Sold the copper for 8 against a 15-shekel
  cost, leaving 14 shekels — one short of the 7-shekel Cyprus grain plus the 8-shekel
  coastal fare.
- That exposed a real hole rather than a dramatic dead end: with no cargo and no wage,
  a broke traveller could not leave and could not recover. Added `work` to the command
  vocabulary: at any place of kind `harbour`, one to seven days of quay labour pays three
  shekels a day and spends one reserve a day; refused inland and when reserve is too low.
  The Place screen offers the one-day button with its wage and cost stated.
- Finished Run B through the fallback: one day's work took the purse to 17, grain to 10,
  coastal passage to 2; a patrol boat's shakedown forced the authored one-day
  work-the-crossing option, and the traveller reached Ugarit on day 10 with 2 shekels.
  Both route reserve and grain were spent. This is a loss, not a game over: the run,
  journal and relationships survive.
- Documented the fallback in ADR-0014, `docs/design/stakes-and-provisioning.md` and the
  command set in `docs/ARCHITECTURE.md`; added focused tests for the wage, the day, the
  reserve and the no-harbor refusal.
- Verification: focused `reduce`/contract tests 89 green; no commit.

## 2026-11-27 — M4 — Afflictions, treatment and road hazards

- Added discrete afflictions as core content (`aff.thirst`, `aff.hunger`, `aff.wound`,
  `aff.fever`, `aff.poison`, `aff.curse`) with treatment tags; added the `affliction`,
  `treatment` and `hasAffliction` DSL atoms; town days, Rest and harbor work now treat.
- Added a derived route hazard (new `hazard` RNG stream, `src/engine/world/hazard.ts`),
  authored outcome table on the Cyprus crossing, and seven rescue/peril/spring scenes.
- Save format v4 (`player.afflictions`, `rng.hazard`) with a pure migration; Status shows
  Conditions and Roads shows risk and factors.
- Decision: ADR-0015. Design note: `docs/design/afflictions-and-road-hazards.md`.
- Verification:   `pnpm check` green, 53 files / 1023 tests, content lint 131 entities,
  0 errors / 0 warnings; `pnpm build` green (existing chunk warning). Browser: Roads showed
  the risk line and factors; Status showed injected thirst and fever with day and remedy.
  No natural hazard scene was walked in the browser; the scenario trace and tests cover
  the triggered outcome. Future: collapse/war/famine phases, poison/curse sources,
  explicit endings; no permadeath or condition timers.

## 2026-11-27 — M4 — Three roads

- Added a saved run-wide difficulty choice: Gentle (60 silver, 8 reserve, −8 road risk),
  Wanderer (40, 8, 0) and Perilous (24, 6, +10). Wanderer remains the default balance;
  the opening Cyprus crossing reads 12 / 20 / 30%.
- `meta.difficulty` is part of save v5 with a pure v4→v5 migration. The new-journey screen
  offers the three choices; Status shows the road and Roads shows its factor.
- Decision: ADR-0016. Design note: `docs/design/difficulty.md`. Data model §3/§4.4 updated.
- Verification: `pnpm check` green, 53 files / 1029 tests; build green (existing chunk
  warning). Browser: new-journey choices render and Perilous selects; no screenshot.

## 2026-11-27 — M4 — Daily condition report

- Added a derived day report (`src/engine/views/day.ts`) that compares afflictions before
  and after a calendar move: new is worse, lingering is same, lifted is better, and a day
  with both is mixed. `TimePassed` carries it; nothing new is saved and no condition ticks
  on a timer.
- Added authored `onset`, `daily` and `recovery` prose to all six afflictions. The day note
  shows the report for eight seconds with up to four condition lines, so thirst, hunger,
  wounds, fever, poison and curses keep a narrative presence between scenes.
- Added view tests for all four report trends and a store test for the passing-day wiring.
- Verification: `pnpm check` green, 54 files / 1034 tests; build green (existing chunk
  warning).

## 2026-11-27 — M4 — Tutorial discoverability and Sibtu reference

- Added a **New here? First steps in the port** callout directly under the first
  destination title, linking to the open First steps panel. The panel now renders before
  the arrival story completes, so the anchor exists as soon as the callout is visible.
- Fixed the Sibtu arc's future-work reference in `docs/design/slice-arc-audit.md`: it
  pointed at M6-T10 (recurrence auditor and Amnit port), but the arc port belongs to
  M6-T04/T05.
- Verification: `pnpm check` green, 54 files / 1034 tests; build green (existing chunk
  warning). Browser: callout and panel target present on the first Ugarit visit.

## 2026-11-27 — M4 — Map CSS consolidation

- Removed 39 earlier duplicate top-level map rules from `src/ui/theme.css`, keeping the
  final cascade winner. Folded in base-only properties that would otherwise have been
  lost: frame margin/overflow, sea-line and river fills/caps, street and ring-road fills,
  building transitions and pointer-events, and the route-label font.
- Moved the remaining early map labels, frame SVG sizing, grid lines and tabs into the map
  section. No duplicate map rule blocks remain; the label selectors appear once for their
  type and once in the shared paper-edge halo rule.
- Verification: `pnpm check` green, 54 files / 1034 tests; build green (existing chunk
  warning). Visually checked the local, region and world maps at 1280 px and the world
  map at 760 px; no horizontal overflow and no console errors.

## 2026-11-27 — M4 — Two-path playtest and slice fixes

- Ran a trader route (`wanderer-1`) and a helper route (`helper-2`) from the opening to
  Shipti's letter. Reports: `docs/playtests/agent/2026-11-27-trader.md` and
  `2026-11-27-helper.md`; both are agent sessions, not human evidence.
- Fixed the Cypriot arrival order: landfall now opens the doorway scene, and the destination
  introduction describes the harbor in the present tense. Added three beat plates to the
  doorway node and removed its two stale backlog keys.
- Fixed the thirty-six-shekel counter-offer to record the copper-deal journal,
  `deed.copper-agreed`, merchant trust, the yard-price knowledge and the letter schedule.
  Added `scenario.slice.cyprus-counter` plus `cyprus-counter` and `cyprus-letter` playtest
  checkpoints; `pnpm playtest:build` writes 12 checkpoints.
- The arrival doorway now uses distinct plates for landfall, inn and landing, and the room
  node has its own inn picture, so Shipti's portrait is not repeated as both hero and scene.
- Clamped the ambience fade to `[0, 1]`; a frame timestamp just before the fade start could
  drive `HTMLMediaElement.volume` below zero and throw `IndexSizeError` in the console.
- Gated `evt.cyprus.arrival-news` on the paid journal instead of the take-bundle journal and
  gave it a visible entry, `journal.slice.sibtu-news`.
- Gave the inn room a real night (one day, two reserve, one Shipti trust), corrected its
  “two nights” copy, replaced the market's “paid nothing” with “no purchase cost”, and
  warned in First steps to keep silver back for the sea's tolls. The empty Roads button now
  says “Go down to the harbor” instead of promising a conversation.
- Audio audit with `ffmpeg loudnorm`: all 16 tracks sit around −22 to −26 LUFS with no
  outlier; true peaks −4.5 to −10.5 dBTP. No re-levelling was needed.
- Deferred: prologue length before the first choice, the intentional zero-silver toll trap,
  the repeating Ada night-kiln conversation, and language/faction legibility in one run.
- Verification: `pnpm check` green, 54 files / 1035 tests; `pnpm build` green (existing
  chunk warning); content lint 132 entities, 0 errors / 0 warnings. No commit.

## 2026-11-27 — M4 — Playtest checkpoint usage

- Documented the existing checkpoint jump path: `pnpm playtest:build` replays scenario
  prefixes into `public/playtests/`, and `/playtest.html` loads one into the browser's save
  slot. Added the section to `docs/playtests/README.md` and the tool catalog in
  `docs/TOOLING.md`.
- Verified `pnpm playtest:build -- --list` and the generated index; 12 checkpoints are ready.

## 2026-11-27 — M4 — Sibtu news verified and gradual first steps

- Added `slice-sibtu-news`, which replays the paid cloth path, sails to Cyprus, advances
  eight days and asserts `journal.slice.sibtu-news`; added the `sibtu-news` playtest
  checkpoint (`dest.cyprus`, day 105) and confirmed the journal entry in the browser.
- Replaced the five-lesson **First steps** panel with one contextual hint: destination,
  market, harbor, roads, other place, cargo. It waits for the arrival prose, shows only
  before the first crossing, and disappears once a travel deed exists.
- Verification: `pnpm check` green (54 files / 1035 tests); `pnpm build` green; 13
  checkpoints generated. Browser: destination and market show one hint each.

## 2026-11-27 — M4 — Status cache and slice handoff

- Rewrote `docs/STATUS.md` as a short current M4 cache instead of a 1,299-line
  append-only history; preserved the remaining gaps, evidence, tasks and blockers.
- Reconciled `docs/design/slice-arc-audit.md` with the contextual First step hints and
  added `scenario.slice.sibtu-news` to the regression list.
- Prepared the playable slice, playtest evidence, checkpoint harness and exploratory
  assets for a single M4 handoff commit.
- Verification: `pnpm check` green (54 files / 1035 tests); 13 checkpoints; no commit
  of the generated `public/playtests/` saves.
