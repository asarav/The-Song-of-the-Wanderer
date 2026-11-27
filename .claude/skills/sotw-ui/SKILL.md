---
name: SotW UI and Read Models
description: Build graybox and final UI for The Song of the Wanderer — React screens, Zustand adapters, read models, accessibility, text extraction, and truth-vs-knowledge discipline. Use when touching src/ui, src/store, screens, or player-facing views.
---

# UI and read models

Read `docs/ARCHITECTURE.md` §1, §3, and §8 before touching UI. This skill is the working
procedure.

## Core rules

- UI never mutates `GameState`. It dispatches commands.
- The store contains no rules. It is an adapter plus memoised selectors.
- Player-facing views read **knowledge**, never world truth.
- No rules in components. Rules belong in the engine.
- No hard-coded player text. All strings live in content or `src/ui/strings.ts`.
- Graybox first. Visual polish waits for M18.

## Read models

| View | Built from | Must not reveal |
|---|---|---|
| Journal | knowledge entries + journal content | facts the protagonist never learned |
| Character index | knowledge + character defs | current status if unknown |
| Map | known destinations/routes + rumor state | closed routes the player has not heard about |
| Codex | phase-appropriate authored entries | deliberate ambiguity resolutions |
| Market | derived destination state + player knowledge | hidden modifiers without an in-world reason |
| Day context | calendar + phases + active events | events the protagonist has not learned of |
| Route view | route def + route state + knowledge | unknown closures, waypoints, or dangers |

A "no truth leak" test suite is mandatory from M5.

## Component rules

- Components render read models and emit intents.
- Selectors are memoised and side-effect free.
- Loading, empty, and error states are explicit.
- Every unavailable option explains why in-world.
- Forms and lists survive 150–200% text size.
- Color is never the only indicator; use text and shape.

## Accessibility baseline

- Keyboard-only path through every screen.
- Dialogue log available.
- Reduced motion respected.
- Text size control.
- Color-independent indicators.
- Save/load and settings reachable without a mouse.

## Localisation readiness

- Extract every string with a stable key.
- Named placeholders only; no positional interpolation.
- No concatenated sentences for grammar.
- Write variants instead of grammatical hacks.
- Check text expansion in key screens.

## Commands and dispatch

- Components call store actions, never engine functions directly.
- Store actions dispatch commands and expose selectors.
- Async work is UI-level only; engine commands remain synchronous.

## Common mistakes

| Symptom | Fix |
|---|---|
| Component contains a rule | Move the rule to the engine and test it |
| Journal shows an unlearned fact | Read knowledge, not facts |
| Map reveals a closed route | Gate route state by knowledge |
| Text overflows at 150% | Use flexible layout and extracted strings |
| Button only works with a mouse | Add keyboard handlers and focus styles |
| Hard-coded JSX string | Move it to content or `strings.ts` |
| Store mutates state | Dispatch a command instead |

## Checklist

- [ ] Screen renders from read models only.
- [ ] No truth leaks into player-facing views.
- [ ] Keyboard path works.
- [ ] Text survives 150% size.
- [ ] Strings are extracted.
- [ ] No rules in components.
- [ ] `pnpm check` passes.
