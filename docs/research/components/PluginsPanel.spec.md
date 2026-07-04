# PluginsPanel Specification

## Overview
- **Target files:** `PluginsNav.tsx`, `PluginsPanel.tsx`
- **Route:** `/plugins` (live: `/plugins/filter/all/`)
- **Interaction model:** static marketplace grid; cards and filters visual only.

## Layout
`flex` row: **PluginsNav** (300px) + **PluginsPanel** (`flex-1`).

### PluginsNav (300px)
- Search-style **All Plugins** filter (active)
- **Installed Plugins** link with check icon
- **Categories** section with count badges:
  Bybelt Features `31`, Automation `20`, CMS `10`, CRM `7`, Marketing `7`, Messaging `13`, Teamwork `11`, Others `17`

### Header (70px)
- Left: LayoutGrid icon + **Plugins**

### Plugin grid (2 columns, ~280px cards)
Each card:
- 64px icon
- Badge: Essentials (black), Mini (green), Plus (purple), Free (blue), or price `$N/mth`
- Name + optional `Separate checkout`
- Description (truncated)
- **View Details** blue bordered button

## Sidebar
- Plugins (secondary nav) active: `bg #F4F6FB` on `/plugins`

## Mock data
- `src/lib/mock-plugins.ts` — 19 verbatim plugins from live page

## Verify
- `npm run check` passes.
