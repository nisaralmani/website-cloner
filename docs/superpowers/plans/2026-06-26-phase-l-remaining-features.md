# Phase L — Remaining feature marketing pages

> **For agentic workers:** Data-driven feature landings via `MarketingFeatureLandingPage`.

**Goal:** Replace the last 9 hero stubs with full sectioned landing pages.

---

## Queue

| Step | Page | Live URL | Status |
|------|------|----------|--------|
| L1 | `/en/crm` | `/en/crm/` | **done** |
| L2 | `/en/campaigns` | `/en/campaigns/` | **done** |
| L3 | `/en/analytics` | `/en/analytics/` | **done** |
| L4 | `/en/knowledge` | `/en/knowledge/` | **done** |
| L5 | `/en/artificial-intelligence` | `/en/ai/` | **done** |
| L6 | `/en/ticket-center` | `/en/ticket/` | **done** |
| L7 | `/en/status-page` | `/en/status/` | **done** |
| L8 | `/en/chat-sdk` | `/en/sdk/` | **done** |
| L9 | `/en/unleash` | `/en/unleash/` | **done** |

## Architecture

- Config: `src/lib/marketing-feature-landings.ts`
- Component: `src/components/marketing/MarketingFeatureLandingPage.tsx`
- Assets: `node scripts/localize-phase-l-assets.mjs`

## Remaining (Phase N)

- Live pixel diff with authenticated chat.bybelt.com session
- Bybelt Sans font extraction (optional polish)
