import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export const CHATBOX_BEHAVIOR_PAGE_SLUG = "chatbox/behavior";
export const CHATBOX_ALLOW_FILES_KEY = "2-0";
export const CHATBOX_ALLOW_AUDIO_KEY = "2-1";
export const CHATBOX_ATTACHMENT_MAX_BYTES_KEY = "chatbox/attachments::maxBytes";

import {
  DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES,
  MAX_CHATBOX_ATTACHMENT_MAX_BYTES,
  MIN_CHATBOX_ATTACHMENT_MAX_BYTES,
} from "@/lib/chatbox/attachment-limits";

export {
  DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES,
  MIN_CHATBOX_ATTACHMENT_MAX_BYTES,
  MAX_CHATBOX_ATTACHMENT_MAX_BYTES,
};

const AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
]);

function chatboxBehaviorSettingKey(localKey: string) {
  return `${CHATBOX_BEHAVIOR_PAGE_SLUG}::${localKey}`;
}

async function readWorkspaceSetting(
  db: AppDatabase,
  workspaceId: string,
  settingKey: string,
): Promise<string | null> {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      ),
  );

  return row?.value ?? null;
}

async function readChatboxBehaviorToggle(
  db: AppDatabase,
  workspaceId: string,
  localKey: string,
  defaultValue: boolean,
): Promise<boolean> {
  const row = await readWorkspaceSetting(db, workspaceId, chatboxBehaviorSettingKey(localKey));
  if (row === null) {
    return defaultValue;
  }
  return row === "true";
}

export function isAudioAttachmentMime(mime: string) {
  return AUDIO_MIME_TYPES.has(mime);
}

export async function isChatboxFilesAllowed(
  db: AppDatabase,
  workspaceId: string,
): Promise<boolean> {
  return readChatboxBehaviorToggle(db, workspaceId, CHATBOX_ALLOW_FILES_KEY, true);
}

export async function isChatboxAudioAllowed(
  db: AppDatabase,
  workspaceId: string,
): Promise<boolean> {
  return readChatboxBehaviorToggle(db, workspaceId, CHATBOX_ALLOW_AUDIO_KEY, true);
}

export async function getChatboxMaxAttachmentBytes(
  db: AppDatabase,
  workspaceId: string,
): Promise<number> {
  const raw = await readWorkspaceSetting(db, workspaceId, CHATBOX_ATTACHMENT_MAX_BYTES_KEY);
  if (!raw) {
    return DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES;
  }

  return Math.min(
    MAX_CHATBOX_ATTACHMENT_MAX_BYTES,
    Math.max(MIN_CHATBOX_ATTACHMENT_MAX_BYTES, parsed),
  );
}

export async function setChatboxMaxAttachmentBytes(
  db: AppDatabase,
  workspaceId: string,
  maxBytes: number,
): Promise<number> {
  const clamped = Math.min(
    MAX_CHATBOX_ATTACHMENT_MAX_BYTES,
    Math.max(MIN_CHATBOX_ATTACHMENT_MAX_BYTES, Math.round(maxBytes)),
  );

  const existing = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CHATBOX_ATTACHMENT_MAX_BYTES_KEY),
        ),
      ),
  );

  if (existing) {
    await db
      .update(workspaceSettings)
      .set({ value: String(clamped) })
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CHATBOX_ATTACHMENT_MAX_BYTES_KEY),
        ),
      );
  } else {
    await db.insert(workspaceSettings).values({
      workspaceId,
      settingKey: CHATBOX_ATTACHMENT_MAX_BYTES_KEY,
      value: String(clamped),
    });
  }

  return clamped;
}

export function validateChatboxMaxAttachmentBytes(maxBytes: number) {
  if (!Number.isFinite(maxBytes)) {
    return "maxBytes must be a number";
  }
  const rounded = Math.round(maxBytes);
  if (rounded < MIN_CHATBOX_ATTACHMENT_MAX_BYTES) {
    return `maxBytes must be at least ${MIN_CHATBOX_ATTACHMENT_MAX_BYTES}`;
  }
  if (rounded > MAX_CHATBOX_ATTACHMENT_MAX_BYTES) {
    return `maxBytes must be at most ${MAX_CHATBOX_ATTACHMENT_MAX_BYTES}`;
  }
  return null;
}
