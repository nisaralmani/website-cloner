# Chatbox Security — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/chatbox/security/`  
**Clone route:** `/settings/chatbox/security`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible inline in header on live |
| Description | 14px `#8d949d` — "Configure security and privacy preferences here." |
| Content width | 710px centered |

## Domain lock toggle

| Toggle | State |
|--------|-------|
| Lock the chatbox to website domain (and subdomains) | **OFF** |

Large divider follows.

## Privacy status rows

Horizontal flex rows (label left, status button right):

| Label | Button | Style |
|-------|--------|-------|
| Ignore user privacy choices (MagicType, MagicBrowse) | Privacy choices honored | Green outline `#39A746`, 36px |
| Do not auto-create chat sessions and cookies without user intent | Total Privacy™ is inactive | Black outline `#1c293b`, 36px |

These are **not** toggles on live — they are read-only status buttons.
