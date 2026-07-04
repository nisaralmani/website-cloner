export type OperatorPresence = "online" | "offline";

const VALID_PRESENCE = new Set<OperatorPresence>(["online", "offline"]);

export function parsePresenceStatus(value: unknown): OperatorPresence | null {
  return typeof value === "string" && VALID_PRESENCE.has(value as OperatorPresence)
    ? (value as OperatorPresence)
    : null;
}

export function toOperatorPresence(
  presenceStatus: string | null | undefined,
): OperatorPresence {
  return presenceStatus === "offline" ? "offline" : "online";
}
