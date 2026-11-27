# ADR-0014 — One reserve and a grain provision

**Status:** accepted · 2026-11-27
**Related:** `docs/design/stakes-and-provisioning.md`, `src/engine/state/schema.ts`, `src/engine/world/routes.ts`, `src/engine/narrative/journey.ts`, `src/engine/save/migrations.ts`

## Context

The slice could take the traveller's silver but not their strength. Losing a fare hurt;
nothing on the road could hurt the traveller. The world was unforgiving in its prices but
not in its weather, distance, or work. The design brief (§5.5, §9.7) allows injury,
imprisonment, loss, deprivation and grief, and allows progression through transport,
guides, supplies and capacity — but §21 explicitly rules out open-world action combat,
mandatory combat, and complex hunger/thirst/fatigue/disease meters.

The request was for a hybrid: light survival with pressure, but no meter dashboard, and a
failure that fails backwards or returns the traveller rather than ending the run. The
period's answer to a bad road is not a respawn screen; it is a shrine, a lost load, and
two days you cannot account for.

## Decision

- **One reserve, not four meters.** `player.stamina` is an integer from 0 to 8. It stands
  for sleep, food, water and nerve together. There is no separate hunger, thirst, fatigue
  or disease track.
- **Passages carry an authored exertion and provision cost.** A travel mode may declare
  `exertion` (default `max(1, ceil(days / 2))`) and `provisions`. The slice's coastal
  crossing costs 2 reserve and one grain; open water costs 3 and one grain. The provision
  is `good.grain`, already a tradable good, so stocking up is an ordinary market decision.
- **Spend at departure; restore by rest.** Travel spends the reserve and removes the grain
  when the traveller boards. `rest` restores `days × 2`; ordinary days at a port do not.
  The route quote refuses an impossible passage with a plain reason (“You do not have the
  strength for this passage. Rest first.”), so the player is never stranded by a silent
  failure.
- **Choices can spend the last of it.** Authored effects and choice costs may use the
  `stamina` atom. A choice that brings reserve to zero while a journey is open sets the
  local flag `road.exhausted`.
- **Collapse is a return, never a death.** When the scene ends, `continueJourney` moves
  the traveller back to the journey's origin, advances two days, loses one cargo item,
  restores reserve to 2, clears the journey, and presents the route's
  `exhaustionDialogue` (`dlg.travel.exhaustion`). The journal, relationships and story
  survive. The time, the distance and one load do not.
- **Departure is not collapse.** Spending the last strength to get aboard clears
  `road.exhausted` after the travel effects; the return only happens when a choice spends
  the reserve on the road itself.
- **Harbor labour is the floor under the purse.** A place of kind `harbour` offers
  `work`: up to seven days, three shekels a day, one reserve a day. It is the recovery from
  an empty purse and unsellable cargo, not a trade strategy; it pays less than a good
  crossing and cannot be done at zero reserve or inland.
- **Save format v3.** A v2 run has no exertion history, so the migration opens it at full
  reserve rather than at zero.

## Consequences

- The slice now has a failure that is legible, recoverable, and tied to the world rather
  than to a combat system. It costs the player time and cargo, not the run.
- Grain is a second reason to visit a market before a crossing. It also gives the Cyprus
  grain stall a purpose beyond flavour.
- Reserve is deliberately coarse. Tuning it (max, rest rate, mode exertion, provision
  count) changes the pressure without adding a new subsystem or a new save field.
- The UI must show the reserve in Status, show exertion and grain on each route mode, and
  show a stamina cost beside a choice that has one. These are read models over persisted
  state, never a second copy.
- A future physical-development system can raise the reserve maximum or reduce exertion
  for a mode; it must not silently turn the reserve into a conventional stat block. Any
  such change needs its own decision and its own migration.
- The collapse route has no authored exhaustion scene on routes that do not declare one;
  those routes still return the traveller and lose the cargo, but present no dialogue.
