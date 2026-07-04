/**
 * SQLite → PostgreSQL migration — table plan builder.
 *
 * Derives a deterministic, FK-safe migration plan from the drizzle schema
 * definitions (the single source of truth). Because `schema.pg.ts` and
 * `schema.sqlite.ts` declare identical logical shapes (same JS property names,
 * booleans as `integer`, timestamps as dates), a row read via the SQLite
 * drizzle schema is directly insertable via the PostgreSQL drizzle schema —
 * drizzle performs the per-dialect (de)serialization, so IDs/UUIDs (text),
 * timestamps (Date), foreign keys (text) and ordering columns round-trip
 * verbatim.
 *
 * Pure + dependency-free of any live database, so it is unit-testable on its
 * own. The FK graph and column metadata are taken from the PostgreSQL schema
 * (the migration target); SQLite tables are matched by name for reading.
 */

import { getTableColumns, is } from "drizzle-orm";
import { getTableConfig, PgTable, type AnyPgColumn } from "drizzle-orm/pg-core";
import {
  getTableConfig as getSqliteTableConfig,
  SQLiteTable,
} from "drizzle-orm/sqlite-core";
import * as pgSchema from "@/db/schema.pg";
import * as sqliteSchema from "@/db/schema.sqlite";

export type ForeignKeyPlan = {
  /** JS property names of the child (referencing) columns. */
  childJsColumns: string[];
  /** DB column names of the child columns (for raw SQL orphan checks). */
  childDbColumns: string[];
  /** Referenced (parent) table DB name. */
  refTable: string;
  /** JS property names of the parent columns. */
  refJsColumns: string[];
  /** DB column names of the parent columns. */
  refDbColumns: string[];
};

/**
 * A set of DB column names that some unique index or unique constraint MUST
 * cover exactly in the target schema — whether declared as a named
 * `uniqueIndex(...)` (possibly composite) or a bare inline `.unique()` on a
 * single column. `label` is for diagnostics only; validation matches by the
 * actual column set, not by name, so it works regardless of how drizzle-kit
 * happens to name an auto-generated constraint.
 */
export type UniqueColumnSet = {
  label: string;
  dbColumns: string[];
};

export type TablePlan = {
  /** DB table name (identical across dialects). */
  name: string;
  /** drizzle PostgreSQL table (insert target). */
  pgTable: PgTable;
  /** drizzle SQLite table (read source). */
  sqliteTable: SQLiteTable;
  /** JS property names comprising the primary key (single or composite). */
  pkJsKeys: string[];
  /**
   * The actual PostgreSQL column objects for the primary key, in the same
   * order as pkJsKeys — used to target `ON CONFLICT` precisely at the PK so
   * idempotent re-runs only skip genuine PK duplicates, not unrelated unique-
   * constraint collisions (e.g. a different row sharing a unique email).
   */
  pkColumns: AnyPgColumn[];
  /**
   * Every unique constraint that MUST exist in the target schema before data
   * is trusted — covers both named (possibly composite) `uniqueIndex(...)`
   * declarations and bare inline `.unique()` single-column constraints.
   */
  uniqueColumnSets: UniqueColumnSet[];
  /** Foreign keys (excluding self-references), for integrity validation. */
  foreignKeys: ForeignKeyPlan[];
};

function dbNameToJsKey(table: PgTable | SQLiteTable): Map<string, string> {
  const map = new Map<string, string>();
  for (const [jsKey, col] of Object.entries(getTableColumns(table))) {
    map.set((col as { name: string }).name, jsKey);
  }
  return map;
}

