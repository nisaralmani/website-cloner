# Message Shortcuts — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/messaging/shortcuts/`  
**Clone route:** `/settings/inbox/shortcuts`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Message Shortcuts |
| Help icon | Present (`CircleHelp`) |
| Saved badge | Not present |
| Description | None |
| Content width | 710px centered |

## Section 1 — Add a new shortcut

| Element | Live value |
|---------|------------|
| Heading | Add a new shortcut (20px bold) |
| Intro | "Create a new shortcut. Give it a !bang, a group tag, and write a message for this shortcut. Then, use it in conversations to quickly answer to visitors using the shortcut !bang." |
| Shortcut field | Label **Shortcut** * — placeholder `!bang` |
| In tag select | Label **In tag** — placeholder `—`, dropdown includes "Add a tag…" |
| Layout | Shortcut + In tag in horizontal row (gap ~24px) |
| Message composer | Label **Message** — textarea placeholder "Enter a message for this shortcut !bang…", min-height ~150px |
| Editor toolbar | Bold, Italic, Underline, Color, Link, Image, GIF, Video, File (disabled behind upgrade gate) |
| Button | **Add Shortcut** — blue bordered, disabled, plus icon left (`c-base-button--blue c-base-button--bordered c-base-button--disabled c-base-button--with-left-icon`) |

## Section 2 — Manage all shortcuts

| Element | Live value |
|---------|------------|
| Heading row | **Manage all shortcuts** + inline search (placeholder "Search") + grey mini filter button |
| Subheading | "Manage your shortcuts. They are grouped by tag to help you organize them." |
| Empty state | **You have no shortcut** / "Your shortcuts will appear here." |

## Upgrade gate (bottom overlay)

Paid feature overlay blocks interaction on free plan:

| Element | Live value |
|---------|------------|
| Title | Upgrade your plan to unlock **Message Shortcuts** |
| Feature Details | Preview panel with shortcut message examples + Note/Reminder/Shortcuts/Helpdesk tabs |
| Feature name | Message Shortcuts |
| Plans | Included in Mini plan, Essentials plan, Plus plan (green) |
| Description | Full paragraph about !pricing / !refund shortcuts |
| Bullets | Train new operators faster; Save time on repetitive replies; Keep support consistent; Answer faster, even on mobile |
| Button | **Upgrade your Bybelt plan** (solid blue) |
| Footnotes | Refund if unsatisfied · 5/7 Live chat support |

## Notes

- Live route `/messaging/shortcuts/` matches plan slug.
- No saved badge on live — `hideSavedBadge: true`.
- Upgrade overlay covers lower portion of page on free workspace.
