# Phase U72 — Note author

**Goal:** Persist and return the workspace operator who wrote each internal note.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U72.1 | `messages.author_user_id` column | **done** |
| U72.2 | Set author on `POST …/notes` | **done** |
| U72.3 | Author join on list/detail/poll/SSE message fetch | **done** |
| U72.4 | Thread UI shows `Note · {author}` | **done** |
| U72.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Notes store `authorUserId` from session
- [x] Operator/visitor messages leave author null
- [x] GET thread / poll / SSE include `author { id, name }` on notes
- [x] Thread renders author name on note bubbles
- [x] Legacy notes without author remain valid (author omitted)
- [x] `npm run smoke:api` passes (72 steps)

## API

```
POST /api/conversations/:id/notes
Response message:
{
  "from": "note",
  "text": "...",
  "author": { "id": "<userId>", "name": "..." }
}
```

## Deferred

- Assignee avatar on list cards
- Note author avatar gradient in thread
- Edit/delete notes
