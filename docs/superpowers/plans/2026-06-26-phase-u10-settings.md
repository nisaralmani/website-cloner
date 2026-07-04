# Phase U10 — Settings persist

**Goal:** Settings toggles persist per workspace in SQLite.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U10.1 | `workspace_settings` key-value schema | **done** |
| U10.2 | `GET/PATCH /api/settings/[...slug]` | **done** |
| U10.3 | Wire SettingsDetail toggles to API | **done** |
| U10.4 | Docs + verify | **done** |

## Compare checklist

- [x] Toggle on settings page saves to DB
- [x] Reload page → toggle state persists
- [x] Defaults from registry when no override saved
- [x] `npm run check` passes

## API

```
GET /api/settings/chatbox/behavior
Response: { pageSlug, toggles: { "0-3": true, ... } }

PATCH /api/settings/chatbox/behavior
Body: { "key": "0-3", "on": false }
```

Setting keys in DB: `{pageSlug}::{sectionIndex}-{itemIndex}`
