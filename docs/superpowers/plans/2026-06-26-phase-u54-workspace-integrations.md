# Phase U54 — Workspace integrations

**Goal:** Load Website ID and integration catalog from API on `/settings/workspace/integrations`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U54.1 | Shared integration catalog lib | **done** |
| U54.2 | `GET /api/workspaces/integrations` | **done** |
| U54.3 | `useWorkspaceIntegrations` + SettingsDetail wiring | **done** |
| U54.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Website ID copy field shows active workspace UUID
- [x] Integration categories load from API (4 categories, 34 channels)
- [x] Chatbox setup row remains static UI
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (54 steps)

## API

```
GET /api/workspaces/integrations
→ { workspaceId, intro, footerButton, categories[] }
```

## Deferred

- Per-channel connection state / install flows
- Chatbox setup instructions deep link
- "See all integrations" marketplace route
