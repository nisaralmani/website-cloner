# Phase U12 — Realtime inbox (polling)

**Goal:** Inbox list and active thread refresh automatically without full page reload.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U12.1 | `usePolling` hook (visibility-aware) | **done** |
| U12.2 | `GET /api/conversations/[id]/messages?after=` | **done** |
| U12.3 | Silent list poll (5s) + thread poll (3s) | **done** |
| U12.4 | Docs + verify | **done** |

## Compare checklist

- [x] Conversation list refreshes preview/unread every 5s
- [x] Open thread polls for new messages every 3s
- [x] Polling pauses when browser tab is hidden
- [x] Incremental fetch uses `sortOrder` cursor
- [x] `npm run check` passes

## API

```
GET /api/conversations/[id]/messages?after=12
Response: { messages: ApiMessage[], lastSortOrder: number }
```

## Notes

- Polling first; WebSocket/SSE deferred to a later phase.
- Test new visitor messages by inserting into SQLite while inbox is open.
