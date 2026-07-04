# Phase U37 — Inbox message shortcuts

**Goal:** Workspace-scoped CRUD for `!bang` message shortcuts on `/settings/inbox/shortcuts`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U37.1 | `message_shortcuts` table + seed data | **done** |
| U37.2 | `GET/POST /api/message-shortcuts` + `[id]` PATCH/DELETE | **done** |
| U37.3 | Settings page form + manage list wired | **done** |
| U37.4 | Inbox composer expands `!bang` on send | **done** |
| U37.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Create shortcut with bang, tag, message
- [x] List grouped by tag with search
- [x] Delete shortcut from manage list
- [x] Workspace isolation (shortcuts do not leak across workspaces)
- [x] Seed `!pricing` and `!refund` on primary workspace
- [x] Composer sends expanded message when `!bang` matches
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (37 steps)

## Storage

```
message_shortcuts (
  id, workspace_id, bang, tag, message, created_by, sort_order, created_at
)
UNIQUE (workspace_id, bang)
```

## Deferred

- Paid-plan upgrade gate removal (UI overlay remains)
- Rich-text toolbar on composer
- Shortcut analytics page
