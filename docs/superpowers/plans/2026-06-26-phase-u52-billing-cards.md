# Phase U52 — Billing cards

**Goal:** User-scoped payment method CRUD on `/settings/billing/cards`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U52.1 | `GET/POST /api/billing/cards` + `DELETE /api/billing/cards/[id]` | **done** |
| U52.2 | `useBillingCards` + `BillingCardsPanel` wiring | **done** |
| U52.3 | Plans `hasPaymentMethod` integration | **done** |
| U52.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Empty state: info lines + “Add new payment method” button
- [x] Yellow alert hidden when user has at least one card
- [x] Card rows show label, brand, last4, remove action
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (52 steps)

## Storage

```
payment_methods (
  id, user_id, label, last4, brand, created_at
)
```

## Deferred

- Stripe Elements / real card tokenization
- Default card selection per workspace (`workspace/billing`)
- Invoice linkage (`billing/invoices`)
