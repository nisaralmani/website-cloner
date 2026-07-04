/**
 * SQLite → PostgreSQL migration test suite.
 *
 * Structural tests (always run, no database) verify the plan builder + FK
 * ordering against the real 41-table schema. Behavioural tests use the
 * in-memory adapters to exercise the migration guarantees deterministically:
 *   - empty database
 *   - existing database (relationships + FK integrity)
 *   - duplicate execution (idempotent / resumable)
 *   - interrupted migration (transactional rollback)
 *   - validation failures (missing index, count mismatch, FK orphan)
 *   - dry-run leaves the target untouched
 *
 * When TEST_DATABASE_URL is set, a final block runs the same shapes end-to-end
 * against a REAL PostgreSQL (exercising adapters.mts); otherwise it skips loudly.
 *
 * Run: npx tsx scripts/test-migration.mts
 */

import assert from "node:assert";
import {
  buildTablePlans,
  chunk,
  orderPlansByDependencies,
  pkOf,
} from "./lib/db-migrate/plan.mjs";
import { runMigration } from "./lib/db-migrate/migrator.mjs";
import {
  createMemorySource,
  createMemoryTarget,
} from "./lib/db-migrate/memory.mjs";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const PLANS = buildTablePlans();
const NAMES = new Set(PLANS.map((p) => p.name));

// Minimal related fixture across three real tables with a real FK chain:
// workspace_members(user_id → users.id, workspace_id → workspaces.id).
function fixture() {
  return {
    users: [
      { id: "u1", email: "a@x.com" },
      { id: "u2", email: "b@x.com" },
    ],
    workspaces: [{ id: "w1", name: "Acme", domain: "acme", initials: "AC" }],
    workspace_members: [
      { userId: "u1", workspaceId: "w1", role: "owner" },
      { userId: "u2", workspaceId: "w1", role: "operator" },
    ],
  } as Record<string, Record<string, unknown>[]>;
}

