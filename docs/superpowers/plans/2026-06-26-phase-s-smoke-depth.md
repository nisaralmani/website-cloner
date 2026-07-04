# Phase S — Full settings smoke & title QA

**Goal:** Cover all 31 settings detail pages in smoke and assert marketing document titles.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| S1 | `smoke-registry.mjs` — parse settings slugs + marketing titles | **done** |
| S2 | Smoke all 31 `/settings/*` routes + favicon.ico | **done** |
| S3 | Marketing `<title>` assertions on all `/en/*` routes | **done** |
| S4 | Docs + `npm run deploy:verify` | **done** |

## Smoke count

**68 routes** (13 app + 31 settings + 1 settings overview + 19 marketing + 1 404 + 4 SEO)

## Shared module

- `scripts/smoke-registry.mjs` — parsers reused by smoke + future QA scripts
