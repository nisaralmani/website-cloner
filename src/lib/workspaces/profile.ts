import type { workspaces } from "@/db/schema";
import {
  normalizeWorkspaceDomain,
  validateWorkspaceInput,
  workspaceInitials,
} from "@/lib/workspaces/utils";
import type { WorkspaceProfile, WorkspaceProfileFieldKey } from "@/lib/workspaces/profile-fields";

export type { WorkspaceProfile, WorkspaceProfileFieldKey } from "@/lib/workspaces/profile-fields";
export {
  WORKSPACE_FIELD_BY_LABEL,
  workspaceFieldKeyForLabel,
} from "@/lib/workspaces/profile-fields";

export function normalizeWorkspaceProfile(
  workspace: typeof workspaces.$inferSelect,
): WorkspaceProfile {
  return {
    name: workspace.name,
    domain: workspace.domain,
    logoUrl: workspace.logoUrl ?? "",
    initials: workspace.initials,
    contactEmail: workspace.contactEmail ?? "",
    contactPhone: workspace.contactPhone ?? "",
    contactMessenger: workspace.contactMessenger ?? "",
    contactTelegram: workspace.contactTelegram ?? "",
    contactTwitter: workspace.contactTwitter ?? "",
    contactWhatsapp: workspace.contactWhatsapp ?? "",
    contactInstagram: workspace.contactInstagram ?? "",
  };
}

export function sanitizeWorkspacePatch(patch: Partial<Record<WorkspaceProfileFieldKey, string>>) {
  const sanitized: Partial<Record<WorkspaceProfileFieldKey, string>> = {};

  for (const [key, value] of Object.entries(patch) as [WorkspaceProfileFieldKey, string][]) {
    sanitized[key] = value.trim();
  }

  return sanitized;
}

export function validateWorkspacePatch(
  patch: Partial<Record<WorkspaceProfileFieldKey, string>>,
  current: WorkspaceProfile,
) {
  const errors: string[] = [];

  if (patch.name !== undefined && !patch.name.trim()) {
    errors.push("name is required");
  }

  if (patch.domain !== undefined) {
    const validated = validateWorkspaceInput(current.name, patch.domain);
    if ("error" in validated && validated.error) {
      errors.push(validated.error);
    }
  }

  if (patch.name !== undefined && patch.domain === undefined) {
    const validated = validateWorkspaceInput(patch.name, current.domain);
    if ("error" in validated && validated.error) {
      errors.push(validated.error);
    }
  }

  return errors;
}

export function workspacePatchToRow(
  patch: Partial<Record<WorkspaceProfileFieldKey, string>>,
  current: WorkspaceProfile,
) {
  const row: Partial<typeof workspaces.$inferInsert> = {};
  const nextName = patch.name !== undefined ? patch.name.trim() : current.name;
  const nextDomain =
    patch.domain !== undefined ? normalizeWorkspaceDomain(patch.domain) : current.domain;

  if (patch.name !== undefined || patch.domain !== undefined) {
    const validated = validateWorkspaceInput(nextName, nextDomain);
    if (!("error" in validated)) {
      if (patch.name !== undefined) {
        row.name = validated.name;
        row.initials = workspaceInitials(validated.name);
      }
      if (patch.domain !== undefined) {
        row.domain = validated.domain;
      }
    }
  }

  if (patch.contactEmail !== undefined) row.contactEmail = patch.contactEmail || null;
  if (patch.contactPhone !== undefined) row.contactPhone = patch.contactPhone || null;
  if (patch.contactMessenger !== undefined) row.contactMessenger = patch.contactMessenger || null;
  if (patch.contactTelegram !== undefined) row.contactTelegram = patch.contactTelegram || null;
  if (patch.contactTwitter !== undefined) row.contactTwitter = patch.contactTwitter || null;
  if (patch.contactWhatsapp !== undefined) row.contactWhatsapp = patch.contactWhatsapp || null;
  if (patch.contactInstagram !== undefined) row.contactInstagram = patch.contactInstagram || null;

  return row;
}
