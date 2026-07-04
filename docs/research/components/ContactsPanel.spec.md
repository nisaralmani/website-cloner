# ContactsPanel Specification

## Overview
- **Target file:** `src/components/contacts/ContactsPanel.tsx`
- **Route:** `/contacts`
- **Live URL:** `/website/{id}/contacts/`
- **Interaction model:** static table with mock contacts; search/buttons visual only.

## Layout
Full-width panel (`flex-1 min-w-0`), white shell.

### Header (70px, padding `16px 32px`, border-bottom `#F4F4F5`)
- Left: `Users` icon 20px + **`100 Contacts`** 16/600 `#2C405A`
- Right (gap 8px):
  - Search field 250×36, bg `#F8F9F9`, border `#E8EAEB`, radius 4px, magnifier + placeholder `Search`
  - Column layout icon button 44×37 grey
  - Documentation icon button 44×37 blue `#1972F5`
  - **New Contact** black button `#1C293B`, 131×37
  - **Actions** grey button `#F8F9F9` + chevron

### Table (`bg #FBFBFB`, min-width 1136px, horizontal scroll)
**Header row** 36px, 13.5px/600 `#75869C`, icons on Full Name / Email / Location.

| Col | Width | Content |
|-----|-------|---------|
| ⋯ | 35px | Row menu dots |
| ☐ | 30px | Checkbox |
| Full Name | 158px | 26px avatar + name 14/600 `#1C293B` |
| Email | 158px | truncate |
| Location | 158px | truncate |
| Company | 106px | `Unknown` grey |
| Segments | 127px | tags: `chat` `#FDF4EC`/`#E07415`, `shopify` `#F2F8F2`/`#5DAC5D` |
| Last Active | 106px | e.g. `Jan 2024` |
| Score | 104px | number |
| Preview | 139px | blue button `#1972F5` |

**Rows:** 39px, border-bottom `#F4F4F5`.

## Sidebar (when on /contacts)
- Contacts active: bordered style (`#D2D4D8` + blue text)
- Sub-section **Filters** with **Create filter** link (Plus icon)

## Mock data
- `src/lib/mock-contacts.ts` — 15 verbatim rows + `contactCount: 100`

## Verify
- Default export `ContactsPanel`. `npm run check` passes.
