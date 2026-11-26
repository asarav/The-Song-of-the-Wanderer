# Content

Authored game content lives here as JSON, one folder per entity type. The
folders are created as the vertical slice needs them; empty folders are not
committed for their own sake.

```
content/
  regions/        region definitions and historical phase notes
  destinations/   location screens, activities, cast, goods, routes
  routes/         edges in the travel graph, requirements, durations
  goods/          trade goods, categories, base values
  characters/     character briefs, schedules, relationship hooks
  events/         authored events and travel encounters
  dialogues/      dialogue graphs
  codex/          optional historical context entries
```

Rules that the linter enforces now, and will keep enforcing:

1. Every file parses as JSON and contains an `id`.
2. IDs are globally unique and namespaced: `dest.ugarit`, `char.ugarit.amnit`,
   `evt.slice.recognition`, `route.ugarit-cyprus`, `good.copper`.
3. The file's base name matches the final segment of its ID
   (`destinations/ugarit.json` → `dest.ugarit`).
4. From M1 onward: every historical entity carries `provenance`
   (`confidence` + `sources`) and every referenced ID resolves.

Authoring guidance lives in `docs/CONTENT.md`. Historical rules live in
`docs/HISTORY.md`.
