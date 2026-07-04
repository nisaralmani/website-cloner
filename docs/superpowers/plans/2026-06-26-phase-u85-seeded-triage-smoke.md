# Phase U85 — Seeded triage rules smoke

**Goal:** Verify db-seeded triage rules (`noreply` → Send to Spam, `vip` → Assign Segment) fire at runtime without creating temporary rules.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U85.1 | Assert seeded rules present and enabled | **done** |
| U85.2 | Visitor message with `noreply` → spam segment | **done** |
| U85.3 | Visitor message with `vip` → `vip` segment | **done** |
| U85.4 | Docs + verify | **done** |

## Compare checklist

- [x] GET `/api/triage-rules` includes seeded block + sort rules
- [x] `noreply` in message triggers `Send to Spam` + `spam` segment
- [x] `vip` in message triggers `segment:vip`
- [x] Uses conversation `c2` (isolated from main smoke thread)
- [x] `npm run smoke:api` passes (85 steps)

## Seed reference

| matchContains | Action | Segment |
|---------------|--------|---------|
| `noreply` | Send to Spam | `spam` |
| `vip` | Assign Segment | `vip` |

## Deferred

- Public visitor chat widget / unauthenticated ingest
- Snoozed filter UI toggle
- Auto-unsnooze notification job
