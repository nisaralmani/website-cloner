# Phase U30 — Change password

**Goal:** Wire the account information "Change password" button to an authenticated password change flow.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U30.1 | `changePasswordForUser` helper + validation | **done** |
| U30.2 | `POST /api/auth/change-password` | **done** |
| U30.3 | `ChangePasswordModal` component | **done** |
| U30.4 | Settings account information button wiring | **done** |
| U30.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Modal opens from Security → Password row
- [x] Current password verified server-side
- [x] New password min length enforced
- [x] Confirm password match on client
- [x] Wrong current password returns 401
- [x] Smoke changes password, verifies login, restores seed password
- [x] `npm run check` passes

## API

```
POST /api/auth/change-password  { currentPassword, newPassword }
```

## Deferred

- Avatar upload on account information
- Email verification flow
- Account security sessions table (authorized apps / login history)
