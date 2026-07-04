# Invoices — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/billing/invoices/all/`  
**Clone route:** `/settings/billing/invoices`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` question circle |
| Saved badge | **Hidden** |
| Content width | 710px centered |
| Header → intro gap | 40px |

## Intro lines

Two stacked 14px lines, `#75869c`, 22px line-height:

1. Regular — "Those are your invoices for all your payment methods"
2. Extrabold — "You may download those invoices regularly, to keep a copy of them."

24px margin below intro block.

## Empty state

Centered block, 45px top margin, 50px horizontal padding:

| Line | Style |
|------|-------|
| There are no invoices for this payment method. | 16px / 800 `#1c293b`, center, 10px margin below |
| Looking for workspace invoices? Go to the workspace settings… | 14px regular `#75869c`, center, 22px line-height, 20px margin below |

No invoice table, tabs, or payment method selector in empty state.
