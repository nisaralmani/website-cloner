# Phase U24 — Availability ↔ presence sync

**Goal:** Unify operator presence with the Availability settings page.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U24.1 | Map "Force offline" toggle to `users.presence_status` | **done** |
| U24.2 | GET availability settings derives toggle + `presence` | **done** |
| U24.3 | PATCH force-offline updates presence | **done** |
| U24.4 | Live status banner on settings page | **done** |
| U24.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Account menu Offline ↔ Force offline toggle stay in sync
- [x] Banner shows Online / Offline from session
- [x] Other availability toggles still use workspace_settings
- [x] `npm run check` passes

## Deferred

- Availability schedule toggles wired to DB
- "Set me available when using the app" auto-presence
