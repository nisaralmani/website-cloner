# Phase U57 — Workspace transparency log

**Goal:** Team Transparency Log on `/settings/workspace/transparency` backed by workspace audit logs.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U57.1 | `workspace_audit_logs` table + seed | **done** |
| U57.2 | `GET /api/workspaces/transparency` with filters | **done** |
| U57.3 | `useWorkspaceTransparency` + audit filters/table wiring | **done** |
| U57.4 | Collect-logs toggle via settings API | **done** |
| U57.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Collect transparency logs toggle persists
- [x] Audit log table from DB (action, operator, time, IP)
- [x] Operator + action filter dropdowns
- [x] Date range stays disabled (live parity)
- [x] Plugin install banner stays static
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (57 steps)

## Storage

```
workspace_audit_logs (
  id, workspace_id, user_id, action, badge, ip_address, country, created_at
)

workspace_settings (
  workspace/transparency::0-0  — collect logs toggle
)
```

## Deferred

- Team Transparency Log plugin install flow
- Date range picker
- Runtime log collection enforcement when toggle is off
- Automatic audit log writes on login/settings changes
