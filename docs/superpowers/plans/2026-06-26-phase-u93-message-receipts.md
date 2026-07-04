# Phase U93 — Message delivery & read receipts

**Goal:** Operator and visitor messages track delivered/read timestamps and fan out over SSE.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U93.1 | `delivered_at` / `read_at` on messages | **done** |
| U93.2 | Receipt POST routes + publish helper | **done** |
| U93.3 | Inbox + chatbox SSE `receipt` events | **done** |
| U93.4 | Widget/inbox receipt UI + auto-ack | **done** |
| U93.5 | Smoke + docs | **done** |

## Compare checklist

- [x] Visitor messages auto-delivered on ingest
- [x] `POST …/messages/[id]/receipt` from widget (operator msgs)
- [x] Visitor messages marked read when inbox unread cleared
- [x] Receipt updates propagate over SSE
- [x] `npm run smoke:api` passes (92 steps)

## Deferred

- Attachments on visitor messages
- Settings UI copy button for install snippet
