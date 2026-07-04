import type { AppDatabase } from "@/db/client";
import { fetchShopifyCustomerContext } from "@/lib/integrations/shopify-context";
import { fetchVisitorDataForConversation } from "@/lib/inbox/visitor-data";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";
import type {
  ShopifyCustomerContextResponse,
  ShopifyCustomerSummary,
} from "@/types/shopify";
import type { VisitorDataEntry } from "@/types/inbox";

/**
 * Canonical Order Context Resolver (M3-T1).
 *
 * Before this module, several call sites independently decided where a
 * conversation's Shopify order context comes from and re-implemented the same
 * "is this live response linked and does it carry a usable customer?" predicate.
 * This resolver is the ONE place that decision lives.
 *
 * Behavior is intentionally unchanged from the previous inline logic:
 *  - The live source is still `fetchShopifyCustomerContext` (which itself never
 *    throws and returns `null` on any failure — so `error` is always `null`
 *    here for now; surfacing real fetch errors is a later task, see W12).
 *  - The stored source is still `fetchVisitorDataForConversation`.
 *
 * This module adds NO caching, NO new storage, and NO new API surface.
 */

export type OrderContextSource = "live" | "stored" | "none";

/** The live Shopify response, plus the centrally-extracted usable customer. */
export type ResolvedLiveContext = {
  linked: boolean;
  /** The usable customer, or null when unlinked / not matched. */
  customer: ShopifyCustomerSummary | null;
  shop: string | null;
  shopName: string | null;
  /** The raw upstream response, preserved verbatim for callers that need it. */
  response: ShopifyCustomerContextResponse;
};

export type OrderContextResult = {
  /** Which source actually produced usable context. */
  source: OrderContextSource;
  /** Live Shopify context (null when not requested or no email). */
  live: ResolvedLiveContext | null;
  /** Stored per-conversation visitor data (null when not requested). */
  stored: VisitorDataEntry[] | null;
  /** Coarse freshness: live is fresh-from-Shopify, stored is DB copy of unknown age. */
  freshness: OrderContextSource;
  /** Reserved for surfacing fetch errors once the upstream stops swallowing them. */
  error: string | null;
};

export type ResolveOrderContextArgs = {
  workspaceId: string;
  /** Customer email; when falsy, the live source is skipped (same as before). */
  email?: string | null;
  /** Required together with `conversationId` to read the stored source. */
  db?: AppDatabase;
  conversationId?: string;
  /** Which sources to consult. Defaults preserve prior per-caller behavior. */
  include?: { live?: boolean; stored?: boolean };
};

/**
 * The single, canonical decision: turn a raw live response into a resolved
 * shape whose `customer` is non-null iff the response is linked AND carries a
 * usable customer. This replaces the duplicated
 * `ctx?.linked && "customer" in ctx && ctx.customer` predicate.
 */
export function toResolvedLiveContext(
  response: ShopifyCustomerContextResponse | null,
): ResolvedLiveContext | null {
  if (!response) return null;
  if (!response.linked) {
    return { linked: false, customer: null, shop: null, shopName: null, response };
  }
  const customer = "customer" in response ? response.customer : null;
  return {
    linked: true,
    customer: customer ?? null,
    shop: response.shop,
    shopName: "shopName" in response ? response.shopName ?? null : null,
    response,
  };
}

export async function resolveOrderContext(
  args: ResolveOrderContextArgs,
): Promise<OrderContextResult> {
  const wantLive = args.include?.live ?? true;
  const wantStored = args.include?.stored ?? false;
  const email = normalizeCustomerEmail(args.email);

  let live: ResolvedLiveContext | null = null;
  if (wantLive && email) {
    const response = await fetchShopifyCustomerContext(args.workspaceId, email);
    live = toResolvedLiveContext(response);
  }

  let stored: VisitorDataEntry[] | null = null;
  if (wantStored && args.db && args.conversationId) {
    stored = await fetchVisitorDataForConversation(args.db, args.conversationId);
  }

  const hasLiveCustomer = Boolean(live?.customer);
  const hasStored = Boolean(stored && stored.length > 0);
  const source: OrderContextSource = hasLiveCustomer
    ? "live"
    : hasStored
      ? "stored"
      : "none";

  return { source, live, stored, freshness: source, error: null };
}
