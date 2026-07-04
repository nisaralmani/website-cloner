# Phase U96 — Operator outbound attachments

**Goal:** Operators can send file attachments from the inbox composer; visitors see them in the widget.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U96.1 | Multipart POST on operator messages API | **done** |
| U96.2 | Inbox paperclip upload + bubble preview | **done** |
| U96.3 | Widget shows operator attachments | **done** |
| U96.4 | Smoke + docs | **done** |

## Compare checklist

- [x] `POST /api/conversations/[id]/messages` accepts multipart `file`
- [x] Reuses chatbox file storage + `/api/chatbox/files/…`
- [x] Inbox + widget render attachment metadata
- [x] `npm run smoke:api` passes (94 steps)

## Deferred

- Attachment size limits per workspace settings
