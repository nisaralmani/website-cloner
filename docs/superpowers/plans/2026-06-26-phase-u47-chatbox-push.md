# Phase U47 — Chatbox push notifications

**Goal:** Persist Android and iOS push toggles on `/settings/chatbox/push`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U47.1 | Workspace toggles via settings API | **done** |
| U47.2 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Android FCM toggle persists (`0-0`)
- [x] iOS APNs toggle persists (`1-0`)
- [x] Section badges remain static UI (live parity)
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (47 steps)

## Storage

```
workspace_settings (
  chatbox/push::0-0  — Notify users using Android
  chatbox/push::1-0  — Notify users using iOS
)
```

## Deferred

- FCM/APNs credential upload and delivery
- Runtime mobile SDK push registration
- Badge state driven by credential configuration
