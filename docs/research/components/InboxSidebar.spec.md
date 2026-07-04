# InboxSidebar Specification

**Scraped:** 2026-06-26 from live `chat.bybelt.com`

## Overview
- **Target file:** `src/components/inbox/InboxSidebar.tsx`
- **Width:** **200px** fixed (`c-sidebar c-sidebar--default-width`), full height, white bg, right border `#E6EAF0`
- **Settings nav (when present):** 300px (`c-section-menu`)

## Structure (top → bottom)

1. **Workspace header** (~60px): 42px circular workspace logo image + green online dot top-left + red `99+` badge bottom-right; name `FashionSis` (15px bold) / `fashionsis.com` (12px grey). Click opens workspace switcher when user has 2+ workspaces (FashionSis + Demo Boutique).
2. **Upgrade** — orange `#F97316`, h-40px, gauge icon left
3. **Get Started** — green `#40B630`, gift icon, red badge `8` trailing
4. **Inbox block** — light `#F4F6FB` bg when on inbox route; link row with message-bubble icon; sub-sections:
   - Default Inboxes → 💬 Main Inbox + red badge `148`
   - Your Inboxes → + New sub-inbox
   - Other Inboxes → 💣 Spam
5. **Primary nav** — AI Agent, Visitors, Contacts, Campaigns, Knowledge Base, Analytics
6. **Secondary nav** — Get help (blue `#0093EE`, external help.bybelt.com), Search (opens global overlay, Ctrl+F), Plugins, Settings
7. **User footer** — avatar + online dot; `Nisar Ali` / `contact@fashionpara.com` (no top border). Click opens account menu: Account information, Notifications, Availability, Security, Log out.

## Notes
- No chevron controls on Inbox row on live.
- Logo from `/images/fashionsis-workspace.jpg` (Bybelt CDN avatar).
