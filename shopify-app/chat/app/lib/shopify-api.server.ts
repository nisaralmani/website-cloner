import "@shopify/shopify-app-react-router/adapters/node";
import { ApiVersion, shopifyApi } from "@shopify/shopify-api";

function appOrigin(): string {
  return (process.env.SHOPIFY_APP_URL || "https://chat.bybelt.com").replace(
    /\/$/,
    "",
  );
}

export const shopifyApiClient = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: process.env.SCOPES?.split(",") || [],
  hostName: new URL(appOrigin()).host,
  hostScheme: "https",
  apiVersion: ApiVersion.October25,
  isEmbeddedApp: false,
});

export const SHOPIFY_AUTH_CALLBACK_PATH = "/auth/callback";
