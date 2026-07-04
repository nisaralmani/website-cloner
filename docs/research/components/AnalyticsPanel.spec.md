# AnalyticsPanel Specification

## Overview
- **Target files:** `AnalyticsNav.tsx`, `AnalyticsPanel.tsx`
- **Route:** `/analytics` (live: `/analytics/messaging/overview`)
- **Interaction model:** static; upgrade paywall overlay (FashionSis workspace has no Analytics plan).

## Layout
`flex` row: **AnalyticsNav** (300px) + **AnalyticsPanel** (`flex-1`).

### AnalyticsNav (300px, white, right border `#E6EAF0`)
Six accordion sections:
1. **Dashboards:** Default Dashboard, Create new dashboard
2. **Messaging:** Overview (active), Workload, Responsiveness, Ratings, Operators, Automations, Channels, SLAs, Segments, Shortcuts
3. **Visitors:** Website Visits, Triggers
4. **Knowledge Base:** Knowledge Base Visits, Search, Articles
5. **Contacts:** Contacts Saved, Campaigns Reached, Campaigns Activity
6. **Status Page:** Downtimes

### Header (70px)
- Left: BarChart3 icon + **Analytics**
- Right: date filter `Since a week — Last 7 days` + timezone `Asia/Karachi`

### KPI row (3 cards)
| Label | Value |
|-------|-------|
| Conversations | 0 |
| Visitors | 0 |
| Rating | 0 |

### Widget grid
1. **Conversations** — line chart axes (0–2), empty state message
2. **Conversations Per Period** — heatmap axes (Mon–Sun × 0h–23h)
3. **Conversations Per Operator** — empty state
4. **Conversations Per First Response Origin** — empty state

Empty message: `Oops! Looks like we don't have any data there at the moment.`

### Upgrade overlay
Same pattern as Helpdesk paywall — title **Analytics**, feature bullets from live scrape.

## Sidebar
- Analytics active: bordered style + `#0093EE` text

## Verify
- `npm run check` passes.
