# Phase U29 — Availability schedule

**Goal:** Persist and edit operator availability schedule (days, timezone, hours).

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U29.1 | `schedule_*` columns on `users` | **done** |
| U29.2 | `GET/PATCH /api/auth/availability-schedule` | **done** |
| U29.3 | Enable schedule toggle (`0-2`) on user | **done** |
| U29.4 | Editable days/timezone/hours UI | **done** |
| U29.5 | Activity presence respects schedule | **done** |
| U29.6 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Schedule toggle persists per user
- [x] Day pills toggle and save
- [x] Timezone + hours save
- [x] Fields disabled when schedule off
- [x] Auto-available respects schedule window
- [x] `npm run check` passes

## API

```
GET   /api/auth/availability-schedule
PATCH /api/auth/availability-schedule  { days?, timezone?, start?, end?, enabled? }
```

Settings availability GET also returns `schedule` payload.

## Deferred

- Multiple hour slots per day
- True timezone offset math (uses local clock for window check)
