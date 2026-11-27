# ADR-0010 — Three period horizons, and art that shows its trade

**Status:** accepted · 2026-11-27
**Related:** `docs/ASSETS.md` §2.5–2.6, `assets/exploratory/README.md`, `src/ui/art.ts`

## Context

The exploratory images were generated from one general brief — "Late Bronze Age, c. 1230
BCE, Mediterranean". Two problems followed. The first was generic classical and medieval
forms in a Levantine town; the second is subtler: a single visual "Bronze Age" that mixes
the wares of different decades. Cyprus and Ugarit change materially between 1230 and 1200,
and again by 1175. A locally made Mycenaean-style pot in a 1230 scene is a false claim,
as is an iron tool, and the game will eventually visit those later years.

At the same time, the period's art is interesting precisely because it is not regional
isolation: Cypriot White Slip and Base Ring ware sit in Ugarit's storerooms, Mycenaean
pots cross to Cyprus, and Ugaritic ivories carry Egyptian motifs carved by local hands.
The art should make that visible, because the protagonist's whole position is movement
between those worlds.

## Decision

- **Every illustration is dated to one horizon**, recorded with the asset:
  - **A — c. 1250–1230 BCE.** The slice. Late Cypriot IIC; White Slip II, Base Ring II,
    Mycenaean IIIA2–IIIB imports, Canaanite jars; Ugarit's last palace phase, Egyptianising
    ivories, the Baal stela, oxhide ingots.
  - **B — c. 1200 BCE.** Late Cypriot IIIA begins; locally made Mycenaean IIIC:1, new
    ashlar public buildings, Aegean-style figurines, arriving settlers; Ugarit under
    pressure and destroyed by c. 1185.
  - **C — c. 1175 BCE.** Cyprus rebuilt on new plans; Aegean-style wares established; iron
    appearing; Ugarit gone.
- **The slice uses A only.** An image may not mix horizons: IIIB imports do not appear
  with IIIC local wares, and no later pottery, iron or architectural form enters an A
  scene.
- **A later horizon is a new file and a new `art.*` ID**, authored as a phase variant.
  An A image is never repainted to become B or C, because the difference is evidence.
- **Art must be regionally specific and show exchange.** Where an object is legible, its
  origin should be legible too: a Cypriot bowl in Ugarit, a Canaanite jar on the island,
  the same vessel shape locally copied with different decoration, or an Egyptian winged
  sun-disc on ivory worked in Syria.
- **Each art record names its horizon**, and the exploratory README records it per file.
  An image that cannot be dated does not enter the slice.

## Consequences

- `docs/ASSETS.md` §2.5 holds the regional visual inventory and §2.6 the horizon table.
- The four images rebuilt under this ADR are dated A in their records; the rest of the
  set was reviewed against A (flat roofs, square lintels, no later wares).
- When the timeline advances, phase variants add files rather than editing these. That
  costs more art than repainting, and is the only way the change stays honest.
- Reversing this means accepting undated art, or re-reviewing every image each time the
  chronology moves.
