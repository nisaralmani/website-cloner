# Team Transparency Log — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/audit/`  
**Clone route:** `/settings/workspace/transparency`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible inline in header on live |
| Description | 14px `#8d949d` — "Security log of important actions that workspace operators have taken." |
| Content width | 710px centered |

## Plugin banner

Dark banner `#3F536E`, rounded, flex row:

| Left | Right |
|------|-------|
| "Please install the Team Transparency Log plugin to see all your logs." | **Install Plugin** — light grey small button |

## Collect logs toggle

- Label: "Collect transparency logs from all team members" — 14px bold `#1c293b`
- Horizontal full-width toggle, **ON** (blue)

## Divider

Large grey divider (`my-[30px]`)

## Filter by

Label **Filter by** — 14px bold `#606976`

Horizontal row (~710px):

| Control | Width | Details |
|---------|-------|---------|
| Date range | ~313px | Calendar icon, `__/__/__` - `__/__/__`, disabled grey mini picker |
| Operator | ~154px | User icon, "All operators", chevron |
| Action | ~154px | Plus icon, "All actions", chevron |

## Audit log table

| Column | Width | Icon |
|--------|-------|------|
| Action | 34% | plus_circle |
| Operator | 23% | user_single |
| Time Ago | 17% | clock |
| IP Address | 20% | cloud |
| (context) | 6% | empty |

Row cells:

- **Action** — semibold text + orange "Write" mini badge
- **Operator** — 20px avatar + name
- **Time Ago** — relative time (e.g. "45m", "1h (3:51 AM)")
- **IP Address** — PK flag + IP (no country text inline)
