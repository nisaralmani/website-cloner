# Phase U46 — Chatbox restrictions settings

**Goal:** Persist vacation toggle and restriction rules on `/settings/chatbox/restrictions`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U46.1 | `chatbox_restrictions` table + validation | **done** |
| U46.2 | `GET/POST /api/chatbox/restrictions` + delete/clear routes | **done** |
| U46.3 | Settings page add buttons + blocked pages table wired | **done** |
| U46.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Vacation toggle persists (`0-0`)
- [x] Add buttons create allowed/blocked pages, countries, locales, IPs
- [x] Blocked pages table lists rows with delete
- [x] Clear blocked visitors removes `blocked_visitor` rules
- [x] Per-workspace isolation on switch
- [x] Seed cart + checkout blocked pages
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (46 steps)

## Storage

```
workspace_settings (
  chatbox/restrictions::0-0  — Place support in vacation
)

chatbox_restrictions (
  id, workspace_id, kind, value, sort_order, created_at
)

kinds: allowed_page | blocked_page | blocked_country | blocked_locale | blocked_ip | blocked_visitor
```

## Deferred

- Runtime chatbox widget enforces restrictions
- Modal forms for custom URLs/countries on add
- Lists for allowed pages, countries, locales, IPs in UI
