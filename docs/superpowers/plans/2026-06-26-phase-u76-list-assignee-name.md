# Phase U76 — List assignee name label

**Goal:** When **Show assignee** is enabled, list cards display the assigned operator's name below the message preview.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U76.1 | Assignee name row on `ConversationCard` | **done** |
| U76.2 | Gated by `showAssignee` + `conversation.assignee` | **done** |
| U76.3 | Smoke: list/detail assignee name matches session | **done** |
| U76.4 | Docs + verify | **done** |

## Compare checklist

- [x] Name label only when customize toggle on and assignee set
- [x] Complements U73 avatar badge on same card
- [x] List/detail return `assignee.name` consistent with session user
- [x] `npm run smoke:api` passes (76 steps)

## UI

```
Preview row
Assignee name (xs, #5D6B98) — when showAssignee
Channel / segments — unchanged
```

## Deferred

- Edit/delete notes
- Public visitor chat widget
- Bulk assignment from list selection
- Triage rules runtime apply
