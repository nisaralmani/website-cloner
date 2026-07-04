import { truncatePreview } from "@/lib/inbox/time";

const MAX_REMINDER_NOTE_LENGTH = 500;
const MAX_REMINDER_FUTURE_MS = 365 * 24 * 60 * 60 * 1000;

export function formatReminderPreview(note: string, maxLength = 80): string {
  const body = truncatePreview(note, maxLength - 10);
  return `Reminder: ${body}`;
}

export function isReminderPreview(preview: string): boolean {
  return preview.trim().toLowerCase().startsWith("reminder:");
}

export function parseReminderInput(body: {
  note?: string;
  remindAt?: string;
}): { note: string; remindAt: Date } | { error: string } {
  const note = body.note?.trim() || "Follow-up reminder";
  if (note.length > MAX_REMINDER_NOTE_LENGTH) {
    return { error: "Reminder note is too long" };
  }

  const rawRemindAt = body.remindAt?.trim();
  if (!rawRemindAt) {
    return { error: "remindAt is required" };
  }

  const remindAt = new Date(rawRemindAt);
  if (Number.isNaN(remindAt.getTime())) {
    return { error: "Invalid remindAt" };
  }

  const now = Date.now();
  if (remindAt.getTime() <= now) {
    return { error: "remindAt must be in the future" };
  }

  if (remindAt.getTime() - now > MAX_REMINDER_FUTURE_MS) {
    return { error: "remindAt is too far in the future" };
  }

  return { note, remindAt };
}

export function formatReminderDueLabel(remindAt: string | Date): string {
  const date = typeof remindAt === "string" ? new Date(remindAt) : remindAt;
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
