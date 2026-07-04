import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  buildWorkspaceDataPayload,
  saveWorkspaceDataSetting,
} from "@/lib/workspaces/workspace-data-store";
import { WORKSPACE_DATA_SETTING_KEYS } from "@/lib/workspaces/workspace-data";

export async function POST() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const now = new Date().toISOString();

  await saveWorkspaceDataSetting(
    db,
    workspaceId,
    WORKSPACE_DATA_SETTING_KEYS.gdprDpaSigned,
    "true",
  );
  await saveWorkspaceDataSetting(
    db,
    workspaceId,
    WORKSPACE_DATA_SETTING_KEYS.gdprDpaSignedAt,
    now,
  );

  const payload = await buildWorkspaceDataPayload(db, workspaceId);

  return NextResponse.json({
    signedAt: now,
    contract: payload.contract,
  });
}

export async function DELETE() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  await saveWorkspaceDataSetting(db, workspaceId, WORKSPACE_DATA_SETTING_KEYS.gdprDpaSigned, "false");
  await saveWorkspaceDataSetting(db, workspaceId, WORKSPACE_DATA_SETTING_KEYS.gdprDpaSignedAt, "");

  const payload = await buildWorkspaceDataPayload(db, workspaceId);

  return NextResponse.json({
    contract: payload.contract,
  });
}
