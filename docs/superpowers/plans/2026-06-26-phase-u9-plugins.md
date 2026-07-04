# Phase U9 — Plugins

**Goal:** Plugin marketplace from DB with install toggles per workspace.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U9.1 | `plugin_catalog` + `workspace_plugins` + categories | **done** |
| U9.2 | Seed 19 plugins + category counts | **done** |
| U9.3 | `GET /api/plugins` + `PATCH /api/plugins/[id]` | **done** |
| U9.4 | Wire PluginsPanel install toggle + filters | **done** |
| U9.5 | Wire PluginsNav category badges from API | **done** |
| U9.6 | Docs + verify | **done** |

## Compare checklist

- [x] `/plugins` shows 19 plugins from DB
- [x] Category nav badges (31, 20, …) from API
- [x] Install / Installed toggle persists
- [x] Installed Plugins filter shows only installed
- [x] `npm run check` passes

## API

```
GET /api/plugins?filter=installed&category=automation&q=search
PATCH /api/plugins/:id  { "installed": true|false }
```
