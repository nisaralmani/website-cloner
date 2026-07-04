# Workspace information — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/information/`  
**Clone route:** `/settings/workspace/information`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible (same as account pages) |
| Description | "Configure your workspace information. This defines how your workspace appear to your users." — 14px `#75869c` |
| Content width | 710px centered |

## Section: General information

Heading: 18px bold `#1c293b`, 24px margin below.

### Icon field (`c-field-image`)

| Part | Tokens |
|------|--------|
| Preview container | 120×120 circle, `#F8F9F9` bg, `#E8EAEB` border |
| Image | 80×80 circular workspace logo |
| Label | **Icon** — 14px semibold `#1c293b` |
| Instructions | 14px semibold `#8d949d`, inline after label |
| Upload button | Small blue 36px — "Upload image" |
| Remove button | 42×30 mini icon button (no text label) |

24px gap below icon field.

### Fields (2-column grid, 343px each, 24px gap)

| Field | Value |
|-------|-------|
| Domain * | fashionsis.com |
| Name * | FashionSis |

Large grey divider after Name — 30px vertical margin.

## Section: Contact information

Heading + description block (50px tall):

- Title: **Contact information** — 18px bold `#1c293b`
- Description: "Set your public contact information so that visitors have other ways to directly contact you." — 14px `#75869c`

### Fields (2-column grid)

| Field | Value |
|-------|-------|
| Email | contact@fashionsis.com |
| Phone | 3322528575 |
| Messenger | (empty) |
| Telegram | (empty) |
| X (Twitter) | (empty) |
| WhatsApp | (empty) |
| Instagram | (empty) |

Instagram is single-column width (343px), not full-width span.

## Field tokens

Same as Account information: label 14px bold `#606976`, input 40px `#F8F9F9` / `#E8EAEB`, filled values bold `#1c293b`.
