# Phase U6 — Campaigns

**Goal:** Campaigns nav + empty state backed by DB; template counts in nav from API.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U6.1 | `campaigns` + `campaign_templates` schema | **done** |
| U6.2 | Seed 0 campaigns + 2 Bybelt templates | **done** |
| U6.3 | `GET /api/campaigns?type=` | **done** |
| U6.4 | Wire CampaignsPanel empty state + search | **done** |
| U6.5 | Wire CampaignsNav template badges from API | **done** |
| U6.6 | Docs + verify | **done** |

## Compare checklist

- [x] `/campaigns/types/all` shows empty state from API
- [x] Nav template badges show **2** (All + Bybelt)
- [x] Type filter param wired (automated / one-shot)
- [x] `npm run check` passes

## API

```
GET /api/campaigns?type=all|automated|one-shot&q=search
Response: { campaigns: Campaign[], counts: { templatesAll, templatesBybelt, templatesYours } }
```
