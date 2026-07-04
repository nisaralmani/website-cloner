# Phase U61 — Conversation status

**Goal:** Thread header status control persists to the database and updates the inbox list in realtime.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U61.1 | `PATCH /api/conversations/[id]` status | **done** |
| U61.2 | Status validation + inbox SSE fan-out | **done** |
| U61.3 | `updateStatus` hook + header dropdown UI | **done** |
| U61.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Status dropdown shows Pending / Resolved / Unassigned
- [x] PATCH updates DB and returns conversation
- [x] Invalid status returns 400
- [x] List card highlight follows pending vs resolved
- [x] SSE publishes updated conversation list
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (61 steps)

## API

```
PATCH /api/conversations/:id
Body: { "status": "pending" | "resolved" | "unassigned" }
Response: { "conversation": { ... } }
```

## Deferred

- Bulk status change from list selection
- Operator assignment on status change
- Resolved conversation archive / hide rules
