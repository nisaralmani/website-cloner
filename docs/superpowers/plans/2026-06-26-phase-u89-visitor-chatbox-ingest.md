# Phase U89 — Public visitor chatbox ingest

**Goal:** Unauthenticated visitors can open a chat session, send messages that land in the operator inbox with triage + SSE.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U89.1 | `visitor_chat_sessions` + create/resume API | **done** |
| U89.2 | Public message ingest + triage reuse | **done** |
| U89.3 | `VisitorChatWidget` + `/widget` page | **done** |
| U89.4 | Smoke + docs | **done** |

## Compare checklist

- [x] `GET /api/chatbox/config?domain=fashionsis.com`
- [x] `POST /api/chatbox/sessions` without auth
- [x] Messages persist as `from: visitor` with unread bump
- [x] Operator inbox list + detail show widget thread
- [x] Session resume via `sessionId`
- [x] Blocked visitor returns 403
- [x] `npm run smoke:api` passes (89 steps)

## API

```
GET  /api/chatbox/config?domain=fashionsis.com
POST /api/chatbox/sessions { workspaceId, sessionId?, country?, pageUrl? }
POST /api/chatbox/sessions/:sessionId/messages { text }
GET  /api/chatbox/sessions/:sessionId/messages?after=-1
```

## Deferred

- Embeddable script tag for third-party sites
- Typing indicators and delivery receipts
- Attachments on visitor messages
