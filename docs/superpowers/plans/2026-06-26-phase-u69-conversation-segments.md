# Phase U69 — Conversation segments

**Goal:** Segment labels on a conversation persist and appear in the info panel and list (when enabled).

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U69.1 | `conversation_segments` table + seed | **done** |
| U69.2 | `POST/DELETE /api/conversations/[id]/segments` | **done** |
| U69.3 | `details.segments` + list `conversation.segments` | **done** |
| U69.4 | Info panel add/remove + list pills when customize toggle on | **done** |
| U69.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] POST adds segment label to conversation
- [x] DELETE removes segment by name
- [x] Duplicate POST is idempotent
- [x] Empty segment returns 400
- [x] GET detail/list include segments arrays
- [x] Info panel lists tags with add/remove
- [x] List shows pills when **Show segments** customize toggle enabled
- [x] Seed `refund` segment on conversation c7
- [x] `npm run smoke:api` passes (69 steps)

## API

```
POST /api/conversations/:id/segments
Body: { "segment": "refund" }
Response: { "segment", "conversation", "details" }

DELETE /api/conversations/:id/segments
Body: { "segment": "refund" }
Response: { "conversation", "details" }
```

## Deferred

- Segment autocomplete from workspace catalog
- Triage rules auto-applying segments
- Sync segments to contacts profile
- Bulk segment edit from list selection
