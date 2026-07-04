# HelpdeskPanel Specification

## Overview
- **Target files:** `HelpdeskNav.tsx`, `HelpdeskPanel.tsx`
- **Route:** `/helpdesk` (live: `/helpdesk/articles/`)
- **Interaction model:** static; upgrade paywall overlay (FashionSis workspace has no Helpdesk plan).

## Layout
`flex` row: **HelpdeskNav** (300px) + **HelpdeskPanel** (`flex-1`).

### HelpdeskNav (300px, white, right border `#E6EAF0`)
Accordion sections (deployed):
1. **Knowledge Base:** Articles (active), Categories
2. **Status:** Draft, Visible, Hidden

Active item: white bg, border `#D2D4D8`, radius 8px, text `#1C293B`.
Section labels: bold 14px `#1C293B`.

### Header (70px, padding `16px 32px`, border-bottom `#F4F4F5`)
- Left: BookOpen icon + **`0 Articles`** 16/600 `#2C405A`
- Right: **Documentation** blue `#1972F5`, **New Article** black `#1C293B`, **Actions** grey

### Table area (`bg #FBFBFB`)
**Header row** 13.5px/600 `#75869C`: Article Title, Status, Statistics, Last Update, Actions.
No data rows (0 articles).

### Upgrade overlay (live paywall for this workspace)
Centered modal over table area:
- Title: `Upgrade your plan to unlock` + blue **Helpdesk**
- **Feature Details** tab active
- Plan badges: Essentials, Plus
- Video thumbnail + description
- 4 feature bullets
- **Upgrade your Bybelt plan** CTA
- Footer: Refund if unsatisfied · 5/7 Live chat support
- Tabs: Plans Details, Payment

## Sidebar
- Knowledge Base active: bordered style + `#0093EE` text

## Verify
- `npm run check` passes.