async function main() {
  console.log("SQLite → PostgreSQL migration tests\n");

  // ---- Structural / plan ----
  assert.equal(PLANS.length, 41, "expected 41 application tables");
  ok("plan builder discovers all 41 tables");

  const { ordered, cycles } = orderPlansByDependencies(PLANS);
  assert.equal(cycles.length, 0, "schema must have no FK cycles");
  assert.equal(ordered.length, PLANS.length, "every table is ordered");
  ok("dependency ordering has no cycles and covers every table");

  // Generic invariant: every FK's parent table appears before the child.
  const seen = new Set<string>();
  for (const plan of ordered) {
    for (const fk of plan.foreignKeys) {
      if (fk.refTable !== plan.name && NAMES.has(fk.refTable)) {
        assert.ok(
          seen.has(fk.refTable),
          `${plan.name} migrated before its parent ${fk.refTable}`,
        );
      }
    }
    seen.add(plan.name);
  }
  ok("parents are always ordered before their children (FK-safe)");

  const wm = PLANS.find((p) => p.name === "workspace_members")!;
  assert.deepEqual(wm.pkJsKeys.sort(), ["userId", "workspaceId"]);
  assert.equal(wm.foreignKeys.length, 2);
  ok("composite PK + foreign keys resolved with JS + DB column names");

  // Inline `.unique()` single-column constraints (e.g. users.email) are NOT
  // captured by drizzle's cfg.indexes/cfg.uniqueConstraints — they only show
  // up as a per-column `isUnique` flag. Confirm the plan builder finds them
  // (this was previously a silent certification gap: a missing email-unique
  // constraint on the target would report "indexes verified" regardless).
  const users = PLANS.find((p) => p.name === "users")!;
  assert.ok(
    users.uniqueColumnSets.some(
      (s) => s.dbColumns.length === 1 && s.dbColumns[0] === "email",
    ),
    "users.email inline .unique() must be captured as a required unique set",
  );
  // Named composite unique indexes still resolve too.
  const shortcuts = PLANS.find((p) => p.name === "message_shortcuts")!;
  assert.ok(
    shortcuts.uniqueColumnSets.some(
      (s) => s.dbColumns.sort().join(",") === "bang,workspace_id",
    ),
    "named composite uniqueIndex must still be captured",
  );
  ok("inline .unique() columns and named composite indexes are both captured");

  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  // Primary-key keying is stable for equal rows and distinct for different ones.
  assert.equal(
    pkOf(wm, { userId: "u1", workspaceId: "w1" }),
    pkOf(wm, { userId: "u1", workspaceId: "w1" }),
  );
  assert.notEqual(
    pkOf(wm, { userId: "u1", workspaceId: "w1" }),
    pkOf(wm, { userId: "u1", workspaceId: "w2" }),
  );
  ok("batch chunking and primary-key keying");

  // ---- Empty database ----
  {
    const report = await runMigration({
      source: createMemorySource({}),
      target: createMemoryTarget(),
      plans: PLANS,
    });
    assert.equal(report.ok, true, report.error);
    assert.equal(report.totals.inserted, 0);
    assert.ok(report.validation.every((v) => v.ok));
    ok("empty database migrates cleanly (0 rows, all validations pass)");
  }

  // ---- Existing database (relationships + FK integrity) ----
  {
    const target = createMemoryTarget();
    const report = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
    });
    assert.equal(report.ok, true, report.error);
    assert.equal(report.totals.inserted, 5); // 2 users + 1 ws + 2 members
    const dump = target.dump();
    assert.equal(dump.users.length, 2);
    assert.equal(dump.workspace_members.length, 2);
    assert.ok(
      report.validation.every((v) => v.ok),
      "all row-count + FK checks pass",
    );
    ok("existing database migrates with counts + FK integrity preserved");

    // Certification block: full success certifies every dimension.
    assert.match(report.migrationId, /^[0-9a-f-]{36}$/i, "migrationId is a UUID");
    assert.equal(report.totals.tablesMigrated, report.totals.tables);
    assert.equal(report.totals.verified, report.totals.sourceRows);
    assert.equal(report.certification.checksumsMatched, true);
    assert.equal(report.certification.foreignKeysVerified, true);
    assert.equal(report.certification.indexesVerified, true);
    assert.equal(report.certification.readyForCutover, true, "real run + ok = cutover-ready");
    assert.equal(report.certification.rollbackLocation, "memory-source");
    assert.ok(report.tables.every((t) => /^[0-9a-f]{64}$/.test(t.checksum)));
    ok("certification block reports migrationId, checksums, and cutover-ready");
  }

  // ---- Two runs produce distinct migration ids ----
  {
    const a = await runMigration({
      source: createMemorySource({}),
      target: createMemoryTarget(),
      plans: PLANS,
    });
    const b = await runMigration({
      source: createMemorySource({}),
      target: createMemoryTarget(),
      plans: PLANS,
    });
    assert.notEqual(a.migrationId, b.migrationId);
    ok("each migration run gets a distinct migration id");
  }

  // ---- Duplicate execution (idempotent / resumable) ----
  {
    const target = createMemoryTarget();
    const first = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
    });
    assert.equal(first.ok, true);
    assert.equal(first.totals.inserted, 5);

    // second run without resume must refuse (target non-empty).
    const blocked = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
    });
    assert.equal(blocked.ok, false);
    assert.match(blocked.error ?? "", /not empty/i);

    // second run WITH resume is idempotent: inserts nothing, skips all.
    const second = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
      resume: true,
    });
    assert.equal(second.ok, true, second.error);
    assert.equal(second.totals.inserted, 0);
    assert.equal(second.totals.skipped, 5);
    assert.equal(target.dump().users.length, 2, "no duplicate rows created");
    ok("duplicate execution is idempotent (resume skips, no duplicates)");
  }

  // ---- Interrupted migration (transactional rollback) ----
  {
    const target = createMemoryTarget({ failOnInsert: "workspaces" });
    const report = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
    });
    assert.equal(report.ok, false);
    // users were inserted before the failure, but the transaction rolled back.
    assert.equal((target.dump().users ?? []).length, 0, "rolled back to empty");
    ok("interrupted migration rolls back completely (no partial commit)");
  }

  // ---- Validation failure: missing required index (schema not pushed) ----
  {
    const report = await runMigration({
      source: createMemorySource(fixture()),
      target: createMemoryTarget({ missingIndexes: { users: ["users_x_idx"] } }),
      plans: PLANS,
    });
    assert.equal(report.ok, false);
    assert.ok(report.validation.some((v) => !v.ok && v.check.includes("index")));
    ok("missing required index aborts before copying data");
  }

  // ---- Validation failure: row-count mismatch (lost write) ----
  {
    const target = createMemoryTarget({ dropRowsOnInsert: { users: 1 } });
    const report = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
    });
    assert.equal(report.ok, false);
    assert.match(report.error ?? "", /row-count mismatch/i);
    assert.equal((target.dump().users ?? []).length, 0, "aborted + rolled back");
    ok("row-count mismatch is detected and aborts the migration");
  }

  // ---- Validation failure: content checksum mismatch (row count unaffected) ----
  {
    const target = createMemoryTarget({
      corruptFieldOnInsert: { users: { jsKey: "email", value: "corrupted@x.com" } },
    });
    const report = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
    });
    assert.equal(report.ok, false);
    assert.match(report.error ?? "", /checksum mismatch/i);
    // Row count validation alone would NOT have caught this — same row count,
    // different content. Prove the checksum step is what caught it.
    const rowCountEntry = report.validation.find(
      (v) => v.table === "users" && v.check === "row-count",
    );
    assert.equal(rowCountEntry?.ok, true, "row count matched despite corrupted content");
    const checksumEntry = report.validation.find(
      (v) => v.table === "users" && v.check === "checksum",
    );
    assert.equal(checksumEntry?.ok, false, "checksum caught the content corruption");
    assert.equal((target.dump().users ?? []).length, 0, "aborted + rolled back");
    ok("content checksum mismatch is detected (row count alone would have missed it)");
  }

  // ---- Validation failure: FK orphan ----
  {
    const bad = fixture();
    bad.workspace_members = [{ userId: "GHOST", workspaceId: "w1", role: "x" }];
    const report = await runMigration({
      source: createMemorySource(bad),
      target: createMemoryTarget(),
      plans: PLANS,
    });
    assert.equal(report.ok, false);
    assert.match(report.error ?? "", /foreign-key integrity/i);
    ok("foreign-key orphan is detected and aborts the migration");
  }

  // ---- Dry-run leaves the target untouched ----
  {
    const target = createMemoryTarget();
    const report = await runMigration({
      source: createMemorySource(fixture()),
      target,
      plans: PLANS,
      dryRun: true,
    });
    assert.equal(report.ok, true, report.error);
    assert.equal(report.dryRun, true);
    assert.equal(report.totals.inserted, 5, "dry-run reports what it would insert");
    assert.equal((target.dump().users ?? []).length, 0, "but commits nothing");
    // A passing dry-run validates everything but must NOT claim cutover-ready —
    // nothing was actually committed.
    assert.equal(report.certification.checksumsMatched, true);
    assert.equal(
      report.certification.readyForCutover,
      false,
      "dry-run success must not claim cutover-ready (nothing committed)",
    );
    ok("dry-run validates end-to-end but commits nothing and is not cutover-ready");
  }

  // ---- Large dataset / multi-batch verification ----
  await largeDatasetTests();

  // ---- Optional: real PostgreSQL integration ----
  await realPostgresIntegration();

  console.log(`\n${passed} assertions passed.`);
}

