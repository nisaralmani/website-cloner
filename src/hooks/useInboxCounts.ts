"use client";

import { useEffect, useState } from "react";

export type InboxCounts = {
  mainInbox: number;
  getStarted: number;
  spam: number;
  shopify: number;
  notificationCount: string;
  totalUnread: number;
  subInboxes: { id: string; unread: number }[];
};

const EMPTY_COUNTS: InboxCounts = {
  mainInbox: 0,
  getStarted: 0,
  spam: 0,
  shopify: 0,
  notificationCount: "0",
  totalUnread: 0,
  subInboxes: [],
};

export function useInboxCounts() {
  const [counts, setCounts] = useState<InboxCounts>(EMPTY_COUNTS);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/inbox/counts");
        if (!response.ok || cancelled) {
          return;
        }
        const data = (await response.json()) as InboxCounts;
        if (!cancelled) {
          setCounts(data);
        }
      } catch {
        if (!cancelled) {
          setCounts(EMPTY_COUNTS);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return { counts };
}
