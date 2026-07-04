import path from "node:path";

export type DatabaseDialect = "sqlite" | "postgres";

export function getDatabaseDialect(): DatabaseDialect {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return "postgres";
  }
  return "sqlite";
}

export function getSqliteFilePath() {
  const configuredPath = process.env.DATABASE_PATH?.trim();
  if (configuredPath) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  }

  return path.join(process.cwd(), "data", "bybelt.db");
}

export function getSqliteUrl() {
  const filePath = getSqliteFilePath().replace(/\\/g, "/");
  return `file:${filePath}`;
}

export function getPostgresUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for postgres");
  }
  return url;
}
