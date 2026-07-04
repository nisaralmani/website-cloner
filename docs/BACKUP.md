# Backup Procedures

Recurring backup guidance for the running production database. This is
separate from [PRODUCTION_CUTOVER_RUNBOOK.md](PRODUCTION_CUTOVER_RUNBOOK.md)
§3, which covers the one-time backup taken immediately before a SQLite →
PostgreSQL cutover. This document covers ongoing, routine backups of
whichever database is currently in production.

**Current state: no automated backup job exists in this repository.**
Backups today are a manual operator action. If you need scheduled backups,
add a cron entry per the manual procedure below (analogous to the existing
`npm run cron:shopify-install` pattern in [DEPLOY.md](DEPLOY.md)) — that
automation does not exist yet and is out of scope for this document to
invent.

## SQLite (current sanctioned production posture)

Production data lives in a single file: `/var/www/bybelt/chat/data/bybelt.db`.

```bash
# 1. Copy the live file (SQLite readers do not block this, but prefer low-traffic windows)
ssh $VPS "cp /var/www/bybelt/chat/data/bybelt.db /var/www/bybelt/chat/data/bybelt.$(date +%Y%m%d-%H%M%S).bak"

# 2. Verify integrity of the copy
ssh $VPS "sqlite3 /var/www/bybelt/chat/data/bybelt.<timestamp>.bak 'PRAGMA integrity_check;'"
# Expected: ok

# 3. Copy off-VPS to durable/cold storage
scp -i "$VPS_SSH_KEY_PATH" "$VPS_USER@$VPS_IP:/var/www/bybelt/chat/data/bybelt.*.bak" ./backups/
```

**Recommended cadence:** daily, retained for at least 30 days, consistent
with the retention window already used for cutover backups
(`PRODUCTION_CUTOVER_RUNBOOK.md` §3.3).

**Restore:** stop the app container, copy the chosen `.bak` file back to
`bybelt.db`, restart. This is a plain file copy — no database-specific
restore tooling, since SQLite is a single file (same procedure as
`PRODUCTION_CUTOVER_RUNBOOK.md` §7.1).

## PostgreSQL (once migrated)

Use standard PostgreSQL backup tooling (`pg_dump` / your hosting provider's
managed backup feature) against the `DATABASE_URL` target. This repository's
migration toolkit (`scripts/migrate-sqlite-to-postgres.mts`) is a one-time
SQLite→Postgres data-mover, not a backup tool — do not repurpose it for
recurring Postgres backups.

```bash
pg_dump "$DATABASE_URL" -Fc -f "bybelt-$(date +%Y%m%d-%H%M%S).dump"
```

**Recommended cadence:** follow your PostgreSQL host's point-in-time-recovery
(WAL archiving) feature if available, in addition to a daily logical dump as
a portable fallback.

## What is out of scope here

- Backing up `REDIS_URL` state — Redis is used only for realtime SSE fan-out
  cache, not source-of-truth data; it is not backed up or restored.
- Backing up uploaded files under `public/uploads/` — not currently covered
  by any backup procedure in this repository; back up that directory
  alongside the database if it holds production content.
