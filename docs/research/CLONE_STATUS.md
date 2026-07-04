# Clone Status — Bybelt (FashionSis workspace)

**Target:** [chat.bybelt.com](https://chat.bybelt.com) + [bybelt.com/en/](https://bybelt.com/en/)  
**Last updated:** 2026-06-26 · Phase T app sub-routes

## Summary

| Surface | Routes | Status |
|---------|--------|--------|
| App (inbox + settings) | 77 static | **Complete** |
| Marketing homepage | `/en` | **Complete** |
| Marketing sub-pages | 18 routes | **Complete** (full landing pages, no hero stubs) |
| Assets | Local `/public` | **Complete** (no CDN deps in `src/`) |

## App routes (`chat.bybelt.com`)

| Area | Count | Notes |
|------|-------|-------|
| Inbox shell | 1 | Conversation deep links via `?conversation=` |
| App pages | 9 | Agent, Visitors, Contacts, Campaigns, Helpdesk, Analytics, Plugins, Login |
| Settings overview | 1 | Bento cards |
| Settings detail | 31 | SSG via `generateStaticParams` |
| Sub-routes | 33 | Campaigns, Helpdesk, Analytics catch-alls |

## Marketing (`bybelt.com/en/`)

| Section | Status |
|---------|--------|
| Hugo banner + nav (mobile + dropdowns + Hugo link) | Done |
| Hero + customers strip | Done |
| Platform, Agentic, Features, Use cases, Testimonials | Done |
| Hugo portal + footer + chat bubble | Done |
| Sub-pages | `/en/pricing`, nav items, 11 feature dropdown pages, `unleash`, `signup` |

## Marketing sub-routes (`/en/*`)

| Route | Content |
|-------|---------|
| `/en/pricing` | 4-plan grid + feature comparison table + Enterprise + FAQ + testimonials |
| `/en/ai-agent` | Full page: hero, 4-step workflow, testimonials, Hugo portal |
| `/en/hugo` | Full page: dark hero, benefits, agentic steps, channels, use cases, CTA |
| `/en/livechat` | Full page: hero, benefits, customize, engage, qualities |
| `/en/shared-inbox` | Full page: hero, showcase tabs, channels, collaborate, routing & AI |
| `/en/chatbot` | Full page: hero, showcase tabs, engage, train sources, builder scenarios |
| `/en/integrations` | Hero + popular integrations grid |
| `/en/apps` | Platform download cards + feature highlights |
| `/en/signup` | Trial signup form → `/initiate/login` |
| `/en/crm`, `/en/campaigns`, `/en/analytics`, `/en/knowledge` | Feature landing: hero, tabbed showcase, highlights |
| `/en/artificial-intelligence`, `/en/ticket-center`, `/en/status-page`, `/en/chat-sdk` | Feature landing (live content from `/en/ai`, `/ticket`, `/status`, `/sdk`) |
| `/en/unleash` | Roadmap hero + highlights + link to unleash.bybelt.com |
| Footer links | Wired to internal routes + bybelt.com externals |

## Deploy (Phase M)

| Item | Path / command |
|------|----------------|
| Project guide | `docs/CLONE_README.md` |
| Deploy guide | `docs/DEPLOY.md` |
| Sitemap | `/sitemap.xml` — all 19 marketing paths |
| Site URL env | `NEXT_PUBLIC_SITE_URL` in `.env.example` |
| Vercel cache headers | `vercel.json` |
| Pre-deploy verify | `npm run check && npm run smoke` |
| Deploy | `npx vercel --prod` (set env in Vercel dashboard) |

## Cross-site navigation

| From | To | Link |
|------|-----|------|
| `/en` header | App inbox | Go to Dashboard → `/` |
| `/en` header | Login | Log In → `/initiate/login` |
| `/initiate/login` logo | Marketing | `/en` |
| Login submit (mock) | Inbox | `/` |

## Verification

```bash
npm run check   # lint + typecheck + build
npm run deploy:verify   # check + smoke (pre-deploy gate)
npm run smoke   # production server — 98 routes (full app + marketing coverage)
SMOKE_BASE_URL=https://your-host node scripts/smoke-routes.mjs  # remote deploy verify
node scripts/localize-crisp-fonts.mjs   # marketing Aeonik Pro fonts
npm run qa:live   # compare document titles vs bybelt.com
```

## SEO (Phase G)

| Asset / meta | Status |
|--------------|--------|
| `marketingMetadata()` on `/en` | Done |
| `loginMetadata()` title = Bybelt | Done |
| `appPageMetadata()` on app routes | Done |
| `/public/seo/og-en.png` | Localized |
| `robots.txt` | Via `src/app/robots.ts` |
| Live QA notes | `LIVE_QA_G.md`, `LIVE_QA_N.md` |
| Final sign-off | `docs/research/SIGNOFF.md` |

## Known acceptable gaps

| Gap | Notes |
|-----|-------|
| Bybelt Sans font (app) | Inter substitute — proprietary on chat.bybelt.com |
| Marketing typography | **Bybelt Aeonik Pro** localized on `/en/*` |
| Live WebSocket / auth | Mock data only |
| Marketing mega-menus | Rich Features + Help panels (icons, descriptions, Bybelt/Hugo promos) |
| Chat widget bubble | Interactive mock panel (open/close, no live WebSocket) |
| Live pixel diff | Requires authenticated session on production |

## Phase history

| Phase | Scope |
|-------|-------|
| Settings | 31/31 detail pages |
| App | 10/10 sidebar routes |
| B | Integration, search, assets, sub-routes |
| C | Behaviors, deep links, login carousel |
| D | Marketing homepage structure |
| E | Marketing polish (mobile nav, Hugo portal) |
| F | Sign-off, smoke tests, cross-links |
| G | Production SEO, OG assets, live QA `/en` + login |
| H | Marketing sub-routes, Google login mock, webmanifest |
| I | Feature dropdown pages, pricing FAQ, sitemap, Vercel deploy |
| J | Hugo + pricing comparison + footer links; ai-agent + livechat depth |
| K | shared-inbox, chatbot, integrations, apps, signup full pages |
| L | Remaining 9 feature pages via `MarketingFeatureLandingPage` |
| M | Full smoke test (35 routes), VISUAL_QA, `docs/DEPLOY.md` |
| N | Aeonik Pro fonts on marketing; live title QA (`LIVE_QA_N.md`) |
| O | CI smoke, `robots.txt`, `SIGNOFF.md`, remote smoke support |
| P | `deploy-verify`, branded 404, `CLONE_README.md` (deploy needs `vercel login`) |
| Q | Mega-menu panels, smoke depth (43 routes incl. settings + 404) |
| R | Chat bubble panel, video modals, webmanifest smoke (44 routes) |
| S | Full settings smoke (31/31), marketing `<title>` QA, favicon (68 routes) |
| T | Campaigns + helpdesk + analytics sub-routes (98 routes = all static pages) |
