/** Poll conversation list for preview/unread updates. */
export const INBOX_LIST_POLL_MS = 5_000;

/** Poll active thread for new visitor messages. */
export const INBOX_THREAD_POLL_MS = 3_000;

/** Polling fallback when SSE stream is disconnected. */
export const INBOX_POLL_FALLBACK_MS = 10_000;

/** Poll widget thread when chatbox SSE is disconnected. */
export const CHATBOX_POLL_FALLBACK_MS = 8_000;
