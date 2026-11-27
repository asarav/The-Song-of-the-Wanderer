# Playtest records

Evidence for M4. Two kinds of session live here, and they are not interchangeable.

## Human sessions — `docs/playtests/human/`

These are the sessions M4-T01 asks for: three recorded playthroughs (trader, curious
traveller, helper), at least one by a reader who has not seen the design docs. A human
session is recorded as video or detailed notes and named
`YYYY-MM-DD-<persona>.md`. Only these can tick M4-T01. The milestone forbids ticking it
from simulation or from an agent.

## Agent sessions — `docs/playtests/agent/`

Sessions run by the repository's playtester agent (`.agents/agents/sotw-playtester`,
mirrored into every harness). They are useful for finding reproducible bugs, catching
copy and UI friction, and forming hypotheses for M4-T03. They are **not** human evidence:
no `M4-T01`/`M4-T02`/`M4-T05` checkbox may be ticked on the strength of one, and a report
must say `Session type: agent session (not human evidence)` in its header.

## Starting a session

The slice is played in the browser build, not through the scenario runner.

```bash
pnpm install          # once
pnpm dev              # Vite, serving http://127.0.0.1:5173
```

Open that origin, press **Begin**, keep or set a seed, press **Step ashore**. Nothing else
runs: content is bundled from `src/content/packs`, state is in memory, and saves use
`localStorage`. Record the seed and `git rev-parse --short HEAD` in the report.

## Jumping to a checkpoint

Do not replay the opening to reach a known branch. Build the checkpoint saves, then open
the playtest page on the dev server:

```bash
pnpm playtest:build
# open http://127.0.0.1:5173/playtest.html
```

The page lists every checkpoint, its location, day, purse and any open scene. **Load
checkpoint** writes that save into the browser's normal save slot and opens the game at
that moment. Loading replaces the current save and clears the autosave, so export any run
you want to keep before jumping. The generated saves live in `public/playtests/` and are
ignored; rebuild after changing a scenario or its content.

`pnpm playtest:build -- --list` prints the checkpoint IDs without writing files. The
source of truth is `tools/playtest/checkpoints.json`; each entry names a scenario and how
many authored steps to replay. Checkpoints are generated from real scenario prefixes, so
they stay honest about state, RNG and save shape. Never hand-edit a checkpoint save.

Before a session, a read-only smoke check of the same content (not a substitute for
playing):

```bash
pnpm simulate -- slice-day-save
pnpm check
```

If `pnpm dev` is not already running, start it in the background and wait for HTTP 200 on
the origin before playing. A playtest of a dev server that will not start is a build
report, not a session.

## Writing a report

- One file per session: `YYYY-MM-DD-<persona>.md`.
- Use the template the agent ships with
  (`.agents/agents/sotw-playtester/references/report-template.md`).
- Bugs need a reproduction, a severity, and expected vs actual.
- Ideas need the pillar they serve and the evidence from the session.
- Verdicts on the seven §22.1 questions are per session and may say "not enough
  evidence".

## What a report is not

- Not a design document. Ideas stay sketches; anything that adds a mechanic goes through
  the scope gate in `AGENTS.md` and the milestone's non-goals.
- Not a fix log. Reports never change `src/**`; a bug found in a session is filed and
  fixed by a task with its own tests and `pnpm check`.
