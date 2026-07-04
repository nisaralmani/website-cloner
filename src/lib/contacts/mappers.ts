import type { Contact, ContactSegment } from "@/types/contacts";
import type { contacts } from "@/db/schema";

type ContactRow = typeof contacts.$inferSelect;

const SEGMENTS = new Set<ContactSegment>(["chat", "shopify"]);

function parseSegments(value: string): ContactSegment[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return ["chat"];
    return parsed.filter(
      (segment): segment is ContactSegment =>
        typeof segment === "string" && SEGMENTS.has(segment as ContactSegment),
    );
  } catch {
    return ["chat"];
  }
}

export function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials ?? undefined,
    email: row.email,
    location: row.location,
    company: row.company,
    segments: parseSegments(row.segments),
    lastActive: row.lastActive,
    score: row.score,
    avatarGradient: row.avatarGradient,
  };
}

export function serializeSegments(segments: ContactSegment[]): string {
  return JSON.stringify(segments);
}
