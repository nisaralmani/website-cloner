# Phase U91 — Chatbox embed script

**Goal:** Third-party sites can embed the visitor chatbox via a copy-paste `<script>` snippet and floating iframe loader.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U91.1 | `GET /api/chatbox/embed` snippet API | **done** |
| U91.2 | Public `/embed.js` loader (iframe bubble) | **done** |
| U91.3 | `/widget?embed=1` iframe-friendly layout | **done** |
| U91.4 | Smoke + docs | **done** |

## Compare checklist

- [x] Public embed snippet by `domain` or `workspaceId`
- [x] Authenticated embed snippet for active workspace
- [x] Loader injects iframe to `/widget?embed=1`
- [x] Toggle bubble open/close
- [x] `npm run smoke:api` passes (90 steps)

## Deferred

- Typing indicators and delivery receipts
- Attachments on visitor messages
- Settings UI copy button for install snippet
