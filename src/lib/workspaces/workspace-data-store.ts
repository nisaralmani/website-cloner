import { and, count, eq } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { selectOne } from "@/db/client";
import {
  campaignRecipients,
  campaigns,
  helpdeskArticles,
  workspaceMembers,
  workspaceSettings,
  workspaces,
} from "@/db/schema";
import {
  campaignRecipientsMain,
  DEFAULT_WORKSPACE_DATA_LIMITS,
  GDPR_CONTRACT_LABEL,
  GDPR_CONTRACT_VIEW_HREF,
  knowledgeBaseDescriptionEnabled,
  KNOWLEDGE_BASE_DESCRIPTION_DISABLED,
  limitProgress,
  usagePairMain,
  WORKSPACE_DATA_LIMIT_LABELS,
  WORKSPACE_DATA_PAGE,
  WORKSPACE_DATA_SETTING_KEYS,
  workspaceDataSettingKey,
} from "@/lib/workspaces/workspace-data";
import type {
  WorkspaceDataLimit,
  WorkspaceDataLimitKey,
  WorkspaceDataPayload,
} from "@/types/workspace-data";

type StoredWorkspaceData = {
  magicReplyTrained: boolean;
  magicReplyLastTrainedAt: string | null;
  campaignRecipientsLimit: number;
  operatorsLimit: number;
  filesUploadLimit: number;
  filesUploadedCount: number;
  gdprDpaSigned: boolean;
  gdprDpaSignedAt: string | null;
};

function parseStoredNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function loadStoredWorkspaceData(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
): Promise<StoredWorkspaceData> {
  const prefix = `${WORKSPACE_DATA_PAGE}::`;
  const allRows = await db
    .select()
    .from(workspaceSettings)
    .where(eq(workspaceSettings.workspaceId, workspaceId));

  const values: Record<string, string> = {};
  for (const row of allRows) {
    if (row.settingKey.startsWith(prefix)) {
      values[row.settingKey.slice(prefix.length)] = row.value;
    }
  }

  return {
    magicReplyTrained: values[WORKSPACE_DATA_SETTING_KEYS.magicReplyTrained] === "true",
    magicReplyLastTrainedAt: values[WORKSPACE_DATA_SETTING_KEYS.magicReplyLastTrainedAt] || null,
    campaignRecipientsLimit: parseStoredNumber(
      values[WORKSPACE_DATA_SETTING_KEYS.campaignRecipientsLimit],
      DEFAULT_WORKSPACE_DATA_LIMITS.campaignRecipientsLimit,
    ),
    operatorsLimit: parseStoredNumber(
      values[WORKSPACE_DATA_SETTING_KEYS.operatorsLimit],
      DEFAULT_WORKSPACE_DATA_LIMITS.operatorsLimit,
    ),
    filesUploadLimit: parseStoredNumber(
      values[WORKSPACE_DATA_SETTING_KEYS.filesUploadLimit],
      DEFAULT_WORKSPACE_DATA_LIMITS.filesUploadLimit,
    ),
    filesUploadedCount: parseStoredNumber(
      values[WORKSPACE_DATA_SETTING_KEYS.filesUploadedCount],
      DEFAULT_WORKSPACE_DATA_LIMITS.filesUploadedCount,
    ),
    gdprDpaSigned: values[WORKSPACE_DATA_SETTING_KEYS.gdprDpaSigned] === "true",
    gdprDpaSignedAt: values[WORKSPACE_DATA_SETTING_KEYS.gdprDpaSignedAt] || null,
  };
}

export async function saveWorkspaceDataSetting(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
  localKey: string,
  value: string,
) {
  const settingKey = workspaceDataSettingKey(localKey);
  const existing = await selectOne(
    db
      .select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      ),
  );

  if (existing) {
    await db
      .update(workspaceSettings)
      .set({ value })
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      );
  } else {
    await db.insert(workspaceSettings).values({
      workspaceId,
      settingKey,
      value,
    });
  }
}

