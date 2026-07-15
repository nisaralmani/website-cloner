const DEFAULT_MAIN_INTERNAL_URL = "http://127.0.0.1:3004";
const DEFAULT_TIMEOUT_MS = 5_000;

function resolveMainAppBaseUrl(): string {
  return (process.env.BYBELT_MAIN_INTERNAL_URL ?? DEFAULT_MAIN_INTERNAL_URL).replace(/\/$/, "");
}

export class WorkspaceNotFoundError extends Error {
  constructor(workspaceId: string) {
    super(
      `Bybelt workspace ${workspaceId} was not found — it may have been deleted or ` +
        "recreated on the main app. Reconnect this store from Shopify Admin to relink it " +
        "to a current workspace.",
    );
    this.name = "WorkspaceNotFoundError";
  }
}

/**
 * Confirms a workspace still exists on the main app before a shop link is
 * created or updated to point at it. Without this, a workspace deleted or
 * recreated on the main app silently strands the Shopify store on a dead
 * workspace id: the storefront widget then 404s on every load with no
 * operator-visible signal that anything is wrong.
 */
export async function assertWorkspaceExists(workspaceId: string): Promise<void> {
  const base = resolveMainAppBaseUrl();

  let response: Response;
  try {
    response = await fetch(
      `${base}/api/chatbox/config?workspaceId=${encodeURIComponent(workspaceId)}`,
      { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) },
    );
  } catch (cause) {
    throw new Error(
      `Could not reach the Bybelt app to verify workspace ${workspaceId}: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    );
  }

  if (response.status === 404) {
    throw new WorkspaceNotFoundError(workspaceId);
  }
  if (!response.ok) {
    throw new Error(
      `Could not verify workspace ${workspaceId} on the Bybelt app (status ${response.status}).`,
    );
  }
}
