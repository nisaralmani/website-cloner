/**
 * Constant-time secret comparison for the Shopify plugin app (Phase 19).
 *
 * Mirror of the main app's `@/lib/security/constant-time`. Both operands are
 * hashed to a fixed 32-byte digest before comparison so the check is
 * constant-time and leaks no length information, even for differing-length
 * inputs. Duplicated here because the plugin app is a separate runtime/package
 * and cannot import from the main app.
 */
import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function timingSafeEqualStrings(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  return timingSafeEqual(digest(a), digest(b));
}

export function secretsMatch(provided: unknown, expected: unknown): boolean {
  if (typeof provided !== "string" || provided.length === 0) return false;
  if (typeof expected !== "string" || expected.length === 0) return false;
  return timingSafeEqualStrings(provided, expected);
}
