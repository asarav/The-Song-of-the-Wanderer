# ADR-0001 — React + TypeScript + Vite, no game engine

**Date:** 2026-11-25
**Status:** Accepted

## Context

The game is text-and-illustration driven: location screens, dialogue, markets, a route
map, a journal, and menus. There is no 3D, no real-time movement, no physics, and no
action combat. Content volume and correctness matter far more than rendering.

The project will be developed largely by AI agents working in short, resumable sessions.
That favours text-diffable assets, fast type-checked feedback, and headless tests.

## Decision

Build on **React 19 + TypeScript 5.9 + Vite**, with **Zustand** for app state and
**Vitest** for tests. No Unity, Godot, or custom renderer initially. Package for Steam
with **Tauri** once the vertical slice is proven.

## Consequences

- Content and code are plain text, so diffs, reviews, and agent edits are reliable.
- The entire simulation runs headlessly under Vitest, giving fast regression tests.
- UI iteration is immediate via Vite HMR.
- We give up a built-in scene editor, animation timeline, and asset pipeline. For an
  illustrated-screens game this is acceptable; art can still be authored in standard
  tools and imported.
- Audio/animation ambitions beyond simple transitions would require custom work.
- Tauri keeps the desktop binary small and avoids bundling Chromium.

## Alternatives considered

- **Godot 4** — strong 2D engine and Steam path, but binary scene files, weaker
  automated testing, and more friction for text-heavy content. Revisit if the game grows
  substantial animation needs. Content and state are engine-agnostic, so a port remains
  possible at high cost.
- **Ink + Unity** — excellent dialogue authoring, but Ink does not model markets,
  inventory, travel graphs, or save migrations; we would still build an engine around it,
  inside a heavier toolchain.
- **Custom web engine** — unnecessary; React plus a pure reducer is already that.

## Revisit when

The slice needs animation, shader effects, or a scene editor that would take more than
two weeks to approximate in the web stack.
