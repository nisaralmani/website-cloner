# Deploy — Bybelt

## Prerequisites

- Node.js ≥ 24
- Vercel account (or any Node host that runs `next start`)

## VPS (chat.bybelt.com)

### Secrets (local only — never commit)

1. Copy `.env.vps.example` → `.env.vps` and fill in SSH + production secrets.
2. Copy `shopify-app/chat/.env.example` → `shopify-app/chat/.env` with Shopify Partners credentials.

Required in `.env.vps` for deploy:

| Variable | Purpose |
|----------|---------|
| `VPS_IP`, `VPS_USER`, `VPS_SSH_KEY_PATH`, `VPS_REMOTE_WWW_DIR` | SSH deploy target |
| `SESSION_SECRET` | Main app session signing (stable across deploys) |
| `BYBELT_INTERNAL_SECRET` | Shared secret for main app ↔ Shopify plugin |

`.env.production` files are generated on each deploy and are gitignored.

### Standard deploy (code only — does not touch production DB)

```bash
npm run deploy:vps
npm run deploy:shopify:vps
```

### Production database

Startup validation fails fast in production and **never silently falls back to
SQLite**. There are exactly two supported production configurations:

**1. PostgreSQL (preferred / target end-state).** Set `DATABASE_URL` and run
migrations before the first boot of a new schema:

```bash
# provision a reachable Postgres, then:
DATABASE_URL=postgresql://user:password@host:5432/bybelt npm run db:push:pg
# set DATABASE_URL=postgres://… in .env.production (survives deploy-vps as an extra key)
```

Post-deploy, confirm `GET /api/health` shows `checks.config.errors: 0` and
`checks.database.status: "ok"`, then smoke one authenticated route (health's
`select 1` proves connectivity, not that tables exist).

**2. Single-instance SQLite (current production posture, sanctioned for the
pilot scale of ≤~100 tenants).** This is what `npm run deploy:vps` generates
today. It requires a **deliberate, explicit dual opt-in** — production refuses
to boot on SQLite without both:

```bash
DATABASE_PATH=/app/data/bybelt.db
ALLOW_SQLITE_IN_PRODUCTION=true
```

`deploy-vps.mjs` writes both automatically (managed keys), and the app logs a
boot warning so the SQLite choice is always visible, never accidental. The
SQLite file is persisted via the `./data:/app/data` volume across deploys.

> **Bounded, not permanent.** This is a *transitional* posture, milestone-gated
> against the roadmap (SQLite is sanctioned at pilot scale; PostgreSQL is the
> M8 target, sequenced after the M1 schema-drift guard). Two properties keep it
> from becoming permanent debt:
> - **Single-writer interlock:** production refuses to boot if
>   `ALLOW_SQLITE_IN_PRODUCTION` is combined with `REDIS_URL` — Redis fan-out
>   implies multiple instances, and SQLite corrupts under concurrent writers.
>   SQLite in prod is therefore *enforced* single-instance, not merely advised.
> - **Postgres is the default:** the strict "require `DATABASE_URL`" validation
>   is the default path. Retiring SQLite requires **deleting two env lines**, not
>   changing code — the correct end-state is already the code's default.

### Migrating production SQLite → PostgreSQL (data-safe runbook)

A deliberate, separate operation from a code deploy — driven by the migration
toolkit (`scripts/migrate-sqlite-to-postgres.mts`, `npm run db:migrate:pg`). The
migrator is **read-only against SQLite**, idempotent/resumable (ON CONFLICT DO
NOTHING), copies every table in FK-dependency order preserving ids/timestamps/
foreign keys/ordering, runs the whole copy in **one transaction** (never a
partial commit), and validates row counts + FK integrity + required indexes
before commit — aborting and rolling back on any corruption.

Sequence this **after** the Master Plan M1 schema-drift guard so a dual-schema
divergence cannot ship. Do **not** switch `DATABASE_URL` without migrating the
data first — a fresh Postgres boots empty.

> **Maintenance window is mandatory for the real (non-dry-run) migration.**
> The migrator reads SQLite table-by-table with no shared snapshot across the
> 41 tables (each `SELECT` runs independently). If the live app keeps writing
> to SQLite while the migration is running, rows created or changed *during*
> the run can be silently absent from PostgreSQL — with no error, since the
> migrator only validates that what it read matches what it wrote, not
> whether newer rows arrived after it read a given table. **Stop the `chat`
> container (or otherwise fully quiesce writes to `data/bybelt.db`) before
> step 5**, and do not restart it until step 7 redeploys against PostgreSQL.
> The dry-run in step 4 is safe to run against a live system (it only reads),
> but treat its result as advisory, not authoritative, if writes were
> happening concurrently.

