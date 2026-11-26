# Content

Authored game content lives here as JSON, organised into packs. The slice uses a small
set of folders; from M5 onward, content grows into region packs with manifests.

```
content/
  packs/
    core/           shared calendars, goods taxonomy, languages, name banks
    levant/         Ugarit and the Levant
    cyprus/
    ...
  README.md
```

Each pack:

```
packs/<name>/
  manifest.json     id, contentVersion, requires, entity lists
  regions/
  destinations/
  sites/
  routes/
  waypoints/
  groups/
  goods/
  currencies/
  characters/
  families/
  arcs/
  events/
  storylets/
  dialogues/
  journal/
  codex/
  languages/
  factions/
  cultures/
  religions/
  works/
  climates/
  ecologies/
  phases/
  observances/
  objects/
```

Entity shapes, the four representations, and reference-vs-copy rules are in
`docs/DATA_MODEL.md`.

Rules the linter enforces now:

1. Every file parses as JSON and contains an `id`.
2. IDs are globally unique and namespaced: `dest.ugarit`, `char.ugarit.amnit`,
   `evt.slice.recognition`, `route.ugarit-cyprus`, `good.copper`.
3. The file's base name matches the final segment of its ID.
4. From M1 onward: every historical entity carries `provenance`
   (`confidence` + `sources`) and every referenced ID resolves.
5. From M5 onward: packs declare dependencies; the graph is acyclic; cross-pack
   references resolve.

Authoring guidance lives in `docs/CONTENT.md`. World time and events in
`docs/WORLD_MODEL.md`. Characters and arcs in `docs/NARRATIVE_SYSTEMS.md`. Historical
rules in `docs/HISTORY.md`. Tooling in `docs/TOOLING.md`.
