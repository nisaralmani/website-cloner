# Notifications — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/account/notifications/`  
**Clone route:** `/settings/account/notifications`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Saved badge | Same as Account information |
| Section headings | None — flat toggle list |
| Content width | 710px centered |

## Toggles (9 rows, 24px gap)

| Label | Default |
|-------|---------|
| Disable all notifications | OFF |
| Notify me of messages when I am online | ON |
| Notify me of messages when I am offline | ON |
| Notify me when a visitor is browsing my website | OFF |
| Play notification sounds | ON |
| Email me unread messages | OFF |
| Email me transcripts of conversations | OFF |
| Email me user ratings | OFF |
| Email me paid invoices (only if you use a paid plan) | ON |

## Toggle row tokens

- Label: 14px bold `#8d949d`, line-height 24px
- Row: full width, label left / switch right
- Switch: 42×24px, radius 20px
- ON: track `#1972F5`, handle white 16px
- OFF: track `#F4F4F5`, handle `#bbbfc4` 16px
