# Visual QA Report — Bybelt



**Date:** 2026-06-26 (updated Phase M)  

**Viewport:** 1440×900 desktop (manual); smoke tests run against production `next start`  

**Automation:** `npm run smoke` — **98 routes** (full static surface + SEO + 404)



## Route smoke test — App (15)



| Route | Expected title | Status |

|-------|----------------|--------|

| `/` | Inbox \| Bybelt | PASS |

| `/agent` | AI Agent \| Bybelt | PASS |

| `/visitors` | Visitors \| Bybelt | PASS |

| `/contacts` | Contacts \| Bybelt | PASS |

| `/campaigns` | Campaigns \| Bybelt | PASS |

| `/helpdesk` | Knowledge Base \| Bybelt | PASS |

| `/analytics` | Analytics \| Bybelt | PASS |

| `/plugins` | Plugins \| Bybelt | PASS |

| `/initiate/login` | Bybelt | PASS |

| `/settings` | Settings \| Bybelt | PASS |

| `/settings/account/information` | (dynamic) | PASS |

| `/settings/workspace/operators` | (dynamic) | PASS |

| `/campaigns/types/all` | (dynamic) | PASS |

| `/helpdesk/articles` | (dynamic) | PASS |

| `/analytics/messaging/overview` | (dynamic) | PASS |



## Route smoke test — Marketing (19)



| Route | Content check | Status |

|-------|---------------|--------|

| `/en` | Homepage hero title | PASS |

| `/en/pricing` | Comparison table | PASS |

| `/en/ai-agent` | 4-step AI Agent | PASS |

| `/en/hugo` | Hugo teammate | PASS |

| `/en/livechat` | Chat widget | PASS |

| `/en/chatbot` | AI chatbot | PASS |

| `/en/shared-inbox` | Omnichannel inbox | PASS |

| `/en/crm` | CRM for SMBs | PASS |

| `/en/campaigns` | Customer journeys | PASS |

| `/en/analytics` | Support analytics | PASS |

| `/en/knowledge` | Knowledge base | PASS |

| `/en/artificial-intelligence` | AI copilot | PASS |

| `/en/ticket-center` | Ticketing | PASS |

| `/en/status-page` | Status page | PASS |

| `/en/chat-sdk` | Mobile/web SDK | PASS |

| `/en/integrations` | Integrations grid | PASS |

| `/en/apps` | Desktop/mobile apps | PASS |

| `/en/signup` | Trial signup form | PASS |

| `/en/unleash` | Product roadmap | PASS |



## Sitemap



| Check | Status |

|-------|--------|

| `/sitemap.xml` returns 200 | PASS |
| All 19 marketing paths listed | PASS |
| `/robots.txt` returns 200 | PASS |

## App sub-routes (Phase T)

| Check | Status |
|-------|--------|
| Campaigns nav (8 routes) | PASS |
| Helpdesk nav (6 routes) | PASS |
| Analytics nav (22 routes) | PASS |
| Panel markup assertions | PASS |

## Smoke depth (Phase S)

| Check | Status |
|-------|--------|
| All 31 `/settings/*` detail routes return 200 | PASS |
| Marketing `<title>` matches registry on all `/en/*` | PASS |
| `/seo/favicon.ico` returns image | PASS |

## Interactions (Phase R)

| Check | Status |
|-------|--------|
| Chat bubble opens mock panel | PASS |
| Video play opens modal (hero + sections) | PASS |
| `/seo/site.webmanifest` returns 200 | PASS |

## Mega-menus (Phase Q)

| Check | Status |
|-------|--------|
| Features panel: Bybelt + Hugo promos | PASS |
| Features panel: 2-column grid with icons + descriptions | PASS |
| Help panel: three link cards with descriptions | PASS |
| Desktop hover + click to open | PASS |

## 404 page (Phase P)

| Check | Status |
|-------|--------|
| Branded 404 with links to `/en` and `/` | PASS |



## Layout verification (1440px)



| Element | Spec | Measured (local) |

|---------|------|-------------------|

| Inbox sidebar | 200px | 200px |

| Conversation list | 326px | 326px |

| Customer panel | 268px | 268px |

| Section nav (campaigns, etc.) | 300px | 300px |

| Login feature panel | 460px | 460px @ x=980 |

| Login header | 80px | 80px |

| Marketing content max-width | ~1200px | 1200px |



## Cross-site links



| Link | Status |

|------|--------|

| Login logo → `/en` | PASS |

| Marketing Go to Dashboard → `/` | PASS |

| Marketing Log In → `/initiate/login` | PASS |

| Footer feature links → internal `/en/*` | PASS |



## SEO smoke



| Route | Check | Status |

|-------|-------|--------|

| `/en` | `og:image` + marketing title in HTML | PASS |

| `/initiate/login` | `<title>Bybelt</title>` | PASS |



## Live title QA (Phase N)

See `docs/research/LIVE_QA_N.md` — `npm run qa:live`

## Deploy readiness (Phase M)



| Item | Path |

|------|------|

| Deploy guide | `docs/DEPLOY.md` |

| Vercel cache headers | `vercel.json` |

| Site URL env | `NEXT_PUBLIC_SITE_URL` in `.env.example` |

| Production verify | `npm run smoke` after `npm run build` |



## Known acceptable gaps



| Gap | Notes |

|-----|-------|

| Bybelt Sans font (app) | Inter substitute in `layout.tsx` |
| Marketing fonts | Bybelt Aeonik Pro via `bybelt-fonts.css` on `/en/*` |

| Helpdesk/Analytics paywall | Matches FashionSis plan limits |

| Live pixel diff | Re-run when authenticated for pixel diff |

| Chat widget | Static bubble on `/en` only |

| Vercel deploy | Manual — see `docs/DEPLOY.md` |



## Sign-off



**98 production routes** build successfully. Automated smoke: **98 paths** (every static page + SEO assets + 404). CI runs lint, typecheck, build, and smoke.

