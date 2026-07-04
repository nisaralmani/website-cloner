# Phase U48 — Email behavior settings

**Goal:** Persist email behavior toggles on `/settings/email/behavior`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U48.1 | Workspace toggles via settings API | **done** |
| U48.2 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Transcripts toggle persists (`0-0`, default on)
- [x] Ratings toggle persists (`0-1`, default on)
- [x] Spam inbox toggle persists (`0-2`, default on)
- [x] Signature toggle persists (`1-0`, default off)
- [x] Custom signature badge remains static UI
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (48 steps)

## Storage

```
workspace_settings (
  email/behavior::0-0  — Email users transcripts of conversations
  email/behavior::0-1  — Enable ratings
  email/behavior::0-2  — Send junk emails to Spam inbox
  email/behavior::1-0  — Append text signature
)
```

## Deferred

- Custom email signature editor when signature toggle is on
- Runtime transcript/rating/spam routing in email pipeline
