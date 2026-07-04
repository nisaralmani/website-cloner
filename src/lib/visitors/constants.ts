/** Visitor is "online" if their chat session was seen within this window. */
export const VISITOR_ONLINE_WINDOW_MS = 90_000;

/** Visitor is "active" (green dot) if pinged within this shorter window. */
export const VISITOR_ACTIVE_WINDOW_MS = 45_000;

/** How often the visitors panel polls for updates. */
export const VISITOR_POLL_INTERVAL_MS = 15_000;
