export function validateConversationUnread(unread: unknown): string | null {
  if (typeof unread !== "number" || !Number.isInteger(unread)) {
    return "unread must be an integer";
  }

  if (unread < 0 || unread > 999) {
    return "unread must be between 0 and 999";
  }

  return null;
}

/** Default unread count when operator marks a read thread as unread. */
export const MARK_UNREAD_COUNT = 1;
