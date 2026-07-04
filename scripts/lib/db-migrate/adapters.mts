/**
 * SQLite → PostgreSQL migration — real database adapters.
 *
 * `createSqliteSource` reads (only ever SELECTs) from the live SQLite file via
 * the same libsql + drizzle stack the app uses, so values deserialize
 * identically (Date timestamps, integer booleans, text ids).
 *
 * `createPostgresTarget` writes through drizzle + postgres.js inside a single
 * transaction, using ON CONFLICT DO NOTHING (idempotent/resumable) and raw SQL
 * for count/orphan/index validation.
 */

import { count, sql } from "drizzle-orm";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as sqliteSchema from "@/db/schema.sqlite";
import * as pgSchema from "@/db/schema.pg";
import type {
  MigrationSource,
  MigrationTarget,
  MigrationTxn,
} from "./migrator.mjs";
import type { ForeignKeyPlan, TablePlan } from "./plan.mjs";

/** Read-only SQLite source. Issues SELECT statements exclusively. */
export function createSqliteSource(fileUrl: string): MigrationSource {
  const client = createClient({ url: fileUrl });
  const db = drizzleLibsql(client, { schema: sqliteSchema });
  return {
    kind: `sqlite(${fileUrl})`,
    async countRows(plan: TablePlan) {
      const [row] = await db.select({ c: count() }).from(plan.sqliteTable);
      return Number(row?.c ?? 0);
    },
    async readRows(plan: TablePlan) {
      // Full-table read; drizzle maps every column to its JS value + property
      // name, which is exactly what the PostgreSQL insert expects.
      return (await db.select().from(plan.sqliteTable)) as Record<
        string,
        unknown
      >[];
    },
    async close() {
      client.close();
    },
  };
}

/** Sentinel used to force a dry-run transaction to roll back after success. */
class DryRunRollback extends Error {}

/** Transactional PostgreSQL target. */
export function createPostgresTarget(url: string): MigrationTarget {
  const client = postgres(url, { max: 5 });
  const db = drizzlePostgres(client, { schema: pgSchema });

  // The transaction handle drizzle passes to the callback (a PgTransaction),
  // which is not assignable to the top-level db type — extract it precisely.
  type PgTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

  function makeTxn(tx: PgTx): MigrationTxn {
    return {
      async insert(plan, rows) {
        if (rows.length === 0) return { inserted: 0, skipped: 0 };
        // Target the PK explicitly: an unqualified ON CONFLICT DO NOTHING
        // matches ANY unique-constraint violation on the table (e.g. a
        // different row colliding on a unique email), silently skipping rows
        // that are NOT actually already-migrated duplicates. Targeting the PK
        // means only a genuine PK repeat is treated as "already migrated";
        // any other constraint violation throws immediately with a specific,
        // diagnosable Postgres error instead of surfacing later as a generic
        // row-count mismatch.
        const inserted = await tx
          .insert(plan.pgTable)
          .values(rows as never)
          .onConflictDoNothing({ target: plan.pkColumns })
          .returning();
        return {
          inserted: inserted.length,
          skipped: rows.length - inserted.length,
        };
      },
      async countRows(plan) {
        const [row] = await tx.select({ c: count() }).from(plan.pgTable);
        return Number(row?.c ?? 0);
      },
      async readRows(plan) {
        return (await tx.select().from(plan.pgTable)) as Record<
          string,
          unknown
        >[];
      },
      async countOrphans(plan: TablePlan, fk: ForeignKeyPlan) {
        const notNull = fk.childDbColumns.map(
          (c) => sql`c.${sql.identifier(c)} is not null`,
        );
        const joinOn = fk.childDbColumns.map(
          (c, i) =>
            sql`c.${sql.identifier(c)} = p.${sql.identifier(fk.refDbColumns[i]!)}`,
        );
        const q = sql`
          select count(*)::int as n
          from ${sql.identifier(plan.name)} c
          where ${sql.join(notNull, sql` and `)}
            and not exists (
              select 1 from ${sql.identifier(fk.refTable)} p
              where ${sql.join(joinOn, sql` and `)}
            )`;
        const res = (await tx.execute(q)) as unknown as { n: number }[];
        return Number(res[0]?.n ?? 0);
      },
      async missingUniqueIndexes(plan) {
        if (plan.uniqueColumnSets.length === 0) return [];
        // Match by COLUMN SET, not by index name: a bare inline `.unique()`
        // has no index-name field to look up in pg_indexes, and matching by
        // name would also be fragile against drizzle-kit's naming choices for
        // auto-generated constraints. This covers both named (possibly
        // composite) uniqueIndex(...) declarations and inline .unique().
        const res = (await tx.execute(sql`
          select array_agg(a.attname order by a.attnum) as cols
          from pg_index i
          join pg_class t on t.oid = i.indrelid
          join pg_attribute a on a.attrelid = t.oid and a.attnum = any(i.indkey)
          where t.relname = ${plan.name}
            and t.relnamespace = 'public'::regnamespace
            and i.indisunique
          group by i.indexrelid
        `)) as unknown as { cols: string[] }[];
        const presentSets = res.map((r) => [...r.cols].sort().join(","));
        return plan.uniqueColumnSets
          .filter((set) => {
            const wanted = [...set.dbColumns].sort().join(",");
            return !presentSets.includes(wanted);
          })
          .map((set) => set.label);
      },
    };
  }

  return {
    kind: "postgres",
    async isEmpty(plans: TablePlan[]) {
      for (const plan of plans) {
        const [row] = await db.select({ c: count() }).from(plan.pgTable);
        if (Number(row?.c ?? 0) > 0) return false;
      }
      return true;
    },
    async runInTransaction(fn, opts) {
      let result: Awaited<ReturnType<typeof fn>> | undefined;
      let completed = false;
      try {
        await db.transaction(async (tx) => {
          result = await fn(makeTxn(tx));
          completed = true;
          if (opts.rollback) throw new DryRunRollback();
        });
      } catch (error) {
        if (!(error instanceof DryRunRollback)) throw error;
        // dry-run: transaction rolled back; `result` already captured.
      }
      if (!completed) {
        throw new Error("Migration transaction did not complete.");
      }
      return result as Awaited<ReturnType<typeof fn>>;
    },
    async close() {
      await client.end({ timeout: 5 });
    },
  };
}
