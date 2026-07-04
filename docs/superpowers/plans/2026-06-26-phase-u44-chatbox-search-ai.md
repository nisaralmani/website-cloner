# Phase U44 — Chatbox Search AI

**Goal:** Overlay-gated search AI toggles, default language field, and frequent searches CRUD on `/settings/chatbox/search-ai`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U44.1 | Overlay plugin + `search_ai_frequent_searches` table | **done** |
| U44.2 | `GET/POST /api/search-ai/frequent-searches` + `[id]` | **done** |
| U44.3 | Settings toggles/fields + FrequentSearchesPanel wired | **done** |
| U44.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Search AI toggles disabled until Overlay plugin installed
- [x] Direct-search toggle disabled until enable toggle on
- [x] Default language field persisted
- [x] Frequent searches create/delete with empty state
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (44 steps)

## Storage

```
workspace_settings (
  chatbox/search-ai::defaultLanguage,
  chatbox/search-ai::{section}-{item} toggles
)

search_ai_frequent_searches (
  id, workspace_id, query, sort_order, created_at
)
```

## Deferred

- Runtime search widget reads frequent searches
- Overlay plugin install flow from settings banner button
- Frequent search inline edit UI
