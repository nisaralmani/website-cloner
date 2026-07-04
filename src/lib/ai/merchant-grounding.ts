/**
 * Merchant grounding provider — the single source of truth for the
 * merchant-specific facts (store policy, business info, configured AI
 * instructions) that AI prompt builders are allowed to state as fact.
 *
 * Every channel's prompt builder (chat, email, future channels) must obtain
 * merchant policy through this provider instead of hardcoding it. This does
 * NOT implement retrieval/RAG/embeddings — it is a thin, synchronous lookup
 * over the existing per-workspace agent config, with a safe fallback for
 * workspaces that haven't configured a policy yet.
 */
import type { AppDatabase } from "@/db/client";
import { getWorkspaceAgentConfig } from "@/lib/email/agent-config";

/**
 * Fallback used only when a workspace has not configured its own store
 * policy yet. Kept intentionally generic — do not add merchant-specific
 * claims here.
 */
const DEFAULT_STORE_POLICY =
  "We offer free replacements for manufacturing defects within 30 days, " +
  "free returns within 30 days, and priority shipping on replacements. " +
  "Always be warm, concise, and solution-oriented.";

export interface MerchantGrounding {
  /** Returns/refunds/shipping/warranty policy text to state as fact in prompts. */
  storePolicy: string;
  /** Where `storePolicy` came from: the workspace's configured value, or the generic default fallback. */
  source: "workspace" | "default";
  business: {
    name: string;
  };
  identity: {
    agentName: string;
    greeting: string;
  };
}

/**
 * Resolves the merchant-specific facts a prompt builder is allowed to state.
 * This is the ONLY place prompt builders should obtain merchant policy from.
 */
export async function resolveMerchantGrounding(
  db: AppDatabase,
  workspaceId: string,
): Promise<MerchantGrounding> {
  const cfg = await getWorkspaceAgentConfig(db, workspaceId);
  const configured = cfg.storePolicy?.trim();
  return {
    storePolicy: configured || DEFAULT_STORE_POLICY,
    source: configured ? "workspace" : "default",
    business: {
      name: cfg.identity.name || "Support",
    },
    identity: {
      agentName: cfg.identity.name || "Support",
      greeting: cfg.identity.greeting,
    },
  };
}
