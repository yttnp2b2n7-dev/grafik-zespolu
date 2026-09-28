"use client";

import { useEffect, useRef } from "react";

// Runs `callback` on a timer while the tab is visible, skipping ticks while
// it's backgrounded (a hidden tab doing nothing productive with its polls),
// and refreshes immediately the moment the tab becomes visible again instead
// of waiting for the next tick - so data is never stale for longer than the
// user was actually away.
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (document.hidden) return;
      callbackRef.current();
    }, intervalMs);

    function handleVisibilityChange() {
      if (!document.hidden) callbackRef.current();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
