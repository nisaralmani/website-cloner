/**
 * SQLite → PostgreSQL migration — in-memory test doubles.
 *
 * Faithful, database-free implementations of the migration adapters so the
 * orchestration guarantees (dependency ordering, idempotent skip, transactional
 * rollback, row-count + FK validation) can be exercised deterministically
 * without a live PostgreSQL. The real adapters (adapters.mts) additionally get
 * end-to-end coverage when TEST_DATABASE_URL is provided.
 */

import {
  MigrationAbort,
  type MigrationRow,
  type MigrationSource,
  type MigrationTarget,
  type MigrationTxn,
} from "./migrator.mjs";
import { pkOf, type ForeignKeyPlan, type TablePlan } from "./plan.mjs";

/** In-memory read-only source seeded with rows keyed by table name. */
export function createMemorySource(
  data: Record<string, MigrationRow[]>,
): MigrationSource {
  return {
    kind: "memory-source",
    async countRows(plan) {
      return (data[plan.name] ?? []).length;
    },
    async readRows(plan) {
      return [...(data[plan.name] ?? [])];
    },
    async close() {},
  };
}

export type MemoryTargetOptions = {
  /** Force a specific table's insert to throw (to test interruption). */
  failOnInsert?: string;
  /** Report these index names as missing for a table (to test preflight). */
  missingIndexes?: Record<string, string[]>;
  /** Silently drop N rows on a table's insert (to test count validation). */
  dropRowsOnInsert?: Record<string, number>;
  /**
   * Corrupt one field's value on the FIRST inserted row of a table (row count
   * stays correct — only content changes), to test that checksum validation
   * catches content-level corruption that row-count validation cannot.
   */
  corruptFieldOnInsert?: Record<string, { jsKey: string; value: unknown }>;
};

type Store = Map<string, Map<string, MigrationRow>>;

/**
 * In-memory transactional target. A "transaction" snapshots the store and
 * restores it on rollback, mirroring the all-or-nothing guarantee of the real
 * PostgreSQL target. Reuse one instance across two runMigration calls to test
 * resume/idempotency (rows persist between successful runs).
 */
export function createMemoryTarget(
  options: MemoryTargetOptions = {},
): MigrationTarget & { dump: () => Record<string, MigrationRow[]> } {
  const store: Store = new Map();

  function tableMap(name: string): Map<string, MigrationRow> {
    let map = store.get(name);
    if (!map) {
      map = new Map();
      store.set(name, map);
    }
    return map;
  }

  function makeTxn(): MigrationTxn {
    return {
      async insert(plan: TablePlan, rows: MigrationRow[]) {
        if (options.failOnInsert === plan.name) {
          throw new Error(`Injected failure while inserting "${plan.name}"`);
        }
        const map = tableMap(plan.name);
        const drop = options.dropRowsOnInsert?.[plan.name] ?? 0;
        const corrupt = options.corruptFieldOnInsert?.[plan.name];
        let dropped = 0;
        let corrupted = false;
        let inserted = 0;
        let skipped = 0;
        for (const row of rows) {
          const key = pkOf(plan, row);
          if (map.has(key)) {
            skipped += 1;
            continue;
          }
          if (dropped < drop) {
            dropped += 1; // simulate a lost write for count-validation testing
            continue;
          }
          const stored =
            corrupt && !corrupted
              ? { ...row, [corrupt.jsKey]: corrupt.value }
              : row;
          if (corrupt && !corrupted) corrupted = true;
          map.set(key, stored);
          inserted += 1;
        }
        return { inserted, skipped };
      },
      async countRows(plan) {
        return tableMap(plan.name).size;
      },
      async readRows(plan) {
        return [...tableMap(plan.name).values()];
      },
      async countOrphans(plan: TablePlan, fk: ForeignKeyPlan) {
        const parents = tableMap(fk.refTable);
        const parentKeys = new Set<string>();
        for (const parent of parents.values()) {
          parentKeys.add(JSON.stringify(fk.refJsColumns.map((c) => parent[c])));
        }
        let orphans = 0;
        for (const child of tableMap(plan.name).values()) {
          if (fk.childJsColumns.some((c) => child[c] === null || child[c] === undefined)) {
            continue; // NULL FK is not an orphan
          }
          const key = JSON.stringify(fk.childJsColumns.map((c) => child[c]));
          if (!parentKeys.has(key)) orphans += 1;
        }
        return orphans;
      },
      async missingUniqueIndexes(plan) {
        return options.missingIndexes?.[plan.name] ?? [];
      },
    };
  }

  function snapshot(): Store {
    const copy: Store = new Map();
    for (const [table, map] of store) {
      copy.set(table, new Map(map));
    }
    return copy;
  }

  function restore(snap: Store): void {
    store.clear();
    for (const [table, map] of snap) store.set(table, map);
  }

  return {
    kind: "memory-target",
    async isEmpty(plans: TablePlan[]) {
      for (const plan of plans) {
        if ((store.get(plan.name)?.size ?? 0) > 0) return false;
      }
      return true;
    },
    async runInTransaction(fn, opts) {
      const snap = snapshot();
      try {
        const result = await fn(makeTxn());
        if (opts.rollback) restore(snap);
        return result;
      } catch (error) {
        restore(snap); // roll back on any failure (incl. MigrationAbort)
        throw error;
      }
    },
    async close() {},
    dump() {
      const out: Record<string, MigrationRow[]> = {};
      for (const [table, map] of store) out[table] = [...map.values()];
      return out;
    },
  };
}

/** Re-export so tests importing memory get the abort type too. */
export { MigrationAbort };
