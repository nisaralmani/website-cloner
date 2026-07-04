"use client";

import { useCallback, useEffect, useRef } from "react";

type UseTypingPingOptions = {
  url: string | null;
  enabled?: boolean;
  idleMs?: number;
};

export function useTypingPing({ url, enabled = true, idleMs = 2500 }: UseTypingPingOptions) {
  const activeRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTyping = useCallback(
    async (typing: boolean) => {
      if (!url || !enabled) return;
      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typing }),
        });
      } catch {
        // Silent typing failure.
      }
    },
    [enabled, url],
  );

  const stopTyping = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (activeRef.current) {
      activeRef.current = false;
      void sendTyping(false);
    }
  }, [sendTyping]);

  const notifyTyping = useCallback(() => {
    if (!url || !enabled) return;

    if (!activeRef.current) {
      activeRef.current = true;
      void sendTyping(true);
    }

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      activeRef.current = false;
      idleTimerRef.current = null;
      void sendTyping(false);
    }, idleMs);
  }, [enabled, idleMs, sendTyping, url]);

  useEffect(() => stopTyping, [stopTyping, url]);

  return { notifyTyping, stopTyping };
}
