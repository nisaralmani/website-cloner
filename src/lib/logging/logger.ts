/**
 * Shared structured logger (Phase 18 + 24B).
 *
 * Dependency-free and edge-runtime safe (used from middleware). Emits a single
 * JSON line per event in production for log aggregation, and a compact
 * human-readable line in development.
 *
 * Phase 24B: merges optional request-context fields when a provider is
 * registered (Node.js runtime only — see request-context.ts).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

type ContextProvider = () => LogFields;

let contextProvider: ContextProvider = () => ({});

/** Register active request-context fields (Node.js API routes only). */
export function setLogContextProvider(provider: ContextProvider): void {
  contextProvider = provider;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredMinLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function nowIso(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function contextFields(): LogFields {
  try {
    return contextProvider();
  } catch {
    return {};
  }
}

function emit(level: LogLevel, message: string, fields?: LogFields, component?: string): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[configuredMinLevel()]) {
    return;
  }

  const timestamp = nowIso();
  const sink =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;

  const merged = {
    level,
    timestamp,
    message,
    ...(component ? { component } : {}),
    ...contextFields(),
    ...fields,
  };

  if (isProduction()) {
    let line: string;
    try {
      line = JSON.stringify(merged);
    } catch {
      line = JSON.stringify({ level, timestamp, message, component });
    }
    sink(line);
    return;
  }

  const suffix =
    Object.keys(merged).length > 3 ? ` ${safeInline(merged)}` : "";
  sink(`[${level}]${component ? `[${component}]` : ""} ${message}${suffix}`);
}

function safeInline(fields: LogFields): string {
  try {
    return JSON.stringify(fields);
  } catch {
    return "";
  }
}

export type Logger = {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (message: string, fields?: LogFields) => void;
};

export const logger: Logger = {
  debug: (message, fields) => emit("debug", message, fields),
  info: (message, fields) => emit("info", message, fields),
  warn: (message, fields) => emit("warn", message, fields),
  error: (message, fields) => emit("error", message, fields),
};

/** Component-scoped logger — every line carries `component` + request context. */
export function createComponentLogger(component: string): Logger {
  return {
    debug: (message, fields) => emit("debug", message, fields, component),
    info: (message, fields) => emit("info", message, fields, component),
    warn: (message, fields) => emit("warn", message, fields, component),
    error: (message, fields) => emit("error", message, fields, component),
  };
}
