import { publishTypingUpdated } from "@/lib/inbox/event-bus";

export function publishConversationTyping(
  workspaceId: string,
  conversationId: string,
  from: "visitor" | "operator",
  typing: boolean,
  operatorName?: string,
) {
  publishTypingUpdated(workspaceId, conversationId, from, typing, operatorName);
}
