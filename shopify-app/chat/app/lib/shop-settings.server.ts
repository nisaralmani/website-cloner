import {
  type BybeltShopSettings,
  parseWidgetEnabled,
} from "./bybelt.server";
import { assertWorkspaceExists } from "./workspace-validation.server";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

const SHOP_SETTINGS_QUERY = `#graphql
  query BybeltShopSettings {
    shop {
      id
      myshopifyDomain
      workspaceId: metafield(namespace: "bybelt", key: "workspace_id") {
        value
      }
      domain: metafield(namespace: "bybelt", key: "domain") {
        value
      }
      widgetEnabled: metafield(namespace: "bybelt", key: "widget_enabled") {
        value
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = `#graphql
  mutation BybeltMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function loadBybeltShopSettings(
  admin: AdminGraphql,
): Promise<BybeltShopSettings & { shopId: string; shopDomain: string }> {
  const response = await admin.graphql(SHOP_SETTINGS_QUERY);
  if (!response.ok) {
    throw Object.assign(new Error(`Shopify GraphQL ${response.status}`), {
      response: { code: response.status },
    });
  }
  const json = (await response.json()) as {
    data?: {
      shop?: {
        id: string;
        myshopifyDomain: string;
        workspaceId?: { value?: string | null } | null;
        domain?: { value?: string | null } | null;
        widgetEnabled?: { value?: string | null } | null;
      };
    };
  };

  const shop = json.data?.shop;
  if (!shop?.id) {
    throw new Response("Unable to load shop settings", { status: 500 });
  }

  return {
    shopId: shop.id,
    shopDomain: shop.myshopifyDomain,
    workspaceId: shop.workspaceId?.value?.trim() ?? "",
    domain: shop.domain?.value?.trim() ?? "",
    widgetEnabled: parseWidgetEnabled(shop.widgetEnabled?.value),
  };
}

export async function saveBybeltShopSettings(
  admin: AdminGraphql,
  shopId: string,
  settings: BybeltShopSettings,
): Promise<void> {
  await assertWorkspaceExists(settings.workspaceId.trim());

  const metafields = [
    {
      ownerId: shopId,
      namespace: "bybelt",
      key: "workspace_id",
      type: "single_line_text_field",
      value: settings.workspaceId.trim(),
    },
    {
      ownerId: shopId,
      namespace: "bybelt",
      key: "domain",
      type: "single_line_text_field",
      value: settings.domain.trim(),
    },
    {
      ownerId: shopId,
      namespace: "bybelt",
      key: "widget_enabled",
      type: "boolean",
      value: settings.widgetEnabled ? "true" : "false",
    },
  ];

  const response = await admin.graphql(METAFIELDS_SET_MUTATION, {
    variables: { metafields },
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Shopify GraphQL ${response.status}`), {
      response: { code: response.status },
    });
  }
  const json = (await response.json()) as {
    data?: {
      metafieldsSet?: {
        userErrors?: Array<{ field?: string[] | null; message: string }>;
      };
    };
  };

  const errors = json.data?.metafieldsSet?.userErrors ?? [];
  if (errors.length > 0) {
    throw new Response(errors.map((error) => error.message).join(", "), {
      status: 400,
    });
  }
}
