/**
 * SQLite → PostgreSQL migration — orchestrator.
 *
 * Copies every application table from a SQLite source into a PostgreSQL target
 * inside a SINGLE transaction (all-or-nothing), preserving IDs/UUIDs/timestamps/
 * foreign keys/ordering. Idempotent + resumable (ON CONFLICT DO NOTHING),
 * read-only against SQLite, and validated (row counts + content checksums + FK
 * integrity + required indexes) before commit. On any corruption / validation
 * failure it aborts and the transaction rolls back — nothing partial is ever
 * committed.
 *
 * The database-specific work is behind {@link MigrationSource}/{@link
 * MigrationTarget} adapters so the orchestration logic is testable without a
 * live PostgreSQL (see adapters.mts for the real implementations and
 * memory.mts for the in-memory test doubles).
 */

import { createHash, randomUUID } from "node:crypto";
import {
  chunk,
  orderPlansByDependencies,
  pkOf,
  type ForeignKeyPlan,
  type TablePlan,
} from "./plan.mjs";

/** Aborts the migration (and rolls back the transaction) on corruption. */
export class MigrationAbort extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationAbort";
  }
}

export type MigrationRow = Record<string, unknown>;

export interface MigrationSource {
  readonly kind: string;
  countRows(plan: TablePlan): Promise<number>;
  /** All rows, ordered deterministically by primary key. READ-ONLY. */
  readRows(plan: TablePlan): Promise<MigrationRow[]>;
  close(): Promise<void>;
}

export interface MigrationTxn {
  /** Insert with ON CONFLICT DO NOTHING; returns actually-inserted vs skipped. */
  insert(
    plan: TablePlan,
    rows: MigrationRow[],
  ): Promise<{ inserted: number; skipped: number }>;
  countRows(plan: TablePlan): Promise<number>;
  /** All rows currently in the target table, for content-checksum comparison. */
  readRows(plan: TablePlan): Promise<MigrationRow[]>;
  /** Count child rows whose FK value has no matching parent (0 = healthy). */
  countOrphans(plan: TablePlan, fk: ForeignKeyPlan): Promise<number>;
  /** Report which required unique indexes are absent from the target schema. */
  missingUniqueIndexes(plan: TablePlan): Promise<string[]>;
}

export interface MigrationTarget {
  readonly kind: string;
  /** True when none of the tables contain any rows (fresh target). */
  isEmpty(plans: TablePlan[]): Promise<boolean>;
  /**
   * Run `fn` inside one transaction. When `rollback` is true (dry-run) the
   * transaction is rolled back even on success, but `fn`'s result is returned.
   */
  runInTransaction<T>(
    fn: (txn: MigrationTxn) => Promise<T>,
    opts: { rollback: boolean },
  ): Promise<T>;
  close(): Promise<void>;
}

export type TableReport = {
  table: string;
  sourceRows: number;
  inserted: number;
  skipped: number;
  /** sha256 of the canonicalized source rows (order-independent by PK). */
  checksum: string;
  durationMs: number;
};

export type ValidationEntry = {
  table: string;
  check: string;
  ok: boolean;
  detail?: string;
};

export type MigrationCertification = {
  /** Every checksum comparison (source vs. target content) matched. */
  checksumsMatched: boolean;
  /** Every foreign-key integrity check found zero orphans. */
  foreignKeysVerified: boolean;
  /** Every required unique index existed in the target before writing. */
  indexesVerified: boolean;
  /**
   * Where the untouched original data lives, for rollback. The migrator never
   * writes to the source, so this is simply its location — no separate backup
   * mechanism is implied. See docs/DEPLOY.md for the full rollback runbook.
   */
  rollbackLocation: string;
  /**
   * True only for a real (non-dry-run) run that fully passed — i.e. the data
   * is actually committed in PostgreSQL and it is safe to switch DATABASE_URL.
   * A passing dry-run means "validated, safe to run for real" — it is
   * intentionally NOT cutover-ready on its own, since nothing was committed.
   */
  readyForCutover: boolean;
};

export type MigrationReport = {
  ok: boolean;
  migrationId: string;
  dryRun: boolean;
  resume: boolean;
  source: string;
  target: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totals: {
    tables: number;
    tablesMigrated: number;
    sourceRows: number;
    inserted: number;
    skipped: number;
    /** Rows that passed both row-count and checksum validation. */
    verified: number;
  };
  tables: TableReport[];
  validation: ValidationEntry[];
  certification: MigrationCertification;
  error?: string;
};

