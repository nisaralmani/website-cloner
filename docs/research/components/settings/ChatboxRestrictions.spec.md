# Chatbox Restrictions — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/chatbox/restrictions/`  
**Clone route:** `/settings/chatbox/restrictions`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Chatbox Restrictions |
| Help icon | Present |
| Saved badge | Automatically Saved (inline in header) |
| Description | 14px `#8d949d` — "Hide or block your chatbox for certain pages of your website, countries, etc." |
| Content width | 710px centered |

## Vacation toggle

| Toggle | State |
|--------|-------|
| Place support in vacation (hide chatbox) | **OFF** |

Large grey divider follows.

## Restriction groups

Each restriction is a horizontal row: **bold label left** (`#606976`), **blue bordered button right** (`c-base-button--blue c-base-button--small c-base-button--bordered`, ~36px height). Groups are separated by large grey dividers.

| Label | Button |
|-------|--------|
| Show chatbox only on pages | Add an allowed page |
| Hide chatbox on pages | Add a blocked page |
| Hide chatbox for countries | Add a blocked country |
| Hide chatbox for locales | Add a blocked locale |
| Hide chatbox for IPs | Add a blocked IP |

### Blocked pages table

Shown under "Hide chatbox on pages" when entries exist.

| Column | Width | Icon |
|--------|-------|------|
| Url | 90% | Map icon `#75869c` |
| Action | 10% center | — |

Live rows:

- `https://www.fabzop.com/cart`
- `https://www.fabzop.com/checkout`

Action column: mini transparent grey delete button with cross-square icon only (tooltip: Delete).

## Blocked visitors

| Label | Button | Style |
|-------|--------|-------|
| Blocked visitors | Clear all block rules (IP & Email) | Red bordered (`c-base-button--red c-base-button--bordered`) |

Preceded by large divider after the IPs group.
