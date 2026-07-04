import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "crypto";
import {
  DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES,
  isAudioAttachmentMime,
} from "@/lib/chatbox/attachment-preferences";
import type { MessageAttachment } from "@/types/inbox";

const FILE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

const AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

export function chatboxUploadDirectory(workspaceId: string) {
  return path.join(process.cwd(), "public", "uploads", "chatbox", workspaceId);
}

export function chatboxAttachmentPublicPath(workspaceId: string, filename: string) {
  return `/api/chatbox/files/${workspaceId}/${filename}`;
}

export function isAllowedChatboxAttachmentMime(mime: string) {
  return FILE_MIME_TYPES.has(mime) || AUDIO_MIME_TYPES.has(mime);
}

type ValidationResult = { ok: false; error: string } | { ok: true; extension: string };

export function validateChatboxAttachment(
  file: File,
  maxBytes: number = DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES,
): ValidationResult {
  if (!isAllowedChatboxAttachmentMime(file.type)) {
    return {
      ok: false,
      error: "File must be an image, PDF, text, or audio recording",
    };
  }
  if (file.size > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `File must be smaller than ${limitMb} MB` };
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    return { ok: false, error: "Unsupported file type" };
  }

  return { ok: true, extension };
}

export type SavedChatboxAttachment = MessageAttachment & { messageId: string };

export async function saveChatboxAttachment(
  workspaceId: string,
  file: File,
  maxBytes: number = DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES,
): Promise<{ error: string } | SavedChatboxAttachment> {
  const validated = validateChatboxAttachment(file, maxBytes);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const messageId = randomUUID();
  const directory = chatboxUploadDirectory(workspaceId);
  mkdirSync(directory, { recursive: true });

  const filename = `${messageId}.${validated.extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(path.join(directory, filename), buffer);

  return {
    messageId,
    url: chatboxAttachmentPublicPath(workspaceId, filename),
    name: file.name.trim() || filename,
    mime: file.type,
    size: file.size,
  };
}

export { isAudioAttachmentMime };
