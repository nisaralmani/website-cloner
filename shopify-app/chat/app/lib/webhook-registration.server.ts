/**
 * Resilient webhook registration (Phase 20 — Task 6).
 *
 * `shopify.registerWebhooks({ session })` is called from two places: the
 * `afterAuth` hook (first install / reinstall) and the reconciliation job. A
 * transient failure there previously produced a partial installation state —
 * an authed shop with missing webhook subscriptions and no recovery path.
 *
 * This helper wraps the registration call with bounded exponential-backoff
 * retry and structured logging. It never throws: registration is best-effort at
 * the auth boundary (a thrown error would fail the whole OAuth completion), and
 * any shop left under-registered is detected and repaired by the reconciliation
 * job. Returns whether registration ultimately succeeded.
 */

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 200;

function log(level: "info" | "warn" | "error", fields: Record<string, unknown>): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    component: "webhook-registration",
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function registerWebhooksWithRetry(
  register: () => Promise<unknown>,
  ctx: { shop: string; origin: "afterAuth" | "reconcile" },
): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await register();
      log("info", {
        event: "webhook_registration_ok",
        shop: ctx.shop,
        origin: ctx.origin,
        attempt,
      });
      return true;
    } catch (error) {
      const isLast = attempt === MAX_ATTEMPTS;
      log(isLast ? "error" : "warn", {
        event: isLast ? "webhook_registration_failed" : "webhook_registration_retry",
        shop: ctx.shop,
        origin: ctx.origin,
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        errorType: error instanceof Error ? error.name : typeof error,
        error: error instanceof Error ? error.message : String(error),
      });
      if (isLast) return false;
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }
  return false;
}
