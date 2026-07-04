# Phase U55 — Workspace operators

**Goal:** Workspace-scoped operators list + invite/remove on `/settings/workspace/operators`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U55.1 | `GET/POST /api/workspaces/operators` + `DELETE .../[userId]` | **done** |
| U55.2 | `useWorkspaceOperators` + `WorkspaceOperatorsPanel` wiring | **done** |
| U55.3 | Live support banner from operator presence | **done** |
| U55.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Operators loaded from `workspace_members` join `users`
- [x] Owner row shows role badge, online dot, (you) marker
- [x] Options toggles persist via settings API
- [x] Support banner reflects `supportOnline`
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (55 steps)

## Storage

```
workspace_members (user_id, workspace_id, role)
workspace_settings (workspace/operators::0-0, 0-1 toggles)
```

## Deferred

- Operator edit / role changes
- Sort + empty last active toolbar actions
- Email invite to non-existing accounts
- 2FA enforcement runtime
