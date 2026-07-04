# Phase U11 — Global search

**Goal:** Ctrl+F overlay searches conversations, contacts, plugins, and settings via one API.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U11.1 | `GET /api/search?q=` unified index | **done** |
| U11.2 | Search settings pages from nav tree | **done** |
| U11.3 | Wire GlobalSearchOverlay to API | **done** |
| U11.4 | Docs + verify | **done** |

## Compare checklist

- [x] Ctrl+F opens search with quick nav + recent conversations
- [x] Query searches conversations, contacts, plugins, settings
- [x] Debounced API calls (250ms)
- [x] `npm run check` passes

## API

```
GET /api/search?q=bot
Response: {
  query, conversations, contacts, plugins, settings, navigation
}
```
