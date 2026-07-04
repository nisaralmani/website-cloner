# Phase U7 — Helpdesk

**Goal:** Helpdesk articles/categories from DB; upgrade overlay when plan locked.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U7.1 | `helpdesk_articles` + `helpdesk_categories` schema | **done** |
| U7.2 | `workspaces.helpdesk_enabled` flag | **done** |
| U7.3 | `GET /api/helpdesk` | **done** |
| U7.4 | Wire HelpdeskPanel (counts, overlay, status filter) | **done** |
| U7.5 | Docs + verify | **done** |

## Compare checklist

- [x] `/helpdesk/articles` header shows **0 Articles** from API
- [x] Upgrade overlay when `helpdeskEnabled` is false
- [x] Status nav routes filter articles (draft/visible/hidden)
- [x] Categories view shows **0 Categories**
- [x] `npm run check` passes

## API

```
GET /api/helpdesk?view=articles|categories&status=all|draft|visible|hidden&q=search
Response: {
  articles, categories, helpdeskEnabled,
  articleTotal, categoryTotal
}
```
