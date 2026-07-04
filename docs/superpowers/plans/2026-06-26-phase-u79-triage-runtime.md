# Phase U79 — Triage runtime on visitor messages

**Goal:** Enabled triage rules run when a simulated visitor message arrives — block rules can drop/spam; sort rules assign segments, set visitor data, or resolve.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U79.1 | `evaluateBlockTriage` + `applySortTriage` helpers | **done** |
| U79.2 | Wire into `POST …/visitor-messages` | **done** |
| U79.3 | Response includes `triage` + `dropped` when blocked | **done** |
| U79.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Block rules evaluated before insert (first match wins)
- [x] Drop Message skips persist + returns `dropped: true`
- [x] Send to Spam tags `spam` segment after insert
- [x] Sort rules: Assign Segment, Set Data Value, Resolve Conversation
- [x] Match uses case-insensitive `matchContains`
- [x] Only enabled rules apply
- [x] `npm run smoke:api` passes (79 steps)

## Actions

| Action | Effect |
|--------|--------|
| Drop Message | No message row; `{ dropped: true }` |
| Send to Spam | Insert + segment `spam` |
| Assign Segment | Segment token from `matchContains` |
| Set Data Value | KV key from match token, value = message text |
| Resolve Conversation | `status: resolved` |

## Deferred

- Author-only note edit/delete
- Public visitor chat widget
- Bulk assignment from list selection
- Triage rule condition builder UI
