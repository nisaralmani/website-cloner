# Phase U60 — Workspace danger zone

**Goal:** Danger Zone™ on `/settings/workspace/danger` — leave and delete workspace with session recovery.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U60.1 | `GET /api/workspaces/danger` eligibility | **done** |
| U60.2 | `POST /api/workspaces/leave` + `DELETE /api/workspaces` | **done** |
| U60.3 | Cascade workspace delete + session switch | **done** |
| U60.4 | `useWorkspaceDanger` + danger zone wiring | **done** |
| U60.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Leave workspace removes membership and switches session
- [x] Sole owner cannot leave current workspace
- [x] Delete workspace owner-only with alternate workspace required
- [x] Blocked reasons shown under action copy
- [x] Buttons disabled when action unavailable
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (60 steps)

## Rules

- **Leave:** requires another workspace; sole owners blocked
- **Delete:** owners only; requires another workspace to switch into

## Deferred

- Ownership transfer before leave
- Typed workspace name confirmation modal
- Soft-delete / recovery window
