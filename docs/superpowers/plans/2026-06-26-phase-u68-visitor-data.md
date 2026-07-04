# Phase U68 — Visitor data KV

**Goal:** Customer info panel visitor data key/value pairs persist per conversation.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U68.1 | `conversation_visitor_data` table + seed | **done** |
| U68.2 | `PUT/DELETE /api/conversations/[id]/visitor-data` | **done** |
| U68.3 | GET thread returns `details.visitorData` | **done** |
| U68.4 | Info panel editor + hooks | **done** |
| U68.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] PUT upserts key/value on conversation
- [x] DELETE removes entry by key
- [x] Empty key/value returns 400
- [x] GET detail includes `details.visitorData[]`
- [x] PATCH conversation preserves visitorData in details
- [x] Info panel lists entries with save/remove
- [x] Seed `order_id` on conversation c7
- [x] `npm run smoke:api` passes (68 steps)

## API

```
PUT /api/conversations/:id/visitor-data
Body: { "key": "order_id", "value": "1413568" }
Response: { "entry": { key, value }, "conversation", "details" }

DELETE /api/conversations/:id/visitor-data
Body: { "key": "order_id" }
Response: { "conversation", "details" }
```

## Deferred

- Conversation segments persistence
- Sync visitor data to contacts profile
- Triage rules applying visitor data automatically
- Bulk import/export of visitor data
