# Phase U45 — Chatbox security settings

**Goal:** Persist the domain-lock toggle on `/settings/chatbox/security`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U45.1 | Workspace toggle via settings API | **done** |
| U45.2 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Domain lock toggle persists (`0-0`)
- [x] Privacy status rows remain static (live parity — not toggles)
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (45 steps)

## Storage

```
workspace_settings (
  chatbox/security::0-0  — Lock the chatbox to website domain (and subdomains)
)
```

## Deferred

- Runtime chatbox widget enforces domain lock
- Total Privacy™ and MagicType/MagicBrowse status from live privacy APIs
