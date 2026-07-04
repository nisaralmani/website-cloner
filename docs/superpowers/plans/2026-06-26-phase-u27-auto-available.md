# Phase U27 — Auto-available when using the app

**Goal:** Presence follows app activity when "Set me available when using the app" is enabled.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U27.1 | `force_offline` + `auto_available` on `users` | **done** |
| U27.2 | Separate force-offline preference from manual presence | **done** |
| U27.3 | `POST /api/auth/activity` | **done** |
| U27.4 | `useAppPresence` client tracker | **done** |
| U27.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Force offline toggle is independent of manual presence
- [x] Auto-available toggle persists per user
- [x] Activity active → online (when auto-available on)
- [x] Activity inactive → offline (when auto-available on)
- [x] Force offline overrides activity sync
- [x] `npm run check` passes

## API

```
POST /api/auth/activity  { active: boolean }
```

## Deferred

- Availability schedule (days/hours/timezone)
- Idle timeout before away
