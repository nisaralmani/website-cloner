import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  buildWorkspaceDataPayload,
  saveWorkspaceDataSetting,
  storedLimitSettingKey,
} from "@/lib/workspaces/workspace-data-store";
import {
  validateWorkspaceDataLimit,
  WORKSPACE_DATA_LIMIT_KEYS,
} from "@/lib/workspaces/workspace-data";
import type { WorkspaceDataLimitKey } from "@/types/workspace-data";

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { key?: string; limit?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const key = body.key as WorkspaceDataLimitKey | undefined;
  const limit = body.limit;

  if (!key || typeof limit !== "number") {
    return NextResponse.json({ error: "key and limit are required" }, { status: 400 });
  }

  if (!WORKSPACE_DATA_LIMIT_KEYS.includes(key)) {
    return NextResponse.json({ error: "Unknown limit key" }, { status: 400 });
  }

  const validationError = validateWorkspaceDataLimit(key, limit);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const operatorRows = await buildWorkspaceDataPayload(db, workspaceId);
  const operatorsLimitRow = operatorRows.limits.find((row) => row.key === "operators");
  if (key === "operators" && operatorsLimitRow && limit < operatorsLimitRow.used) {
    return NextResponse.json(
      { error: "operators limit cannot be lower than current operator count" },
      { status: 400 },
    );
  }

  await saveWorkspaceDataSetting(
    db,
    workspaceId,
    storedLimitSettingKey(key),
    String(Math.round(limit)),
  );

  const payload = await buildWorkspaceDataPayload(db, workspaceId);
  const updated = payload.limits.find((row) => row.key === key);

  return NextResponse.json({
    key,
    limit,
    row: updated,
    limits: payload.limits,
  });
}
