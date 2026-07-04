# Phase U82 — Bulk assignment from list selection

**Goal:** Assign multiple conversations to an operator in one action — API batch endpoint plus list footer picker when conversations are Ctrl/Cmd-selected.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U82.1 | `PATCH /api/conversations/bulk-assign` | **done** |
| U82.2 | `bulkAssignConversations` helper + validation | **done** |
| U82.3 | List Ctrl/Cmd-click selection + footer picker | **done** |
| U82.4 | Hook + smoke + docs | **done** |

## Compare checklist

- [x] Batch update `assigned_operator_id` for workspace conversations
- [x] Validates operator membership; rejects unknown ids (404)
- [x] Dedupes ids; max 50 per request
- [x] SSE list refresh after bulk assign
- [x] Footer assign button when selection active
- [x] `npm run smoke:api` passes (82 steps)

## UX

- **Ctrl/Cmd+click** card toggles bulk selection (blue inset ring)
- Footer center shows assign picker with count badge
- Pick operator or Unassigned to apply to all selected

## Deferred

- Reminder tab wiring
- Public visitor chat widget / unauthenticated ingest
- Dedicated checkbox selection mode
