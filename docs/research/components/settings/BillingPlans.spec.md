# Plans & Subscriptions — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/billing/plans/`  
**Clone route:** `/settings/billing/plans`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Saved badge | **Hidden** on this page |
| Content width | 710px centered |
| Header → status gap | 40px |

## Warning status

Yellow banner below title:

- Background `#FFF5CC`, border `#FACA00`, padding 16px, 40px margin below
- Text: "You do not have any payment method. Add one to subscribe to paid features."
- Inline action (bold): "Go to billing settings"

## Monthly total banner

Blue summary card (710×101px):

| Part | Tokens |
|------|--------|
| Container | `bg rgba(25,114,245,0.09)`, border `rgba(25,114,245,0.2)`, radius 4px, padding 24px 16px |
| Price pill | `#1972F5` bg, white text, 24px, padding 8px 16px, radius 4px, 24px right margin |
| Price value | `$0.00` |
| Title | 18px / 800 `#1c293b` — "This is what you pay monthly." |
| Description | 14px `#1c293b` — "Payments are done monthly or yearly based on your plan preferences." |

32px gap below banner.

## Section intro

Not a button — heading block only:

| Line | Style |
|------|-------|
| Manage all workspace plans | 20px bold `#1c293b` |
| Manage all your workspace plan subscriptions. | 14px `#75869c` |

32px gap below intro.

## Workspace plan cards (×4)

Workspaces: **FashionSis**, **FashionDia**, **FashionAxe**, **VelvetHem** — all Free / Active / billing owner none.

### Title row (above card)

- 30px avatar, 18px bold name, blue `#0093ee` "Free" tag (12px bold white, 4×8px padding)
- 24px margin below title row

### Card body

White box: border `#E8EAEB`, radius 8px, padding 24px, flex row, 24px gap

| Left | Right |
|------|-------|
| Amount "Free" 40px/600 `#2c405a` | Green "Active" badge with dot |
| Period "forever!" 12px/600 `#8d949d` | "Billing owner none" with user icon, 14px `#8d949d`, 21px top margin |

Active badge: `#EBF6ED` bg, `#39A746` text/dot, 12.5px bold, pill radius

16px margin below card, then **Change Plan** button (blue `#1972F5`, 36px height, 13px bold)

32px gap between workspace blocks.
