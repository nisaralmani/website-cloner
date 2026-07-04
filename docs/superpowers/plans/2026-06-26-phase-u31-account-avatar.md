# Phase U31 — Account avatar upload

**Goal:** Persist and upload operator avatar on account information settings.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U31.1 | `avatar_url` column on `users` | **done** |
| U31.2 | `POST/DELETE /api/auth/avatar` | **done** |
| U31.3 | `AccountAvatarField` + hook methods | **done** |
| U31.4 | Settings avatar section wiring | **done** |
| U31.5 | Session + account menu avatar | **done** |
| U31.6 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Upload JPEG/PNG/WebP (max 10 MB)
- [x] Clear existing removes file + DB url
- [x] Profile + session return `avatarUrl`
- [x] Sidebar footer shows uploaded image
- [x] Gradient fallback when no avatar
- [x] `npm run check` passes

## API

```
POST   /api/auth/avatar   multipart field: avatar
DELETE /api/auth/avatar
```

Files stored at `public/images/avatars/users/{userId}.{ext}`.

## Deferred

- Email verification flow
- Account security sessions table
- Image dimension validation (400×400)
