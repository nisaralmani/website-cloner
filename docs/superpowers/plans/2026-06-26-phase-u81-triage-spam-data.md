# Phase U81 — Triage spam + Set Data Value coverage

**Goal:** Verify remaining triage actions on simulated visitor messages — **Send to Spam** tags the conversation and **Set Data Value** upserts visitor data from the message text.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U81.1 | Smoke: Send to Spam inserts message + `spam` segment | **done** |
| U81.2 | Smoke: Set Data Value upserts visitor data key | **done** |
| U81.3 | Docs + verify | **done** |

## Compare checklist

- [x] Send to Spam does not drop the message
- [x] Response includes `triage.block.action === "Send to Spam"`
- [x] Conversation gains `spam` segment
- [x] Set Data Value key derived from `matchContains` token
- [x] Visitor data value equals full message text
- [x] `npm run smoke:api` passes (81 steps)

## Deferred

- Bulk assignment from list selection
- Reminder tab wiring
- Public visitor chat widget / unauthenticated ingest
