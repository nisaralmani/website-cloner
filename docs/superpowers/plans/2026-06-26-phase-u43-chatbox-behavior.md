# Phase U43 — Chatbox behavior settings

**Goal:** Persist chatbox behavior select fields and toggles on `/settings/chatbox/behavior`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U43.1 | Behavior field keys + validation | **done** |
| U43.2 | Workspace field pages registry + settings API | **done** |
| U43.3 | Settings select fields wired on page | **done** |
| U43.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Default section + KB navigation selects persist
- [x] Eight behavior sections toggles persist (existing workspace settings)
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (43 steps)

## Storage

```
workspace_settings (
  chatbox/behavior::defaultSection,
  chatbox/behavior::knowledgeBaseNavigation,
  chatbox/behavior::{section}-{item} toggles
)
```

## Deferred

- Runtime chatbox widget reads behavior preferences
- Knowledge Base-only mode enforcement
- Hide chatbox rules tied to operator presence
