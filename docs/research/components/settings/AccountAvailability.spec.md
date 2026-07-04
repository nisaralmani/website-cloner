# Availability — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/account/availability/`  
**Clone route:** `/settings/account/availability`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600 + help icon (24px `#777f89`) |
| Saved badge | Standard |
| Success banner | `#F5FCEE` bg, `#B6EAAF` border, green check |

### Status banner copy

- **Title:** You are currently seen as: **Online**
- **Body:** Schedule explanation + bold multi-operator note

## Toggles

| Label | Default |
|-------|---------|
| Force offline (invisible mode) | OFF |
| Set me available when using the app | ON |
| Enable availability schedule | OFF |

## Schedule fields (disabled when schedule OFF)

| Field | Live UI |
|-------|---------|
| Days (6/7) | Tab pills Mon–Sat active (blue), Sun inactive |
| — divider — | Horizontal rule |
| Timezone | Horizontal row, label 140px, field 340px, `UTC+05:00` |
| Hours | 4 small selects (`—`) + disabled **Add** button |
