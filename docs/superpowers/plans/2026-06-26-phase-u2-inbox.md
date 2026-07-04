# Phase U2 — Inbox conversations from DB

**Goal:** Conversation list + thread/detail loaded from SQLite via API.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U2.1 | `conversations` + `messages` schema | **done** |
| U2.2 | Seed 10 conversations + messages from mock | **done** |
| U2.3 | `GET /api/conversations`, `GET /api/conversations/[id]` | **done** |
| U2.4 | Wire `InboxApp`, search overlay | **done** |
| U2.5 | Docs + verify | **done** |

## Compare checklist

- [x] Login → inbox shows 10 conversations from DB
- [x] Click conversation → messages load in thread
- [x] Customer panel shows location/device from DB
- [x] Ctrl+F search lists API conversations
- [x] `npm run check` passes
