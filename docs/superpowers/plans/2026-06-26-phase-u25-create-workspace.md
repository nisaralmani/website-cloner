# Phase U25 — Create workspace flow

**Goal:** Let operators create a new workspace from the sidebar and switch into it.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U25.1 | `POST /api/workspaces` create API | **done** |
| U25.2 | `createWorkspaceForUser` helper | **done** |
| U25.3 | Workspace menu always opens (chevron) | **done** |
| U25.4 | Inline create form in switcher | **done** |
| U25.5 | API smoke + docs + verify | **done** |

## Compare checklist

- [x] Create workspace with name + domain
- [x] User becomes owner, session switches to new workspace
- [x] Workspace appears in switcher list
- [x] Empty inbox for new workspace
- [x] `npm run check` passes

## API

```
POST /api/workspaces  { name, domain }
```

## Deferred

- Workspace logo upload on create
- Invite operators during create
