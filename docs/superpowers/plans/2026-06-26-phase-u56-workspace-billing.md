# Phase U56 — Workspace billing

**Goal:** Per-workspace payment method selection on `/settings/workspace/billing`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U56.1 | `GET/PATCH /api/workspaces/billing` | **done** |
| U56.2 | `useWorkspaceBilling` + `WorkspaceBillingPanel` wiring | **done** |
| U56.3 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Empty state: add payment method button + Go to Cards link
- [x] Selected card shown when workspace has `paymentMethodId`
- [x] Cards scoped to current user; selection scoped to workspace
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (56 steps)

## Storage

```
workspace_settings (
  workspace/billing::paymentMethodId  — selected card id or empty
)
```

## Deferred

- Runtime subscription charging against selected card
- Owner-only selection rules
- Clear selection when card deleted globally
