# Backend — Real Data & Live Parity

**Approved:** 2026-06-26 · **Data source:** Own backend (SQLite → Postgres later)

## Goal

Replace mock/static behavior with a persistent backend that mirrors **chat.bybelt.com** flows. Each phase: **live QA → build → compare → sign-off → next**.

## Architecture

| Layer | Choice |
|-------|--------|
| Database | SQLite (`data/bybelt.db`) via Drizzle ORM |
| API | Next.js Route Handlers under `src/app/api/` |
| Auth | bcrypt passwords + JWT in httpOnly cookie (Edge-safe middleware) |
| Realtime | Phase U3+ (polling first, WebSocket later) |
| Marketing | **Frozen** — no backend changes on `/en/*` |

## Phase roadmap (app only)

| Phase | Live QA target | Build | Compare |
|-------|----------------|-------|---------|
| **U1** | Login form, session, redirect to inbox | Auth API + middleware + seed user | Login → inbox gate |
| **U2** | Inbox list + conversation select | DB conversations + GET APIs + wire UI | List matches seed / live structure |
| **U3** | Thread messages + compose | Messages table + POST send | Send/receive parity |
| **U4** | Visitors panel | Visitors API + map data | |
| **U5** | Contacts table + search | Contacts CRUD | |
| **U6** | Campaigns nav + empty states | Campaigns models | |
| **U7** | Helpdesk articles | Helpdesk models | |
| **U8** | Analytics dashboards | Analytics read models | |
| **U9** | Plugins install toggles | Plugins state | |
| **U10** | Settings toggles persist | Settings key-value per workspace | |
| **U11** | Global search | Search index API | |
| **U12** | WebSocket / realtime inbox | WS or SSE | |

## Per-phase workflow

1. **Live QA** — Document buttons/fields in `docs/research/backend/QA-U{n}-*.md` (browser on chat.bybelt.com)
2. **Spec** — API + schema delta
3. **Implement** — smallest vertical slice
4. **Compare** — manual + automated checks
5. **Sign-off** — update `docs/research/BACKEND_STATUS.md`

## Seed data

Initial seed from `src/lib/mock-inbox.ts` (FashionSis workspace) + default operator login.

## Env

```env
DATABASE_URL=file:./data/bybelt.db
SESSION_SECRET=change-me-in-production
SEED_USER_PASSWORD=...   # optional override for db:seed
SMOKE_BYPASS_AUTH=1      # smoke tests only
```