async function countWorkspaceOperators(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const result = await db
    .select({ value: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return Number(result[0]?.value ?? 0);
}

async function countHelpdeskArticles(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const result = await db
    .select({ value: count() })
    .from(helpdeskArticles)
    .where(eq(helpdeskArticles.workspaceId, workspaceId));

  return Number(result[0]?.value ?? 0);
}

async function countWorkspaceCampaignRecipients(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const result = await db
    .select({ value: count() })
    .from(campaignRecipients)
    .innerJoin(campaigns, eq(campaignRecipients.campaignId, campaigns.id))
    .where(eq(campaigns.workspaceId, workspaceId));

  return Number(result[0]?.value ?? 0);
}

function buildLimitRows(
  stored: StoredWorkspaceData,
  operatorCount: number,
  campaignUsed: number,
): WorkspaceDataLimit[] {
  return [
    {
      key: "campaignRecipients",
      label: WORKSPACE_DATA_LIMIT_LABELS.campaignRecipients,
      main: campaignRecipientsMain(campaignUsed, stored.campaignRecipientsLimit),
      progress: limitProgress(campaignUsed, stored.campaignRecipientsLimit),
      tone: "blue",
      limit: stored.campaignRecipientsLimit,
      used: campaignUsed,
    },
    {
      key: "operators",
      label: WORKSPACE_DATA_LIMIT_LABELS.operators,
      main: usagePairMain(operatorCount, stored.operatorsLimit),
      secondary: "(in total)",
      progress: limitProgress(operatorCount, stored.operatorsLimit),
      tone: "blue",
      limit: stored.operatorsLimit,
      used: operatorCount,
    },
    {
      key: "filesUploaded",
      label: WORKSPACE_DATA_LIMIT_LABELS.filesUploaded,
      main: usagePairMain(stored.filesUploadedCount, stored.filesUploadLimit),
      secondary: "Every 1d",
      progress: limitProgress(stored.filesUploadedCount, stored.filesUploadLimit),
      tone: "black",
      limit: stored.filesUploadLimit,
      used: stored.filesUploadedCount,
    },
  ];
}

export async function buildWorkspaceDataPayload(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
): Promise<WorkspaceDataPayload> {
  const [stored, workspace, operatorCount, articleCount, campaignRecipientCount] =
    await Promise.all([
    loadStoredWorkspaceData(db, workspaceId),
    selectOne(db.select().from(workspaces).where(eq(workspaces.id, workspaceId))),
    countWorkspaceOperators(db, workspaceId),
    countHelpdeskArticles(db, workspaceId),
    countWorkspaceCampaignRecipients(db, workspaceId),
  ]);

  const knowledgeBaseEnabled = workspace?.helpdeskEnabled === 1;

  return {
    training: {
      magicReplyNeverTrained: !stored.magicReplyTrained,
      magicReplyLastTrainedAt: stored.magicReplyLastTrainedAt,
      knowledgeBaseEnabled,
      helpdeskArticleCount: articleCount,
      knowledgeBaseDescription: knowledgeBaseEnabled
        ? knowledgeBaseDescriptionEnabled(articleCount)
        : KNOWLEDGE_BASE_DESCRIPTION_DISABLED,
    },
    limits: buildLimitRows(stored, operatorCount, campaignRecipientCount),
    contract: {
      label: GDPR_CONTRACT_LABEL,
      signed: stored.gdprDpaSigned,
      signedAt: stored.gdprDpaSignedAt,
      viewHref: GDPR_CONTRACT_VIEW_HREF,
    },
  };
}

export function storedLimitValue(stored: StoredWorkspaceData, key: WorkspaceDataLimitKey) {
  if (key === "campaignRecipients") {
    return stored.campaignRecipientsLimit;
  }
  if (key === "operators") {
    return stored.operatorsLimit;
  }
  return stored.filesUploadLimit;
}

export function storedLimitSettingKey(key: WorkspaceDataLimitKey) {
  if (key === "campaignRecipients") {
    return WORKSPACE_DATA_SETTING_KEYS.campaignRecipientsLimit;
  }
  if (key === "operators") {
    return WORKSPACE_DATA_SETTING_KEYS.operatorsLimit;
  }
  return WORKSPACE_DATA_SETTING_KEYS.filesUploadLimit;
}

export async function incrementFilesUploadedCount(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const stored = await loadStoredWorkspaceData(db, workspaceId);
  if (stored.filesUploadedCount >= stored.filesUploadLimit) {
    return { ok: false as const, error: "File upload limit reached" };
  }

  const next = stored.filesUploadedCount + 1;
  await saveWorkspaceDataSetting(
    db,
    workspaceId,
    WORKSPACE_DATA_SETTING_KEYS.filesUploadedCount,
    String(next),
  );
  return { ok: true as const, count: next };
}

export async function assertOperatorLimit(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const stored = await loadStoredWorkspaceData(db, workspaceId);
  const operatorCount = await countWorkspaceOperators(db, workspaceId);
  if (operatorCount >= stored.operatorsLimit) {
    return "Workspace operator limit reached";
  }
  return null;
}
