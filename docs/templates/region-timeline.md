# Region timeline — `<region>`

**Region:** `region.<slug>` · **Pack:** `pack.<slug>` · **Span:** c. … – … BCE
**Author:** … · **Historical reviewer:** … · **Provenance:** per phase

This is the authored spine for a region. It is the source for phase, event, route, and
cast data. If this file and the content disagree, fix one in the same commit.

## 1. Phase table

| Phase ID | From | To | Short description | Destinations present | Dominant powers |
|---|---|---|---|---|---|
| `phase.<region>.opening` | | | | | |
| `phase.<region>.pressure` | | | | | |
| `phase.<region>.breaking` | | | | | |
| `phase.<region>.after` | | | | | |

No gaps, no overlaps. A destination that does not exist in a phase has no activities,
market, routes, or cast there.

## 2. World-event hooks

| World event | Enters region | Local consequence | Rumour delay | Notes |
|---|---|---|---|---|
| | | | | |

## 3. Regional processes

Slow pressures the player can feel:

| Process | Starts | Ends | Effect on destinations | Effect on people |
|---|---|---|---|---|
| | | | | |

## 4. Local event pools

| Destination | Phase | Pool | Themes | Major beats |
|---|---|---|---|---|
| | | arrival / market / road / temple / evening | | |

## 5. Route plan

| Route | Phase availability | Requirement changes | Closure/risk reason |
|---|---|---|---|
| | | | |

## 6. Cast impact

| Character | Home | Fate across phases | Arc | Reappearance basis |
|---|---|---|---|---|
| | | | | |

## 7. Knowledge plan

| Fact | Who can learn it | From whom | Form | Distortion/correction |
|---|---|---|---|---|
| | | | | |

## 8. Economy plan

- Regional goods:
- Production/consumption:
- Price bands and phase modifiers:
- Contracts and transport:

## 9. Dossiers required

- [ ] `docs/design/dossiers/<destination>.md`
- [ ] `docs/design/dossiers/<destination>.md`

## 10. Validation

- [ ] `pnpm timeline:validate`
- [ ] `pnpm content:continuity`
- [ ] `pnpm content:coverage`
- [ ] Long-run simulation across the full region span
- [ ] Persona run reaches and leaves the region
- [ ] Historical review recorded in `WORKLOG.md`

## 11. Open questions

- …
