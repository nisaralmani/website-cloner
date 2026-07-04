import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticatePluginAdmin } from "../lib/plugin-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticatePluginAdmin(request);
  throw redirect(`/plugin/shopify/settings?shop=${encodeURIComponent(session.shop)}`);
};

export default function AppLayout() {
  return null;
}
