# Phase T — App sub-route smoke

**Goal:** Smoke all campaigns, helpdesk, and analytics catch-all routes (36 sub-paths).

---

## Queue

| Step | Task | Status |
|------|------|--------|
| T1 | Parse nav hrefs from `*-routes.ts` in `smoke-registry.mjs` | **done** |
| T2 | Smoke all campaigns (8), helpdesk (6), analytics (22) routes | **done** |
| T3 | Panel markup assertions per app area | **done** |
| T4 | Docs + `npm run deploy:verify` | **done** |

## Smoke count

**98 routes** — matches **98 production static pages** (+ robots/sitemap are extra SEO assets)

| Area | Count |
|------|-------|
| Core app | 7 |
| Campaigns | 8 |
| Helpdesk | 6 |
| Analytics | 22 |
| Settings | 31 |
| Marketing | 19 |
| 404 test | 1 |
| SEO assets | 4 |
