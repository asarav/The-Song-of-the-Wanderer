# ADR-0013 — Exploratory audio in the playable slice

**Status:** accepted · 2026-11-27
**Related:** `docs/ASSETS.md` §6, `assets/audio/README.md`, `src/ui/audio.ts`, `src/ui/audioPlayer.tsx`, `tools/build-audio.mjs`

## Context

The design already says music is central to atmosphere and that sound belongs to people
and places. It also reserved final music and ambience profiles for M18, and the repository
had no audio files, no playback, and no pipeline. The playable slice was therefore silent.

The user asked for copyright-free/public-domain audio now, matched to scene, region and
action, with a reusable pipeline if one was needed. This is presentation work; it adds no
simulation rule and no save field.

## Decision

- **Ship exploratory audio in the slice, not the M18 soundtrack.** It is reviewable,
  replaceable material that makes the current places audible; M18 still owns final
  recordings, regional profiles, loudness delivery and commissioning.
- **Use `audio.*` IDs and a manifest.** `src/ui/audio.ts` resolves IDs to files;
  `assets/audio/manifest.json` records source, author, license and modifications for every
  file. Content and screens never name a file path.
- **Use CC0 field recordings for weather and work beds.** The current beds mix modern
  BigSoundBank recordings (water, gulls, market, fire, anvil, crickets, frogs). They are
  material, not evidence for how a Bronze Age place sounded.
- **Generate original music and one-shots.** The title and temple cues and the trade,
  travel, gate and smithy effects are original procedural synthesis, dedicated to CC0.
  The music is a modal sketch, not a reconstruction of a surviving melody, and no invented
  language is sung.
- **Keep selection presentation-only.** `gameAudioFor` chooses a looping bed from the
  screen, destination, place and night state; `sfxForCommand` maps accepted trade and
  travel commands to a one-shot. No audio ID enters `GameState`, a save, or the reducer.
- **Make silence safe.** The UI keeps a persistent **Sound on/off** preference on the
  device, attempts playback only after the browser permits it, and never blocks a screen
  or command on audio.

## Consequences

- The slice can be evaluated with sound, and the asset pipeline (`pnpm audio:build`,
  `pnpm audio:check`) is exercised now rather than invented under M18 pressure.
- The field beds are modern recordings and the music is speculative; the manifest and
  `assets/audio/README.md` say so. Do not present either as an authentic Bronze Age
  soundtrack.
- Final regional ambience profiles, commissioned performances, localisation of any sung
  text, and delivery loudness remain M18 work.
- Adding a new bed means one catalog entry, one manifest source record, one file, and a
  mapping decision; adding a new cue means the same plus a screen or command that uses it.