```bash
# 1. Back up SQLite (the migrator never writes/deletes it, but back up anyway).
ssh $VPS "cp /var/www/bybelt/chat/data/bybelt.db /var/www/bybelt/chat/data/bybelt.$(date +%F).bak"

# 2. Provision a reachable PostgreSQL and export its URL locally.
export MIGRATION_TARGET_URL='postgresql://user:password@host:5432/bybelt'

# 3. Push the schema (creates tables + required indexes) into PostgreSQL.
DATABASE_URL="$MIGRATION_TARGET_URL" npm run db:push:pg

# 4. DRY-RUN: copies + validates inside a transaction, then rolls back. Commits
#    nothing. Read the report; every table + FK check must pass. Safe to run
#    against a live system, but see the maintenance-window note above.
npm run db:migrate:pg -- --sqlite ./data/bybelt.db --dry-run --report ./migration-dryrun.json

# 5. STOP THE APP before the real run (docker compose stop chat, or equivalent)
#    so nothing writes to SQLite while it's being read. Then:
#    REAL migration (commits). Idempotent: re-run with --resume if interrupted.
npm run db:migrate:pg -- --sqlite ./data/bybelt.db --report ./migration.json

# 6. Switch the app to PostgreSQL: in .env.production set
#      DATABASE_URL=postgresql://…
#    and REMOVE both DATABASE_PATH and ALLOW_SQLITE_IN_PRODUCTION.
#    (Remove ALLOW_SQLITE_IN_PRODUCTION from deploy-vps.mjs coreEnv/managedKeys
#     so the generated env stops declaring SQLite.)

# 7. Deploy the app and verify health.
npm run deploy:vps
curl -s https://chat.bybelt.com/api/health | jq '.status, .checks.database.status, .checks.config.errors'
#   expect: "healthy"  "ok"  0    — then smoke one authenticated route.
```

Rollback: nothing was written to SQLite, so revert step 6 (`DATABASE_URL` back to
`DATABASE_PATH` + `ALLOW_SQLITE_IN_PRODUCTION=true`) and redeploy — the SQLite
volume is untouched.

**Before trusting this for a real cutover:** run `npm run test:migration`
against a throwaway PostgreSQL (`TEST_DATABASE_URL=postgres://… npm run
test:migration`). Without `TEST_DATABASE_URL` it only runs the deterministic,
DB-free structural + in-memory-adapter suite (safe for normal CI, never
requires Postgres). With it set, it additionally exercises the real adapter:
transactional rollback, composite-PK conflict targeting, timestamp/boolean/
NULL/UTF-8/numeric-precision round-trip fidelity, and unique-constraint
validation (named + inline `.unique()`) — all against a genuine PostgreSQL,
not a mock. This is a mandatory gate, not optional: it is the only way to
verify the real driver/wire-protocol behavior the dry-run/live steps above
depend on.

### One-off database sync (destructive)

Only when you intentionally want to overwrite production SQLite from local `data/bybelt.db`:

```bash
DEPLOY_SYNC_DB_CONFIRM=1 npm run sync:db:vps
```

### Shopify cron (daily contact sync)

Installs cron on VPS; secret lives in `/home/<user>/chat/.cron.env` (chmod 600), not in crontab:

```bash
npm run cron:shopify-install
```

Re-run after rotating `BYBELT_INTERNAL_SECRET`.

### Rotating secrets

1. Generate new `SESSION_SECRET` and/or `BYBELT_INTERNAL_SECRET`.
2. Update `.env.vps` with new values.
3. Run `npm run deploy:vps` and `npm run deploy:shopify:vps` (regenerates `.env.production` on server).
4. Run `npm run cron:shopify-install` if internal secret changed.
5. All users will need to log in again if `SESSION_SECRET` changed.

Production stack on Contabo VPS:

- **App:** Docker (`bybelt-chat`) on port **3004**
- **Shopify plugin:** Docker on port **3005**
- **Proxy:** nginx + Let's Encrypt SSL
- **Data:** SQLite at `/var/www/bybelt/chat/data/bybelt.db`
- **URL:** https://chat.bybelt.com

Redeploy after code changes:

```bash
npm run deploy:vps
```

Or manually on the server:

```bash
cd /var/www/bybelt/chat
docker compose -f docker-compose.prod.yml up -d --build
```

## Verify locally

```bash
npm run check:secrets        # fail if tracked files contain secrets
npm run check:no-mock        # fail if app/components import mock-* modules
npm run deploy:verify        # recommended pre-deploy gate
npm run check && npm run smoke
```

Critical authenticated journeys (requires seeded DB + running server on :3099):

```bash
DATABASE_PATH=./data/bybelt.db SESSION_SECRET=ci-smoke-secret npm run build
DATABASE_PATH=./data/bybelt.db SESSION_SECRET=ci-smoke-secret npx next start -p 3099
SESSION_SECRET=ci-smoke-secret E2E_BASE_URL=http://127.0.0.1:3099 npm run smoke:critical
E2E_SKIP_WEBSERVER=1 SESSION_SECRET=ci-smoke-secret E2E_BASE_URL=http://127.0.0.1:3099 npm run e2e:critical
```

Production Shopify smoke:

```bash
npm run smoke:shopify-all    # needs BYBELT_INTERNAL_SECRET in env
```

## Cache headers

`vercel.json` sets long cache for `/seo/*` and day cache for `/images/*`.

## Route count

- **97** static app routes (inbox, settings, campaigns, helpdesk, analytics, …)
- **19** marketing routes (`/en` + 18 sub-pages)
- **1** sitemap
