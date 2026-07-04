import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function userAvatarDirectory() {
  return path.join(process.cwd(), "public", "images", "avatars", "users");
}

export function userAvatarPublicPath(userId: string, extension: string) {
  return `/images/avatars/users/${userId}.${extension}`;
}

export function validateUserAvatar(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "Avatar must be a JPEG, PNG, or WebP image" as const };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Avatar must be smaller than 10 MB" as const };
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    return { error: "Unsupported image type" as const };
  }

  return { extension };
}

export type SaveUserAvatarResult = { error: string } | { avatarUrl: string };

export async function saveUserAvatar(userId: string, file: File): Promise<SaveUserAvatarResult> {
  const validated = validateUserAvatar(file);
  if ("error" in validated && validated.error) {
    return { error: validated.error };
  }

  const directory = userAvatarDirectory();
  mkdirSync(directory, { recursive: true });

  for (const extension of Object.values(EXTENSION_BY_MIME)) {
    try {
      unlinkSync(path.join(directory, `${userId}.${extension}`));
    } catch {
      // Ignore missing files.
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${userId}.${validated.extension}`;
  writeFileSync(path.join(directory, filename), buffer);

  return {
    avatarUrl: userAvatarPublicPath(userId, validated.extension),
  };
}

export function removeUserAvatarFiles(userId: string) {
  const directory = userAvatarDirectory();

  for (const extension of Object.values(EXTENSION_BY_MIME)) {
    try {
      unlinkSync(path.join(directory, `${userId}.${extension}`));
    } catch {
      // Ignore missing files.
    }
  }
}
