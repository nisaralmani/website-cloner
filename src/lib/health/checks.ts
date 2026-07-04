/**
 * Health check probes (Phase 18).
 *
 * Each probe is best-effort, bounded, and never throws — a failing dependency
 * is reported as `down`/`error`, not surfaced as an exception. Used by
 * GET /api/health.
 */

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { httpRequest } from "@/lib/http/client";
import { getRedisStatus, isRedisEnabled, pingRedis } from "@/lib/infra/redis-client";
import { internalBridgeConfig } from "@/lib/config";
import { getJobsHealth, type JobsHealth } from "@/lib/jobs/health";
import { getReliabilityHealth, type ReliabilityHealth } from "@/lib/reliability/health";
import { captureException } from "@/lib/observability/error-tracking";

export type CheckStatus =
  | "ok"
  | "down"
  | "disabled"
  | "unknown"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type CheckResult = {
  status: CheckStatus;
  latencyMs?: number;
  detail?: string;
};

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; latencyMs: number }> {
  const start = Date.now();
  const value = await fn();
  return { value, latencyMs: Date.now() - start };
}

/** Cross-dialect connectivity ping (sqlite uses `.run`, postgres uses `.execute`). */
export async function checkDatabase(): Promise<CheckResult> {
  try {
    const { latencyMs } = await timed(async () => {
      const db = (await getDb()) as unknown as {
        run?: (query: unknown) => Promise<unknown>;
        execute?: (query: unknown) => Promise<unknown>;
      };
      const query = sql`select 1`;
      if (typeof db.execute === "function") {
        await db.execute(query);
      } else if (typeof db.run === "function") {
        await db.run(query);
      } else {
        throw new Error("No executable query method on database handle");
      }
    });
    return { status: "ok", latencyMs };
  } catch (error) {
    captureException(error, { route: "/api/health", tags: { check: "database" } });
    return {
      status: "down",
      detail: error instanceof Error ? error.message : "database check failed",
    };
  }
}

/**
 * Internal bridge (Shopify plugin app) connectivity via the existing
 * authenticated internal health endpoint. `disabled` when the bridge secret is
 * not configured (single-runtime deploys).
 */
export async function checkInternalBridge(): Promise<CheckResult> {
  // Phase 25: single parse via centralized config accessor.
  const bridge = internalBridgeConfig();
  if (!bridge.enabled) {
    return { status: "disabled", detail: "BYBELT_INTERNAL_SECRET not configured" };
  }

  const url = `${bridge.url}/plugin/shopify/internal/health`;

  try {
    const { latencyMs } = await timed(() =>
      httpRequest(url, {
        headers: { "X-Bybelt-Internal-Secret": process.env.BYBELT_INTERNAL_SECRET!.trim() },
        cache: "no-store",
        timeoutMs: 2_000,
        event: "health_bridge_probe",
      }),
    );
    return { status: "ok", latencyMs };
  } catch (error) {
    return {
      status: "down",
      detail: error instanceof Error ? error.message : "bridge unreachable",
    };
  }
}

/**
 * Redis status. `disabled` when REDIS_URL is unset (in-memory fan-out is the
 * documented single-instance default). When configured, performs a bounded
 * PING against a short-lived client.
 */
export async function checkRedis(): Promise<CheckResult> {
  if (!isRedisEnabled()) {
    return { status: "disabled", detail: "REDIS_URL not configured" };
  }

  const runtimeStatus = getRedisStatus();
  if (runtimeStatus === "reconnecting") {
    return {
      status: runtimeStatus,
      detail: "Redis client is reconnecting",
    };
  }

  try {
    const latencyMs = await pingRedis();
    return { status: "connected", latencyMs };
  } catch (error) {
    return {
      status: "disconnected",
      detail: error instanceof Error ? error.message : "redis ping failed",
    };
  }
}

/**
 * Background-job subsystem status (Phase 24C, STEP 8). Reports running/queued/
 * failed counts, last execution, and a degraded/draining state. Extends the
 * existing health surface — no new endpoint. Never throws.
 */
export function checkJobs(): CheckResult & {
  jobs: JobsHealth;
  reliability: ReliabilityHealth;
} {
  const jobs = getJobsHealth();
  // Phase 24D — fold circuit-breaker / retry-budget / recovery state into the
  // existing jobs health block (no new endpoint).
  const reliability = getReliabilityHealth();

  const jobsDown = jobs.status === "degraded" || jobs.status === "draining";
  const reliabilityDown = reliability.status === "degraded";
  const status: CheckStatus = jobsDown || reliabilityDown ? "down" : "ok";

  const details: string[] = [];
  if (jobs.status === "draining") details.push("draining in-flight jobs (shutdown)");
  else if (jobs.status === "degraded") details.push(`${jobs.failed} failed executions`);
  else details.push(`${jobs.running} running, ${jobs.queued} queued`);
  if (reliability.degradedDependencies.length > 0) {
    details.push(`degraded deps: ${reliability.degradedDependencies.join(", ")}`);
  }

  return {
    status,
    detail: details.join("; "),
    jobs,
    reliability,
  };
}
