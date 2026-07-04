# Phase U97 — Chatbox allow files toggle enforcement

**Goal:** The "Allow files to be sent from the chatbox" behavior toggle blocks visitor uploads and hides the widget paperclip when disabled.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U97.1 | Read `chatbox/behavior::2-0` preference helper | **done** |
| U97.2 | Reject visitor multipart uploads when disabled | **done** |
| U97.3 | Expose `allowFiles` on `/api/chatbox/config` + hide widget paperclip | **done** |
| U97.4 | Smoke + docs | **done** |

## Compare checklist

- [x] `isChatboxFilesAllowed()` reads workspace toggle (default ON)
- [x] `POST …/sessions/[id]/messages` returns 403 when files disabled
- [x] `/api/chatbox/config` returns `allowFiles` (+ `allowAudio` for future use)
- [x] Widget hides paperclip when `allowFiles` is false
- [x] Operator inbox attachments unaffected
- [x] `npm run smoke:api` passes (95 steps)

## Deferred

- Audio recording upload (`allowAudio` toggle)
- Per-workspace attachment size limits
