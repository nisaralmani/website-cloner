# Phase U19 — Inbox SSE stream smoke

**Goal:** Verify `/api/inbox/stream` connects, emits snapshots, and pushes message events in CI.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U19.1 | SSE client helper in `smoke-api-tests.mjs` | **done** |
| U19.2 | Unauthenticated stream returns 401 | **done** |
| U19.3 | Connected + conversations snapshot events | **done** |
| U19.4 | POST message pushes `messages` event over SSE | **done** |
| U19.5 | Docs + verify | **done** |

## Compare checklist

- [x] `GET /api/inbox/stream` without session → 401
- [x] Authenticated stream emits `connected`
- [x] Stream emits `conversations` snapshot
- [x] Send message while stream open → `messages` event with same text
- [x] Runs as part of `npm run smoke` / CI

## Deferred

- Redis pub/sub for multi-instance SSE
- Account menu / profile settings from sidebar footer
