# Phase U32 — Email verification

**Goal:** Wire the account information “email not verified” alert to a working verification flow.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U32.1 | `email_verified` + `email_verification_tokens` | **done** |
| U32.2 | Request + confirm verification APIs | **done** |
| U32.3 | `/initiate/verify-email` page | **done** |
| U32.4 | Settings alert + nav badge from session | **done** |
| U32.5 | Email change resets verified; Google OAuth verifies | **done** |
| U32.6 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Unverified users see yellow alert on account information
- [x] “Send an email now?” requests verification link
- [x] Dev exposes `verifyUrl` in API response (console log)
- [x] Token link verifies email
- [x] Alert + nav badge hidden when verified
- [x] Changing email sets `emailVerified` false
- [x] `npm run check` passes

## API

```
POST /api/auth/verify-email/request     # authenticated — send link
GET  /api/auth/verify-email?token=...   # check token valid
POST /api/auth/verify-email             { token } — confirm
```

Dev: `EMAIL_VERIFICATION_DEBUG=0` disables exposing `verifyUrl` in production-like runs.

## Deferred

- Real SMTP delivery
- Account security sessions table
- Notification preferences persistence
