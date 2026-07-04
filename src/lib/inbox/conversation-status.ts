import type { ConversationStatus } from "@/types/inbox";

const STATUSES: ConversationStatus[] = ["pending", "resolved", "unassigned"];

export function isConversationStatus(value: string): value is ConversationStatus {
  return STATUSES.includes(value as ConversationStatus);
}

export function conversationStatusLabel(status: ConversationStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "resolved":
      return "Resolved";
    case "unassigned":
      return "Unassigned";
  }
}
