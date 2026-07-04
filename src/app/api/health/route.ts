/**
 * GET /api/health — production health/readiness endpoint (Phase 18).
 *
 * Reports application status, dependency connectivity, configuration validity,
 * version, uptime and timestamp. Returns 200 when healthy, 503 when a
 * launch-critical dependency (database) is down or production config is invalid.
 * Used by the Docker HEALTHCHECK and external monitors.
 */

import { appVersion, validateConfig } from "@/lib/config";
import {
  checkDatabase,
  checkInternalBridge,
  checkJobs,
  checkRedis,
  type CheckResult,
} from "@/lib/health/checks";
import { withRequestLogging } from "@/lib/logging/request-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bootAt = Date.now();

function nowIso(): string {
  return new Date().toISOString();
}

async function handler(): Promise<Response> {
  const [database, bridge, redis] = await Promise.all([
    checkDatabase(),
    checkInternalBridge(),
    checkRedis(),
  ]);
  const jobs = checkJobs();

  const config = validateConfig();

  // Healthy = DB reachable AND production configuration valid. Optional
  // dependencies (bridge/redis/jobs) being `disabled` never fail the check;
  // being `down` degrades but does not 503 (they are not launch-critical here).
  const healthy = database.status === "ok" && config.ok;
  const degraded =
    healthy &&
    (bridge.status === "down" ||
      jobs.status === "down" ||
      redis.status === "down" ||
      redis.status === "reconnecting" ||
      redis.status === "disconnected");

  const status: "healthy" | "degraded" | "unhealthy" = !healthy
    ? "unhealthy"
    : degraded
      ? "degraded"
      : "healthy";

  const body = {
    status,
    version: appVersion(),
    environment: config.environment,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: nowIso(),
    checks: {
      database,
      internalBridge: bridge,
      redis,
      jobs,
      config: configCheck(config),
    },
  };

  return Response.json(body, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

function configCheck(config: ReturnType<typeof validateConfig>): CheckResult & {
  errors: number;
  warnings: number;
  issues: { key: string; severity: string; message: string }[];
} {
  return {
    status: config.ok ? "ok" : "down",
    errors: config.errors.length,
    warnings: config.warnings.length,
    issues: [...config.errors, ...config.warnings],
  };
}

export const GET = withRequestLogging(handler);
