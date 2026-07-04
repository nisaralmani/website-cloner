# VisitorsPanel Specification

## Overview
- **Target file:** `src/components/visitors/VisitorsPanel.tsx`
- **Route:** `/visitors`
- **Live URL:** `/website/{id}/visitors/`
- **Interaction model:** static empty state + static MagicMap background.

## Layout
Two-column flex row filling main content (`flex-1 min-w-0`).

### Left — Visitors list menu (`320px`, white, right border `#E3E8EF`)
1. **Header** 48px, flex center, gap 16px, padding `12px 8px`, border-bottom `#E3E8EF`:
   - Title `VISITORS` — 14px/800, uppercase, `#1C293B`
   - **Live** pill — bg `#FFA10A`, border `#FFA10A`, white 12/600 text, padding `2px 6px`, radius 4px, 8px white dot
2. **Empty area** (`flex-1`, centered):
   - Card 250×320, bg `#F4F4F5`, radius 8px, centered content
   - Globe icon 22px `#1C293B`
   - Title `There are no visitors.` — 16/600 `#1C293B`
   - Description `Nobody is currently browsing your website. Your visitors will appear here.` — 14/400 `#495462`
3. **Search footer** 55px, border-top `#E3E8EF`, padding `0 12px`:
   - Input placeholder `Filter by name, city…`, 14px `#777F89`, disabled/readonly

### Right — MagicMap (`flex-1`, relative, min-h-0)
- Background: `public/images/visitors/magic-map.webp` cover center
- **Stats overlay** absolute `top-[30px] left-[54px]`, 241×115, bg `rgba(28,41,59,0.7)`, border `rgba(0,0,0,0.05)`, radius 7px:
  - Metrics padding `11px 26px`, gap 4px
  - Row 1: `0` 24/bold white + `online users` white
  - Row 2: `0` 24/bold `#8DFF3E` + `active users now` `#8DFF3E`
  - Footer: `Live view from MagicMap` — 13px `rgba(255,255,255,0.75)`, padding `9px 8px`
- **Zoom box** bottom-right (~45px wide), bg `rgba(168,198,223,0.6)`, plus/minus rows 32px, white icons
- **Attribution** bottom-left: `© OpenStreetMap` small grey text

## Sidebar (when on /visitors)
- Active item: border `#D2D4D8`, inset shadow `0 -2px 0 rgba(0,0,0,0.06)`, text/icon `#0093EE`
- Optional blue count badge `1` on Visitors (live has 1 visitor notification)

## Verify
- Default export `VisitorsPanel`. `npm run check` passes.
