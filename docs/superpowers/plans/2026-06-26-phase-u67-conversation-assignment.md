# Phase U67 — Conversation operator assignment

**Goal:** Assign a workspace operator to a conversation — persists on the row, returns assignee on list/detail, and refreshes inbox SSE.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U67.1 | `conversations.assigned_operator_id` column + seed | **done** |
| U67.2 | `PATCH /api/conversations/[id]` assignedOperatorId | **done** |
| U67.3 | Assignee join on list/detail + SSE fan-out | **done** |
| U67.4 | `updateAssignedOperator` hook + header display | **done** |
| U67.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] PATCH assigns workspace operator by user id
- [x] PATCH clears assignee via null
- [x] Non-member operator returns 400
- [x] GET list/detail include `assignee { id, name, avatarGradient }`
- [x] Inbox SSE refresh on assignment change
- [x] Thread header shows assignee when set
- [x] Seed assigns c1 to demo operator
- [x] `npm run smoke:api` passes (67 steps)

## API

```
PATCH /api/conversations/:id
Body: { "assignedOperatorId": "<userId>" | null | "" }
Response: { "conversation": { assignee: ... }, "details": { ... } }
```

## Deferred

- Assignee picker UI in thread header
- List card assignee avatar
- Auto-assign on operator reply (routing rules integration)
- Bulk assignment from list selection