export type MigrationEvent =
  | { type: "start"; tables: number }
  | { type: "table-start"; table: string; sourceRows: number }
  | { type: "table-done"; table: string; inserted: number; skipped: number }
  | { type: "validated"; check: string; ok: boolean; detail?: string }
  | { type: "aborted"; error: string };

export type RunMigrationOptions = {
  source: MigrationSource;
  target: MigrationTarget;
  plans: TablePlan[];
  dryRun?: boolean;
  resume?: boolean;
  batchSize?: number;
  /** Surfaced verbatim in the report's certification block. */
  rollbackLocation?: string;
  onEvent?: (event: MigrationEvent) => void;
};

/** Deterministic per-row string: sorted keys, Date normalized to ISO. */
function canonicalRow(row: MigrationRow): string {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(row).sort()) {
    const value = row[key];
    normalized[key] = value instanceof Date ? value.toISOString() : value;
  }
  return JSON.stringify(normalized);
}

/** sha256 over rows sorted by primary key — order-independent, content-sensitive. */
function checksumRows(plan: TablePlan, rows: MigrationRow[]): string {
  const sorted = [...rows].sort((a, b) => pkOf(plan, a).localeCompare(pkOf(plan, b)));
  const hash = createHash("sha256");
  for (const row of sorted) hash.update(canonicalRow(row));
  return hash.digest("hex");
}

/**
 * Execute the migration. Never throws for a data/validation problem — inspect
 * `report.ok`. Only unexpected infrastructure errors (e.g. lost connection)
 * propagate, after the transaction has rolled back.
 */
