import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  internalAuthFailure,
  verifyBybeltInternalRequest,
} from "../lib/internal-auth.server";
import { runReconciliation } from "../lib/reconcile.server";

/**
 * Internal reconciliation endpoint (Phase 20 — Task 3).
 *
 * GET  → report-only dry run (no repairs), for inspection.
 * POST → run with safe idempotent repairs (webhook re-registration).
 *
 * Authenticated with the shared internal secret, exactly like the other
 * `plugin.shopify.internal.*` routes. Invoked on a schedule by
 * `scripts/shopify-reconcile-cron.mjs`.
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!verifyBybeltInternalRequest(request)) {
    return internalAuthFailure();
  }
  const report = await runReconciliation({ repair: false });
  return Response.json(report, { headers: { "Cache-Control": "no-store" } });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (!verifyBybeltInternalRequest(request)) {
    return internalAuthFailure();
  }
  const report = await runReconciliation({ repair: true });
  return Response.json(report, { headers: { "Cache-Control": "no-store" } });
};
