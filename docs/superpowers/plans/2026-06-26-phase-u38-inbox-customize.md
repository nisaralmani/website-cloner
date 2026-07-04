# Phase U38 — Inbox customize settings

**Goal:** Persist workspace-scoped inbox customize toggles and email preview on `/settings/inbox/customize`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U38.1 | Workspace field storage for email preview | **done** |
| U38.2 | `GET/PATCH` returns toggles + fields for customize page | **done** |
| U38.3 | Settings UI select + `InboxCustomizeProvider` | **done** |
| U38.4 | Inbox list/send behavior respects preferences | **done** |
| U38.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Seven toggles persist per workspace
- [x] Email preview select persists per workspace
- [x] Settings isolated per workspace on switch
- [x] Show channel in conversation list when enabled
- [x] Send confirm dialog unless hidden
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (38 steps)

## Storage

```
workspace_settings (workspace_id, setting_key, value)
toggle keys: inbox/customize::{section}-{item}
field key: inbox/customize::emailPreview
```

## Deferred

- List layout modal
- Segments / subject / waiting-since columns (no conversation fields yet)
- Email preview rendering in thread view
