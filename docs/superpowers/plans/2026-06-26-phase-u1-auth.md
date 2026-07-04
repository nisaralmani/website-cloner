# Phase U1 — Auth & Session

> **For agentic workers:** Live QA → implement → compare before U2.

**Goal:** Real login against SQLite user table; protect app routes; smoke bypass for CI.

**Architecture:** Drizzle + SQLite, JWT session cookie, Next.js middleware.

**Tech Stack:** drizzle-orm, better-sqlite3, bcryptjs, jose

---

## Queue

| Step | Task |
|------|------|
| U1.1 | Drizzle schema (users, workspaces, members) |
| U1.2 | `db:push` + `db:seed` (FashionSis operator) |
| U1.3 | `POST /api/auth/login`, `logout`, `GET /api/auth/session` |
| U1.4 | Middleware — redirect unauthenticated app routes |
| U1.5 | Wire `LoginPage` + smoke `SMOKE_BYPASS_AUTH` |

## Default credentials (dev seed)

- Email: `contact@fashionpara.com`
- Password: `SEED_USER_PASSWORD` env or `fashionsis-dev`

## Compare checklist

- [ ] Empty password → submit disabled
- [ ] Wrong password → error message
- [ ] Valid login → redirect `/`
- [ ] `/agent` without cookie → `/initiate/login`
- [ ] `/en` without cookie → still public
- [ ] `npm run smoke` still passes
