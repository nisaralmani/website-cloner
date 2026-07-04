/**
 * Canonical email normalizer (M3-T3 Part 1).
 *
 * The ONE place responsible for turning any raw email input into the
 * canonical identity used for conversation ↔ Shopify matching: trimmed,
 * lowercased, and `null` for anything empty or not a string. Every location
 * involved in that matching (conversation linking, order context resolution,
 * backfill, Shopify enrichment, visitor sessions, contact matching) must
 * route through this function instead of re-implementing trim/lowercase.
 */
export function normalizeCustomerEmail(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function validateCustomerEmail(email: string): string | null {
  const normalized = normalizeCustomerEmail(email);
  if (!normalized) {
    return "Email is required";
  }

  if (normalized.length > 320) {
    return "Email is too long";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Invalid email address";
  }

  return null;
}

export function parseCustomerEmailInput(
  value: unknown,
): { email: string | null } | { error: string } {
  if (value === null) {
    return { email: null };
  }

  if (typeof value !== "string") {
    return { error: "customerEmail must be a string or null" };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { email: null };
  }

  const validationError = validateCustomerEmail(trimmed);
  if (validationError) {
    return { error: validationError };
  }

  return { email: normalizeCustomerEmail(trimmed) };
}
