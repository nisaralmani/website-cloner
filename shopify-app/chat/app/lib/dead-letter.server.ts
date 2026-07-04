import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Lightweight dead-letter store for permanently-failed bridge operations
 * (Phase 20 — Task 2).
 *
 * Deliberately file-backed (append-only JSONL), NOT a new database table: the
 * Phase 20 mandate forbids database migrations, and a single-file append log is
 * the smallest durable store that satisfies "persist failures safely." Records
 * are never auto-replayed here — the store only captures failures so an operator
 * (or the reconciliation job) can inspect and, later, manually replay them.
 *
 * One process owns the file at a time (the Shopify app runs single-instance), so
 * writes are serialized through an in-process promise chain to avoid interleaved
 * partial lines. `appendFile` is atomic for the small payloads written here.
 */

export type DeadLetterRecord = {
  /** Bridge event type, e.g. "shopify_linked" / "customers_redact". */
  event: string;
  workspaceId: string | null;
  shop: string | null;
  requestId: string;
  /** ISO-8601 timestamp of when the failure was recorded. */
  timestamp: string;
  /** Human-readable failure reason (error message). */
  reason: string;
  /** Error class name, when available. */
  errorType?: string;
  /** Number of attempts made before the operation was given up on. */
  retryCount: number;
};

export type DeadLetterInput = Omit<DeadLetterRecord, "timestamp"> & {
  timestamp?: string;
};

function dlqFilePath(): string {
  const override = process.env.BYBELT_DLQ_FILE?.trim();
  if (override) return override;
  const dataDir = process.env.BYBELT_DATA_DIR?.trim() || process.cwd();
  return path.join(dataDir, "bridge-dead-letter.jsonl");
}

// Serialize writes so concurrent webhook failures cannot interleave JSONL lines.
let writeChain: Promise<void> = Promise.resolve();

/**
 * Persist a permanently-failed bridge operation. Never throws — a dead-letter
 * write failure must not mask or replace the original error that triggered it;
 * it is logged and swallowed.
 */
export function recordDeadLetter(input: DeadLetterInput): Promise<void> {
  const record: DeadLetterRecord = {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  writeChain = writeChain.then(async () => {
    try {
      const file = dlqFilePath();
      await mkdir(path.dirname(file), { recursive: true });
      await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
      console.error(
        JSON.stringify({
          ts: record.timestamp,
          level: "error",
          component: "bridge-dead-letter",
          event: "bridge_dead_letter_recorded",
          bridgeEvent: record.event,
          workspaceId: record.workspaceId,
          shop: record.shop,
          requestId: record.requestId,
          retryCount: record.retryCount,
          errorType: record.errorType,
          reason: record.reason,
        }),
      );
    } catch (error) {
      // Last-resort: the failure store itself failed. Log and move on.
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          component: "bridge-dead-letter",
          event: "bridge_dead_letter_write_failed",
          error: error instanceof Error ? error.message : String(error),
          original: record,
        }),
      );
    }
  });

  return writeChain;
}

/** Read all dead-letter records (used by the reconciliation report). */
export async function readDeadLetters(): Promise<DeadLetterRecord[]> {
  let raw: string;
  try {
    raw = await readFile(dlqFilePath(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw error;
  }
  const records: DeadLetterRecord[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed) as DeadLetterRecord);
    } catch {
      // Skip a corrupt line rather than fail the whole read.
    }
  }
  return records;
}

/** Count of dead-letter records (cheap-ish summary for health/telemetry). */
export async function countDeadLetters(): Promise<number> {
  const records = await readDeadLetters();
  return records.length;
}
