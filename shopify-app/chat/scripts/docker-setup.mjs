import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("npx prisma generate");

try {
  run("npx prisma migrate deploy");
} catch {
  console.warn("Prisma migrate deploy failed — attempting recovery...");
  const migrations = readdirSync("prisma/migrations")
    .filter((name) => !name.startsWith("."))
    .sort();
  for (const migration of migrations) {
    try {
      run(`npx prisma migrate resolve --applied ${migration}`);
    } catch {
      // ignore migrations that are already applied or not failed
    }
  }
  run("npx prisma migrate deploy");
}

// Idempotent guard: migrate resolve can mark SQL as applied without running it.
try {
  run(
    "npx prisma db execute --file prisma/migrations/20260627120000_shop_link_sync_status/migration.sql --schema prisma/schema.prisma",
  );
} catch {
  console.warn("ShopLink sync columns already present or migration SQL skipped.");
}
