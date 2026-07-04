# Phase U75 — Note author avatar

**Goal:** Note messages expose author `avatarGradient` and the thread renders a gradient avatar beside the note header.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U75.1 | `MessageAuthor.avatarGradient` on API responses | **done** |
| U75.2 | Author join maps user gradient in mappers | **done** |
| U75.3 | Note bubble avatar in `ConversationDetail` | **done** |
| U75.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] `author { id, name, avatarGradient }` on note POST/GET/poll
- [x] Operator/visitor messages omit author
- [x] Thread note header shows gradient circle + label
- [x] Matches session user gradient for authoring operator
- [x] `npm run smoke:api` passes (75 steps)

## Deferred

- Assignee name label on list row
- Edit/delete notes
- Public visitor chat widget
- Bulk assignment from list selection
