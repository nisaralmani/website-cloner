# Cards — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/billing/cards/`  
**Clone route:** `/settings/billing/cards`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` question circle next to title |
| Saved badge | **Hidden** |
| Content width | 710px centered |
| Header → status gap | 40px |

## Warning status

Yellow banner (same tokens as Plans page):

- Text: "No payment method. Add a payment method to start adding subscriptions to your workspaces!"
- No inline action link on this page
- 40px margin below

## Info lines

Two stacked 14px lines, `#75869c`:

1. Regular — "You can cancel or subscribe at anytime. No commitment."
2. Extrabold — "A payment method can be linked to multiple workspaces (eg: if you have workspaces for multiple businesses)"

24px margin below info block.

## Primary action

Blue button with credit card icon:

- Label: "Add new payment method"
- Height 43px, 14px bold white, `#1972F5` bg, 4px radius
- Left icon: credit card (16px)

No "Payment methods" field label — empty state only.
