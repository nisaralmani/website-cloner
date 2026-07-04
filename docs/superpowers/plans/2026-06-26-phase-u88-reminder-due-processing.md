# Phase U88 — Reminder due processing

**Goal:** When a reminder’s `remindAt` passes, unsnooze the conversation, bump unread, and fan out over inbox SSE.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U88.1 | `fulfilledAt` column + snooze query update | **done** |
| U88.2 | `processDueRemindersForWorkspace` | **done** |
| U88.3 | Wire list GET + SSE poll + POST route | **done** |
| U88.4 | Smoke + docs | **done** |

## Compare checklist

- [x] Due reminders marked `fulfilledAt` (idempotent)
- [x] Conversation returns to default list with unread ≥ 1
- [x] Resolved threads reopen to `pending`
- [x] Preview updated to `Reminder: …`
- [x] Active reminders list excludes fulfilled
- [x] `POST /api/inbox/process-due-reminders` accepts optional `asOf`
- [x] `npm run smoke:api` passes (88 steps)

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Push/email notification outside inbox SSE
