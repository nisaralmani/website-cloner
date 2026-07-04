# Phase U21 — Operator presence (online/offline)

**Goal:** Persist operator presence and toggle it from the account menu.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U21.1 | `users.presence_status` in SQLite + Postgres schemas | **done** |
| U21.2 | `PATCH /api/auth/presence` | **done** |
| U21.3 | Session includes `user.presence` | **done** |
| U21.4 | Account menu "Seen as" Online / Offline | **done** |
| U21.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Default presence is online for seeded user
- [x] Menu toggles online ↔ offline
- [x] Footer dot turns gray when offline
- [x] Presence persists across session refresh
- [x] `npm run check` passes

## API

```
PATCH /api/auth/presence  { "status": "online" | "offline" }
GET   /api/auth/session   → user.presence
```

## Deferred

- Redis pub/sub for multi-instance SSE
- Create-new-workspace flow
- Per-workspace notification counts
