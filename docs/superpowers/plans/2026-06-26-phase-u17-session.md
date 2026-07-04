# Phase U17 — Session + Logout Wiring

**Goal:** Wire session API into app shell with logout and remember-me cookie duration.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U17.1 | `SessionProvider` + `useSession` hook | **done** |
| U17.2 | `InboxSidebar` real user/workspace + logout | **done** |
| U17.3 | Remember me on login (7d / 30d cookie) | **done** |
| U17.4 | Google OAuth 30-day session | **done** |
| U17.5 | Docs + verify | **done** |

## Compare checklist

- [x] Sidebar shows authenticated user name + email from DB
- [x] Workspace header uses DB workspace name/domain/logo
- [x] Log out clears session and redirects to login
- [x] Remember me extends session to 30 days
- [x] `npm run check` passes

## API

```
GET  /api/auth/session
POST /api/auth/logout
POST /api/auth/login  { email, password, remember? }
```

## Deferred

- Account menu / profile settings from footer
- Workspace switcher
- Live notification count on workspace header
