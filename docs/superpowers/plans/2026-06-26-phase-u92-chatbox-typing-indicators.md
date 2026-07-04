# Phase U92 — Chatbox typing indicators

**Goal:** Visitor and operator typing state propagates over inbox/chatbox SSE in real time.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U92.1 | `typing` SSE event + publish helper | **done** |
| U92.2 | Operator + visitor typing POST routes | **done** |
| U92.3 | Inbox + widget stream forwarding | **done** |
| U92.4 | UI indicators + debounced ping hooks | **done** |
| U92.5 | Smoke + docs | **done** |

## Compare checklist

- [x] `POST /api/conversations/[id]/typing` (authenticated)
- [x] `POST /api/chatbox/sessions/[id]/typing` (public)
- [x] Operator typing reaches widget SSE
- [x] Visitor typing reaches inbox SSE
- [x] Typing cleared on message send
- [x] `npm run smoke:api` passes (91 steps)

## Deferred

- Delivery/read receipts
- Attachments on visitor messages
- Settings UI copy button for install snippet