/** Build one {@link TablePlan} per PostgreSQL table in the schema. */
export function buildTablePlans(): TablePlan[] {
  const sqliteByName = new Map<string, SQLiteTable>();
  for (const value of Object.values(sqliteSchema)) {
    if (is(value, SQLiteTable)) {
      sqliteByName.set(getSqliteTableConfig(value).name, value);
    }
  }

  const plans: TablePlan[] = [];
  for (const value of Object.values(pgSchema)) {
    if (!is(value, PgTable)) continue;
    const pgTable = value;
    const cfg = getTableConfig(pgTable);
    const columns = getTableColumns(pgTable);
    const dbToJs = dbNameToJsKey(pgTable);

    const sqliteTable = sqliteByName.get(cfg.name);
    if (!sqliteTable) {
      throw new Error(
        `Schema mismatch: PostgreSQL table "${cfg.name}" has no SQLite counterpart. ` +
          "Both schemas must define the same tables before migrating.",
      );
    }

    // Primary key JS keys — composite PKs live in cfg.primaryKeys; a single
    // inline .primaryKey() lives on the column (col.primary === true).
    let pkJsKeys: string[];
    if (cfg.primaryKeys.length > 0) {
      pkJsKeys = cfg.primaryKeys[0]!.columns
        .map((c) => dbToJs.get(c.name))
        .filter((k): k is string => Boolean(k));
    } else {
      pkJsKeys = Object.entries(columns)
        .filter(([, col]) => (col as { primary?: boolean }).primary)
        .map(([jsKey]) => jsKey);
    }
    if (pkJsKeys.length === 0) {
      // No declared primary key means checksum row-ordering (sorted by PK) has
      // no stable tie-break and ON CONFLICT DO NOTHING has nothing to target —
      // refuse rather than silently produce a non-deterministic migration.
      throw new Error(
        `Table "${cfg.name}" has no primary key — the migrator requires every ` +
          "table to declare one for stable checksum ordering and safe idempotent inserts.",
      );
    }
    const columnsByKey = columns as Record<string, AnyPgColumn | undefined>;
    const pkColumns = pkJsKeys
      .map((k) => columnsByKey[k])
      .filter((c): c is AnyPgColumn => Boolean(c));
    if (pkColumns.length !== pkJsKeys.length) {
      throw new Error(
        `Could not resolve all primary-key columns for "${cfg.name}" ` +
          `(keys: ${pkJsKeys.join(", ")}). Refusing to build an unsafe migration plan.`,
      );
    }

    // Named (possibly composite) unique indexes, e.g. uniqueIndex("x").on(a, b).
    // A drizzle index column can be a plain column or a SQL expression (e.g. a
    // functional index) — only plain-column entries have a `.name` and are
    // meaningful for a column-set comparison against the target's pg_index.
    const namedUniqueSets: UniqueColumnSet[] = cfg.indexes
      .filter((idx) => idx.config.unique && idx.config.columns.length > 0)
      .map((idx) => {
        const names = idx.config.columns
          .map((c) => (c as { name?: string }).name)
          .filter((n): n is string => Boolean(n));
        return {
          label: idx.config.name ?? `unique(${names.join(",")})`,
          dbColumns: names,
        };
      })
      .filter((set) => set.dbColumns.length > 0);

    // Bare inline `.unique()` single-column constraints — these do NOT appear
    // in cfg.indexes/cfg.uniqueConstraints in drizzle-orm's pg-core metadata;
    // they are tracked per-column via `isUnique`. Without this, a table like
    // `users` (email: text().unique()) would report "indexes verified" even
    // if the target's email-uniqueness constraint were silently missing.
    const inlineUniqueSets: UniqueColumnSet[] = Object.values(columns)
      .filter((col): col is AnyPgColumn & { isUnique?: boolean } =>
        Boolean((col as { isUnique?: boolean }).isUnique),
      )
      .map((col) => ({
        label: `${cfg.name}.${col.name} (unique)`,
        dbColumns: [col.name],
      }));

    const uniqueColumnSets: UniqueColumnSet[] = [
      ...namedUniqueSets,
      ...inlineUniqueSets,
    ];

    const foreignKeys: ForeignKeyPlan[] = cfg.foreignKeys.map((fk) => {
      const ref = fk.reference();
      const refTableName = getTableConfig(ref.foreignTable as PgTable).name;
      const refDbToJs = dbNameToJsKey(ref.foreignTable as PgTable);
      return {
        childJsColumns: ref.columns
          .map((c) => dbToJs.get(c.name))
          .filter((k): k is string => Boolean(k)),
        childDbColumns: ref.columns.map((c) => c.name),
        refTable: refTableName,
        refJsColumns: ref.foreignColumns
          .map((c) => refDbToJs.get(c.name))
          .filter((k): k is string => Boolean(k)),
        refDbColumns: ref.foreignColumns.map((c) => c.name),
      };
    });

    plans.push({
      name: cfg.name,
      pgTable,
      sqliteTable,
      pkJsKeys,
      pkColumns,
      uniqueColumnSets,
      foreignKeys,
    });
  }
  return plans;
}

/**
 * Order plans so every table is migrated AFTER the tables it references
 * (parents before children) — Kahn's algorithm, deterministic (alphabetical
 * tie-break). Self-references are ignored (a row can reference an earlier row
 * in the same table; ON CONFLICT + single-transaction handling covers this).
 * Any remaining tables indicate an FK cycle and are returned in `cycles`.
 */
export function orderPlansByDependencies(plans: TablePlan[]): {
  ordered: TablePlan[];
  cycles: string[][];
} {
  const byName = new Map(plans.map((p) => [p.name, p]));
  const deps = new Map<string, Set<string>>();
  for (const plan of plans) {
    const set = new Set<string>();
    for (const fk of plan.foreignKeys) {
      if (fk.refTable !== plan.name && byName.has(fk.refTable)) {
        set.add(fk.refTable);
      }
    }
    deps.set(plan.name, set);
  }

  const ordered: TablePlan[] = [];
  const remaining = new Set(plans.map((p) => p.name));
  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter((name) => [...deps.get(name)!].every((dep) => !remaining.has(dep)))
      .sort();
    if (ready.length === 0) break; // cycle — cannot make progress
    for (const name of ready) {
      ordered.push(byName.get(name)!);
      remaining.delete(name);
    }
  }

  return {
    ordered,
    cycles: remaining.size > 0 ? [[...remaining].sort()] : [],
  };
}

/** Split an array into fixed-size batches (insert statement sizing). */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Build a stable string key for a row's primary key (dedup / validation). */
export function pkOf(plan: TablePlan, row: Record<string, unknown>): string {
  return JSON.stringify(plan.pkJsKeys.map((k) => row[k]));
}
