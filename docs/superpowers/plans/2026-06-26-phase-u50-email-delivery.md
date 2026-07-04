# Phase U50 — Email delivery settings

**Goal:** Persist custom SMTP toggle on `/settings/email/delivery`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U50.1 | Workspace SMTP toggle via settings API | **done** |
| U50.2 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Custom SMTP toggle persists (`1-0`)
- [x] Outbound IP info + status panel remain static UI
- [x] Custom SMTP section badge remains static UI
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (50 steps)

## Storage

```
workspace_settings (
  email/delivery::1-0  — Send all emails using my custom outbound SMTP server
)
```

## Deferred

- Dedicated Email IP plugin install from settings panel
- SMTP credential fields when toggle is on
- Runtime outbound email routing (shared pool vs dedicated IP vs custom SMTP)
