# Phase U74 — Simulate visitor message UI

**Goal:** Operators can simulate visitor messages from the customer info panel using the existing visitor-messages API.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U74.1 | `SimulateVisitorMessageField` in customer info panel | **done** |
| U74.2 | Wire `simulateVisitorMessage` + list refresh | **done** |
| U74.3 | `simulatingVisitor` loading state | **done** |
| U74.4 | Smoke stack unread + preview + docs | **done** |

## Compare checklist

- [x] Textarea + **Send as visitor** in info panel
- [x] Calls `POST …/visitor-messages` via hook
- [x] Thread appends message + list updates unread/preview
- [x] Sequential visitor messages stack unread count
- [x] Latest visitor text becomes list preview
- [x] `npm run smoke:api` passes (74 steps)

## UI

```
CustomerInfoPanel → Simulate visitor
  textarea + Send as visitor button
```

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Typing indicators and delivery receipts
- Attachments on visitor messages
- Note author avatar in thread
