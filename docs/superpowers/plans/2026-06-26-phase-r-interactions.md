# Phase R — Interactive marketing polish

**Goal:** Close remaining marketing interaction gaps (chat widget + video modals) and extend SEO smoke.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| R1 | Interactive chat bubble panel (open/close, mock thread) | **done** |
| R2 | Video play modals (hero + `MarketingVideoPreview`) | **done** |
| R3 | Smoke: `/seo/site.webmanifest` | **done** |
| R4 | Docs + `npm run deploy:verify` | **done** |

## Smoke count

**44 routes** (21 app/settings + 19 marketing + 3 SEO + 404)

## Components

- `MarketingChatBubble.tsx` — toggle panel with welcome message
- `MarketingVideoModal.tsx` — shared fullscreen preview dialog
- `MarketingPlayVideoButton.tsx` — hero "Discover Bybelt" trigger
