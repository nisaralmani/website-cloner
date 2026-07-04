# Phase U77 — Delete notes

**Goal:** Operators can delete internal notes from a thread; conversation preview resyncs from the latest remaining message.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U77.1 | `DELETE /api/conversations/[id]/notes/[messageId]` | **done** |
| U77.2 | Preview resync via `syncConversationPreviewFromLatestMessage` | **done** |
| U77.3 | `deleteNote` hook + thread trash control | **done** |
| U77.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] DELETE removes `from: note` messages only
- [x] 404 for missing note, 400 for non-note message
- [x] Preview/time revert to latest remaining message
- [x] Inbox SSE list refresh after delete
- [x] Thread removes note locally; list preview updates
- [x] `npm run smoke:api` passes (77 steps)

## API

```
DELETE /api/conversations/:id/notes/:messageId
Response: { "messageId": "...", "conversation": Conversation }
```

## Deferred

- Edit notes
- Author-only delete permission
- Public visitor chat widget
- Triage rules runtime apply
