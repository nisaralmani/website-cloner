import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  getDatabaseDialect,
  getPostgresUrl,
  getSqliteFilePath,
  getSqliteUrl,
} from "@/db/dialect";
import * as pgSchema from "@/db/schema.pg";
import * as sqliteSchema from "@/db/schema.sqlite";

type SqliteDb = ReturnType<typeof drizzleLibsql<typeof sqliteSchema>>;

let sqliteDb: SqliteDb | null = null;
let postgresDb: SqliteDb | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;

function createSqliteDatabase() {
  const dbPath = getSqliteFilePath();
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const client = createClient({ url: getSqliteUrl() });
  return drizzleLibsql(client, { schema: sqliteSchema });
}

function createPostgresDatabase() {
  postgresClient = postgres(getPostgresUrl(), { max: 10 });
  return drizzlePostgres(postgresClient, { schema: pgSchema }) as unknown as SqliteDb;
}

export { getDatabaseDialect } from "@/db/dialect";
export type AppDatabase = SqliteDb;

export async function getDb(): Promise<SqliteDb> {
  if (getDatabaseDialect() === "postgres") {
    if (!postgresDb) {
      postgresDb = createPostgresDatabase();
    }
    return postgresDb;
  }

  if (!sqliteDb) {
    sqliteDb = createSqliteDatabase();
  }
  return sqliteDb;
}

export async function selectOne<T>(query: Promise<T[]>): Promise<T | undefined> {
  const rows = await query;
  return rows[0];
}

export async function selectAll<T>(query: Promise<T[]>): Promise<T[]> {
  return query;
}
