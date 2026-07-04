# Phase U94 — Visitor message attachments

**Goal:** Visitors can send image/file attachments from the chatbox widget; operators see them in the inbox.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U94.1 | Attachment columns on messages + storage helper | **done** |
| U94.2 | Multipart POST on chatbox messages | **done** |
| U94.3 | Widget upload UI + inbox preview | **done** |
| U94.4 | Smoke + docs | **done** |

## Compare checklist

- [x] `POST …/sessions/[id]/messages` accepts multipart `file`
- [x] Attachment stored under `/api/chatbox/files/` (disk-backed)
- [x] Operator inbox + widget poll/SSE show attachment metadata
- [x] Image attachments render inline
- [x] `npm run smoke:api` passes (93 steps)

## Deferred

- Operator outbound attachments
- Settings UI copy button for install snippet
