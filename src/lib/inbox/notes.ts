import { truncatePreview } from "@/lib/inbox/time";

export function formatNotePreview(text: string, maxLength = 80): string {
  const body = truncatePreview(text, maxLength - 6);
  return `Note: ${body}`;
}

export function isNotePreview(preview: string): boolean {
  return preview.trim().toLowerCase().startsWith("note:");
}
