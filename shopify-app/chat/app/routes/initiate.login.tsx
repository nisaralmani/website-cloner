import type { LoaderFunctionArgs } from "react-router";
import { redirectDocument } from "react-router";
import { bybeltInboxUrl } from "../lib/bybelt.server";

/** Client navigations to /initiate/login hit the Shopify app shell — forward to the main Bybelt login. */
export const loader = ({ request }: LoaderFunctionArgs) => {
  const incoming = new URL(request.url);
  const loginUrl = new URL("/initiate/login", bybeltInboxUrl());
  const next = incoming.searchParams.get("next");
  if (next) {
    loginUrl.searchParams.set("next", next);
  }
  throw redirectDocument(loginUrl.toString());
};
