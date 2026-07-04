/**
 * Centralized configuration validation (Phase 18).
 *
 * Single source of truth for validating required environment configuration.
 * `validateConfig()` is pure (no side effects) and safe to call from the health
 * endpoint; `runStartupValidation()` (see @/lib/startup) uses it to fail fast in
 * production.
 *
 * This module does NOT change how config is read elsewhere — it validates the
 * same `process.env.*` the app already consumes, so the diff stays minimal and
 * runtime behavior is unchanged when configuration is valid.
 */

import { getDatabaseDialect, type DatabaseDialect } from "@/db/dialect";

export type ConfigSeverity = "error" | "warning";

export type ConfigIssue = {
  key: string;
  severity: ConfigSeverity;
  message: string;
};

export type ConfigReport = {
  ok: boolean;
  environment: string;
  isProduction: boolean;
  dialect: DatabaseDialect;
  errors: ConfigIssue[];
  warnings: ConfigIssue[];
};

function isNonEmpty(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Parse a boolean opt-in env flag ("1"/"true"/"yes"/"on", case-insensitive). */
function isTruthy(value: string | undefined | null): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/**
 * Validate all required configuration for the current environment.
 * Pure: returns a report, never throws, never mutates state.
 */
export function validateConfig(): ConfigReport {
  const environment = process.env.NODE_ENV ?? "development";
  const isProduction = environment === "production";
  const dialect = getDatabaseDialect();

  const errors: ConfigIssue[] = [];
  const warnings: ConfigIssue[] = [];

  const require = (key: string, present: boolean, message: string) => {
    if (present) return;
    (isProduction ? errors : warnings).push({
      key,
      severity: isProduction ? "error" : "warning",
      message,
    });
  };

  // --- Secrets required to run safely in production ---
  require(
    "SESSION_SECRET",
    isNonEmpty(process.env.SESSION_SECRET),
    "SESSION_SECRET is required in production (session signing).",
  );
  require(
    "BYBELT_INTERNAL_SECRET",
    isNonEmpty(process.env.BYBELT_INTERNAL_SECRET),
    "BYBELT_INTERNAL_SECRET is required in production (internal bridge auth).",
  );

  // --- Database: PostgreSQL is the default/preferred production database, and
  //     production must NEVER *silently* fall back to SQLite. SQLite in
  //     production is permitted only as a deliberate, explicit dual opt-in
  //     (ALLOW_SQLITE_IN_PRODUCTION=true AND an explicit DATABASE_PATH) — the
  //     sanctioned single-instance pilot posture (≤~100 tenants; migrate to
  //     Postgres before scaling past one replica — Master Plan M8, docs/DEPLOY).
  //     An accidental/misconfigured SQLite (flag unset, or set without a path)
  //     still fails fast. The opt-in is surfaced as a boot warning, so it is
  //     visible and never silent. ---
  if (isProduction && dialect !== "postgres") {
    const sqliteOptIn = isTruthy(process.env.ALLOW_SQLITE_IN_PRODUCTION);
    const explicitPath = isNonEmpty(process.env.DATABASE_PATH);
    if (sqliteOptIn && explicitPath) {
      // Single-writer safety interlock: SQLite is a single-process file store and
      // corrupts under concurrent writers. REDIS_URL exists in this architecture
      // ONLY to fan realtime events across multiple app instances (see M8-T1), so
      // its presence signals multi-instance intent — which is incompatible with
      // SQLite. Fail fast rather than let two replicas share one .db file. This is
      // the guardrail that keeps the SQLite opt-in a *bounded* single-instance
      // posture and not an open door to data-corrupting horizontal scale.
      if (isNonEmpty(process.env.REDIS_URL)) {
        errors.push({
          key: "ALLOW_SQLITE_IN_PRODUCTION",
          severity: "error",
          message:
            "ALLOW_SQLITE_IN_PRODUCTION and REDIS_URL are both set. REDIS_URL implies a multi-instance " +
            "deployment, but SQLite cannot be safely shared across processes (write corruption). " +
            "Migrate to PostgreSQL (DATABASE_URL) before running more than one instance.",
        });
      } else {
        warnings.push({
          key: "ALLOW_SQLITE_IN_PRODUCTION",
          severity: "warning",
          message:
            "Production is running on SQLite by explicit opt-in (ALLOW_SQLITE_IN_PRODUCTION=true). " +
            "This is a single-instance-only posture — migrate to PostgreSQL (DATABASE_URL) before scaling beyond one replica.",
        });
      }
    } else if (sqliteOptIn && !explicitPath) {
      errors.push({
        key: "DATABASE_PATH",
        severity: "error",
        message:
          "ALLOW_SQLITE_IN_PRODUCTION is set but DATABASE_PATH is not — refusing to guess a SQLite location in production. " +
          "Set DATABASE_PATH explicitly.",
      });
    } else {
      errors.push({
        key: "DATABASE_URL",
        severity: "error",
        message:
          "Production requires a PostgreSQL DATABASE_URL. Refusing to fall back to SQLite. " +
          "Set DATABASE_URL=postgres://… (preferred), or explicitly opt into single-instance SQLite with " +
          "ALLOW_SQLITE_IN_PRODUCTION=true and an explicit DATABASE_PATH.",
      });
    }
  } else if (dialect === "postgres" && !isNonEmpty(process.env.DATABASE_URL)) {
    errors.push({
      key: "DATABASE_URL",
      severity: "error",
      message: "DATABASE_URL is required for the postgres dialect.",
    });
  }

  // --- OpenAI: AI features degrade to templates without it. Non-fatal by
  //     design (template fallback exists) so this never blocks boot. ---
  if (!isNonEmpty(process.env.OPENAI_API_KEY)) {
    warnings.push({
      key: "OPENAI_API_KEY",
      severity: "warning",
      message: "OPENAI_API_KEY is not set — AI replies fall back to templates.",
    });
  } else if (!isNonEmpty(process.env.OPENAI_MODEL)) {
    warnings.push({
      key: "OPENAI_MODEL",
      severity: "warning",
      message: "OPENAI_MODEL is not set — defaulting to gpt-4o-mini.",
    });
  }

  // --- Phase 25: optional production features + invalid-combination detection.
  //     All non-fatal (warnings) — a misconfigured optional feature must be
  //     visible at boot, but never block startup. No env var is renamed. ---
  validateOptionalFeatures(warnings, isProduction);

  return {
    ok: errors.length === 0,
    environment,
    isProduction,
    dialect,
    errors,
    warnings,
  };
}

/**
 * Phase 25 — surface misconfigured optional features and impossible/incomplete
 * env combinations that would otherwise silently disable a feature at runtime.
 */
function validateOptionalFeatures(warnings: ConfigIssue[], isProduction: boolean): void {
  const warn = (key: string, message: string) =>
    warnings.push({ key, severity: "warning", message });

  // Realtime fan-out: without Redis, multi-instance deployments silently lose
  // cross-instance delivery (Architecture Review #6). Single-instance is fine.
  if (isProduction && !isNonEmpty(process.env.REDIS_URL)) {
    warn(
      "REDIS_URL",
      "REDIS_URL not set — realtime fan-out is single-instance only. Do not run more than one replica without it.",
    );
  }
  if (isNonEmpty(process.env.REDIS_URL) && !/^rediss?:\/\//i.test(process.env.REDIS_URL!.trim())) {
    warn("REDIS_URL", "REDIS_URL should be a redis:// or rediss:// URL.");
  }

  // Internal bridge (Shopify plugin app): secret + URL must be coherent.
  const hasBridgeSecret = isNonEmpty(process.env.BYBELT_INTERNAL_SECRET);
  const hasBridgeUrl = isNonEmpty(process.env.SHOPIFY_PLUGIN_INTERNAL_URL);
  if (hasBridgeUrl && !hasBridgeSecret) {
    warn(
      "BYBELT_INTERNAL_SECRET",
      "SHOPIFY_PLUGIN_INTERNAL_URL is set but BYBELT_INTERNAL_SECRET is not — bridge calls cannot authenticate.",
    );
  }

  // Inbound email (IMAP): host without credentials silently disables ingest.
  const imapHost = isNonEmpty(process.env.IMAP_HOST);
  if (imapHost && (!isNonEmpty(process.env.IMAP_USER) || !isNonEmpty(process.env.IMAP_PASS))) {
    warn(
      "IMAP_USER",
      "IMAP_HOST is set but IMAP_USER/IMAP_PASS is missing — inbound email polling is disabled.",
    );
  }
  // The poll-inbox cron requires CRON_SECRET; without it the scheduled poll
  // cannot authenticate and inbound email is never fetched.
  const emailIngest = imapHost || isNonEmpty(process.env.EMAIL_INGEST_WORKSPACE_ID);
  if (isProduction && emailIngest && !isNonEmpty(process.env.CRON_SECRET)) {
    warn(
      "CRON_SECRET",
      "Inbound email is configured but CRON_SECRET is unset — the poll-inbox cron cannot authenticate.",
    );
  }

  // Job drain window (Phase 24C) must be a positive number when set.
  const drain = process.env.JOB_SHUTDOWN_DRAIN_MS;
  if (isNonEmpty(drain) && !(Number(drain) > 0)) {
    warn(
      "JOB_SHUTDOWN_DRAIN_MS",
      `JOB_SHUTDOWN_DRAIN_MS="${drain}" is not a positive number — falling back to the default drain window.`,
    );
  }
}

/** Application version, resolved from env with a package fallback. */
export function appVersion(): string {
  return (
    process.env.APP_VERSION?.trim() ||
    process.env.npm_package_version?.trim() ||
    "0.3.1"
  );
}

// ---------------------------------------------------------------------------
// Phase 25 — typed config accessors.
//
// Single source of truth for a handful of production settings that were parsed
// ad-hoc across modules. These do NOT rename or change any env var; they
// centralize parsing + defaults so there is one place to reason about them.
// ---------------------------------------------------------------------------

/** Default graceful-shutdown drain window for background jobs (Phase 24C). */
export const DEFAULT_JOB_SHUTDOWN_DRAIN_MS = 25_000;

/** Parsed job drain window; falls back to the default on missing/invalid input. */
export function jobShutdownDrainMs(): number {
  const raw = Number(process.env.JOB_SHUTDOWN_DRAIN_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_JOB_SHUTDOWN_DRAIN_MS;
}

/** Whether Redis-backed realtime fan-out is configured. */
export function isRedisConfigured(): boolean {
  return isNonEmpty(process.env.REDIS_URL);
}

export type InternalBridgeConfig = {
  enabled: boolean;
  url: string;
  hasSecret: boolean;
};

/** Internal Shopify-plugin bridge target + auth presence (single parse). */
export function internalBridgeConfig(): InternalBridgeConfig {
  const hasSecret = isNonEmpty(process.env.BYBELT_INTERNAL_SECRET);
  const url =
    process.env.SHOPIFY_PLUGIN_INTERNAL_URL?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:3005";
  return { enabled: hasSecret, url, hasSecret };
}

/** Whether inbound email ingest is configured for at least one path. */
export function isEmailIngestConfigured(): boolean {
  return (
    (isNonEmpty(process.env.IMAP_HOST) && isNonEmpty(process.env.IMAP_USER)) ||
    isNonEmpty(process.env.EMAIL_INGEST_WORKSPACE_ID)
  );
}

export type FeatureStatus = {
  name: string;
  enabled: boolean;
  detail?: string;
};

/**
 * A boot-time summary of which optional subsystems are active, for operator
 * diagnostics (STEP 5). Pure — reads env only, no side effects.
 */
export function describeRuntimeFeatures(): FeatureStatus[] {
  const bridge = internalBridgeConfig();
  return [
    {
      name: "redis-realtime",
      enabled: isRedisConfigured(),
      detail: isRedisConfigured() ? "multi-instance fan-out" : "single-instance (in-memory)",
    },
    {
      name: "internal-bridge",
      enabled: bridge.enabled,
      detail: bridge.enabled ? bridge.url : "disabled (no BYBELT_INTERNAL_SECRET)",
    },
    {
      name: "email-ingest",
      enabled: isEmailIngestConfigured(),
      detail: isEmailIngestConfigured() ? "configured" : "not configured",
    },
    {
      name: "ai-openai",
      enabled: isNonEmpty(process.env.OPENAI_API_KEY),
      detail: isNonEmpty(process.env.OPENAI_API_KEY)
        ? process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
        : "template fallback",
    },
  ];
}
