# Phase U23 — Redis inbox pub/sub

**Goal:** Fan out inbox SSE events across multiple Node instances when `REDIS_URL` is set.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U23.1 | Optional Redis publish on `publishInbox` | **done** |
| U23.2 | Process-wide PSUBSCRIBE fan-in | **done** |
| U23.3 | Origin id dedupe (no double-delivery locally) | **done** |
| U23.4 | In-memory fallback when unset | **done** |
| U23.5 | Docs + verify | **done** |

## Compare checklist

- [x] Without `REDIS_URL` — same in-process behavior as U16
- [x] With `REDIS_URL` — publish reaches subscribers on other instances
- [x] Publisher instance does not duplicate via Redis echo
- [x] SSE smoke still passes in CI (no Redis)
- [x] `npm run check` passes

## Env

```
REDIS_URL=redis://127.0.0.1:6379
```

Channel: `bybelt:inbox:{workspaceId}` · Payload: `{ origin, event }`

## Deferred

- Managed Redis in production deploy docs
- Integration test with live Redis in CI
