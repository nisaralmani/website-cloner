import { useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, redirect, useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PluginShell } from "../components/PluginShell";
import styles from "../components/PluginShell.module.css";
import {
  fetchBybeltSession,
} from "../lib/bybelt-auth.server";
import { getShopLink, updateShopLinkWidget } from "../lib/shop-link.server";
import {
  loadBybeltShopSettings,
  saveBybeltShopSettings,
} from "../lib/shop-settings.server";
import { bybeltInboxUrl, themeEmbedActivateUrl } from "../lib/bybelt.server";
import {
  authenticatePluginAdmin,
  reauthorizeShopify,
} from "../lib/plugin-auth.server";
import { isShopifyUnauthorizedError } from "../lib/shopify-errors.server";
import { SHOPIFY_WEBHOOK_TOPIC_COUNT } from "../lib/shopify-webhooks.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticatePluginAdmin(request);
  const shop = session.shop;

  const link = await getShopLink(shop);
  if (!link) {
    throw redirect(`/initiate/plugin/shopify?shop=${encodeURIComponent(shop)}`);
  }

  const bybelt = await fetchBybeltSession(request);
  // Linked shops: Shopify OAuth is sufficient; Bybelt cookies are not sent in Admin iframe.

  let settings;
  let metafieldsUnavailable = false;
  try {
    settings = await loadBybeltShopSettings(admin);
  } catch (error) {
    if (isShopifyUnauthorizedError(error)) {
      await reauthorizeShopify(request, shop, session.id);
    }
    metafieldsUnavailable = true;
    settings = {
      shopId: "",
      shopDomain: shop,
      workspaceId: link.workspaceId,
      domain: link.domain,
      widgetEnabled: link.widgetEnabled,
    };
  }

  let shopifyApiHealthy = false;
  try {
    const healthResponse = await admin.graphql(`#graphql
      query BybeltShopHealth {
        shop {
          name
        }
      }
    `);
    shopifyApiHealthy = healthResponse.ok;
  } catch {
    shopifyApiHealthy = false;
  }
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";

  return {
    shop,
    link,
    settings,
    inboxUrl: bybeltInboxUrl(),
    themeActivateUrl: themeEmbedActivateUrl(shop, apiKey),
    userEmail: bybelt?.user?.email ?? "",
    internalBridgeConfigured: Boolean(process.env.BYBELT_INTERNAL_SECRET?.trim()),
    metafieldsUnavailable,
    shopifyApiHealthy,
    webhookTopicCount: SHOPIFY_WEBHOOK_TOPIC_COUNT,
    shopAdminUrl: `https://${shop.includes(".") ? shop : `${shop}.myshopify.com`}/admin`,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticatePluginAdmin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const widgetEnabled = formData.get("widgetEnabled") === "on";
  const link = await getShopLink(session.shop);

  if (!link) {
    throw redirect(`/initiate/plugin/shopify?shop=${encodeURIComponent(session.shop)}`);
  }

  if (intent === "widget") {
    try {
      const current = await loadBybeltShopSettings(admin);
      await saveBybeltShopSettings(admin, current.shopId, {
        workspaceId: link.workspaceId,
        domain: link.domain,
        widgetEnabled,
      });
    } catch (error) {
      if (isShopifyUnauthorizedError(error)) {
        await reauthorizeShopify(request, session.shop, session.id);
      }
      throw error;
    }
    await updateShopLinkWidget(session.shop, widgetEnabled);
  }

  if (intent === "sync-contacts") {
    const { triggerMainAppContactSync } = await import("../lib/bybelt-main.server");
    const result = await triggerMainAppContactSync(link.workspaceId);
    const params = new URLSearchParams({ shop: session.shop });
    if (result.ok) {
      params.set("synced", "1");
      params.set("created", String(result.created ?? 0));
      params.set("updated", String(result.updated ?? 0));
      params.set("total", String(result.total ?? 0));
      params.set("tagged", String(result.conversationsTagged ?? 0));
    } else {
      params.set("syncError", "1");
      if (result.error) {
        params.set("syncErrorMessage", result.error.slice(0, 240));
      }
    }
    throw redirect(`/plugin/shopify/settings?${params.toString()}`);
  }

  return redirect(`/plugin/shopify/settings?shop=${encodeURIComponent(session.shop)}`);
};

