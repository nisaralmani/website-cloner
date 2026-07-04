import type { AppDatabase } from "@/db/client";
import { enrichContactFromShopify } from "@/lib/integrations/shopify-contact-enrich";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";

/**
 * Order Backfill Resolver (M3-T2, Part 1).
 *
 * The problem: a Shopify order/customer event can arrive BEFORE any
 * conversation exists for that customer. When that happens the per-conversation
 * enrichment has nowhere to land and is effectively discarded. Later, when the
 * customer first starts (or is linked to) a conversation, the inbox shows no
 * historical order context.
 *
 * This module centralizes the ONE decision that fixes that: "a conversation has
 * just become linkable to a customer email — attach any historical order
 * context that already exists." Several call sites previously re-implemented
 * that decision by calling `enrichContactFromShopify` inline; they now route
 * through here so the backfill policy lives in a single place.
 *
 * Scope guarantees (per M3-T2 Part 1):
 *  - NO schema changes, NO new tables, NO background jobs, NO caching, NO new
 *    API surface. It reuses the existing live-pull enrichment path verbatim.
 *  - It does not redesign synchronization, poll, or reconcile. It only reacts,
 *    once, at the moment a conversation becomes linkable.
 *  - Best-effort and non-blocking: a failed or empty backfill never blocks
 *    conversation creation or linkage (enrichment error isolation, W5/W12).
 */

/** A conversation is linkable once it carries a non-empty customer email. */
export function isConversationLinkable(
  email: string | null | undefined,
): email is string {
  return normalizeCustomerEmail(email) !== null;
}

/**
 * Attach any pre-existing Shopify order/customer context to a conversation that
 * has just become linkable. Safe to call unconditionally at every linkability
 * boundary — it no-ops when there is no email to link on.
 */
export async function backfillOrderContextForConversation(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  email: string | null | undefined,
): Promise<void> {
  const normalized = normalizeCustomerEmail(email);
  if (!normalized) return;

  try {
    await enrichContactFromShopify(db, workspaceId, normalized, { conversationId });
  } catch {
    // Backfill is best-effort — never block conversation creation/linkage on a
    // Shopify enrichment failure. The live/stored context simply stays absent
    // until the next enrichment trigger.
  }
}
