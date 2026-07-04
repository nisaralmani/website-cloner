import type { LoaderFunctionArgs } from "react-router";
import {
  internalAuthFailure,
  verifyBybeltInternalRequest,
} from "../lib/internal-auth.server";
import { listLinkedWorkspaceIds } from "../lib/shop-link.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!verifyBybeltInternalRequest(request)) {
    return internalAuthFailure();
  }

  const workspaceIds = await listLinkedWorkspaceIds();
  return Response.json({ workspaceIds });
};
