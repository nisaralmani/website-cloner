# Phase U15 — Postgres production

**Goal:** Same app code runs on SQLite (local) or PostgreSQL (production) via `DATABASE_URL`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U15.1 | Dialect detection (`sqlite` / `postgres`) | **done** |
| U15.2 | `schema.pg.ts` + drizzle-kit push config | **done** |
| U15.3 | Async `getDb()` with libsql + postgres-js | **done** |
| U15.4 | Migrate all API routes to async queries | **done** |
| U15.5 | Docs + verify | **done** |

## Compare checklist

- [x] Default local dev still uses SQLite file
- [x] `DATABASE_URL=postgresql://...` switches to Postgres
- [x] `npm run db:push:pg` applies schema to Postgres
- [x] `npm run check` passes

## Local (SQLite)

```bash
npm run db:seed
npm run dev
```

Uses `DATABASE_PATH` or `file:./data/bybelt.db` via libSQL.

## Production (PostgreSQL)

```bash
export DATABASE_URL=postgresql://user:pass@host:5432/crisp
npm run db:push:pg
npm run db:seed   # seeds when DB is empty
npm run build && npm start
```

## Notes

- `db:seed` uses better-sqlite3 DDL for local file setup; Postgres relies on `db:push:pg`.
- Turso/libSQL remote URLs can be added later with the same libsql client.
