# Phase U22 — Workspace switcher

**Goal:** Multi-workspace users can switch active workspace from the sidebar header.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U22.1 | JWT `wid` claim for active workspace | **done** |
| U22.2 | `GET/POST /api/auth/workspace` + session workspaces list | **done** |
| U22.3 | Seed second workspace (`ws-demo-boutique`) | **done** |
| U22.4 | `WorkspaceSwitcher` in sidebar header | **done** |
| U22.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Seeded user belongs to FashionSis + Demo Boutique
- [x] Session returns `workspaces` array
- [x] Switch re-issues cookie and reloads inbox
- [x] Chevron menu only when 2+ workspaces
- [x] `npm run check` passes

## API

```
GET  /api/auth/session    → workspaces[]
POST /api/auth/workspace  { workspaceId }
```

## Deferred

- Per-workspace notification counts
