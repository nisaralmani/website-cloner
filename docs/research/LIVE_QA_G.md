# Live QA — Phase G (2026-06-26)

**Viewport:** 1440×900 desktop  
**Compared:** local (`localhost:3001`) vs production

## `/en` vs bybelt.com/en/

| Check | Live | Local | Status |
|-------|------|-------|--------|
| Document title | The AI Customer Support Platform for Every Business - Bybelt | Match | PASS |
| Hero H1 | Augment your customer experience… | Match | PASS |
| Hugo banner copy | NEW Discover - the brand new AI-powered support agent | Fixed in G5 | PASS |
| Header Hugo link | Present next to logo | Added in G5 | PASS |
| OG image | `__og-image__/static/en/og.png` | `/seo/og-en.png` (localized) | PASS |
| Mega-menus | Full panels | Simplified dropdowns | Acceptable gap |
| Google / live chat widget | Live Bybelt widget | Static bubble | Acceptable gap |

## `/initiate/login` vs chat.bybelt.com/initiate/login

| Check | Live | Local | Status |
|-------|------|-------|--------|
| Document title | Bybelt | Bybelt (was Login \| Bybelt) | PASS |
| Form fields | Email, password, remember | Match | PASS |
| Feature carousel | Rotating panels | 8s rotation | PASS |
| Google sign-in | Present | Not cloned | Acceptable gap |
| Logo → marketing | bybelt.com | `/en` | PASS |

## SEO metadata (G1)

- `src/lib/seo-metadata.ts` — shared `bybeltIcons`, `marketingMetadata()`, `loginMetadata()`, `appPageMetadata()`
- Wired: root `layout.tsx`, `en/layout.tsx`, `initiate/login/page.tsx`

## Assets (G2)

- `public/seo/og-en.png`, `favicon-512x512.png` localized
- Re-download: `node scripts/localize-seo-assets.mjs`
