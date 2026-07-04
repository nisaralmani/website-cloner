import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function workspaceLogoDirectory() {
  return path.join(process.cwd(), "public", "images", "workspaces");
}

export function workspaceLogoPublicPath(workspaceId: string, extension: string) {
  return `/images/workspaces/${workspaceId}.${extension}`;
}

export function validateWorkspaceLogo(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "Logo must be a JPEG, PNG, or WebP image" as const };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Logo must be smaller than 5 MB" as const };
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    return { error: "Unsupported image type" as const };
  }

  return { extension };
}

export type SaveWorkspaceLogoResult = { error: string } | { logoUrl: string };

export async function saveWorkspaceLogo(
  workspaceId: string,
  file: File,
): Promise<SaveWorkspaceLogoResult> {
  const validated = validateWorkspaceLogo(file);
  if ("error" in validated && validated.error) {
    return { error: validated.error };
  }

  const directory = workspaceLogoDirectory();
  mkdirSync(directory, { recursive: true });

  for (const extension of Object.values(EXTENSION_BY_MIME)) {
    try {
      unlinkSync(path.join(directory, `${workspaceId}.${extension}`));
    } catch {
      // Ignore missing files.
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${workspaceId}.${validated.extension}`;
  writeFileSync(path.join(directory, filename), buffer);

  return {
    logoUrl: workspaceLogoPublicPath(workspaceId, validated.extension),
  };
}

export function removeWorkspaceLogoFiles(workspaceId: string) {
  const directory = workspaceLogoDirectory();

  for (const extension of Object.values(EXTENSION_BY_MIME)) {
    try {
      unlinkSync(path.join(directory, `${workspaceId}.${extension}`));
    } catch {
      // Ignore missing files.
    }
  }
}
