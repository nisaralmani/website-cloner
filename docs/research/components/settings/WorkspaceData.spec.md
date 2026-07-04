# Data, Limits & Legal — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/usage/`  
**Clone route:** `/settings/workspace/data`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible inline in header on live |
| Description | 14px `#8d949d` — "Review your data usage, manage your legal compliance settings." |
| Content width | 710px centered |

## Section 1 — MagicReply & Copilot Data Training

Stacked white cards (`border #E3E8EF`, `px 22px`):

| Card | Title | Button |
|------|-------|--------|
| 1 | Train your MagicReply AI with latest Inbox Messages | Orange solid **Start Training MagicReply** + warning icon |
| 2 | Write Knowledge Base articles as training data | Orange outline **Setup Knowledge Base** + chevron |

Card 1 disclaimer (orange `#FF5C0A`, semibold): *MagicReply & Copilot were never trained. Run a first training now!*

Body copy: 13px `#75869c`

## Section 2 — Limits & Quotas Usage

Three usage rows with label, progress bar, **Edit** button (blue outline mini):

| Label | Value | Secondary | Progress | Bar tone |
|-------|-------|-----------|----------|----------|
| Campaign recipients limit | 50 | — | 0% | blue |
| Workspace operators limit | 1 / 2 | (in total) | 50% | blue |
| *(large divider)* | | | | |
| Files uploaded | 0 / 500 | Every 1d | 0% | black |

## Section 3 — Contract Agreements

Row: green check icon + **GDPR Data Processing Agreement** | **Upload signed** (black outline) + **See contract** (blue outline) → PDF URL
