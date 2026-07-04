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
    WORKSPACE_DATA_SETTING_KEYS.magicReplyTrained,
    "true",
  );
  await saveWorkspaceDataSetting(
    db,
    workspaceId,
    WORKSPACE_DATA_SETTING_KEYS.magicReplyLastTrainedAt,
    now,
  );

  const payload = await buildWorkspaceDataPayload(db, workspaceId);

  return NextResponse.json({
    trainedAt: now,
    training: payload.training,
  });
}

export async function DELETE() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  await saveWorkspaceDataSetting(
    db,
    workspaceId,
    WORKSPACE_DATA_SETTING_KEYS.magicReplyTrained,
    "false",
  );
  await saveWorkspaceDataSetting(db, workspaceId, WORKSPACE_DATA_SETTING_KEYS.magicReplyLastTrainedAt, "");

  const payload = await buildWorkspaceDataPayload(db, workspaceId);

  return NextResponse.json({
    training: payload.training,
  });
}
