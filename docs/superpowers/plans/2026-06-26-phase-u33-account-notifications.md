# Phase U33 — Account notification preferences

**Goal:** Persist account notification toggles per user (not per workspace).

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U33.1 | `user_settings` table | **done** |
| U33.2 | User-scoped GET/PATCH in settings API | **done** |
| U33.3 | Smoke: toggle + workspace switch persistence | **done** |
| U33.4 | Docs + verify | **done** |

## Compare checklist

- [x] Nine toggles on `/settings/account/notifications`
- [x] Defaults match registry
- [x] PATCH saves per user
- [x] Values survive workspace switch
- [x] Workspace-scoped pages unchanged
- [x] `npm run check` passes

## Storage

```
user_settings (user_id, setting_key, value)
setting_key = account/notifications::{section}-{item}
```

## Deferred

- Account security sessions table
- Interface language/appearance persistence
- Real SMTP delivery
