# Phase U83 — Reminder tab wiring

**Goal:** Reminder composer tab schedules follow-ups on a conversation — persisted with due time, shown in thread, cancellable by author.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U83.1 | `conversation_reminders` schema | **done** |
| U83.2 | POST/GET/DELETE reminder routes | **done** |
| U83.3 | Reminder tab UI + thread bubble | **done** |
| U83.4 | Hook + smoke + docs | **done** |

## Compare checklist

- [x] Reminder tab switches composer to purple internal mode
- [x] POST saves `from: "reminder"` message + reminder row
- [x] List preview prefixed with `Reminder:`
- [x] Future `remindAt` required; past rejected
- [x] Author can cancel active reminder
- [x] `npm run smoke:api` passes (83 steps)

## API

```
POST /api/conversations/:id/reminders
Body: { "note": "Call back", "remindAt": "2026-06-27T10:00:00.000Z" }

GET /api/conversations/:id/reminders
DELETE /api/conversations/:id/reminders/:reminderId
```

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Seeded noreply/vip triage smoke
- Checkbox bulk selection mode
- Snooze/hide conversation until due
