# The Song of the Wanderer

A long-form, narrative-led adventure set across the interconnected worlds of the Late
Bronze Age. You are a merchant. You travel, trade, learn languages, build relationships,
and watch the old networks fracture around you — while the world never quite explains
who you are.

Target platform: PC / Steam. Genre: narrative historical travel RPG with light trading
and relationship systems. No 3D, no open-world combat, no live AI-generated story.

## Status

**M0 complete. The full production plan now covers M0–M19.** The repository has its
documentation system, agent skills, toolchain, and a greybox app shell. There is no game
yet. M1 builds the deterministic engine spine; M5–M8 build the scale layer (world
timeline, character arcs, society/economy, tooling) before regional expansion begins.

The roadmap is in [`docs/PLAN.md`](docs/PLAN.md); the live state is in
[`docs/STATUS.md`](docs/STATUS.md).

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # typecheck + lint + tests + content lint
```

Requires Node 22+ and pnpm 10+.

## How this repository is organised

```
AGENTS.md            entry point for any contributor or agent
docs/                plan, status, architecture, content/history rules
docs/design/         distilled world truth (read instead of the full spec)
docs/milestones/     task lists and acceptance criteria
src/engine/          pure deterministic simulation, no UI
src/content/         authored JSON content
src/ui/              React screens (greybox until the slice is proven)
src/store/           Zustand adapters that dispatch into the engine
tools/               content linter and (from M1) simulation harness
```

The complete design specification is
[`The Song of the Wanderer Spec.md`](The%20Song%20of%20the%20Wanderer%20Spec.md).

## Working on the project

Start with [`AGENTS.md`](AGENTS.md), then [`docs/STATUS.md`](docs/STATUS.md). The project
is designed for short, resumable sessions and handoffs between agents: status, decisions,
and task state live on disk, not in conversation memory.

## Licence

TBD.