export default function ShopifyPluginSettings() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [showThemeModal, setShowThemeModal] = useState(
    searchParams.get("onboard") === "1",
  );
  const syncMessage = searchParams.get("synced") === "1"
    ? `Synced ${searchParams.get("total") ?? "0"} customers (${searchParams.get("created") ?? "0"} new, ${searchParams.get("updated") ?? "0"} updated)${
        Number(searchParams.get("tagged") ?? 0) > 0
          ? ` · ${searchParams.get("tagged")} inbox conversation(s) tagged`
          : ""
      }.`
    : searchParams.get("syncError") === "1"
      ? searchParams.get("syncErrorMessage") ??
        "Contact sync failed. Try again from Bybelt or check your workspace link."
      : null;
  const lastSyncLabel = data.link.lastContactSyncAt
    ? new Date(data.link.lastContactSyncAt).toLocaleString()
    : null;

  return (
    <>
      <PluginShell
        title="Shopify"
        subtitle="Talk to your customers and centralize Shopify conversations in Bybelt."
        showLogos={false}
      >
        <div className={styles.toggles}>
          <label className={styles.toggleRow}>
            <span>Show chat widget on storefront</span>
            <Form method="post">
              <input type="hidden" name="intent" value="widget" />
              <input
                type="checkbox"
                name="widgetEnabled"
                defaultChecked={data.link.widgetEnabled}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              />
            </Form>
          </label>
        </div>

        <p className={styles.note}>
          Workspace: <strong>{data.settings.domain}</strong> ({data.settings.workspaceId})
        </p>
        {lastSyncLabel ? (
          <p className={styles.note}>
            Last contact sync: <strong>{lastSyncLabel}</strong>
            {data.link.lastContactSyncTotal != null
              ? ` · ${data.link.lastContactSyncTotal} customers (${data.link.lastContactSyncCreated ?? 0} new, ${data.link.lastContactSyncUpdated ?? 0} updated)`
              : ""}
          </p>
        ) : (
          <p className={styles.note}>Contacts have not been synced from Shopify yet.</p>
        )}
        {syncMessage ? (
          <p className={styles.note} style={searchParams.get("syncError") === "1" ? { color: "#b45309" } : undefined}>
            {syncMessage}
          </p>
        ) : null}
        {data.metafieldsUnavailable ? (
          <p className={styles.note} style={{ color: "#b45309" }}>
            Shopify shop metafields could not be loaded. Re-open this app from Shopify Admin to
            refresh your session.
          </p>
        ) : null}
        {!data.internalBridgeConfigured ? (
          <p className={styles.note} style={{ color: "#b45309" }}>
            Internal sync bridge is not configured on the server (missing BYBELT_INTERNAL_SECRET).
            Contact sync and webhooks may not update Bybelt until this is fixed.
          </p>
        ) : null}
        {data.shopifyApiHealthy ? (
          <p className={styles.note}>
            Shopify API: <strong style={{ color: "#5DAC5D" }}>connected</strong>
            {data.webhookTopicCount > 0
              ? ` · ${data.webhookTopicCount} webhook topics registered`
              : ""}
          </p>
        ) : (
          <p className={styles.note} style={{ color: "#b45309" }}>
            Shopify API health check failed. Open this app from Shopify Admin to refresh your session.
          </p>
        )}

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <Form method="post">
            <input type="hidden" name="intent" value="sync-contacts" />
            <button type="submit" className={styles.secondaryButton}>
              Sync Shopify customers to Contacts
            </button>
          </Form>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setShowThemeModal(true)}
          >
            Enable Bybelt on my theme
          </button>
          <a className={styles.secondaryButton} href={data.inboxUrl} target="_blank" rel="noreferrer">
            Open Bybelt inbox
          </a>
          <a className={styles.secondaryButton} href={data.shopAdminUrl} target="_blank" rel="noreferrer">
            Open Shopify admin
          </a>
        </div>
      </PluginShell>

      {showThemeModal ? (
        <div className={styles.modalOverlay} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true">
            <h2 className={styles.modalTitle}>Last step! Enable Bybelt for your Shopify theme</h2>
            <p className={styles.modalText}>
              Click the button below to enable the Bybelt chatbox in your Shopify theme editor.
              Once enabled, shoppers can chat with your team and you will see Shopify customer
              context in Bybelt.
            </p>
            <a
              className={styles.primaryButton}
              href={data.themeActivateUrl}
              target="_top"
              rel="noreferrer"
            >
              Enable Bybelt on my theme
            </a>
            <p className={styles.note}>
              Make sure to click <strong>Save</strong> on Shopify for the changes to take effect.
            </p>
            <button
              type="button"
              className={styles.secondaryButton}
              style={{ marginTop: 12 }}
              onClick={() => setShowThemeModal(false)}
            >
              I&apos;ll do this later
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