export async function runMigration(
  options: RunMigrationOptions,
): Promise<MigrationReport> {
  const {
    source,
    target,
    dryRun = false,
    resume = false,
    batchSize = 500,
    rollbackLocation = source.kind,
    onEvent,
  } = options;

  const { ordered, cycles } = orderPlansByDependencies(options.plans);
  const startedAt = new Date();
  const migrationId = randomUUID();
  const base = {
    migrationId,
    dryRun,
    resume,
    source: source.kind,
    target: target.kind,
    startedAt: startedAt.toISOString(),
    rollbackLocation,
  };

  if (cycles.length > 0) {
    return finalize(base, startedAt, [], [], {
      ok: false,
      error: `Unresolvable foreign-key cycle among tables: ${cycles
        .flat()
        .join(", ")}. Refusing to migrate — ordering cannot guarantee FK integrity.`,
    });
  }

  // Never overwrite an unrelated dataset: a non-empty target requires an
  // explicit resume (the copy itself is idempotent via ON CONFLICT DO NOTHING).
  const empty = await target.isEmpty(ordered);
  if (!empty && !resume) {
    return finalize(base, startedAt, [], [], {
      ok: false,
      error:
        "Target PostgreSQL is not empty. Re-run with resume=true to continue/repeat an " +
        "idempotent migration, or point at a fresh database. Refusing to touch existing data.",
    });
  }

  onEvent?.({ type: "start", tables: ordered.length });

  const tables: TableReport[] = [];
  const validation: ValidationEntry[] = [];
  const sourceChecksums = new Map<string, string>();

  try {
    await target.runInTransaction(async (txn) => {
      // 1. Preflight: the schema must already be pushed (db:push:pg) — required
      //    unique indexes must exist before we trust uniqueness/idempotency.
      for (const plan of ordered) {
        const missing = await txn.missingUniqueIndexes(plan);
        for (const name of missing) {
          validation.push({
            table: plan.name,
            check: `index:${name}`,
            ok: false,
            detail: "missing in target — run `npm run db:push:pg` first",
          });
        }
      }
      if (validation.some((v) => !v.ok)) {
        throw new MigrationAbort(
          "Required unique indexes are missing in the target — push the schema (npm run db:push:pg) before migrating data.",
        );
      }

      // 2. Copy every table in dependency order (parents before children).
      for (const plan of ordered) {
        const t0 = Date.now();
        const rows = await source.readRows(plan);
        const checksum = checksumRows(plan, rows);
        sourceChecksums.set(plan.name, checksum);
        onEvent?.({ type: "table-start", table: plan.name, sourceRows: rows.length });
        let inserted = 0;
        let skipped = 0;
        for (const batch of chunk(rows, batchSize)) {
          const res = await txn.insert(plan, batch);
          inserted += res.inserted;
          skipped += res.skipped;
        }
        tables.push({
          table: plan.name,
          sourceRows: rows.length,
          inserted,
          skipped,
          checksum,
          durationMs: Date.now() - t0,
        });
        onEvent?.({ type: "table-done", table: plan.name, inserted, skipped });
      }

      // 3. Validate row counts: every source row must be present in the target.
      for (const plan of ordered) {
        const src = await source.countRows(plan);
        const dst = await txn.countRows(plan);
        const ok = dst >= src;
        const detail = `source=${src} target=${dst}`;
        validation.push({ table: plan.name, check: "row-count", ok, detail });
        onEvent?.({ type: "validated", check: `row-count:${plan.name}`, ok, detail });
        if (!ok) {
          throw new MigrationAbort(
            `Row-count mismatch for "${plan.name}" (${detail}) — aborting, target rolled back.`,
          );
        }
      }

      // 4. Validate content checksums: catches value-level corruption that a
      //    matching row count would miss (e.g. a truncated/garbled column).
      for (const plan of ordered) {
        const targetRows = await txn.readRows(plan);
        const targetChecksum = checksumRows(plan, targetRows);
        const sourceChecksum = sourceChecksums.get(plan.name) ?? "";
        const ok = targetChecksum === sourceChecksum;
        const detail = ok
          ? `sha256=${targetChecksum.slice(0, 12)}…`
          : `source=${sourceChecksum.slice(0, 12)}… target=${targetChecksum.slice(0, 12)}…`;
        validation.push({ table: plan.name, check: "checksum", ok, detail });
        onEvent?.({ type: "validated", check: `checksum:${plan.name}`, ok, detail });
        if (!ok) {
          throw new MigrationAbort(
            `Content checksum mismatch for "${plan.name}" — row count matched but data differs — aborting, target rolled back.`,
          );
        }
      }

      // 5. Validate foreign-key integrity: no orphaned child rows.
      for (const plan of ordered) {
        for (const fk of plan.foreignKeys) {
          const orphans = await txn.countOrphans(plan, fk);
          const label = `fk:${fk.childDbColumns.join(",")}->${fk.refTable}`;
          const ok = orphans === 0;
          const detail = `orphans=${orphans}`;
          validation.push({ table: plan.name, check: label, ok, detail });
          onEvent?.({ type: "validated", check: `${label}@${plan.name}`, ok, detail });
          if (!ok) {
            throw new MigrationAbort(
              `Foreign-key integrity violation in "${plan.name}": ${orphans} orphan row(s) referencing "${fk.refTable}" — aborting, target rolled back.`,
            );
          }
        }
      }
    }, { rollback: dryRun });

    return finalize(base, startedAt, tables, validation, { ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown migration error";
    onEvent?.({ type: "aborted", error: message });
    // MigrationAbort is an expected, handled validation failure (already rolled
    // back). Anything else is unexpected but the transaction still rolled back.
    return finalize(base, startedAt, tables, validation, {
      ok: false,
      error: message,
    });
  }
}

function finalize(
  base: {
    migrationId: string;
    dryRun: boolean;
    resume: boolean;
    source: string;
    target: string;
    startedAt: string;
    rollbackLocation: string;
  },
  startedAt: Date,
  tables: TableReport[],
  validation: ValidationEntry[],
  outcome: { ok: boolean; error?: string },
): MigrationReport {
  const finishedAt = new Date();
  const { rollbackLocation, ...rest } = base;

  // Certification is only meaningful on full success: the migration runs as a
  // single transaction, so a failure means EVERYTHING rolled back — nothing is
  // partially "verified." Claiming otherwise would overstate what is actually
  // committed and safe.
  const certification: MigrationCertification = {
    checksumsMatched: outcome.ok,
    foreignKeysVerified: outcome.ok,
    indexesVerified: outcome.ok,
    rollbackLocation,
    readyForCutover: outcome.ok && !base.dryRun,
  };

  return {
    ...rest,
    ok: outcome.ok,
    error: outcome.error,
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    totals: {
      tables: tables.length,
      tablesMigrated: outcome.ok ? tables.length : 0,
      sourceRows: tables.reduce((n, t) => n + t.sourceRows, 0),
      inserted: tables.reduce((n, t) => n + t.inserted, 0),
      skipped: tables.reduce((n, t) => n + t.skipped, 0),
      verified: outcome.ok
        ? tables.reduce((n, t) => n + t.sourceRows, 0)
        : 0,
    },
    tables,
    validation,
    certification,
  };
}
