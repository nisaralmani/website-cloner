# CampaignsPanel Specification

## Overview
- **Target files:** `CampaignsNav.tsx`, `CampaignsPanel.tsx`
- **Route:** `/campaigns` (live: `/campaigns/types/all/`)
- **Interaction model:** static empty state; nav links visual only.

## Layout
`flex` row: **CampaignsNav** (300px) + **CampaignsPanel** (`flex-1`).

### CampaignsNav (300px, white, right border `#E6EAF0`)
Three sections with bold labels:
1. **Types:** All Types (active), Automated, One-Shot
2. **Tags:** All Tags
3. **Templates:** All Templates `2`, Bybelt Templates `2`, Your Templates

Active item: white bg, border `#D2D4D8`, radius 8px, padding `5px 12px`, text `#1C293B`.
Inactive: transparent, text `#1C293B`.
Template count badges: grey pill `2`.

### Header (70px, padding `16px 32px`, border-bottom `#F4F4F5`)
- Left: Megaphone icon + **Campaigns** title
- Right: Search field (250px grey), **Documentation** blue `#1972F5`, **New Campaign** black `#1C293B`, **Actions** grey

### Table area (`bg #FBFBFB`)
**Header row** 13.5px/600 `#75869C`: Campaign Name, Status, Contacts, Last Update, Actions.

**Empty state** (centered, ~400px tall):
- Campaign illustration ~138×132 (grey envelope SVG style)
- Title `You have no campaign.` — 18/600 `#1C293B`
- Description `Campaigns are used to send emails to targeted contacts. Create your first one!` — 14/400 `#495462`
- **New Campaign** black button

## Sidebar
- Campaigns active: bordered style + `#0093EE` text

## Verify
- `npm run check` passes.
