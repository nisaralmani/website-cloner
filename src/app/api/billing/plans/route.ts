import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { paymentMethods, workspaceMembers, workspaceSubscriptions, workspaces } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toWorkspacePlan } from "@/lib/billing/plans";
import { fetchShopifyWorkspaceStatus } from "@/lib/integrations/shopify-internal-client";

/** Stable handle from shopify.app.toml — used to deep-link the merchant to the app in Shopify admin. */
const SHOPIFY_APP_HANDLE = "bybelt-live-chat";

export async function GET() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const userId = session.user.id;

  const rows = await selectAll(
    db
      .select({
        workspace: workspaces,
        subscription: workspaceSubscriptions,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .innerJoin(
        workspaceSubscriptions,
        eq(workspaceSubscriptions.workspaceId, workspaces.id),
      )
      .where(eq(workspaceMembers.userId, userId)),
  );

  const paymentMethodRows = await selectAll(
    db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId)),
  );

  const plans = rows.map((row) => toWorkspacePlan(row.workspace, row.subscription));
  const monthlyTotalCents = rows.reduce(
    (total, row) => total + row.subscription.monthlyCents,
    0,
  );

  return NextResponse.json({
    monthlyTotalCents,
    hasPaymentMethod: paymentMethodRows.length > 0,
    plans,
  });
}

/**
 * Billing is managed by Shopify. Plan changes are never applied here — they are
 * initiated inside the Shopify admin app and written back via the internal
 * `app_subscriptions/update` webhook. This handler only resolves where the
 * merchant should go to manage their subscription. It always uses the session's
 * own workspace (never a client-supplied id) to avoid cross-tenant access.
 */
export async function PATCH() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await fetchShopifyWorkspaceStatus(session.workspace.id);
  // A null result means the Shopify bridge threw (network error, timeout, non-2xx)
  // — the link state is unknown, NOT known-unlinked. Reporting "connect your store"
  // here would wrongly tell a linked, paying merchant they have no store during a
  // transient bridge blip. Surface a retryable error instead.
  if (status === null) {
    return NextResponse.json(
      { error: "Billing is temporarily unavailable. Please try again.", code: "bridge_unavailable" },
      { status: 503 },
    );
  }
  if (!status.linked || !status.shop) {
    return NextResponse.json(
      { error: "Connect your Shopify store to manage billing.", code: "not_linked" },
      { status: 400 },
    );
  }

  const host = status.shop.includes(".") ? status.shop : `${status.shop}.myshopify.com`;
  const manageUrl = `https://${host}/admin/apps/${SHOPIFY_APP_HANDLE}`;
  return NextResponse.json({ manageUrl });
}
