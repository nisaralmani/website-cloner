# Phase U14 — Forgot password

**Goal:** Request reset by email and set a new password via secure token link.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U14.1 | `password_reset_tokens` table | **done** |
| U14.2 | `POST /api/auth/forgot-password` | **done** |
| U14.3 | `GET/POST /api/auth/reset-password` | **done** |
| U14.4 | `/initiate/forgot` + `/initiate/reset` pages | **done** |
| U14.5 | Docs + verify | **done** |

## Compare checklist

- [x] Login "Forgot Password?" links to `/initiate/forgot`
- [x] Generic success message (no email enumeration)
- [x] Dev mode exposes reset URL for testing
- [x] Token expires after 1 hour, single use
- [x] `npm run check` passes

## API

```
POST /api/auth/forgot-password  { email }
GET  /api/auth/reset-password?token=
POST /api/auth/reset-password   { token, password }
```

## Dev test

1. Go to `/initiate/forgot`
2. Enter `contact@fashionpara.com`
3. Copy dev reset link from response banner
4. Set new password → login with new password

## Notes

- No SMTP in this phase; production would send email via transactional provider.
- Postgres prod migration remains U15+.
