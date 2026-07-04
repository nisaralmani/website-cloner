# Phase U59 — Workspace data, limits & legal

**Goal:** Data, Limits & Legal on `/settings/workspace/data` backed by workspace settings and live usage counts.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U59.1 | `GET /api/workspaces/data` aggregate payload | **done** |
| U59.2 | Training, limits, contract endpoints | **done** |
| U59.3 | `useWorkspaceData` + SettingsDetail wiring | **done** |
| U59.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] MagicReply training disclaimer clears after training
- [x] Knowledge Base card copy reflects helpdesk state
- [x] Usage limits computed from workspace (operators count live)
- [x] Edit limit button persists via API
- [x] GDPR contract upload marks signed
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (59 steps)

## Storage

```
workspace_settings (
  workspace/data::magicReplyTrained
  workspace/data::magicReplyLastTrainedAt
  workspace/data::campaignRecipientsLimit
  workspace/data::operatorsLimit
  workspace/data::filesUploadLimit
  workspace/data::filesUploadedCount
  workspace/data::gdprDpaSigned
  workspace/data::gdprDpaSignedAt
)
```

## Deferred

- Real MagicReply training job + progress
- Knowledge Base setup navigation
- File upload metering
- PDF contract file upload storage
