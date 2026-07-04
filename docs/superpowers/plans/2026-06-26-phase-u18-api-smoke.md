# Phase U18 — Backend API smoke tests

**Goal:** Verify authenticated API routes against seeded SQLite in CI and local smoke.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U18.1 | `scripts/smoke-api-tests.mjs` — login + API assertions | **done** |
| U18.2 | Hook into `smoke-routes.mjs` after HTML smoke | **done** |
| U18.3 | CI seeds DB before smoke | **done** |
| U18.4 | `npm run smoke:api` standalone script | **done** |
| U18.5 | Docs + verify | **done** |

## Compare checklist

- [x] Unauthenticated APIs return 401
- [x] Login → session cookie → protected routes return 200
- [x] Send message, plugin toggle, search, settings read
- [x] Logout clears session
- [x] Runs in CI after `db:seed`
- [x] `npm run check` passes

## Usage

```bash
npm run smoke:api          # build + seed + API-only (own server)
npm run smoke              # build + seed + 98 HTML routes + API smoke
SMOKE_SKIP_API=1 npm run smoke:ci   # HTML routes only (external base)
```

## Coverage (20 checks)

Auth, conversations, messages, visitors, contacts, campaigns, helpdesk, analytics, plugins, settings, search, forgot-password, logout.

## Deferred

- Remote deploy API smoke (needs seeded production DB)
- Redis multi-instance inbox bus
