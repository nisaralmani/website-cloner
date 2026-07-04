# Phase U71 — Assignee picker UI

**Goal:** Thread header assignee picker backed by workspace operators API, plus list footer current-operator avatar from session.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U71.1 | `AssigneePicker` component (operators dropdown + unassign) | **done** |
| U71.2 | Wire `updateAssignedOperator` through `InboxApp` / `ConversationDetail` | **done** |
| U71.3 | List footer avatar from session `avatarGradient` + online dot | **done** |
| U71.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Picker loads operators on open via `GET /api/workspaces/operators`
- [x] Assign / unassign calls existing `PATCH assignedOperatorId`
- [x] List updates after assignment change
- [x] Session exposes `user.avatarGradient` for list footer
- [x] Operators include `avatarUrl` for picker thumbnails
- [x] `npm run smoke:api` passes (71 steps)

## UI

```
ConversationDetail header
  AssigneePicker → operators list + Unassigned
  Status dropdown (unchanged)

ConversationList footer
  Current session user gradient avatar + online indicator
```

## Deferred

- Assignee avatar on individual list cards
- Bulk assignment from list selection
- Keyboard navigation in assignee menu
