# Phase U34 — Account security sessions

**Goal:** Back authorized apps and login history on `/settings/account/security` with real session data.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U34.1 | `user_sessions` table + JWT `sid` | **done** |
| U34.2 | Create/revoke on login/logout | **done** |
| U34.3 | `GET/DELETE /api/auth/sessions` | **done** |
| U34.4 | Security settings UI wiring | **done** |
| U34.5 | Seed history + smoke + docs | **done** |

## Compare checklist

- [x] Authorized apps table from active sessions
- [x] Login history with Authorized/Closed badges
- [x] Close session revokes other browser login
- [x] Closing current session logs out
- [x] Workspace switch keeps same session id
- [x] `npm run check` passes

## API

```
GET    /api/auth/sessions
DELETE /api/auth/sessions  { sessionId }
```

## Deferred

- Interface language/appearance persistence
- Real SMTP delivery
- GeoIP country detection
