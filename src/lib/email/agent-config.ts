/**
 * AI agent configuration (ported from Ai Helpdesk agentConfig.ts).
 */
import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { getDb, selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export interface AgentConfig {
  identity: {
    name: string;
    greeting: string;
  };
  transfer: {
    mode: "transfer" | "continue";
    onlineMessage: string;
    offlineMessage: string;
  };
  actions: {
    orderTracking: boolean;
    cancelOrder: boolean;
    orderReturn: boolean;
    editAddress: boolean;
  };
  channels: {
    chat: { aiAgent: boolean; aiAssistance: boolean };
    email: { aiAgent: boolean; aiAssistance: boolean };
    instagram: { aiAgent: boolean; aiAssistance: boolean };
  };
  flows: {
    proactiveWelcome: { enabled: boolean; message: string; delaySec: number };
    keywordAutoresponder: { enabled: boolean };
    cartRecovery: { enabled: boolean };
  };
  orderActions: {
    changeAddress: "enabled" | "approval" | "disabled";
    cancelOrder: "enabled" | "approval" | "disabled";
    refund: "enabled" | "approval" | "disabled";
    createReturn: "enabled" | "approval" | "disabled";
  };
  emailAgent: {
    mode: "auto" | "approval" | "notes";
    confidenceThreshold: number;
    spamFilter: boolean;
    ignoreNoReply: boolean;
    vipAutoEscalate: boolean;
  };
  /** Merchant-specific store policy (returns/refunds/shipping/warranty) fed to AI reply prompts. Empty string = no merchant override configured yet. */
  storePolicy: string;
  /**
   * AI safety, confidence & human-review settings (Phase 21, Task 6).
   * Consumed by the unified safety engine (`@/lib/ai/safety`). Shape is a
   * structural match for `SafetySettings` so it can be passed straight through.
   */
  safety: {
    /** Minimum confidence required to auto-send (hard floor). */
    minConfidence: number;
    /** Master switch — when false the AI drafts at most, never auto-sends. */
    autoSendEnabled: boolean;
    /** Force every reply to a draft regardless of confidence. */
    draftOnlyMode: boolean;
    /** Force every reply through human review before it can go out. */
    humanReviewRequired: boolean;
    /** Whether to surface the confidence explanation to operators/UI. */
    confidenceExplanation: boolean;
    /** Per-workspace confidence score → tier bands. */
    thresholds: {
      autoSend: number;
      createDraft: number;
      humanReview: number;
    };
  };
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  identity: {
    name: "AI Assistant",
    greeting: "Hi there! How can we help you today?",
  },
  transfer: {
    mode: "transfer",
    onlineMessage:
      "I've reached out to our support team — they're looking into this and will reply here shortly.",
    offlineMessage:
      "I've passed this to our support team. We're offline right now, but they'll get back to you by email soon.",
  },
  actions: {
    orderTracking: true,
    cancelOrder: true,
    orderReturn: true,
    editAddress: true,
  },
  channels: {
    chat: { aiAgent: true, aiAssistance: true },
    email: { aiAgent: true, aiAssistance: true },
    instagram: { aiAgent: false, aiAssistance: false },
  },
  flows: {
    proactiveWelcome: { enabled: true, message: "Hi! Need help finding anything?", delaySec: 8 },
    keywordAutoresponder: { enabled: true },
    cartRecovery: { enabled: false },
  },
  orderActions: {
    changeAddress: "enabled",
    cancelOrder: "approval",
    refund: "approval",
    createReturn: "enabled",
  },
  emailAgent: {
    mode: "auto",
    confidenceThreshold: 75,
    spamFilter: true,
    ignoreNoReply: true,
    vipAutoEscalate: true,
  },
  storePolicy: "",
  safety: {
    minConfidence: 75,
    autoSendEnabled: true,
    draftOnlyMode: false,
    humanReviewRequired: false,
    confidenceExplanation: true,
    thresholds: {
      autoSend: 75,
      createDraft: 50,
      humanReview: 25,
    },
  },
};

const CONFIG_KEY = "email/agent::config";

function merge(base: AgentConfig, patch: Partial<AgentConfig>): AgentConfig {
  return {
    identity: { ...base.identity, ...patch.identity },
    transfer: { ...base.transfer, ...patch.transfer },
    actions: { ...base.actions, ...patch.actions },
    channels: {
      chat: { ...base.channels.chat, ...patch.channels?.chat },
      email: { ...base.channels.email, ...patch.channels?.email },
      instagram: { ...base.channels.instagram, ...patch.channels?.instagram },
    },
    flows: {
      proactiveWelcome: { ...base.flows.proactiveWelcome, ...patch.flows?.proactiveWelcome },
      keywordAutoresponder: {
        ...base.flows.keywordAutoresponder,
        ...patch.flows?.keywordAutoresponder,
      },
      cartRecovery: { ...base.flows.cartRecovery, ...patch.flows?.cartRecovery },
    },
    orderActions: { ...base.orderActions, ...patch.orderActions },
    emailAgent: { ...base.emailAgent, ...patch.emailAgent },
    storePolicy: patch.storePolicy ?? base.storePolicy,
    safety: {
      ...base.safety,
      ...patch.safety,
      thresholds: { ...base.safety.thresholds, ...patch.safety?.thresholds },
    },
  };
}

export async function getWorkspaceAgentConfig(
  db: AppDatabase,
  workspaceId: string,
): Promise<AgentConfig> {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CONFIG_KEY),
        ),
      ),
  );
  if (!row?.value) return DEFAULT_AGENT_CONFIG;
  try {
    return merge(DEFAULT_AGENT_CONFIG, JSON.parse(row.value) as Partial<AgentConfig>);
  } catch {
    return DEFAULT_AGENT_CONFIG;
  }
}

export async function getWorkspaceAgentConfigForWorkspace(workspaceId: string) {
  const db = await getDb();
  return getWorkspaceAgentConfig(db, workspaceId);
}

export async function setWorkspaceAgentConfig(
  db: AppDatabase,
  workspaceId: string,
  patch: Partial<AgentConfig>,
): Promise<AgentConfig> {
  const merged = merge(await getWorkspaceAgentConfig(db, workspaceId), patch);
  const existing = await selectOne(
    db
      .select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CONFIG_KEY),
        ),
      ),
  );

  if (existing) {
    await db
      .update(workspaceSettings)
      .set({ value: JSON.stringify(merged) })
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CONFIG_KEY),
        ),
      );
  } else {
    await db.insert(workspaceSettings).values({
      workspaceId,
      settingKey: CONFIG_KEY,
      value: JSON.stringify(merged),
    });
  }

  return merged;
}
