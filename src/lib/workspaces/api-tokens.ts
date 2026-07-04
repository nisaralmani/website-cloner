import { randomBytes } from "node:crypto";
import type { workspaceApiTokens } from "@/db/schema";
import type { WorkspaceApiToken, WorkspaceApiTokenCreated } from "@/types/workspace-advanced";

type ApiTokenRow = typeof workspaceApiTokens.$inferSelect;

export function generateApiTokenPlain() {
  return `bybelt_${randomBytes(18).toString("hex")}`;
}

export function tokenPreviewFromPlain(plainToken: string) {
  const suffix = plainToken.slice(-8);
  return `bybelt_••••${suffix}`;
}

export function defaultApiTokenLabel(existingCount: number) {
  return existingCount === 0 ? "API Token" : `API Token ${existingCount + 1}`;
}

export function toWorkspaceApiToken(row: ApiTokenRow): WorkspaceApiToken {
  return {
    id: row.id,
    label: row.label,
    tokenPreview: row.tokenPreview,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCreatedWorkspaceApiToken(
  row: ApiTokenRow,
  plainToken: string,
): WorkspaceApiTokenCreated {
  return {
    ...toWorkspaceApiToken(row),
    plainToken,
  };
}
