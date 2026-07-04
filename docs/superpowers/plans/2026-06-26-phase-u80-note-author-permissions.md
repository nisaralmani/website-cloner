# Phase U80 — Author-only note edit/delete

**Goal:** Only the operator who wrote an internal note can edit or delete it — enforced in API and reflected in inbox UI.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U80.1 | `not_author` guard in note delete/update helpers | **done** |
| U80.2 | `403` responses on PATCH/DELETE routes | **done** |
| U80.3 | Hide edit/delete controls for non-authors in thread | **done** |
| U80.4 | Seed secondary operator + smoke + docs | **done** |

## Compare checklist

- [x] PATCH/DELETE require `author_user_id === session.user.id`
- [x] Notes without author cannot be edited or deleted
- [x] Non-authors receive `403`
- [x] Author retains edit/delete access
- [x] UI shows actions only for own notes
- [x] `npm run smoke:api` passes (80 steps)

## Seed

- Secondary operator: `team@fashionpara.com` (same password as primary)

## Deferred

- Public visitor chat widget
- Bulk assignment from list selection
- Triage spam/data smoke coverage
- Reminder tab wiring
