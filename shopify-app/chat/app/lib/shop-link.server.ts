import db from "../db.server";
import {
  loadBybeltShopSettings,
  saveBybeltShopSettings,
} from "./shop-settings.server";
import { triggerMainAppContactSync, notifyMainAppShopifyLinked } from "./bybelt-main.server";
import { logBridgeFireAndForgetError } from "./bridge-client.server";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export async function getShopLink(shop: string) {
  return db.shopLink.findUnique({ where: { shop } });
}

/** Prisma raises P2002 when a unique/primary-key constraint is violated. */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function upsertShopLink(
  admin: AdminGraphql,
  shop: string,
  workspaceId: string,
  domain: string,
) {
  const current = await loadBybeltShopSettings(admin);
  await saveBybeltShopSettings(admin, current.shopId, {
    workspaceId,
    domain,
    widgetEnabled: true,
  });

  // First-link detection is made atomic by the `shop` primary key: exactly one
  // concurrent caller wins the create; every other caller hits the unique
  // constraint (P2002) and falls through to an update. This guarantees the
  // first-link event below fires at most once, without a lock or queue.
  let link;
  let isFirstLink: boolean;
  try {
    link = await db.shopLink.create({
      data: { shop, workspaceId, domain, widgetEnabled: true },
    });
    isFirstLink = true;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    link = await db.shopLink.update({
      where: { shop },
      data: { workspaceId, domain, widgetEnabled: true },
    });
    isFirstLink = false;
  }

  // Fire-and-forget so linking never blocks on the main app, but log any failure
  // instead of swallowing it. (triggerMainAppContactSync never throws; it is kept
  // non-blocking here purely so the link response is not delayed by the sync.)
  void triggerMainAppContactSync(workspaceId).then((result) => {
    if (!result.ok) {
      logBridgeFireAndForgetError("shopify_contact_sync_failed", new Error(result.error));
    }
  });
  if (isFirstLink) {
    void notifyMainAppShopifyLinked(workspaceId, shop, domain).catch((error) => {
      logBridgeFireAndForgetError("shopify_linked_notify_failed", error);
    });
  }

  return link;
}

export async function updateShopLinkWidget(shop: string, widgetEnabled: boolean) {
  return db.shopLink.update({
    where: { shop },
    data: { widgetEnabled },
  });
}

export async function recordShopLinkContactSync(
  workspaceId: string,
  stats: { created: number; updated: number; total: number },
) {
  const link = await db.shopLink.findFirst({ where: { workspaceId } });
  if (!link) return null;

  return db.shopLink.update({
    where: { shop: link.shop },
    data: {
      lastContactSyncAt: new Date(),
      lastContactSyncCreated: stats.created,
      lastContactSyncUpdated: stats.updated,
      lastContactSyncTotal: stats.total,
    },
  });
}

export async function listLinkedWorkspaceIds(): Promise<string[]> {
  const links = await db.shopLink.findMany({
    select: { workspaceId: true },
    orderBy: { linkedAt: "asc" },
  });
  return links.map((link) => link.workspaceId);
}
