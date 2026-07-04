# Phase U51 — Billing plans

**Goal:** Load workspace plan cards + monthly total from DB on `/settings/billing/plans`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U51.1 | `workspace_subscriptions` + `payment_methods` schema | **done** |
| U51.2 | `GET /api/billing/plans` | **done** |
| U51.3 | Seed + workspace create hook | **done** |
| U51.4 | `BillingPlansPanel` + `useBillingPlans` wiring | **done** |
| U51.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Plan cards list all member workspaces with free plan defaults
- [x] Monthly total banner reflects summed `monthly_cents`
- [x] Payment-method alert hidden when `hasPaymentMethod` (none seeded)
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (51 steps)

## Storage

```
workspace_subscriptions (
  workspace_id PK,
  plan_tag, plan_amount, plan_period,
  status, billing_owner, monthly_cents
)

payment_methods (
  id, user_id, label, last4, brand, created_at
)
```

## Deferred

- Plan upgrade / checkout flows
- Payment method CRUD (`billing/cards`)
- Invoice history (`billing/invoices`)
- Real Stripe billing integration
