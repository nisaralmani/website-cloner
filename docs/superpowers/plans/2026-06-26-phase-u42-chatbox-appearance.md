# Phase U42 — Chatbox appearance settings

**Goal:** Persist chatbox appearance select fields and toggles on `/settings/chatbox/appearance`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U42.1 | Appearance field keys + validation | **done** |
| U42.2 | Workspace field pages registry + settings API | **done** |
| U42.3 | Settings select fields wired on page | **done** |
| U42.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Seven theme selects persist per workspace
- [x] Chatbox button toggles persist (existing workspace settings)
- [x] Select options on registry match validation
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (42 steps)

## Storage

```
workspace_settings (
  inbox/customize::emailPreview,
  chatbox/appearance::colorTheme,
  chatbox/appearance::layoutTheme,
  ...
  chatbox/appearance::{section}-{item} toggles
)
```

## Deferred

- Chatbox preview widget reads live appearance fields
- Advanced customization upgrade flow
- Custom color picker / image upload
