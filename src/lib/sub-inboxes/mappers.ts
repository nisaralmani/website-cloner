import type { subInboxes } from "@/db/schema";
import type { SubInbox } from "@/types/sub-inboxes";

type SubInboxRow = typeof subInboxes.$inferSelect;

export function toSubInbox(row: SubInboxRow): SubInbox {
  return {
    id: row.id,
    name: row.name,
    segment: row.segment,
    enabled: row.enabled === 1,
    createdAt: row.createdAt.toISOString(),
  };
}

export function activeSubInboxCount(subInboxes: SubInbox[]) {
  return subInboxes.filter((subInbox) => subInbox.enabled).length;
}
