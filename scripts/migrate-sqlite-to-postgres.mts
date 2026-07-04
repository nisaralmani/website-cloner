/**
 * Production SQLite → PostgreSQL data migration CLI.
 *
 * Copies live application data from the SQLite file into a PostgreSQL database,
 * preserving ids/timestamps/foreign keys/ordering. READ-ONLY against SQLite
 * (never writes or deletes it). Idempotent + resumable. Validates row counts +
 * FK integrity + required indexes and refuses to commit anything partial.
 *
 * Usage:
 *   npx tsx scripts/migrate-sqlite-to-postgres.mts \
 *     --sqlite ./data/bybelt.db \
 *     --postgres postgres://user:pass@host:5432/bybelt \
 *     [--dry-run] [--resume] [--batch 500] [--report ./migration-report.json]
 *
 * Env fallbacks: --sqlite ← DATABASE_PATH, --postgres ← MIGRATION_TARGET_URL.
 * The schema MUST already be pushed to PostgreSQL (npm run db:push:pg) first.
 *
 * IMPORTANT — maintenance window: each table is read independently (no shared
 * snapshot across the whole SQLite file). For a REAL (non-dry-run) run, the
 * app writing to this SQLite file MUST be stopped first, or rows written
 * during the run can be silently absent from the target with no error. See
 * docs/DEPLOY.md ("Migrating production SQLite → PostgreSQL").
 */

import { writeFileSync } from "node:fs";
import { buildTablePlans } from "./lib/db-migrate/plan.mjs";
import { runMigration, type MigrationReport } from "./lib/db-migrate/migrator.mjs";
import {
  createPostgresTarget,
  createSqliteSource,
} from "./lib/db-migrate/adapters.mjs";

type Args = {
  sqlite: string;
  postgres: string;
  dryRun: boolean;
  resume: boolean;
  batch: number;
  report?: string;
};

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (flag: string) => argv.includes(flag);

  const sqlitePath = get("--sqlite") ?? process.env.DATABASE_PATH ?? "./data/bybelt.db";
  const postgresUrl =
    get("--postgres") ??
    process.env.MIGRATION_TARGET_URL ??
    (process.env.DATABASE_URL?.startsWith("postgres") ? process.env.DATABASE_URL : undefined) ??
    "";

  const sqlite = sqlitePath.startsWith("file:") ? sqlitePath : `file:${sqlitePath}`;
  return {
    sqlite,
    postgres: postgresUrl,
    dryRun: has("--dry-run"),
    resume: has("--resume"),
    batch: Number(get("--batch") ?? "500"),
    report: get("--report"),
  };
}

function printReport(report: MigrationReport): void {
  const line = (s: string) => process.stdout.write(s + "\n");
  const yn = (b: boolean) => (b ? "YES" : "NO");

  line("");
  line(`Migration ${report.dryRun ? "(DRY-RUN)" : ""} ${report.source} -> ${report.target}`);
  line(`  status:   ${report.ok ? "OK" : "FAILED"}`);
  if (report.tables.length > 0) {
    line("  per-table:");
    for (const t of report.tables) {
      line(
        `    ${t.table.padEnd(28)} rows=${String(t.sourceRows).padStart(6)} ` +
          `inserted=${String(t.inserted).padStart(6)} skipped=${String(t.skipped).padStart(6)} ${t.durationMs}ms`,
      );
    }
  }
  const failed = report.validation.filter((v) => !v.ok);
  if (failed.length > 0) {
    line(`  validation failures (${failed.length}):`);
    for (const v of failed) {
      line(`    ✗ ${v.table} ${v.check} ${v.detail ?? ""}`);
    }
  }
  if (report.error) line(`  error: ${report.error}`);

  line("");
  line("─── Migration Certification ───────────────────────────────");
  line(`  Migration ID       ${report.migrationId}`);
  line(`  Started            ${report.startedAt}`);
  line(`  Finished           ${report.finishedAt}`);
  line(`  Duration           ${report.durationMs}ms`);
  line("");
  line(`  ${report.totals.tablesMigrated}/${report.totals.tables} tables migrated`);
  line("");
  line(`  Rows copied        ${report.totals.inserted}`);
  line(`  Rows skipped       ${report.totals.skipped}`);
  line(`  Rows verified      ${report.totals.verified}`);
  line("");
  line(`  Checksums matched     ${yn(report.certification.checksumsMatched)}`);
  line(`  Foreign keys verified ${yn(report.certification.foreignKeysVerified)}`);
  line(`  Indexes verified      ${yn(report.certification.indexesVerified)}`);
  line("");
  line(`  Rollback location  ${report.certification.rollbackLocation}`);
  line("");
  if (report.dryRun && report.ok) {
    line("  READY FOR CUTOVER: NO (dry-run — nothing committed; re-run without --dry-run)");
  } else {
    line(`  READY FOR CUTOVER: ${yn(report.certification.readyForCutover)}`);
  }
  line("──────────────────────────────────────────────────────────");
  line("");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.postgres || !args.postgres.startsWith("postgres")) {
    process.stderr.write(
      "Refusing to run: a PostgreSQL target URL is required (--postgres postgres://… or MIGRATION_TARGET_URL).\n",
    );
    process.exit(2);
  }
  if (!Number.isFinite(args.batch) || args.batch <= 0) {
    process.stderr.write("Invalid --batch (must be a positive number).\n");
    process.exit(2);
  }
  if (!args.dryRun) {
    process.stderr.write(
      "\n⚠ REAL migration — this tool takes an independent snapshot of each table.\n" +
        "  If the app is still writing to this SQLite file, rows written during\n" +
        "  this run can be silently missing from the target. Make sure writes to\n" +
        `  ${args.sqlite} are stopped before continuing.\n\n`,
    );
  }

  const plans = buildTablePlans();
  const source = createSqliteSource(args.sqlite);
  const target = createPostgresTarget(args.postgres);

  let report: MigrationReport;
  try {
    report = await runMigration({
      source,
      target,
      plans,
      dryRun: args.dryRun,
      resume: args.resume,
      batchSize: args.batch,
      // The migrator never writes/deletes SQLite, so its own location IS the
      // rollback point — surfaced in the certification report for the operator.
      rollbackLocation: args.sqlite,
      onEvent: (e) => {
        if (e.type === "table-done") {
          process.stdout.write(
            `  · ${e.table}: +${e.inserted} (skip ${e.skipped})\n`,
          );
        } else if (e.type === "aborted") {
          process.stderr.write(`  ! aborted: ${e.error}\n`);
        }
      },
    });
  } finally {
    await source.close();
    await target.close();
  }

  printReport(report);
  if (args.report) {
    writeFileSync(args.report, JSON.stringify(report, null, 2));
    process.stdout.write(`Report written to ${args.report}\n`);
  }
  process.exit(report.ok ? 0 : 1);
}

void main();
