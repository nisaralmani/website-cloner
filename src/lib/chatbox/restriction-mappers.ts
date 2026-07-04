import type { ChatboxRestriction, ChatboxRestrictionKind } from "@/types/chatbox-restrictions";

type ChatboxRestrictionRow = {
  id: string;
  kind: string;
  value: string;
  createdAt: Date;
};

export function toChatboxRestriction(row: ChatboxRestrictionRow): ChatboxRestriction {
  return {
    id: row.id,
    kind: row.kind as ChatboxRestrictionKind,
    value: row.value,
    createdAt: row.createdAt.toISOString(),
  };
}
