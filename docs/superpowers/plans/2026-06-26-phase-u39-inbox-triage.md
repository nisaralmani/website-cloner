# Phase U39 — Inbox automatic triage

**Goal:** Workspace-scoped CRUD for block/sort triage rules on `/settings/inbox/triage`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U39.1 | `triage_rules` table + seed data | **done** |
| U39.2 | `GET/POST /api/triage-rules` + `[id]` PATCH/DELETE | **done** |
| U39.3 | Settings filters + ruleset UI wired | **done** |
| U39.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Block and sort rulesets with active counts
- [x] Create, enable/disable, delete rules
- [x] Search + action filter on list API
- [x] Workspace isolation on switch
- [x] Seed block + sort rules on primary workspace
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (39 steps)

## Storage

```
triage_rules (
  id, workspace_id, ruleset, name, action, enabled,
  match_contains, sort_order, created_at
)
```

## Deferred

- Rule condition builder UI (field/operator)
- Runtime triage execution on incoming messages
- Drag-and-drop rule ordering
