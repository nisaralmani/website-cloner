# Phase U65 — Customer email

**Goal:** Customer info panel `set email` persists visitor email on the conversation.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U65.1 | `conversations.customer_email` column + seed | **done** |
| U65.2 | `PATCH /api/conversations/[id]` customerEmail | **done** |
| U65.3 | Customer info panel inline editor | **done** |
| U65.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] GET thread returns `details.email`
- [x] PATCH sets/clears validated email
- [x] Invalid email returns 400
- [x] Info panel shows email or `set email` link
- [x] Save/remove/cancel in inline form
- [x] `npm run smoke:api` passes (65 steps)

## API

```
PATCH /api/conversations/:id
Body: { "customerEmail": "visitor@example.com" | null | "" }
Response: { "conversation": { ... }, "details": { "email": ... } }
```

## Deferred

- Sync email to contacts table
- Email verification state on visitor
- Visitor data key/value persistence
