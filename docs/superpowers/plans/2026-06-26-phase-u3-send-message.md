# Phase U3 — Send message

**Goal:** Composer sends operator messages to SQLite via API; thread updates immediately.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U3.1 | `POST /api/conversations/[id]/messages` | **done** |
| U3.2 | Update conversation preview + time on send | **done** |
| U3.3 | Wire composer (send button + Enter) | **done** |
| U3.4 | Refresh inbox list after send | **done** |
| U3.5 | Docs + verify | **done** |

## Compare checklist

- [x] Type in composer → send button enables
- [x] Click send or Enter → blue operator bubble appears in thread
- [x] Message persists after page reload
- [x] Conversation preview updates in list
- [x] `npm run check` passes

## API

```
POST /api/conversations/:id/messages
Body: { "text": "Hello" }
Response: { "message": { id, from, text, time } }
```
