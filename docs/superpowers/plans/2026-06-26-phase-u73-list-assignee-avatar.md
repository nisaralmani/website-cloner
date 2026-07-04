# Phase U73 — List card assignee avatar

**Goal:** Show assigned operator avatar on conversation list cards when **Show assignee** customize toggle is on.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U73.1 | `Show assignee` toggle in settings (`1-6`) | **done** |
| U73.2 | `showAssignee` in customize preferences provider | **done** |
| U73.3 | Assignee badge on list card visitor avatar | **done** |
| U73.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Settings registry includes **Show assignee** toggle (default off)
- [x] `inboxCustomizeFromSettings` exposes `showAssignee`
- [x] Card renders ~18px assignee gradient badge when toggle on + assignee set
- [x] List API already returns `assignee { id, name, avatarGradient }`
- [x] `npm run smoke:api` passes (73 steps)

## UI

```
Visitor avatar (40px)
  bottom-right: country flag (unchanged)
  bottom-left: assignee badge when showAssignee && assignee
```

## Deferred

- Assignee name label on list row
- Bulk assignment from list selection
- Note author avatar in thread
- Edit/delete notes
