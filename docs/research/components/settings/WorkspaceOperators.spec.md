# Operators & Teams — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/operators/`  
**Clone route:** `/settings/workspace/operators`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible (inline in header on live) |
| Description | 14px `#8d949d` — "Add people that will be able to handle support for the workspace." |
| Content width | 710px centered |

## Support status banner

Green success banner, 40px margin below:

- Background `#F5FCEE`, border `#B6EAAF`, padding 16px
- Green check icon 16px
- Line 1: "Support is" + green dot + bold green **Online**
- Line 2: "as at least one operator is online."

## Section: Options

Heading: 18px bold `#1c293b`

| Toggle | Default |
|--------|---------|
| Prevent non-owner operators to remove data (conversations & contacts) | OFF |
| Force operators to have Two Factor Authentication enabled | OFF |

Toggle labels: 14px bold `#8d949d`, 24px row gap.

Large divider — 30px margin.

## Section: Operators

Heading: **Operators** (18px bold)  
Subtitle: "Invite and manage operators" (14px `#75869c`)

### Toolbar

| Control | Style |
|---------|-------|
| Add Operator | Blue `#1972F5`, 42px height, 12px bold white |
| Name | Black mini button + sort icon |
| Empty Last Active | Black mini button + list icon |

### Operator list

Bordered container `#E8EAEB`, 4px radius.

| Row | Live data |
|-----|-----------|
| Nisar Ali (you) | contact@fashionpara.com · **Owner** purple badge |

Row: 50px height, 16px horizontal padding, 30px avatar with green online dot, edit pencil + remove icon buttons (42×30).

Owner badge: `#F1F0F9` bg, `#584CBD` text, 11.5px bold pill.
