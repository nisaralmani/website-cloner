# Phase U90 — Chatbox widget SSE

**Goal:** Operator replies reach the public widget over SSE instead of polling only.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U90.1 | `GET /api/chatbox/sessions/[id]/stream` | **done** |
| U90.2 | Filter visitor/operator messages only | **done** |
| U90.3 | `useChatboxStream` + widget wiring | **done** |
| U90.4 | Smoke + docs | **done** |

## Compare checklist

- [x] Public SSE without operator auth
- [x] Subscribes to workspace inbox bus for thread updates
- [x] Poll fallback when SSE disconnected
- [x] Operator POST message arrives on widget stream
- [x] Invalid session returns 404
- [x] `npm run smoke:api` passes (90 steps)

## Deferred

- Embeddable `<script>` snippet for third-party sites
- Typing indicators and delivery receipts
- Attachments on visitor messages
