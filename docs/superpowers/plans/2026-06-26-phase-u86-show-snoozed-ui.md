# Phase U86 — Show snoozed conversations UI

**Goal:** Wire the U84 snooze filter into inbox customize settings and list UI so operators can optionally include snoozed threads.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U86.1 | `showSnoozed` inbox customize toggle (`1-7`) | **done** |
| U86.2 | List + SSE fetch with `includeSnoozed=1` | **done** |
| U86.3 | Snoozed badge on conversation cards | **done** |
| U86.4 | Smoke + docs | **done** |

## Compare checklist

- [x] Settings → Inbox → Customize → “Show snoozed conversations”
- [x] When enabled, `GET /api/conversations?includeSnoozed=1`
- [x] SSE reconnects with `includeSnoozed=1`
- [x] Cards show purple “Snoozed until …” row
- [x] Header pill “Snoozed shown” when preference on
- [x] `npm run smoke:api` passes (86 steps)

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Checkbox-based bulk list selection
- Reminder due notification / auto-unsnooze notify
