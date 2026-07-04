# Phase U4 — Visitors

**Goal:** Visitors panel loads live visitor list + MagicMap stats from SQLite.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U4.1 | `visitors` schema + seed data | **done** |
| U4.2 | `GET /api/visitors` | **done** |
| U4.3 | Wire VisitorsPanel (list, filter, map markers, stats) | **done** |
| U4.4 | Sidebar visitor count badge from API | **done** |
| U4.5 | Docs + verify | **done** |

## Compare checklist

- [x] `/visitors` shows 3 seeded visitors in list
- [x] MagicMap stats show 3 online / 1 active
- [x] Map markers at lat/lng positions
- [x] Filter by name or city works
- [x] Sidebar Visitors badge shows online count
- [x] `npm run check` passes

## API

```
GET /api/visitors
Response: { visitors: Visitor[], stats: { online, active }, total }
```
