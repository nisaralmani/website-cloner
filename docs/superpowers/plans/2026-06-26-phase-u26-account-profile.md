# Phase U26 — Editable account profile

**Goal:** Persist operator first name, last name, email, and phone from Account information settings.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U26.1 | `first_name`, `last_name`, `phone` on `users` | **done** |
| U26.2 | `GET/PATCH /api/auth/profile` | **done** |
| U26.3 | `useAccountProfile` + editable settings fields | **done** |
| U26.4 | Session refresh after save (sidebar name/email) | **done** |
| U26.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Account information fields load from API
- [x] Blur/Enter saves each field (auto-save UX)
- [x] Display name updates in session after name change
- [x] Email uniqueness enforced
- [x] `npm run check` passes

## API

```
GET   /api/auth/profile
PATCH /api/auth/profile  { firstName?, lastName?, email?, phone? }
```

## Deferred

- Avatar upload on account information
- Change password from settings
- Email verification flow
