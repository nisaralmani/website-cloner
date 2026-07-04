# Phase U13 — Google OAuth

**Goal:** Sign in with Google on the login page, linked to existing workspace users by email.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U13.1 | `oauth_accounts` table + link-by-email | **done** |
| U13.2 | `GET /api/auth/google` + callback | **done** |
| U13.3 | `GET /api/auth/providers` + login UI | **done** |
| U13.4 | Docs + verify | **done** |

## Compare checklist

- [x] Google button enabled when env vars are set
- [x] OAuth state cookie CSRF protection
- [x] Existing seed user links by matching Google email
- [x] Unknown Google emails show friendly error
- [x] `npm run check` passes

## Env

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Register the redirect URI in [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/providers` | `{ google: boolean }` |
| GET | `/api/auth/google?next=/` | Start OAuth redirect |
| GET | `/api/auth/google/callback` | Complete OAuth + session cookie |

## Notes

- Only links to existing users (by Google `sub` or email). No auto-provisioning.
- Forgot password and Postgres prod remain U14+.
