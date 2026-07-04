import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  handleShopifyOAuthBegin,
  handleShopifyOAuthCallback,
} from "../lib/plugin-auth.server";
import { SHOPIFY_AUTH_CALLBACK_PATH } from "../lib/shopify-api.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { pathname } = new URL(request.url);

  if (pathname === SHOPIFY_AUTH_CALLBACK_PATH) {
    return handleShopifyOAuthCallback(request);
  }

  return handleShopifyOAuthBegin(request);
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
