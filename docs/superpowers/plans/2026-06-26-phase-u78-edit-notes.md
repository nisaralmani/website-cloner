# Phase U78 — Edit notes

**Goal:** Operators can edit internal note text in a thread; list preview updates when the edited note is the latest message.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U78.1 | `PATCH /api/conversations/[id]/notes/[messageId]` | **done** |
| U78.2 | `updateConversationNote` + preview sync | **done** |
| U78.3 | Inline edit UI on note bubbles | **done** |
| U78.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] PATCH updates note text only (`from: note`)
- [x] Empty text returns 400; non-note returns 400; missing returns 404
- [x] Latest note edit refreshes conversation preview with `Note: …`
- [x] Thread inline edit with save/cancel
- [x] `npm run smoke:api` passes (78 steps)

## API

```
PATCH /api/conversations/:id/notes/:messageId
Body: { "text": "Updated note" }
Response: { "message": ApiMessage, "conversation": Conversation }
```

## Deferred

- Author-only edit permission
- Public visitor chat widget
- Triage rules runtime apply
- Bulk assignment from list selection
