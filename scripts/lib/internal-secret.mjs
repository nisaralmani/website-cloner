import { randomBytes } from "node:crypto";

export function resolveInternalSecret(sources, { required = false } = {}) {
  for (const source of sources) {
    const value = source?.BYBELT_INTERNAL_SECRET?.trim();
    if (value) return value;
  }
  if (required) {
    throw new Error(
      "BYBELT_INTERNAL_SECRET is required in .env.vps for production deploy.",
    );
  }
  const generated = randomBytes(32).toString("hex");
  console.warn(
    "BYBELT_INTERNAL_SECRET not set — generated for this deploy. Add the same value to .env.vps for stable cross-app auth.",
  );
  return generated;
}
