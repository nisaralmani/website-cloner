# Phase U95 — Settings embed install snippet

**Goal:** Workspace Setup & Integrations shows live Website ID + copy-paste install code from `/api/chatbox/embed`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U95.1 | Include `htmlSnippet` on `GET /api/workspaces/integrations` | **done** |
| U95.2 | Install code copy field on integrations settings | **done** |
| U95.3 | Multiline copy UI for snippet | **done** |
| U95.4 | Smoke + docs | **done** |

## Compare checklist

- [x] Website ID populated from active workspace
- [x] Install code matches authenticated embed API output
- [x] Copy button copies full snippet
- [x] `npm run smoke:api` passes (93 steps; extended integrations check)

## Deferred

- Operator outbound attachments
