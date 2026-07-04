import type { Visitor } from "@/types/visitors";
import type { visitors } from "@/db/schema";

type VisitorRow = typeof visitors.$inferSelect;

export function toVisitor(
  row: VisitorRow,
  conversationId?: string | null,
): Visitor {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials ?? undefined,
    city: row.city,
    location: row.location,
    country: row.country,
    currentPage: row.currentPage,
    isActive: row.isActive === 1,
    avatarGradient: row.avatarGradient,
    latitude: row.latitude,
    longitude: row.longitude,
    conversationId: conversationId ?? null,
  };
}