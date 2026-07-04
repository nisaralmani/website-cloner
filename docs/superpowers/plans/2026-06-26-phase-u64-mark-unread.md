# Phase U64 — Mark conversation unread

**Goal:** List checkbox toggles unread state; auto-read only runs when selecting a thread.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U64.1 | `toggleUnread` / `markAsUnread` hooks | **done** |
| U64.2 | List checkbox wired (checked = unread) | **done** |
| U64.3 | Auto-read only on thread selection change | **done** |
| U64.4 | Combined PATCH smoke + docs + verify | **done** |

## Compare checklist

- [x] Checkbox checked when `unread > 0`
- [x] Click toggles unread ↔ read via PATCH
- [x] Marking open thread unread is not immediately cleared
- [x] Selecting a different thread still auto-marks read
- [x] Combined `{ status, unread }` PATCH works
- [x] `npm run smoke:api` passes (64 steps)

## Deferred

- Bulk select multiple conversations
- Increment unread on visitor message simulation
- Per-operator read state