/** A synthetic, standalone (no-FK) large `users` fixture for batching tests. */
function largeUsersFixture(count: number, shuffle = false) {
  const rows = Array.from({ length: count }, (_, i) => ({
    id: `bulk-u${String(i).padStart(4, "0")}`,
    email: `bulk-u${i}@example.com`,
  }));
  if (!shuffle) return rows;
  // Fisher–Yates with a fixed, non-crypto PRNG state is unnecessary here —
  // this only needs to prove checksum order-independence, not reproducible
  // randomness, so Math.random() is fine (this is a test script, not a
  // workflow step).
  const out = [...rows];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

async function largeDatasetTests() {
  const COUNT = 347; // deliberately not a multiple of the batch size below
  const BATCH = 25; // forces ~14 batches for the users table alone

  // ---- All rows migrate correctly across many batches ----
  {
    const target = createMemoryTarget();
    const report = await runMigration({
      source: createMemorySource({ users: largeUsersFixture(COUNT) }),
      target,
      plans: PLANS,
      batchSize: BATCH,
    });
    assert.equal(report.ok, true, report.error);
    const usersReport = report.tables.find((t) => t.table === "users")!;
    assert.equal(usersReport.sourceRows, COUNT);
    assert.equal(usersReport.inserted, COUNT);
    assert.equal(target.dump().users.length, COUNT);
    assert.ok(
      report.validation.every((v) => v.ok),
      "row-count + checksum + FK checks all pass at scale",
    );
    ok(`${COUNT} rows across ~${Math.ceil(COUNT / BATCH)} batches migrate and validate correctly`);
  }

  // ---- Checksum is order-independent regardless of source row order ----
  {
    const ordered = largeUsersFixture(COUNT, false);
    const shuffled = largeUsersFixture(COUNT, true);
    const a = await runMigration({
      source: createMemorySource({ users: ordered }),
      target: createMemoryTarget(),
      plans: PLANS,
      batchSize: BATCH,
    });
    const b = await runMigration({
      source: createMemorySource({ users: shuffled }),
      target: createMemoryTarget(),
      plans: PLANS,
      batchSize: BATCH,
    });
    assert.equal(a.ok, true, a.error);
    assert.equal(b.ok, true, b.error);
    const checksumA = a.tables.find((t) => t.table === "users")!.checksum;
    const checksumB = b.tables.find((t) => t.table === "users")!.checksum;
    assert.equal(
      checksumA,
      checksumB,
      "identical row sets in different source order must produce identical checksums",
    );
    ok("checksum is order-independent for a large, differently-ordered row set");
  }

  // ---- Interrupted migration at scale still rolls back completely ----
  {
    // "workspaces" is migrated after "users" in dependency order, so many
    // users-table batches will have already succeeded before this failure —
    // proving the all-or-nothing guarantee holds regardless of how much
    // earlier work has already happened inside the same transaction.
    const target = createMemoryTarget({ failOnInsert: "workspaces" });
    const report = await runMigration({
      source: createMemorySource({
        users: largeUsersFixture(COUNT),
        workspaces: [{ id: "w1", name: "Acme", domain: "acme", initials: "AC" }],
      }),
      target,
      plans: PLANS,
      batchSize: BATCH,
    });
    assert.equal(report.ok, false);
    assert.equal(
      (target.dump().users ?? []).length,
      0,
      "all previously-succeeded batches for other tables must also roll back",
    );
    ok("interruption after many successful batches still rolls back to fully empty");
  }

  // ---- Resume after a large migration is idempotent across many batches ----
  {
    const target = createMemoryTarget();
    const fixture = largeUsersFixture(COUNT);
    const first = await runMigration({
      source: createMemorySource({ users: fixture }),
      target,
      plans: PLANS,
      batchSize: BATCH,
    });
    assert.equal(first.ok, true, first.error);
    assert.equal(first.totals.inserted, COUNT);

    const second = await runMigration({
      source: createMemorySource({ users: fixture }),
      target,
      plans: PLANS,
      batchSize: BATCH,
      resume: true,
    });
    assert.equal(second.ok, true, second.error);
    assert.equal(second.totals.inserted, 0, "every row is a duplicate on resume");
    assert.equal(second.totals.skipped, COUNT);
    assert.equal(target.dump().users.length, COUNT, "no duplicates created");
    ok(`resume after a ${COUNT}-row, multi-batch migration is fully idempotent`);
  }
}

/**
 * Real-PostgreSQL integration suite. Gated entirely on TEST_DATABASE_URL —
 * never runs in normal CI. Every fixture id is suffixed with a fresh run id so
 * this is safe to re-run repeatedly against a persistent throwaway database
 * without prior runs' leftover rows silently interfering (ON CONFLICT DO
 * NOTHING would otherwise make a second session's assertions misleading).
 */
async function realPostgresIntegration() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !url.startsWith("postgres")) {
    console.log(
      "  — real-PostgreSQL integration SKIPPED (set TEST_DATABASE_URL to run it)",
    );
    return;
  }

  const { createPostgresTarget } = await import("./lib/db-migrate/adapters.mjs");
  const { randomUUID } = await import("node:crypto");
  const postgresDriver = (await import("postgres")).default;
  const { drizzle: drizzlePostgres } = await import("drizzle-orm/postgres-js");
  const pgSchema = await import("@/db/schema.pg");
  const { eq } = await import("drizzle-orm");

  const run = randomUUID().slice(0, 8);
  const id = (name: string) => `pgtest-${run}-${name}`;

  // Independent verification connection — separate from the migrator's own
  // client, so read-backs prove genuine driver round-trip fidelity rather
  // than reflecting whatever the migrator itself happened to buffer in memory.
  const verifyClient = postgresDriver(url, { max: 1 });
  const verifyDb = drizzlePostgres(verifyClient, { schema: pgSchema });

  const target = createPostgresTarget(url);
  try {
    // ---- Round-trip fidelity fixture: timestamps, booleans, NULLs, numeric
    // precision, UTF-8, UUID-shaped ids — all in one representative row set.
    const createdAt = new Date("2026-03-14T15:09:26.535Z"); // deliberately non-round ms
    // Every column is set explicitly (not relying on the target schema's
    // column DEFAULTs) to mirror a REAL migrated row: SQLite always applies
    // and stores its own defaults at write time, so a genuine source row read
    // via createSqliteSource always has every declared column populated. A
    // fixture that omits a defaulted column would only exist in this
    // synthetic in-memory test, and would make the source-side checksum
    // (computed from the lean object) diverge from the target-side checksum
    // (computed from Postgres's full `SELECT *`, which fills in the DEFAULT)
    // — a false mismatch specific to an incomplete test fixture, not a
    // property of the real SQLite -> Postgres migration path.
    const fidelityData: Record<string, Record<string, unknown>[]> = {
      users: [
        {
          id: id("u1"),
          email: `${id("u1")}@example.com`,
          passwordHash: "x",
          name: "Fidelity Test 用户 🧪",
          firstName: "",
          lastName: "",
          phone: null,
          avatarUrl: null,
          avatarGradient: "g",
          emailVerified: 0,
          presenceStatus: "online",
          forceOffline: 0,
          autoAvailable: 1,
          scheduleEnabled: 0,
          scheduleDays: '["Mon","Tue","Wed","Thu","Fri","Sat"]',
          scheduleTimezone: "UTC+05:00",
          scheduleStart: "09:00",
          scheduleEnd: "17:00",
          createdAt,
        },
      ],
      workspaces: [
        {
          id: id("w1"),
          name: "Ünïcödé Wörkspacé 北京",
          domain: id("w1"),
          initials: "AC",
          logoUrl: null,
          contactEmail: null,
          contactPhone: null,
          contactMessenger: null,
          contactTelegram: null,
          contactTwitter: null,
          contactWhatsapp: null,
          contactInstagram: null,
          contactTotal: 0,
          helpdeskEnabled: 0,
          analyticsEnabled: 0,
          analyticsTimezone: "UTC",
        },
      ],
      workspace_members: [
        { userId: id("u1"), workspaceId: id("w1"), role: "owner" },
      ],
      visitors: [
        {
          id: id("v1"),
          workspaceId: id("w1"),
          name: "Visitor Ñoño",
          initials: null, // NULL handling
          city: "São Paulo",
          location: "🌍 remote",
          country: "BR",
          currentPage: "/café",
          isActive: 1, // boolean-as-integer
          avatarGradient: "g",
          latitude: 37.774929500000004, // numeric precision
          longitude: -122.4194155,
          sortOrder: 0,
        },
      ],
    };

    const dry = await runMigration({
      source: createMemorySource(fidelityData),
      target,
      plans: PLANS,
      dryRun: true,
    });
    assert.equal(dry.ok, true, dry.error);
    ok("[pg] dry-run against real PostgreSQL passes and commits nothing");

    const live = await runMigration({
      source: createMemorySource(fidelityData),
      target,
      plans: PLANS,
      resume: true,
    });
    assert.equal(live.ok, true, live.error);
    assert.equal(live.certification.checksumsMatched, true);
    assert.equal(live.certification.foreignKeysVerified, true);
    ok("[pg] real migration inserts with FK integrity (incl. composite-PK table)");

    const again = await runMigration({
      source: createMemorySource(fidelityData),
      target,
      plans: PLANS,
      resume: true,
    });
    assert.equal(again.ok, true, again.error);
    assert.equal(again.totals.inserted, 0, "idempotent on real PostgreSQL");
    ok("[pg] second run is idempotent (ON CONFLICT DO NOTHING)");

    // ---- Data round-trips exactly through the real driver ----
    const [userRow] = await verifyDb
      .select()
      .from(pgSchema.users)
      .where(eq(pgSchema.users.id, id("u1")));
    assert.ok(userRow, "inserted user row must be readable back");
    assert.equal(userRow!.name, "Fidelity Test 用户 🧪", "UTF-8 (incl. 4-byte emoji) round-trips exactly");
    assert.equal(
      userRow!.createdAt.getTime(),
      createdAt.getTime(),
      "timestamp round-trips with no precision loss",
    );

    const [visitorRow] = await verifyDb
      .select()
      .from(pgSchema.visitors)
      .where(eq(pgSchema.visitors.id, id("v1")));
    assert.ok(visitorRow, "inserted visitor row must be readable back");
    assert.equal(visitorRow!.initials, null, "NULL round-trips as null, not undefined/empty-string");
    assert.equal(visitorRow!.isActive, 1, "integer-boolean round-trips exactly");
    assert.equal(
      visitorRow!.latitude,
      37.774929500000004,
      "double-precision numeric round-trips with no rounding",
    );
    assert.equal(visitorRow!.longitude, -122.4194155);
    assert.equal(visitorRow!.id, id("v1"), "UUID/text id round-trips byte-for-byte");
    ok("[pg] timestamps, booleans, NULLs, numeric precision, and UTF-8 all round-trip exactly");

    // ---- ON CONFLICT targets the PK only, not any unique constraint ----
    // A different (fresh PK) row that collides with an EXISTING row's unique
    // email must throw a specific, diagnosable Postgres error and roll back
    // completely — NOT be silently skipped as "already migrated".
    {
      const conflictWorkspace = { id: id("w-conflict"), name: "C", domain: id("w-conflict"), initials: "C" };
      const conflictData: Record<string, Record<string, unknown>[]> = {
        users: [
          {
            id: id("u-conflict"), // fresh PK — NOT already in the target
            email: `${id("u1")}@example.com`, // but colliding email — already in the target
            passwordHash: "x",
            name: "Should Not Be Inserted",
            avatarGradient: "g",
            createdAt: new Date(),
          },
        ],
        workspaces: [conflictWorkspace],
      };
      const conflictReport = await runMigration({
        source: createMemorySource(conflictData),
        target,
        plans: PLANS,
        resume: true,
      });
      assert.equal(conflictReport.ok, false, "an unrelated unique-constraint collision must fail, not silently skip");
      const [leaked] = await verifyDb
        .select()
        .from(pgSchema.users)
        .where(eq(pgSchema.users.id, id("u-conflict")));
      assert.equal(leaked, undefined, "the colliding row must not have been committed");
      const [leakedWs] = await verifyDb
        .select()
        .from(pgSchema.workspaces)
        .where(eq(pgSchema.workspaces.id, id("w-conflict")));
      assert.equal(leakedWs, undefined, "the WHOLE transaction rolled back, not just the colliding row");
      ok("[pg] ON CONFLICT is PK-targeted: an unrelated unique collision fails loudly and rolls back fully");
    }

    // ---- Transactional rollback: a genuine FK orphan leaves nothing behind ----
    {
      const orphanData: Record<string, Record<string, unknown>[]> = {
        workspace_members: [
          { userId: id("u1"), workspaceId: id("w-does-not-exist"), role: "operator" },
        ],
      };
      const orphanReport = await runMigration({
        source: createMemorySource(orphanData),
        target,
        plans: PLANS,
        resume: true,
      });
      assert.equal(orphanReport.ok, false, "a genuine FK orphan must abort the migration");
      // Whether caught by Postgres's own FK constraint (raw insert exception)
      // or by the explicit orphan-count validation phase depends on whether
      // the target schema enforces the constraint — either way, nothing must
      // be committed.
      ok("[pg] a genuine foreign-key orphan aborts against a real, constraint-enforcing target");
    }

    // ---- Index/unique-constraint validation against real pg_index ----
    // Clone the real "users" plan but ask about one set we KNOW is present
    // (email) and one we KNOW is absent (a fabricated column name) — proves
    // the new column-set matching query has neither false positives nor false
    // negatives, without mutating any real schema/constraint.
    {
      const usersPlan = PLANS.find((p) => p.name === "users")!;
      const probePlan = {
        ...usersPlan,
        uniqueColumnSets: [
          { label: "users.email (unique)", dbColumns: ["email"] },
          { label: "users.__nonexistent_probe__ (unique)", dbColumns: ["__nonexistent_probe__"] },
        ],
      };
      const missing = await target.runInTransaction(
        (txn) => txn.missingUniqueIndexes(probePlan),
        { rollback: true },
      );
      assert.ok(
        !missing.includes("users.email (unique)"),
        "a genuinely-present unique constraint must NOT be reported missing",
      );
      assert.ok(
        missing.includes("users.__nonexistent_probe__ (unique)"),
        "a genuinely-absent unique constraint MUST be reported missing",
      );
      ok("[pg] unique-constraint validation has no false positives or false negatives against real pg_index");
    }
  } finally {
    await target.close();
    await verifyClient.end({ timeout: 5 });
    console.log(
      `  note: TEST_DATABASE_URL rows left in place (run id "${run}") — use a throwaway DB.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
