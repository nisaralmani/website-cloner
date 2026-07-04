# Phase U63 — Conversation read/unread

**Goal:** Unread badge on inbox list persists via API; opening a thread marks it read.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U63.1 | `PATCH /api/conversations/[id]` unread field | **done** |
| U63.2 | Auto mark read on thread select | **done** |
| U63.3 | Unread card highlight in list | **done** |
| U63.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] PATCH sets unread count (0–999)
- [x] Invalid unread returns 400
- [x] Opening conversation clears unread badge
- [x] Unread cards use pending highlight color
- [x] SSE publishes updated list
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (63 steps)

## API

```
PATCH /api/conversations/:id
Body: { "unread": 0 }
Response: { "conversation": { ... } }
```

Can be combined with status in one request.

## Deferred

- Increment unread on simulated visitor messages
- Mark unread action from list checkbox
- Per-operator read cursors
