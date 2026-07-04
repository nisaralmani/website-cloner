# Phase U28 — Workspace information

**Goal:** Persist workspace name, domain, contact fields, and logo from Workspace information settings.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U28.1 | Workspace contact columns on `workspaces` | **done** |
| U28.2 | `GET/PATCH /api/workspaces/profile` | **done** |
| U28.3 | `POST/DELETE /api/workspaces/logo` | **done** |
| U28.4 | Editable settings fields + logo upload UI | **done** |
| U28.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Workspace information fields load from API
- [x] Blur/Enter saves each field
- [x] Logo upload (JPEG/PNG/WebP, max 5 MB)
- [x] Logo remove restores initials fallback
- [x] Session refresh updates sidebar workspace name/logo
- [x] `npm run check` passes

## API

```
GET    /api/workspaces/profile
PATCH  /api/workspaces/profile  { name?, domain?, contactEmail?, ... }
POST   /api/workspaces/logo     multipart form: logo
DELETE /api/workspaces/logo
```

## Deferred

- Logo upload on workspace create
- Availability schedule editor
