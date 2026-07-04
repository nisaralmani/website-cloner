# Phase U16 — Inbox SSE stream

**Goal:** Replace client polling with a push stream (SSE) for inbox list + thread updates.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U16.1 | `GET /api/inbox/stream` SSE endpoint | **done** |
| U16.2 | In-memory event bus + publish on send | **done** |
| U16.3 | `useInboxStream` + unified `useInboxApp` | **done** |
| U16.4 | Polling fallback when stream disconnected | **done** |
| U16.5 | Docs + verify | **done** |

## Compare checklist

- [x] Single SSE connection per inbox session
- [x] List + thread updates pushed over stream
- [x] Instant push when operator sends message
- [x] HTTP polling fallback (10s) when SSE drops
- [x] `npm run check` passes

## API

```
GET /api/inbox/stream?conversation=<id>
Events: connected | conversations | messages
```

## Notes

- Uses **SSE** (not raw WebSocket) for Vercel/serverless compatibility.
- In-memory bus is per Node process; optional `REDIS_URL` enables cross-instance fan-out (U23).
