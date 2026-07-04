# Phase U70 — Auto-assign on operator reply

**Goal:** When **Assign operator who responded upon response** is enabled, the first operator reply assigns the conversation to that operator.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U70.1 | Read `inbox/routing::0-0` workspace setting | **done** |
| U70.2 | `autoAssignOperatorOnReply` on operator POST | **done** |
| U70.3 | Skip when assignee already set or setting off | **done** |
| U70.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Respects inbox routing toggle `0-0`
- [x] Assigns responding operator when conversation is unassigned
- [x] Does not overwrite existing assignee
- [x] Does not assign when toggle is off
- [x] List/detail reflect assignee after operator send + SSE refresh
- [x] `npm run smoke:api` passes (70 steps)

## Setting

```
Page: inbox/routing
Toggle key: 0-0
Label: Assign operator who responded upon response
Storage: workspace_settings → inbox/routing::0-0
```

## Deferred

- Assignee picker UI in thread header
- Re-run routing rules after reply
- Auto-assign from notes or visitor messages
- List card assignee avatar
