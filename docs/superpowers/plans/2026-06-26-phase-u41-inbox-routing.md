# Phase U41 — Inbox operator routing

**Goal:** Workspace-scoped routing toggles and routing rules CRUD on `/settings/inbox/routing`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U41.1 | `routing_rules` table + seed data | **done** |
| U41.2 | `GET/POST /api/routing-rules` + `[id]` PATCH/DELETE | **done** |
| U41.3 | Settings toggles + dependent re-run toggles + rules list | **done** |
| U41.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] General option toggle persisted via workspace settings
- [x] Enable routing rules + dependent re-run toggles greyed when off
- [x] Add a routing rule header button creates row
- [x] Globe empty state when no rules
- [x] List with enable toggle and delete
- [x] Workspace isolation on switch
- [x] Seed Sales queue + Support round robin on primary workspace
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (41 steps)

## Storage

```
workspace_settings (inbox/routing::{section}-{item} toggles)

routing_rules (
  id, workspace_id, name, action, assign_target,
  match_contains, enabled, sort_order, created_at
)
```

## Deferred

- Rule condition builder UI (segments, locale, user data)
- Runtime operator assignment on incoming messages
- Drag-and-drop rule ordering
