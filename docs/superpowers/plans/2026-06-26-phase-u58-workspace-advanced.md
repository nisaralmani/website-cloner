# Phase U58 — Workspace advanced configuration

**Goal:** Advanced configuration on `/settings/workspace/advanced` — default language, API tokens, webhooks, identity verification.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U58.1 | `workspace_api_tokens` + `workspace_webhooks` schema | **done** |
| U58.2 | API token + webhook CRUD APIs | **done** |
| U58.3 | Default language field via settings API | **done** |
| U58.4 | `useWorkspaceAdvanced` + panels + section badges/buttons | **done** |
| U58.5 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Workspace default language select persists
- [x] Create Token header button + token list/empty state
- [x] Add a Web Hook header button + webhook list/empty state
- [x] Dynamic webhook count badge
- [x] Identity verification toggle + dynamic disabled/enabled badge
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (58 steps)

## Storage

```
workspace_settings (
  workspace/advanced::defaultLanguage
  workspace/advanced::3-0              — identity verification toggle
)

workspace_api_tokens (id, workspace_id, label, token_preview, created_at)
workspace_webhooks (id, workspace_id, url, enabled, created_at)
```

## Deferred

- MCP server token variants
- Webhook event type selection + delivery
- Runtime identity verification enforcement
- API reference link behavior (stays external static link)
