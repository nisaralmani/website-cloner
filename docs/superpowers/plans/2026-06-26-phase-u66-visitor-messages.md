# Phase U66 — Simulated visitor messages

**Goal:** Operators can inject a visitor message for testing — it persists, bumps unread, reopens resolved threads, and fans out over inbox SSE.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U66.1 | Shared `insertConversationMessage` helper | **done** |
| U66.2 | `POST /api/conversations/[id]/visitor-messages` | **done** |
| U66.3 | Refactor operator send to shared helper | **done** |
| U66.4 | Hook `simulateVisitorMessage` + auto-read on open thread | **done** |
| U66.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Visitor POST persists message with `from: visitor`
- [x] Unread increments on visitor message
- [x] Resolved conversation reopens to `pending`
- [x] Preview/time updated on conversation row
- [x] Inbox SSE publishes messages + conversation list
- [x] Empty text returns 400
- [x] Open thread auto-marks read when visitor message arrives via SSE
- [x] `npm run smoke:api` passes (66 steps)

## API

```
POST /api/conversations/:id/visitor-messages
Body: { "text": "Hello from visitor" }
Response: { "message": ApiMessage, "conversation": Conversation | null }
```

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Typing indicators and delivery receipts
- Attachments on visitor messages
