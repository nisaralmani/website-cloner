import { randomBytes } from "node:crypto";

export function resolveSessionSecret(sources, { required = false } = {}) {
  for (const source of sources) {
    const value = source?.SESSION_SECRET?.trim();
    if (value) return value;
  }
  if (required) {
    throw new Error(
      "SESSION_SECRET is required in .env.vps for production deploy.",
    );
  }
  const generated = randomBytes(32).toString("hex");
  console.warn(
    "SESSION_SECRET not set — generated for this deploy. Add SESSION_SECRET to .env.vps to avoid logging users out on every deploy.",
  );
  return generated;
}
