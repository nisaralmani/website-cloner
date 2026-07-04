# Live QA — Phase N (2026-06-26)

**Compared:** `marketing-pages.ts` document titles vs live `bybelt.com/en/*`  
**Automation:** `node scripts/live-qa-marketing.mjs`

## Title parity (18 sub-pages)

| Route | Live status | Title match | Notes |
|-------|-------------|-------------|-------|
| `/en/pricing` | 200 | PASS | |
| `/en/ai-agent` | 404 | SKIP | Clone-only route (content on homepage live) |
| `/en/apps` | 200 | PASS | |
| `/en/integrations` | 200 | PASS | |
| `/en/hugo` | 404 | SKIP | Clone-only landing |
| `/en/signup` | 404 | SKIP | Clone routes to `/initiate/login` |
| `/en/unleash` | 200 | PASS | |
| `/en/livechat` | 200 | PASS | |
| `/en/chatbot` | 200 | PASS | |
| `/en/crm` | 200 | PASS | |
| `/en/shared-inbox` | 200 | PASS | |
| `/en/artificial-intelligence` | 200 | PASS | Live URL `/en/ai/` |
| `/en/campaigns` | 200 | PASS | |
| `/en/analytics` | 200 | PASS | |
| `/en/knowledge` | 200 | PASS | |
| `/en/ticket-center` | 200 | PASS | Live URL `/en/ticket/` |
| `/en/status-page` | 200 | PASS | Live URL `/en/status/` |
| `/en/chat-sdk` | 200 | PASS | Live URL `/en/sdk/` |

**Score:** 15/18 match live titles; 3 are intentional clone-only routes.

## Homepage

| Check | Live | Local registry | Status |
|-------|------|----------------|--------|
| `/en` title | The AI Customer Support Platform for Every Business - Bybelt | `marketingMetadata()` | PASS |

## Typography (N1–N2)

| Surface | Before | After |
|---------|--------|-------|
| Marketing `/en/*` | Inter (Google) | **Bybelt Aeonik Pro** (localized woff2) |
| App inbox | Inter | Inter (unchanged — Bybelt Sans not public) |

Fonts: `public/fonts/bybelt/*.woff2` — refresh with `node scripts/localize-crisp-fonts.mjs`

## Smoke regression

`npm run smoke` — 35/35 routes after font wiring.

## Acceptable gaps (unchanged)

| Gap | Notes |
|-----|-------|
| App Bybelt Sans | Proprietary; Inter substitute in `layout.tsx` |
| Live mega-menus | Rich panels with icons + descriptions (Phase Q) |
| Google login / live widget | Mock / static bubble |
| Authenticated inbox pixel diff | Requires production login session |
