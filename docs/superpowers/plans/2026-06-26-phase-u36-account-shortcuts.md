# Phase U36 — Account keyboard shortcuts

**Goal:** Persist keyboard shortcut toggles per user on `/settings/account/shortcuts`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U36.1 | User-scoped toggle storage for `account/shortcuts` | **done** |
| U36.2 | `ShortcutPreferencesProvider` + search hotkeys | **done** |
| U36.3 | Smoke: toggle + workspace switch persistence | **done** |
| U36.4 | Docs + verify | **done** |

## Compare checklist

- [x] Three toggles on `/settings/account/shortcuts`
- [x] Defaults match registry (all ON)
- [x] PATCH saves per user in `user_settings`
- [x] Values survive workspace switch
- [x] Ctrl+F / Ctrl+P respect Search + Command palette toggles
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (36 steps)

## Storage

```
user_settings (user_id, setting_key, value)
setting_key = account/shortcuts::{section}-{item}
  0-0 = Search
  0-1 = Command palette
  1-0 = Enable editor actions shortcuts
```

## Deferred

- Dedicated command palette UI (Ctrl+P opens search overlay for now)
- Editor `?` / `!` shortcut actions in composer
- Inbox message shortcuts page (`inbox/shortcuts`)
