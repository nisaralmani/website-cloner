# Behaviors — bybelt.com/en/

## Global
- **No smooth-scroll library** (no Lenis / Locomotive). Native scrolling.
- **No scroll-snap.** Plain document flow.
- **Header is `position: static`** — it does NOT stick or shrink on scroll. Scrolls away normally. (Verified: position=static, top=auto, boxShadow=none after scroll.)
- **Minimal scroll-reveal animation** (`revealElCount` ≈ 1; feature sections render at `opacity:1, transform:none`). Treat content as static-on-load; do not build elaborate IntersectionObserver fade-ups. A light fade/translate on the hero mockup is acceptable but optional.
- Lazy-loaded images below the fold (so instant `scrollTo` can briefly show blank — not an animation, just lazy `loading`).

## Header / Nav
- Top **hugo banner**: dark navy bar — `NEW` pill + "Discover ◆ hugo – the brand new AI-powered support agent →". Full-width, dark `#030D26`-ish.
- Nav row: Bybelt logo (left) + menu (Features ▾, AI Agent, Apps, Pricing, Integrations, Help ▾) + "Go to Dashboard" blue button (right).
- Menu items with ▾ open **mega-menu panels** on desktop (hover or click): Features shows Bybelt/Hugo promos + 2-column feature grid with icons and descriptions; Help shows three link cards with descriptions.

## Hover states
- Primary CTA buttons (blue `#1972F5`): darken slightly on hover (note exact value during per-section extraction).
- Nav links: color shift to primary on hover.
- Cards: subtle shadow/lift on hover (extract per section).

## Interactive sections
- Feature pills under H1 (All-in-one / AI Agents / Flat pricing): appear static (decorative cards), not tabs.
- **Chat bubble** (bottom-right on `/en/*`): click toggles a mock chat panel with welcome message; Escape or minimize closes it. No live Bybelt WebSocket.
- **Video previews**: play buttons open a fullscreen modal with poster image (static preview, no embedded stream).
- No confirmed click-driven tab switchers found at top level; verify per-section in Phase 3 before building (scroll first, then click).

## Responsive (to verify in sweep)
- Desktop 1440: centered column ~1200px max.
- Mobile 390: nav collapses to hamburger; multi-column grids stack to single column.
