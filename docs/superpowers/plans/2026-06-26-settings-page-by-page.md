# Settings Page-by-Page Pixel Clone Plan

> **For agentic workers:** One page at a time — scrape live → spec → build → test → recompare. Do NOT start the next page until the current page passes visual QA.

**Goal:** Clone all 31 Bybelt settings detail pages pixel-perfect against live `chat.bybelt.com`.

**Architecture:** Per-page workflow: (1) navigate live URL, (2) CDP extract DOM + computed styles, (3) write `docs/research/components/settings/<Page>.spec.md`, (4) update registry + `SettingsDetail` widgets, (5) screenshot compare local vs live at 1440px.

**Tech Stack:** Next.js 16, Tailwind v4, browser MCP CDP, `settings-registry.ts`, `SettingsDetail.tsx`

---

## Workflow (repeat per page)

- [ ] **Scrape** — live URL, wait 5s, snapshot + CDP styles
- [ ] **Spec** — write research doc with fields, layout, tokens
- [ ] **Build** — registry + component widgets
- [ ] **Test** — `npm run build`, open `/settings/<slug>`
- [ ] **Recompare** — side-by-side screenshots, fix deltas
- [ ] **Sign off** — mark page DONE in checklist below

---

## Page queue (31 pages)

| # | Slug | Live URL | Status |
|---|------|----------|--------|
| 1 | `account/information` | `/settings/account/information/` | **DONE** |
| 2 | `account/notifications` | `/settings/account/notifications/` | **DONE** |
| 3 | `account/availability` | `/settings/account/availability/` | **DONE** |
| 4 | `account/security` | `/settings/account/security/` | **DONE** |
| 5 | `account/interface` | `/settings/account/interface/` | **DONE** |
| 6 | `account/shortcuts` | `/settings/account/shortcuts/` | **DONE** |
| 7 | `billing/plans` | `/settings/billing/plans/` | **DONE** |
| 8 | `billing/cards` | `/settings/billing/cards/` | **DONE** |
| 9 | `billing/invoices` | `/settings/billing/invoices/` | **DONE** |
| 10 | `workspace/information` | `/settings/website/{id}/` | **DONE** |
| 11 | `workspace/integrations` | `/settings/website/{id}/setup/` | **DONE** |
| 12 | `workspace/operators` | `/settings/website/{id}/operators/` | **DONE** |
| 13 | `workspace/billing` | `/settings/website/{id}/billing/` | **DONE** |
| 14 | `workspace/transparency` | `/settings/website/{id}/audit/` | **DONE** |
| 15 | `workspace/advanced` | `/settings/website/{id}/advanced/` | **DONE** |
| 16 | `workspace/data` | `/settings/website/{id}/usage/` | **DONE** |
| 17 | `workspace/danger` | `/settings/website/{id}/danger/` | **DONE** |
| 18 | `chatbox/appearance` | `/settings/website/{id}/chatbox/appearance/` | **DONE** |
| 19 | `chatbox/behavior` | `/settings/website/{id}/chatbox/behavior/` | **DONE** |
| 20 | `chatbox/search-ai` | `/settings/website/{id}/chatbox/search/` | **DONE** |
| 21 | `chatbox/security` | `/settings/website/{id}/chatbox/security/` | **DONE** |
| 22 | `chatbox/restrictions` | `/settings/website/{id}/chatbox/restrictions/` | **DONE** |
| 23 | `chatbox/push` | `/settings/website/{id}/chatbox/notifications/` | **DONE** |
| 24 | `inbox/customize` | `/settings/website/{id}/messaging/inbox/` | **DONE** |
| 25 | `inbox/triage` | `/settings/website/{id}/messaging/triage/` | **DONE** |
| 26 | `inbox/sub-inboxes` | `/settings/website/{id}/messaging/inboxes/` | **DONE** |
| 27 | `inbox/routing` | `/settings/website/{id}/messaging/routing/` | **DONE** |
| 28 | `inbox/shortcuts` | `/settings/website/{id}/messaging/shortcuts/` | DONE |
| 29 | `email/behavior` | `/settings/website/{id}/email/behavior/` | DONE |
| 30 | `email/domain` | `/settings/website/{id}/email/domain/` | DONE |
| 31 | `email/delivery` | `/settings/website/{id}/email/delivery/` | DONE |

**Website ID:** `11a815c2-135f-464d-93ba-2d8c6ad1791a`

---

## Page 1: Account information — scrape notes

### Layout
- Content column: **710px** centered in ~940px settings pane
- Page title h2: **40px / 600**, color `#1c293b`
- "Automatically Saved" badge: `#F4F4F5` bg, `#E8EAEB` border, 4px radius, green check icon
- Warning banner below header: `#FFF5CC` bg, `#FACA00` border, yellow warning icon, inline bold action

### Sections
1. **Avatar** (h3 18px bold) — 120px circular image, horizontal upload row
2. **Personal Details** — 2-col grid, 343px fields, 24px gap
3. **Security** — horizontal link rows (label 140px + button), no card chrome

### Field tokens
- Label: 14px bold `#606976`
- Input box: `#F8F9F9` bg, `#E8EAEB` border, 4px radius, 40px height
- Filled value: 14px bold `#1c293b`
- Help: 13px bold `#8d949d`, margin-top 10px

### Footer
- "Looking to remove your Bybelt account?" + **"Delete your account there."** (bold `#75869c`, not blue link)
