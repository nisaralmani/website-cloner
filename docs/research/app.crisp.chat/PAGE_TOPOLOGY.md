# Page Topology — chat.bybelt.com

Target: https://chat.bybelt.com (unauthenticated → `/initiate/login/`)
Captured: clone-website pipeline pass · updated 2026-06-26 (Phase F — **complete**).

## Routes (built)

| Route | View | Component |
|-------|------|-----------|
| `/initiate/login/` | Login form + feature promo | **LoginPage** |
| `/` | Inbox shell | **InboxApp** |
| `/agent` | AI Agent welcome | **AgentWelcome** |
| `/visitors` | Visitors map | **VisitorsPanel** |
| `/contacts` | Contacts table | **ContactsPanel** |
| `/campaigns` | Campaigns empty state | **CampaignsPanel** |
| `/helpdesk` | Knowledge Base + upgrade gate | **HelpdeskPanel** |
| `/analytics` | Analytics dashboards + upgrade gate | **AnalyticsPanel** |
| `/plugins` | Plugin marketplace grid | **PluginsPanel** |
| `/settings` | Settings overview | **SettingsOverview** |
| `/settings/[...slug]` | Settings detail (31 pages) | **SettingsDetail** |

## Login page (`/initiate/login/`)

| # | Region | Notes |
|---|--------|-------|
| L0 | **Top bar** | Bybelt logo; "Need help?" + language selector |
| L1 | **Form column** (~600px) | "Login" + subtitle |
| L2 | **Fields** | Email (pre-filled on live session), Password, Remember me |
| L3 | **Actions** | "Sign in to Dashboard" primary; footer signup + forgot links |
| L4 | **Feature panel** (460px) | Blue `#4091E7` promo with rotating feature + illustration |

## Inbox app (authenticated)

| # | Column | Width | Component |
|---|--------|-------|-----------|
| 0 | Sidebar | 200px | **InboxSidebar** |
| 1 | Conversation list | 326px | **ConversationList** |
| 2 | Thread / empty | flex-1 | **ConversationDetail** or **ConversationPanel** |
| 3 | Customer info | 268px | **CustomerInfoPanel** (when conversation selected) |

## App shell routes (sidebar + section nav + panel)

Campaigns, Helpdesk, Analytics, Plugins use **AppShell** = `InboxSidebar` + section nav (300px) + main panel.

## Assembly

- Login: `src/app/initiate/login/page.tsx` → `LoginPage`
- Inbox: `src/app/page.tsx` → `InboxApp`
- App pages: `src/app/{agent,visitors,...}/page.tsx` → `AppShell` + panels
- Settings: `src/app/settings/**` → `SettingsShell` + nav + content
- Global search: `SearchProvider` + `GlobalSearchOverlay` (Ctrl+F)
