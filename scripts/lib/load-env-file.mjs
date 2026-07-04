import { existsSync, readFileSync } from "node:fs";

export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const vars = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

export function loadEnvVps(root) {
  const envPath = `${root}/.env.vps`;
  if (!existsSync(envPath)) {
    throw new Error("Missing .env.vps — copy .env.vps.example and fill in values.");
  }
  return loadEnvFile(envPath);
}
