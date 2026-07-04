# Phase U40 — Inbox sub-inboxes

**Goal:** Workspace-scoped CRUD for sub-inboxes on `/settings/inbox/sub-inboxes`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U40.1 | `sub_inboxes` table + seed data | **done** |
| U40.2 | `GET/POST /api/sub-inboxes` + `[id]` PATCH/DELETE | **done** |
| U40.3 | Settings page list + add button wired | **done** |
| U40.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Empty state with eye icon when no sub-inboxes
- [x] Add a sub-inbox header button creates row
- [x] List with enable toggle and delete
- [x] Optional segment label on each row
- [x] Workspace isolation on switch
- [x] Seed Support + Sales on primary workspace
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (40 steps)

## Storage

```
sub_inboxes (
  id, workspace_id, name, segment, enabled,
  sort_order, created_at
)
```

## Deferred

- Sub-inbox filter rules (segments, locale, user data)
- Inbox sidebar sub-inbox navigation from API
- Drag-and-drop ordering
