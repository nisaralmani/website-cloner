import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, redirect, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PluginShell } from "../components/PluginShell";
import styles from "../components/PluginShell.module.css";
import {
  fetchBybeltSession,
  pluginReturnUrl,
  throwBybeltLoginRedirect,
} from "../lib/bybelt-auth.server";
import { getShopLink, upsertShopLink } from "../lib/shop-link.server";
import { isShopifyUnauthorizedError } from "../lib/shopify-errors.server";
import {
  authenticatePluginAdmin,
  reauthorizeShopify,
} from "../lib/plugin-auth.server";

type WorkspaceOption = {
  id: string;
  name: string;
  domain: string;
};

function normalizeWorkspaces(bybelt: NonNullable<Awaited<ReturnType<typeof fetchBybeltSession>>>) {
  if (bybelt.workspaces?.length) {
    return bybelt.workspaces;
  }
  if (bybelt.workspace) {
    return [
      {
        id: bybelt.workspace.id,
        name: bybelt.workspace.name,
        domain: bybelt.workspace.domain,
      },
    ];
  }
  return [];
}

async function requireBybeltSession(request: Request, shop: string) {
  const returnTo = pluginReturnUrl(request, shop, "/initiate/plugin/shopify");
  const bybelt = await fetchBybeltSession(request);
  if (!bybelt?.authenticated) {
    throwBybeltLoginRedirect(returnTo);
  }
  return bybelt;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticatePluginAdmin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const step = url.searchParams.get("step");

  const existing = await getShopLink(shop);
  if (existing) {
    // Linked stores: Shopify OAuth is sufficient; skip Bybelt cookie (unavailable in Admin iframe).
    const settingsParams = new URLSearchParams(url.searchParams);
    settingsParams.set("shop", shop);
    throw redirect(`/plugin/shopify/settings?${settingsParams.toString()}`);
  }

  const bybelt = await requireBybeltSession(request, shop);
  const workspaces = normalizeWorkspaces(bybelt);

  if (url.searchParams.get("auto") === "1" && workspaces.length === 1) {
    const only = workspaces[0]!;
    try {
      await upsertShopLink(admin, shop, only.id, only.domain);
    } catch (error) {
      if (isShopifyUnauthorizedError(error)) {
        await reauthorizeShopify(request, shop, session.id);
      }
      throw error;
    }
    throw redirect(
      `/plugin/shopify/settings?shop=${encodeURIComponent(shop)}&onboard=1`,
    );
  }

  if (step === "workspaces") {
    return {
      mode: "workspaces" as const,
      shop,
      workspaces,
      userEmail: bybelt.user?.email ?? "",
    };
  }

  return {
    mode: "link" as const,
    shop,
    workspaces,
    userEmail: bybelt.user?.email ?? "",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticatePluginAdmin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  const domain = String(formData.get("domain") ?? "").trim();
  const shop = session.shop;

  const linkShop = async (workspace: WorkspaceOption) => {
    try {
      await upsertShopLink(admin, shop, workspace.id, workspace.domain);
    } catch (error) {
      if (isShopifyUnauthorizedError(error)) {
        await reauthorizeShopify(request, shop, session.id);
      }
      throw error;
    }
  };

  if (intent === "continue") {
    const bybelt = await requireBybeltSession(request, shop);
    const workspaces = normalizeWorkspaces(bybelt);

    if (workspaces.length === 1) {
      const only = workspaces[0]!;
      await linkShop(only);
      throw redirect(`/plugin/shopify/settings?shop=${encodeURIComponent(shop)}&onboard=1`);
    }

    throw redirect(`/initiate/plugin/shopify?shop=${encodeURIComponent(shop)}&step=workspaces`);
  }

  if (!workspaceId || !domain) {
    return { error: "Choose a workspace to continue." };
  }

  await linkShop({ id: workspaceId, name: domain, domain });
  throw redirect(`/plugin/shopify/settings?shop=${encodeURIComponent(shop)}&onboard=1`);
};

function LinkStep({
  shop,
  userEmail,
}: {
  shop: string;
  userEmail: string;
}) {
  return (
    <PluginShell
      title="Link Bybelt with Shopify"
      subtitle="Shopify needs to access your Bybelt workspace to show live chat and customer context."
    >
      <Form method="post">
        <input type="hidden" name="intent" value="continue" />
        <button type="submit" className={styles.primaryButton}>
          Continue
        </button>
      </Form>
      <p className={styles.note}>Store: {shop}</p>
      <p className={styles.note}>Signed in as {userEmail}</p>
    </PluginShell>
  );
}

function WorkspaceStep({
  workspaces,
  userEmail,
}: {
  workspaces: WorkspaceOption[];
  userEmail: string;
}) {
  return (
    <PluginShell
      title="Select a workspace"
      subtitle="Choose which Bybelt workspace should power chat for this Shopify store."
    >
      <div className={styles.workspaceList}>
        {workspaces.map((workspace) => (
          <Form method="post" key={workspace.id}>
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <input type="hidden" name="domain" value={workspace.domain} />
            <button type="submit" className={styles.workspaceButton}>
              <span className={styles.workspaceAvatar}>
                {workspace.name.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <div className={styles.workspaceName}>{workspace.name}</div>
                <div className={styles.workspaceDomain}>{workspace.domain}</div>
              </span>
            </button>
          </Form>
        ))}
      </div>
      <p className={styles.note}>Signed in as {userEmail}</p>
    </PluginShell>
  );
}

export default function InitiateShopifyPlugin() {
  const data = useLoaderData<typeof loader>();

  if (data.mode === "workspaces") {
    return <WorkspaceStep workspaces={data.workspaces} userEmail={data.userEmail} />;
  }

  return <LinkStep shop={data.shop} userEmail={data.userEmail} />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
