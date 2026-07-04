/**
 * Startup validation (Phase 18).
 *
 * Called once from the Next.js instrumentation hook on server boot. Validates
 * configuration, prints a startup report, and fails fast in production when the
 * configuration is invalid — so a misconfigured production deploy refuses to
 * start instead of silently degrading (e.g. falling back to SQLite).
 */

import {
  appVersion,
  describeRuntimeFeatures,
  jobShutdownDrainMs,
  validateConfig,
} from "@/lib/config";
import { logger } from "@/lib/logging/logger";

let hasRun = false;

/** True during `next build` — never abort the build over runtime config. */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function runStartupValidation(): void {
  // Safety guard (STEP 6): startup side-effects must run exactly once per
  // process even if the instrumentation hook is invoked more than once.
  if (hasRun) return;
  hasRun = true;

  const report = validateConfig();

  logger.info("startup", {
    event: "startup",
    version: appVersion(),
    environment: report.environment,
    dialect: report.dialect,
    nodeVersion: process.version,
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    configOk: report.ok,
    errors: report.errors.length,
    warnings: report.warnings.length,
    drainWindowMs: jobShutdownDrainMs(),
  });

  // Operator diagnostics (STEP 5): one line per optional subsystem so an
  // operator can see at a glance what is active in this deployment.
  for (const feature of describeRuntimeFeatures()) {
    logger.info("startup_feature", {
      event: "startup_feature",
      feature: feature.name,
      enabled: feature.enabled,
      detail: feature.detail,
    });
  }

  for (const warning of report.warnings) {
    logger.warn("startup_config_warning", { key: warning.key, message: warning.message });
  }
  for (const error of report.errors) {
    logger.error("startup_config_error", { key: error.key, message: error.message });
  }

  if (!report.ok && report.isProduction && !isBuildPhase()) {
    logger.error("startup_aborted", {
      reason: "invalid production configuration",
      errorKeys: report.errors.map((issue) => issue.key),
    });
    // Fail fast: do not serve traffic with invalid production config.
    throw new Error(
      `Invalid production configuration — refusing to start. Failed keys: ${report.errors
        .map((issue) => issue.key)
        .join(", ")}`,
    );
  }

  logger.info("startup_complete", {
    event: "startup_complete",
    status: report.ok ? "ready" : "degraded",
    warnings: report.warnings.length,
  });
}
