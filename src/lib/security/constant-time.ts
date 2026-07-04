/**
 * Constant-time secret comparison (Phase 19).
 *
 * Centralizes every internal-secret / shared-token comparison so no code path
 * uses `===`/`==` on a secret (which short-circuits on the first differing byte
 * and leaks length + prefix via timing). Both operands are hashed to a
 * fixed-length digest before comparison, so:
 *   - the comparison itself is constant-time (`crypto.timingSafeEqual`), and
 *   - different-length inputs are handled safely and leak no length information
 *     (digests are always 32 bytes).
 *
 * Node.js runtime only (uses `node:crypto`) — all current call sites are route
 * handlers / server modules, never edge middleware.
 */
import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Constant-time string equality. Returns false for non-string inputs. Safe for
 * inputs of differing length — no length or content timing side channel.
 */
export function timingSafeEqualStrings(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  // Both digests are fixed 32-byte buffers, so timingSafeEqual never throws on
  // a length mismatch and the pre-hash removes the length side channel.
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * Validate a provided secret against the expected secret in constant time.
 * Returns false when either value is missing/empty (preserves the existing
 * "no secret configured / no header ⇒ reject" behavior) without branching on
 * secret contents.
 */
export function secretsMatch(provided: unknown, expected: unknown): boolean {
  if (typeof provided !== "string" || provided.length === 0) return false;
  if (typeof expected !== "string" || expected.length === 0) return false;
  return timingSafeEqualStrings(provided, expected);
}
