import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";
import { runJob } from "@/lib/jobs/runner";
import {
  fetchLinkedShopifyWorkspaceIds,
} from "@/lib/integrations/shopify-sync-status";
import { runShopifyBulkContactSync } from "@/lib/integrations/shopify-bulk-sync";

export async function POST(request: Request) {
  if (!isValidInternalSecret(request)) {
    return unauthorizedInternal();
  }

  let body: { workspaceId?: string } = {};
  try {
    body = (await request.json()) as { workspaceId?: string };
  } catch {
    body = {};
  }

  const workspaceIds = body.workspaceId?.trim()
    ? [body.workspaceId.trim()]
    : await fetchLinkedShopifyWorkspaceIds();

  if (!workspaceIds) {
    return NextResponse.json(
      { error: "Unable to list linked Shopify workspaces" },
      { status: 503 },
    );
  }

  const db = await getDb();
  const results: Array<{
    workspaceId: string;
    ok: boolean;
    created?: number;
    updated?: number;
    total?: number;
    conversationsTagged?: number;
    error?: string;
  }> = [];

  for (const workspaceId of workspaceIds) {
    // Phase 24C: run each workspace sync through the job runner so it is
    // tracked for graceful shutdown, timed, and metered. Behavior unchanged —
    // the sync's own {ok,error} result is preserved; no retry/timeout added.
    const job = await runJob(
      "shopify.bulk-sync",
      () => runShopifyBulkContactSync(db, workspaceId),
      { correlation: { workspaceId } },
    );
    const result = job.ok
      ? job.value
      : { ok: false as const, error: job.failureReason };
    if (!result.ok) {
      results.push({ workspaceId, ok: false, error: result.error });
      continue;
    }

    results.push({
      workspaceId,
      ok: true,
      created: result.created,
      updated: result.updated,
      total: result.total,
      conversationsTagged: result.conversationsTagged,
    });
  }

  const synced = results.filter((item) => item.ok).length;
  return NextResponse.json({
    workspaces: workspaceIds.length,
    synced,
    results,
  });
}
