# Billing settings — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/billing/`  
**Clone route:** `/settings/workspace/billing`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | **Hidden** |
| Description | 14px `#8d949d` — "Select the payment method to be used for this workspace, used for subscriptions payment." |
| Content width | 710px centered |

## Payment method row (no card on file)

Horizontal flex row:

| Left | Right |
|------|-------|
| **Add new payment method** — blue button 43px, credit card icon, 14px bold white | Side panel with title + link |

### Add button

- `#1972F5` bg, 4px radius, ~412px wide on live
- Credit card icon left

### Cards link panel

40px left margin, 16px left padding:

| Line | Style |
|------|-------|
| Want to manage all payment cards? | 14px bold `#75869c` |
| Go to Cards… | 14px bold `#0093ee`, links to `/settings/billing/cards/` |

No field label "Payment method for this workspace" on empty state.
