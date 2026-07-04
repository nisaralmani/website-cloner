import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import {
  getChatboxMaxAttachmentBytes,
  isChatboxAudioAllowed,
  isChatboxFilesAllowed,
} from "@/lib/chatbox/attachment-preferences";
import { getChatboxVisitorIdentityPreferences } from "@/lib/chatbox/visitor-identity-preferences";
import { evaluateChatboxAccess } from "@/lib/chatbox/restriction-enforcement";
import { resolveWorkspaceForChatbox } from "@/lib/chatbox/visitor-session";
import { isRatingsEnabled } from "@/lib/email/behavior-preferences";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim();
  const domain = url.searchParams.get("domain")?.trim();

  if (!workspaceId && !domain) {
    return NextResponse.json({ error: "workspaceId or domain is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspace = await resolveWorkspaceForChatbox(db, { workspaceId, domain });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const [allowFiles, allowAudio, maxAttachmentBytes, identity, access, ratingsEnabled] =
    await Promise.all([
    isChatboxFilesAllowed(db, workspace.id),
    isChatboxAudioAllowed(db, workspace.id),
    getChatboxMaxAttachmentBytes(db, workspace.id),
    getChatboxVisitorIdentityPreferences(db, workspace.id),
    evaluateChatboxAccess(
      db,
      workspace.id,
      {},
      request.headers.get("user-agent"),
    ),
    isRatingsEnabled(db, workspace.id),
  ]);

  return NextResponse.json({
    workspaceId: workspace.id,
    name: workspace.name,
    domain: workspace.domain,
    initials: workspace.initials,
    logoUrl: workspace.logoUrl,
    allowFiles,
    allowAudio,
    maxAttachmentBytes,
    askEmail: identity.askEmail,
    askPhone: identity.askPhone,
    forceIdentify: identity.forceIdentify,
    chatboxVisible: access.chatboxVisible,
    ratingsEnabled,
  });
}
