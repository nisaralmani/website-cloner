# Page Topology — bybelt.com/en/ (marketing site)

> **Note:** The authenticated app topology lives in `docs/research/chat.bybelt.com/PAGE_TOPOLOGY.md`.

Target: https://bybelt.com/en/  ·  Page size: 1897 × 11460 (desktop 1440 viewport)
Captured: reconnaissance pass.

## Top-level structure (in `#__crisp > .page-container`)

| # | Element | Class | top (px) | height | Component |
|---|---------|-------|----------|--------|-----------|
| 0 | `nav#header` | `page-header page-header--hugo-banner` | 0 | 127 | **TopBanner + NavBar** (static, NOT sticky) |
| 1 | `.page-content > .home` | — | 153 | 9521 | home sections (below) |
| 2 | `.page-entice` | — | 9834 | 588 | **CTA band** ("Ready to build…") |
| 3 | `#footer` | `page-footer` | 10422 | 1039 | **Footer** |

## `.home` sections (top → bottom)

| # | Class | top | height | Component name | Notes |
|---|-------|-----|--------|----------------|-------|
| H0a | `.home-hero` (inside `.page-wrapper--wide`) | 153 | 1140 | **HeroSection** | NEW badge, H1, 3 feature pills, CTA button, product UI mockup image |
| H0b | `.home-customers` (`common-card--feature`) | 1383 | 172 | **CustomersStrip** | "Trusted by 10,000 companies" + logo row |
| H0c | `.common-colored-container--orange` | 1675 | 1218 | **PlatformSection** | "One platform to delight your teams and customers" + automate cards |
| H1 | `.home-agentic` | 3003 | 756 | **AgenticSteps** | "Build your perfect AI Agent in 4 steps" (Step 1–4) |
| H2 | `.home-features-popular` | 3879 | 1986 | **FeaturesPopular** | Shared Inbox, CRM, etc. — large feature blocks |
| H3 | `.home-features-others` | 5925 | 1146 | **FeaturesOthers** | secondary feature grid |
| H4 | `.home-usecases` | 7181 | 1200 | **UseCases** | use-case cards |
| H5 | `.page-wrapper--generic` (#5) | 8425 | 1249 | **TestimonialsOrPricing** | bottom wrapper (testimonials / social proof) |

## Layout model
- Single vertical scroll, no scroll-snap, no smooth-scroll library (no Lenis).
- Header is `position: static` — scrolls away with the page (no sticky/shrink behavior).
- Centered content column; `.page-wrapper--wide` for hero, generic wrappers elsewhere.
- A persistent Bybelt chat widget bubble (bottom-right) — out of scope (it's the live product), reproduce only a static bubble if visible.

## Assembly order (page.tsx)
TopBanner → NavBar → Hero → CustomersStrip → PlatformSection → AgenticSteps → FeaturesPopular → FeaturesOthers → UseCases → TestimonialsOrPricing → CtaBand → Footer

## Clone status (2026-06-26, Phase D)

| Section | Route | Status |
|---------|-------|--------|
| TopBanner + NavBar + Hero + Customers + CTA + Footer | `/en` | **DONE (D1–D5)** |
| PlatformSection through Testimonials | `/en` | **DONE (D6)** |
| Mobile nav, Hugo portal, chat bubble | `/en` | **DONE (E1–E5)** |
