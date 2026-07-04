import type { AppDatabase } from "@/db/client";
import {
  getChatboxMaxAttachmentBytes,
  isChatboxAudioAllowed,
  isChatboxFilesAllowed,
} from "@/lib/chatbox/attachment-preferences";
import {
  isAudioAttachmentMime,
  saveChatboxAttachment,
  type SavedChatboxAttachment,
} from "@/lib/chatbox/message-attachment";
import { incrementFilesUploadedCount, loadStoredWorkspaceData } from "@/lib/workspaces/workspace-data-store";

type UploadFailure = { ok: false; error: string; status: number };
type UploadSuccess = { ok: true; attachment: SavedChatboxAttachment };

export async function uploadChatboxAttachment(
  db: AppDatabase,
  workspaceId: string,
  file: File,
): Promise<UploadFailure | UploadSuccess> {
  const isAudio = isAudioAttachmentMime(file.type);

  if (isAudio) {
    const audioAllowed = await isChatboxAudioAllowed(db, workspaceId);
    if (!audioAllowed) {
      return {
        ok: false,
        error: "Audio recordings are disabled for this chatbox",
        status: 403,
      };
    }
  } else {
    const filesAllowed = await isChatboxFilesAllowed(db, workspaceId);
    if (!filesAllowed) {
      return {
        ok: false,
        error: "File uploads are disabled for this chatbox",
        status: 403,
      };
    }
  }

  const maxBytes = await getChatboxMaxAttachmentBytes(db, workspaceId);
  const stored = await loadStoredWorkspaceData(db, workspaceId);
  if (stored.filesUploadedCount >= stored.filesUploadLimit) {
    return { ok: false, error: "File upload limit reached", status: 403 };
  }
  const saved = await saveChatboxAttachment(workspaceId, file, maxBytes);
  if ("error" in saved) {
    return { ok: false, error: saved.error, status: 400 };
  }

  await incrementFilesUploadedCount(db, workspaceId);

  return { ok: true, attachment: saved };
}
