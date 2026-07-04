# Phase U84 — Snooze conversations until reminder due

**Goal:** Conversations with an active future reminder are hidden from the default inbox list until the reminder is due or cancelled.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U84.1 | Active snooze map from `conversation_reminders` | **done** |
| U84.2 | Filter default list + SSE snapshot | **done** |
| U84.3 | `GET /api/conversations?includeSnoozed=1` | **done** |
| U84.4 | `snoozedUntil` on conversation + smoke | **done** |

## Compare checklist

- [x] Future active reminder snoozes conversation
- [x] Default list excludes snoozed threads
- [x] `includeSnoozed=1` returns them with `snoozedUntil`
- [x] Cancelling reminder restores to list
- [x] Detail route still accessible by id
- [x] `npm run smoke:api` passes (84 steps)

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Seeded noreply/vip triage smoke
- Checkbox bulk selection mode
- Auto-unsnooze when `remindAt` elapses (cron/job)
