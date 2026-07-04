import type { WorkspaceDataLimitKey } from "@/types/workspace-data";

export const WORKSPACE_DATA_PAGE = "workspace/data";

export const WORKSPACE_DATA_SETTING_KEYS = {
  magicReplyTrained: "magicReplyTrained",
  magicReplyLastTrainedAt: "magicReplyLastTrainedAt",
  campaignRecipientsLimit: "campaignRecipientsLimit",
  operatorsLimit: "operatorsLimit",
  filesUploadLimit: "filesUploadLimit",
  filesUploadedCount: "filesUploadedCount",
  gdprDpaSigned: "gdprDpaSigned",
  gdprDpaSignedAt: "gdprDpaSignedAt",
} as const;

export const DEFAULT_WORKSPACE_DATA_LIMITS = {
  campaignRecipientsLimit: 50,
  operatorsLimit: 2,
  filesUploadLimit: 500,
  filesUploadedCount: 0,
} as const;

export const WORKSPACE_DATA_LIMIT_LABELS: Record<WorkspaceDataLimitKey, string> = {
  campaignRecipients: "Campaign recipients limit",
  operators: "Workspace operators limit",
  filesUploaded: "Files uploaded",
};

export const WORKSPACE_DATA_LIMIT_KEYS = Object.keys(
  WORKSPACE_DATA_LIMIT_LABELS,
) as WorkspaceDataLimitKey[];

export const GDPR_CONTRACT_LABEL = "GDPR Data Processing Agreement";
export const GDPR_CONTRACT_VIEW_HREF = "/documents/gdpr_dpa_contract.pdf";

export const KNOWLEDGE_BASE_DESCRIPTION_DISABLED =
  "You do not have a Bybelt Knowledge Base. Did you know that articles that you write there are also used as training data for MagicReply and Copilot?";

export function knowledgeBaseDescriptionEnabled(articleCount: number) {
  if (articleCount === 0) {
    return "Your Bybelt Knowledge Base is enabled. Add articles to improve MagicReply and Copilot training data.";
  }

  return `Your Knowledge Base has ${articleCount} article${articleCount === 1 ? "" : "s"} used as training data for MagicReply and Copilot.`;
}

export function workspaceDataSettingKey(localKey: string) {
  return `${WORKSPACE_DATA_PAGE}::${localKey}`;
}

export function limitProgress(used: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / limit) * 100));
}

export function campaignRecipientsMain(used: number, limit: number) {
  if (used === 0) {
    return String(limit);
  }
  return `${used} / ${limit}`;
}

export function usagePairMain(used: number, limit: number) {
  return `${used} / ${limit}`;
}

export function validateWorkspaceDataLimit(key: WorkspaceDataLimitKey, limit: number) {
  if (!Number.isFinite(limit) || limit < 1) {
    return `${key} limit must be at least 1`;
  }

  if (key === "operators" && limit > 100) {
    return "operators limit must be 100 or less";
  }

  if (key === "campaignRecipients" && limit > 1_000_000) {
    return "campaignRecipients limit is too large";
  }

  if (key === "filesUploaded" && limit > 100_000) {
    return "filesUploaded limit is too large";
  }

  return null;
}

export function workspaceDataLimitKeyForLabel(label: string): WorkspaceDataLimitKey | null {
  const entry = Object.entries(WORKSPACE_DATA_LIMIT_LABELS).find(([, value]) => value === label);
  return entry ? (entry[0] as WorkspaceDataLimitKey) : null;
}

export function editLimitIncrement(key: WorkspaceDataLimitKey, currentLimit: number) {
  if (key === "campaignRecipients") {
    return currentLimit + 25;
  }
  if (key === "operators") {
    return currentLimit + 1;
  }
  return currentLimit + 50;
}
