# Sub-Inboxes — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/messaging/inboxes/`  
**Clone route:** `/settings/inbox/sub-inboxes`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Sub-Inboxes |
| Help icon | Not present |
| Saved badge | Automatically Saved |
| Description | "Automatically organize conversations into sub-inboxes based on segments, user data, user locale, and more." |
| Content width | 710px centered |

## Section header

| Element | Live value |
|---------|------------|
| Heading | Sub-Inboxes (18px bold) |
| Button | **Add a sub-inbox** — blue bordered mini (`c-base-button--blue c-base-button--mini c-base-button--bordered`) with plus icon right |

## Empty state

Mini empty spot (`c-base-empty-spot--mini`) with eye icon:

| Element | Live value |
|---------|------------|
| Title | You have no sub-inbox |
| Description | Your sub-inboxes will appear here. |

## Notes

- Live route slug is `/messaging/inboxes/` (plan listed `/messaging/sub-inboxes/` — incorrect).
- No sub-inbox list entries on this workspace — empty state only.
- Button is blue bordered, not solid primary fill.
