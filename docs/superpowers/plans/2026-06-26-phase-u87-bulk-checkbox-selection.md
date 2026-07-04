# Phase U87 — Checkbox bulk list selection

**Goal:** Dedicated selection mode with checkboxes for bulk assign — complements U82 Ctrl/Cmd-click.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U87.1 | Select mode header (Cancel, count, Select all) | **done** |
| U87.2 | Bulk checkbox column separate from unread | **done** |
| U87.3 | Row click toggles bulk in select mode | **done** |
| U87.4 | Smoke dedupe + docs | **done** |

## Compare checklist

- [x] Header **Select** enters selection mode
- [x] Bulk checkboxes visible in mode (or when row already selected)
- [x] **Select all** / **Clear all** for visible list
- [x] **Cancel** exits mode and clears selection
- [x] Footer bulk assign picker unchanged
- [x] API dedupes duplicate ids in one bulk-assign request
- [x] `npm run smoke:api` passes (87 steps)

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Reminder due notification / auto-unsnooze notify
