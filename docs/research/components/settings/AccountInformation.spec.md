# Account Information — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/account/information/`  
**Clone route:** `/settings/account/information`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b`, line-height 44px |
| Saved badge | `#F4F4F5` bg, `#E8EAEB` border, 4px radius, green check 16px |
| Content width | 710px centered |
| Header → body gap | 40px padding-bottom on header block |

## Warning banner

- Background `#FFF5CC`, border `#FACA00` 0.67px, radius 4px, padding 16px
- Yellow warning icon 16px
- Text 14px / 600 `#1c293b`
- Action "Send an email now?" inline **bold**, not a separate button

## Section: Avatar

- Heading **Avatar** — 18px bold, margin-bottom 24px
- Image 120×120 container, 104×104 circular photo
- Help text beside image (medium weight)
- Buttons: **Upload image** (small blue 36px), **Clear existing** (mini grey 30px)

## Section: Personal Details

- 2-column grid, 343px fields, 24px gap
- Labels: 14px bold `#606976`, required `*`
- Input wrapper: `#F8F9F9` bg, `#E8EAEB` border, 4px radius, 40px height
- Filled values: 14px **bold** `#1c293b`
- Help: 13px bold `#8d949d`, margin-top 10px

### Fields (live data)

| Field | Value |
|-------|-------|
| First Name | Nisar |
| Last Name | Ali |
| Email | contact@fashionpara.com |
| Phone | (empty) |

## Section: Security

Horizontal rows — **no card chrome**

| Label (140px) | Control |
|---------------|---------|
| Password | Change password (mini blue) |
| 2-Step | Enable Two Factor Authentication (disabled, `#1972F5` at 40% opacity) + help below |

Help under 2-Step: 14px regular `#75869c`

## Footer

`Looking to remove your Bybelt account?` + **`Delete your account there.`** (bold `#75869c`)
