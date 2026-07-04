# Keyboard shortcuts — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/account/shortcuts/`  
**Clone route:** `/settings/account/shortcuts`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Description | None |
| Saved badge | Same as other account pages |
| Content width | 710px centered |

## Section: General Interface

Section heading: 18px bold `#1c293b`, 24px margin below.

| Row | Toggle | Shortcut keycaps |
|-----|--------|------------------|
| Search | ON | Ctrl · F |
| Command palette | ON | Ctrl · P |

## Section: Inbox

| Row | Toggle |
|-----|--------|
| Enable editor actions shortcuts (? and !) | ON |

## Footer link row

Horizontal row (710px full width):

| Label (left) | Action (right) |
|--------------|----------------|
| All keyboard shortcuts | See keyboard shortcuts |

- Label: 14px bold `#606976`, 40px right padding
- Action: 14px semibold `#0093ee`
- 32px gap above link row (after Inbox section)

## Toggle row tokens (this page)

- Label: 14px bold `#1c293b` (not muted grey)
- Row: full width, label left / switch right, 24px vertical gap
- Switch: 42×24px (same as Notifications)

## Keycap tokens

- Container: flex, 4px gap between keys
- Keycap outer: `#5f6d7f` bg, 4px radius, 1px padding, ~25×20px
- Keycap inner: white 80% bg, 3px radius, 11px `#495462`, 3px horizontal padding
