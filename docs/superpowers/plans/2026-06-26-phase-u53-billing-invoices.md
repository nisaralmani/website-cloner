# Phase U53 — Billing invoices

**Goal:** User-scoped invoice list from DB on `/settings/billing/invoices`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U53.1 | `billing_invoices` schema | **done** |
| U53.2 | `GET/POST /api/billing/invoices` + `DELETE /api/billing/invoices/[id]` | **done** |
| U53.3 | `useBillingInvoices` + `BillingInvoicesPanel` wiring | **done** |
| U53.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Intro info lines remain static in registry
- [x] Empty state copy matches live spec when no invoices
- [x] Invoice table when records exist (date, number, amount, status)
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (53 steps)

## Storage

```
billing_invoices (
  id, user_id, invoice_number, amount_cents, currency,
  status, issued_at, payment_method_id
)
```

## Deferred

- PDF download endpoint
- Payment method filter tabs on invoices page
- Workspace-scoped invoice emails (`workspace/billing`)
- Real Stripe invoice sync
