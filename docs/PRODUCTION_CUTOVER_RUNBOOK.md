# Bybelt — Production Cutover Runbook: SQLite → PostgreSQL

**Status:** Migration toolkit engineering-complete and independently certified against real PostgreSQL 16.14 (multiple independent runs, cross-verified via raw SQL outside the toolkit's own reporting).
**Scope:** This document is the execution runbook only. It does not revisit toolkit design or correctness — that work is done and verified. This is what an on-call/release engineer runs, in order, during the actual production cutover.
**Owner during execution:** One operator drives; one second-set-of-eyes reviews each checkpoint before proceeding to the next.

---

## Executive Summary

Production currently runs on single-instance SQLite (`ALLOW_SQLITE_IN_PRODUCTION=true`, `DATABASE_PATH=/app/data/bybelt.db`), the sanctioned pilot posture. This runbook cuts production over to PostgreSQL using the certified migration toolkit (`scripts/migrate-sqlite-to-postgres.mts`, `npm run db:migrate:pg`), which is transactional (single commit, full rollback on any validation failure), idempotent/resumable, and validates row counts, SHA-256 content checksums, foreign-key integrity, and unique-constraint presence before it will report success.

The cutover requires a **maintenance window** (the migrator has no cross-table read snapshot; concurrent writes to SQLite during the real run can be silently absent from the target). Expected total downtime is **10–20 minutes**; worst case **45 minutes** with a full rollback executed. Rollback is a config-and-redeploy operation only — SQLite is never written to, so there is no data-recovery step.

**READY FOR PRODUCTION CUTOVER: YES** (see §9 for the basis of this call and remaining operational risks).

---

## 1. Preconditions

Complete all of these **before** opening the maintenance window. None of these steps require downtime.

| # | Check | Command | Pass criteria |
|---|---|---|---|
| 1.1 | SSH access to VPS confirmed | `ssh -i "$VPS_SSH_KEY_PATH" $VPS_USER@$VPS_IP "echo ok"` | prints `ok` |
| 1.2 | Target PostgreSQL provisioned and reachable | `psql "$MIGRATION_TARGET_URL" -c "select version();"` (or `node -e` one-liner with `postgres` driver if no local `psql`) | returns PostgreSQL 14+ |
| 1.3 | PostgreSQL disk space | Check the provider's disk metrics, or `psql "$MIGRATION_TARGET_URL" -c "select pg_size_pretty(pg_database_size(current_database()));"` on an empty DB to confirm headroom | free space ≥ 5× current SQLite file size |
| 1.4 | VPS disk space for the SQLite backup | `ssh $VPS "df -h /var/www/bybelt/chat/data"` | free space ≥ 2× current `bybelt.db` size |
| 1.5 | Application version pinned | `ssh $VPS "cd $VPS_REMOTE_WWW_DIR/chat && git rev-parse HEAD 2>/dev/null || cat VERSION 2>/dev/null || echo unknown"` — record the running image tag (`docker inspect bybelt-chat --format '{{.Config.Image}}'`) | recorded, matches what's intended to redeploy in step 7 |
| 1.6 | Migration toolkit version | Confirm `scripts/migrate-sqlite-to-postgres.mts` and `scripts/lib/db-migrate/*` in the deploy bundle match what was certified (this runbook assumes the tree verified in the certification pass — no further toolkit changes since) | file hashes/timestamps match the certified tree |
| 1.7 | `npm run test:migration` passes locally, no DB | `npm run test:migration` | `21/21` (or current count) assertions pass, gracefully skips the `[pg]` block |
| 1.8 | `npm run test:migration` passes against a throwaway Postgres | `TEST_DATABASE_URL=postgres://... npm run test:migration` | all assertions pass, incl. all `[pg]`-prefixed ones |
| 1.9 | Required secrets available | `SESSION_SECRET`, `BYBELT_INTERNAL_SECRET` present in `.env.production`; new `DATABASE_URL` for Postgres prepared but **not yet applied** | present |
| 1.10 | Rollback plan reviewed | Read §7 of this document with the second operator before starting | acknowledged |
| 1.11 | Maintenance-mode communication | Notify stakeholders of the planned window (§8) | done |

**Gate:** Do not proceed to §2 until every row in this table is checked off.

---

## 2. Pre-Cutover Validation

Run these immediately before opening the maintenance window (last chance to abort with zero blast radius — nothing below writes anything).

### 2.1 SQLite integrity
```bash
ssh $VPS "sqlite3 /var/www/bybelt/chat/data/bybelt.db 'PRAGMA integrity_check;'"
```
**Expected:** single line `ok`. Any other output — **STOP**, do not proceed; the source file is suspect and must be investigated before any migration attempt.

### 2.2 PostgreSQL connectivity + version
```bash
node -e "const postgres=require('postgres'); const sql=postgres(process.env.MIGRATION_TARGET_URL,{max:1}); sql\`select version()\`.then(r=>{console.log(r[0].version); return sql.end();})"
```
**Expected:** `PostgreSQL 14.x` or higher.

### 2.3 Schema version / push status
```bash
DATABASE_URL="$MIGRATION_TARGET_URL" npm run db:push:pg
```
**Expected:** `Changes applied` (or `No changes detected` if already pushed this session). This is idempotent — safe to re-run.

### 2.4 Row counts (baseline, before migration)
```bash
ssh $VPS "sqlite3 /var/www/bybelt/chat/data/bybelt.db \"select name from sqlite_master where type='table';\"" | while read t; do
  ssh $VPS "sqlite3 /var/www/bybelt/chat/data/bybelt.db \"select '$t', count(*) from $t;\""
done
```
Record this output — it is the baseline §5.2 compares against.

### 2.5 Application health (pre-cutover baseline)
```bash
curl -s https://chat.bybelt.com/api/health | jq '.status, .checks.database.status, .checks.config.errors'
```
**Expected:** `"healthy"`, `"ok"`, `0`. If not healthy now, **do not start the cutover** — fix the current production issue first.

**Gate:** All five checks pass → proceed to §3.

---

## 3. Backup Strategy

### 3.1 Back up SQLite
```bash
ssh $VPS "cp /var/www/bybelt/chat/data/bybelt.db /var/www/bybelt/chat/data/bybelt.$(date +%Y%m%d-%H%M%S).bak"
```
The migrator never writes to SQLite, so this is defense-in-depth, not a dependency of the migration itself.

### 3.2 Verify the backup
```bash
ssh $VPS "sqlite3 /var/www/bybelt/chat/data/bybelt.$(date +%Y%m%d)*.bak 'PRAGMA integrity_check;'"
ssh $VPS "ls -la /var/www/bybelt/chat/data/*.bak"
```
**Expected:** `ok`, and the backup file size matches the live `bybelt.db` size at time of copy (±0, since `cp` is byte-exact for a static file once the app is stopped in §4).

### 3.3 Store the backup
```bash
scp -i "$VPS_SSH_KEY_PATH" "$VPS_USER@$VPS_IP:/var/www/bybelt/chat/data/bybelt.*.bak" ./backups/
```
Copy off-VPS to local/cold storage. Retain for at least 30 days post-cutover.

### 3.4 Restore procedure (verification only at this stage — do not execute unless rolling back)
```bash
ssh $VPS "cp /var/www/bybelt/chat/data/bybelt.<timestamp>.bak /var/www/bybelt/chat/data/bybelt.db"
```
This is a plain file copy — no database-specific restore tooling needed, since SQLite is a single file. Documented fully in §7.

---

## 4. Migration Execution

### 4.1 Open the maintenance window — stop the application
```bash
ssh $VPS "cd $VPS_REMOTE_WWW_DIR/chat && docker compose -f docker-compose.prod.yml stop chat"
```
**Verify stopped:**
```bash
ssh $VPS "docker ps --filter name=bybelt-chat --format '{{.Status}}'"
```
**Expected:** no output (container not running). From this point, nothing writes to `bybelt.db`.

### 4.2 Dry-run (final pre-flight, now with writes frozen)
```bash
ssh $VPS "cd $VPS_REMOTE_WWW_DIR/chat && npm run db:migrate:pg -- \
  --sqlite /app/data/bybelt.db \
  --postgres \"$MIGRATION_TARGET_URL\" \
  --dry-run --report ./migration-dryrun.json"
```
**Expected output (certification block):**
```
41/41 tables migrated
Checksums matched     YES
Foreign keys verified YES
Indexes verified      YES
READY FOR CUTOVER: NO (dry-run — nothing committed; re-run without --dry-run)
```
**Failure conditions:**
- `status: FAILED` + a `validation failures` list → **STOP**. Do not proceed to 4.3. Investigate the named table/check (most likely: schema not fully pushed → re-run §2.3; or a genuine data-integrity issue in that specific table → escalate, do not force through).
- Any table row count in the output looks implausible versus §2.4's baseline → **STOP** and investigate before continuing.

### 4.3 Real migration (commits)
```bash
ssh $VPS "cd $VPS_REMOTE_WWW_DIR/chat && npm run db:migrate:pg -- \
  --sqlite /app/data/bybelt.db \
  --postgres \"$MIGRATION_TARGET_URL\" \
  --report ./migration-live.json"
```
**Expected output:** identical shape to 4.2, but `READY FOR CUTOVER: YES`.

**Failure conditions:**
- Any validation failure → the migration has **already rolled back completely** (single-transaction guarantee — verified in certification). SQLite is untouched, the target Postgres has zero rows from this attempt. Investigate the reported cause; do **not** retry blindly — understand why before re-running.
- Process killed / network drop mid-run → Postgres's own transaction guarantees mean nothing partial is committed. Confirm with `--resume` (4.4) — it will report `0 tables migrated so far` if truly nothing landed, or complete cleanly if it can pick up from an already-partially-populated (but never partially-committed) target.

### 4.4 If interrupted: resume
```bash
ssh $VPS "cd $VPS_REMOTE_WWW_DIR/chat && npm run db:migrate:pg -- \
  --sqlite /app/data/bybelt.db \
  --postgres \"$MIGRATION_TARGET_URL\" \
  --resume --report ./migration-resume.json"
```
**Expected:** idempotent — either completes fully (if 4.3 never committed) or reports `0 copied / N skipped` (if 4.3 already fully succeeded and this is a redundant re-run).

---

## 5. Post-Migration Validation

Do not restart the application until every item below passes.

### 5.1 All tables + row counts (independent of the tool's own report)
```bash
node -e "
const postgres = require('postgres');
const { createClient } = require('@libsql/client');
(async () => {
  const sqlite = createClient({ url: 'file:/path/to/downloaded/bybelt.db' });
  const pg = postgres(process.env.MIGRATION_TARGET_URL, { max: 1 });
  const tables = await sqlite.execute(\"select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '__drizzle%'\");
  let mismatches = 0;
  for (const { name } of tables.rows) {
    const s = (await sqlite.execute(\`select count(*) as n from \"\${name}\"\`)).rows[0].n;
    const p = (await pg\`select count(*)::int as n from \${pg(name)}\`)[0].n;
    if (Number(s) !== Number(p)) { console.log('MISMATCH', name, s, p); mismatches++; }
  }
  console.log('tables:', tables.rows.length, 'mismatches:', mismatches);
  await pg.end();
})();
"
```
**Expected:** `mismatches: 0`.

### 5.2 Checksums, FK, unique constraints, indexes
Read the certification block from `migration-live.json` (or the console output from 4.3):
```bash
node -e "const d=require('./migration-live.json'); console.log(JSON.stringify(d.certification, null, 2))"
```
**Expected:** `checksumsMatched: true`, `foreignKeysVerified: true`, `indexesVerified: true`, `readyForCutover: true`.

Independent cross-check (do not rely solely on the tool's self-report):
```bash
node -e "
const postgres = require('postgres');
const sql = postgres(process.env.MIGRATION_TARGET_URL, { max: 1 });
(async () => {
  const orphans = await sql\`select count(*)::int as n from workspace_members wm where not exists (select 1 from users u where u.id = wm.user_id) or not exists (select 1 from workspaces w where w.id = wm.workspace_id)\`;
  console.log('orphans:', orphans[0].n);
  const uc = await sql\`select conname from pg_constraint where conrelid='users'::regclass and contype='u'\`;
  console.log('users unique constraints:', uc.map(r=>r.conname));
  await sql.end();
})();
"
```
**Expected:** `orphans: 0`, `users_email_unique` present.

### 5.3 Resume history / dry-run history
Confirm `migration-dryrun.json`, `migration-live.json` (and `migration-resume.json` if 4.4 was used) are all present on the VPS with `ok: true` in the final live report. Archive all three alongside the SQLite backup for the audit trail.

### 5.4 Switch the application to PostgreSQL
Edit `.env.production` on the VPS:
```
DATABASE_URL=postgresql://...   # the real MIGRATION_TARGET_URL
```
Remove these two lines entirely:
```
DATABASE_PATH=/app/data/bybelt.db
ALLOW_SQLITE_IN_PRODUCTION=true
```

### 5.5 Application startup
```bash
ssh $VPS "cd $VPS_REMOTE_WWW_DIR/chat && docker compose -f docker-compose.prod.yml up -d --build"
```
Watch startup logs for the fail-fast config gate:
```bash
ssh $VPS "docker logs bybelt-chat --tail 50"
```
**Expected:** `startup_complete status:ready`, dialect `postgres`, zero `startup_config_error` lines. If you see `startup_aborted` — the container will crash-loop; **STOP**, this means `DATABASE_URL` is missing or malformed in `.env.production`. Fix and redeploy; do not proceed to smoke tests.

### 5.6 API health
```bash
curl -s https://chat.bybelt.com/api/health | jq '.status, .checks.database.status, .checks.config.errors'
```
**Expected:** `"healthy"`, `"ok"`, `0`.

### 5.7 Login
Log in as a real operator account through the actual UI (not just an API call) — confirms session/auth reads correctly from PostgreSQL.

### 5.8 Conversations / inbox
Open the inbox; confirm the conversation list loads with the migrated data (real customer names/timestamps visible, not empty).

### 5.9 Feeds / realtime
Open a conversation and confirm the SSE stream connects (network tab shows `/api/inbox/stream` open, no immediate close) and a test message sent from another session appears live.

### 5.10 Background jobs
```bash
curl -s https://chat.bybelt.com/api/health | jq '.checks.jobs'
```
**Expected:** `status: "ok"`, no `degraded`/`draining` state stuck.

---

## 6. Smoke Tests (manual, exact steps)

Perform these in order, on the live post-cutover system, before declaring the cutover complete:

1. **Login** — log in with a real operator account. Confirm redirect to the inbox, no error toast.
2. **Inbox list loads** — confirm conversation count roughly matches the pre-migration baseline (§2.4's `conversations` row count).
3. **Open a conversation** — confirm messages load in order, timestamps look correct (not shifted/garbled).
4. **Send a message** — send a real message as operator; confirm it appears immediately (SSE) and persists on page reload.
5. **Contact/customer data** — open a contact record; confirm order/customer context (if Shopify-linked) still displays.
6. **Create a new conversation/contact** — confirms writes work against PostgreSQL, not just reads.
7. **Settings page loads** — confirms a non-inbox, non-trivial read path also works.
8. **Logout / login again** — confirms session lifecycle is intact end-to-end.
9. **Webhook/integration ping** (if applicable) — trigger one real inbound webhook (e.g., a test Shopify order) and confirm it's received and processed without error in logs.
10. **Check error tracker / logs** for 5 minutes post-cutover — confirm no elevated error rate versus pre-cutover baseline.

**Gate:** All 10 pass → cutover complete, close the maintenance window announcement. Any failure → evaluate against §7 (rollback) immediately; do not "wait and see" on a failed smoke test.

---

## 7. Rollback Procedure

Triggered by: failed post-migration validation (§5), failed smoke tests (§6), or any operator judgment call that production is unhealthy after cutover.

**Key fact this rollback relies on:** the migrator is read-only against SQLite. The source file was never modified. Rollback is a **configuration + redeploy** operation, not a data-recovery operation.

### 7.1 Database rollback
No action needed on the PostgreSQL side unless you intend to retry later — the target database can simply be abandoned/dropped, or left in place for a future retry (it will need `--resume` or a fresh push next time). SQLite itself requires no restore since it was never touched; if in doubt, restore from the §3 backup as a formality:
```bash
ssh $VPS "cp /var/www/bybelt/chat/data/bybelt.<backup-timestamp>.bak /var/www/bybelt/chat/data/bybelt.db"
```

### 7.2 Configuration rollback
Revert `.env.production` on the VPS:
```
DATABASE_PATH=/app/data/bybelt.db
ALLOW_SQLITE_IN_PRODUCTION=true
```
Remove the `DATABASE_URL=postgresql://...` line.

### 7.3 Application rollback
```bash
ssh $VPS "cd $VPS_REMOTE_WWW_DIR/chat && docker compose -f docker-compose.prod.yml up -d --build"
```
This redeploys with the current (unchanged) application image against the restored SQLite config — no image downgrade needed since no application code changed as part of this cutover, only the database backend.

### 7.4 Verification after rollback
Repeat §5.5 (startup logs, expect `dialect: sqlite`, `ALLOW_SQLITE_IN_PRODUCTION` warning present but `configOk: true`) and §5.6 (health = healthy). Then repeat smoke tests §6 items 1–4 (login, inbox, open conversation, send message) to confirm production is back to its known-good pre-cutover state.

**Total rollback time:** under 5 minutes (config edit + container restart) — this is the primary reason downtime risk is bounded (§8).

---

## 8. Downtime Estimate

| Scenario | Duration | Basis |
|---|---|---|
| **Minimum** | ~10 minutes | Stop app (1 min) → dry-run + live migration on real production data volume, comparable to the certified run (~1–2 sec for ~100 rows; scales roughly linearly, expect low seconds to low minutes for realistic production row counts) → env switch + redeploy + health check (5–8 min, dominated by container rebuild/startup) |
| **Expected** | ~15–20 minutes | Includes the full validation checklist (§5) and smoke tests (§6) performed carefully, not rushed |
| **Worst case (with full rollback)** | ~45 minutes | Migration or post-validation fails → investigate (10–15 min) → execute full rollback (§7, ~5 min) → re-verify rollback (5 min) → post-incident buffer |

---

## 9. Risk Assessment

Only genuine runtime risks — nothing hypothetical or architectural.

| Risk | Severity | Basis |
|---|---|---|
| Concurrent write to SQLite during the real migration window | **LOW** | Fully mitigated by §4.1 (app stopped before §4.3) — this is the one risk the toolkit itself cannot detect, but the runbook procedurally eliminates it by construction. Residual risk only if the maintenance-window step is skipped. |
| PostgreSQL target reachability/latency from the VPS at cutover time | **LOW** | Verified in §1.2/§2.2 before the window opens; a network-layer failure here aborts before any write occurs (fail-closed, not silently degraded). |
| Container restart taking longer than expected (image pull/build) | **MEDIUM** | Bounded but variable — dominates the "expected" downtime estimate. Mitigate by pre-pulling/pre-building the image before the window if possible. |
| Operator error executing commands against the wrong environment | **MEDIUM** | Mitigated by the two-operator review gate (this document's ownership model) and by every command in this runbook being copy-paste exact, not free-form. |
| Session-timezone-dependent behavior for raw SQL timestamp literals | **LOW** | Investigated during certification: the actual toolkit inserts via parameterized `Date` objects (not string literals), which round-trip with zero drift regardless of server session timezone — confirmed by direct test. Not a risk to the actual migration path. |
| Post-cutover connection-pool sizing under real production load | **MEDIUM** | The toolkit and app use a bounded pool (`max: 5`/`max: 10`); not exercised at full production concurrency during certification (certification used representative dev-scale data). Standard operational monitoring (§5.10, error tracker) is the mitigation — not a migration-correctness risk, a scale-operations concern to watch in the hours after cutover. |

No risk above is classified HIGH — none identified that isn't already procedurally mitigated by this runbook's ordering (maintenance window, backup-first, transactional migration, independent post-validation, fast rollback).

---

## Final Decision

**READY FOR PRODUCTION CUTOVER: YES**

The migration toolkit is engineering-complete and has been independently certified against real PostgreSQL, including cross-verification via raw SQL outside its own self-reporting. Every operational risk identified above is LOW or MEDIUM and already carries a concrete mitigation embedded in this runbook's step ordering. No genuine runtime blocker exists. Proceed per §1 preconditions, execute in the exact order given, and do not skip any gate.
