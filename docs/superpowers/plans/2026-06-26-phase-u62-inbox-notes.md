# Phase U62 — Inbox internal notes

**Goal:** Note composer tab saves team-only notes to the thread; list preview shows `Note: …` and respects customize toggle.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U62.1 | `POST /api/conversations/[id]/notes` | **done** |
| U62.2 | Note preview + list hide toggle | **done** |
| U62.3 | Note tab UI + thread rendering | **done** |
| U62.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Note tab switches composer to yellow internal mode
- [x] POST saves `from: "note"` message in thread
- [x] Conversation preview prefixed with `Note:`
- [x] Empty note rejected with 400
- [x] Show notes in last message toggle hides note preview in list
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (62 steps)

## API

```
POST /api/conversations/:id/notes
Body: { "text": "Follow up with billing" }
Response: { "message": { id, from: "note", text, time, sortOrder } }
```

## Deferred

- Note author attribution
- Edit/delete notes
- Reminder tab wiring
